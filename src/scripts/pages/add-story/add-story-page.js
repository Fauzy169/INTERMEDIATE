import CONFIG from '../../config';
import { addStory, addStoryAsGuest } from '../../data/api';
import { initMap } from '../../utils/map';
import { saveData } from '../../data/database';

export default class AddStoryPage {
  constructor() {
    this._stream = null;
  }

  async render() {
    return `
      <section class="add-story-container">
        <form id="storyForm" class="story-form">
          <div class="form-group">
            <label for="header">Header</label>
            <input type="text" id="header" placeholder="Judul Cerita" required />
          </div>
          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" rows="4" placeholder="Tuliskan cerita kamu di sini..." required></textarea>
          </div>
          <div class="form-group">
            <label for="photoInput">Upload Photo</label>
            <input type="file" id="photoInput" accept="image/*" />
          </div>
          <div class="form-group">
            <button type="button" id="takePhotoBtn" class="camera-btn">
              <i class="fas fa-camera"></i> Ambil Foto Kamera
            </button>
          </div>
          <div id="photoPreview" class="photo-preview"></div>
          <div class="form-group checkbox-group">
            <label><input type="checkbox" id="includeLocation" /> Sertakan Lokasi</label>
            <label><input type="checkbox" id="asGuest" /> Kirim sebagai Tamu</label>
          </div>
          <div id="map" class="map-container"></div>
          <div id="formError" class="form-error"></div>
          <button type="submit" id="submitBtn" class="submit-btn">
            <i class="fas fa-paper-plane"></i> Publish Story
          </button>
        </form>
      </section>
    `;
  }

  async afterRender() {
    window.addEventListener('hashchange', this._stopCamera.bind(this));
    await this._initMap();
    this._setupEventListeners();
    this._cleanup();
  }

  _setupEventListeners() {
    document.getElementById('storyForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this._handleSubmit();
    });

    document.getElementById('photoInput').addEventListener('change', (e) => {
      this._handlePhotoChange(e.target.files[0]);
    });

    document.getElementById('takePhotoBtn').addEventListener('click', () => {
      this._takePhoto();
    });

    document.getElementById('includeLocation').addEventListener('change', (e) => {
      this._includeLocation = e.target.checked;
      this._toggleLocation(this._includeLocation);
    });

    document.getElementById('asGuest').addEventListener('change', (e) => {
      document.getElementById('includeLocation').disabled = e.target.checked;
      if (e.target.checked) {
        this._includeLocation = false;
        this._toggleLocation(false);
      }
    });
  }

  async _initMap() {
    try {
      this._map = initMap('map');
      this._map.on('click', (e) => {
        if (this._marker) this._map.removeLayer(this._marker);
        this._marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(this._map);
        this._location = { lat: e.latlng.lat, lon: e.latlng.lon };
      });
    } catch (error) {
      document.getElementById('map').innerHTML = `
        <div class="map-error">
          <i class="fas fa-map-marked-alt"></i>
          <p>Map could not be loaded</p>
        </div>`;
    }
  }

  async _handleSubmit() {
    const submitBtn = document.getElementById('submitBtn');
    const errorElement = document.getElementById('formError');

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
    errorElement.textContent = '';

    const header = document.getElementById('header').value.trim();
    const content = document.getElementById('description').value.trim();
    const description = `[HEADER]${header}[/HEADER]\n${content}`;
    const asGuest = document.getElementById('asGuest').checked;
    const token = localStorage.getItem(CONFIG.USER_TOKEN_KEY);

    if (!header || !content) {
      errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> Header and description required`;
      this._resetSubmitBtn();
      return;
    }

    if (!this._photoFile) {
      errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> Please upload or take a photo.`;
      this._resetSubmitBtn();
      return;
    }

    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', this._photoFile);
    if (this._includeLocation && this._location) {
      formData.append('lat', this._location.lat.toString());
      formData.append('lon', this._location.lon.toString());
    }

    try {
      let response = null;

      if (asGuest) {
        response = await addStoryAsGuest(formData);
      } else if (token) {
        response = await addStory(formData, token);
      } else {
        throw new Error('Please login or post as guest');
      }

      if (response?.success) {
        if (!response.data.id) {
          response.data.id = `local-${Date.now()}`;
        }
        await saveData(response.data);
        alert('Story published successfully!');
        window.location.hash = '#/stories';
      } else {
        throw new Error(response?.message || 'Failed to submit story');
      }

    } catch (error) {
      console.warn('Submit failed:', error);

      if (!navigator.onLine || error.message.includes('Failed to fetch')) {
        const localStory = {
          id: `local-${Date.now()}`,
          description,
          photoUrl: URL.createObjectURL(this._photoFile),
          createdAt: new Date().toISOString(),
          lat: this._location?.lat,
          lon: this._location?.lon
        };
        await saveData(localStory);
        alert('Koneksi offline. Cerita disimpan secara lokal dan akan tampil di halaman utama.');
        window.location.hash = '#/stories';
      } else {
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
      }
    } finally {
      this._resetSubmitBtn();
    }
  }

  _resetSubmitBtn() {
    const btn = document.getElementById('submitBtn');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish Story';
  }

  _stopCamera() {
    if (this._stream) {
      this._stream.getTracks().forEach(track => track.stop());
      this._stream = null;
    }
  }

  _cleanup() {
    window.removeEventListener('hashchange', this._stopCamera);
    this._stopCamera();
  }

  _handlePhotoChange(file) {
    this._photoFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('photoPreview').innerHTML = `
        <div class="preview-container">
          <img src="${e.target.result}" alt="Preview" class="photo-preview-img">
        </div>`;
    };
    reader.readAsDataURL(file);
  }

  _takePhoto() {
    const constraints = {
      video: true,
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        this._stream = stream;
        const video = document.createElement('video');
        video.autoplay = true;
        video.srcObject = stream;
        video.style.maxWidth = '100%';
        document.getElementById('photoPreview').innerHTML = '';
        document.getElementById('photoPreview').appendChild(video);

        const captureBtn = document.createElement('button');
        captureBtn.textContent = 'Ambil Foto';
        captureBtn.className = 'capture-btn';
        captureBtn.onclick = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          canvas.toBlob((blob) => {
            this._photoFile = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
            this._handlePhotoChange(this._photoFile);
            this._stopCamera();
          }, 'image/jpeg');
        };

        document.getElementById('photoPreview').appendChild(captureBtn);
      })
      .catch((err) => {
        console.error('Camera error:', err);
        alert('Tidak dapat mengakses kamera');
      });
  }

  _toggleLocation(show) {
    const mapElement = document.getElementById('map');
    mapElement.style.display = show ? 'block' : 'none';
    if (show && !this._location) this._getUserLocation();
  }

  async _getUserLocation() {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });
      this._location = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
      if (this._marker) this._map.removeLayer(this._marker);
      this._marker = L.marker([this._location.lat, this._location.lon])
        .addTo(this._map)
        .bindPopup(`Your location (accuracy: ${Math.round(this._location.accuracy)}m)`)
        .openPopup();
      this._map.setView([this._location.lat, this._location.lon], 15);
    } catch (err) {
      console.error('Geolocation error:', err);
    }
  }
}
