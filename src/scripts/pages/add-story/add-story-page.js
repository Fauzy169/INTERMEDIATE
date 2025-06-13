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
        <div class="add-story-header">
          <a href="#/stories" class="back-button">
            <i class="fas fa-arrow-left"></i>
          </a>
          <h1>Share Your Story</h1>
        </div>

        <form id="storyForm" class="story-form" enctype="multipart/form-data">
          <div class="form-section">
            <label class="form-label">
              <i class="fas fa-heading"></i>
              <span>Story Header/Title</span>
            </label>
            <input type="text" id="header" name="header" placeholder="Enter story title/header" required>
          </div>

          <div class="form-section">
            <label class="form-label">
              <i class="fas fa-align-left"></i>
              <span>Story Description</span>
            </label>
            <textarea id="description" name="description" placeholder="Tell us about your experience..." required></textarea>
          </div>

          <div class="form-section">
            <label class="form-label">
              <i class="fas fa-camera"></i>
              <span>Add Photo</span>
            </label>
            <div class="photo-options">
              <label class="upload-btn">
                <input type="file" id="photoInput" name="photo" accept="image/*" hidden>
                <i class="fas fa-cloud-upload-alt"></i> Upload
              </label>
              <button type="button" id="takePhotoBtn" class="camera-btn">
                <i class="fas fa-camera-retro"></i> Take Photo
              </button>
            </div>
            <div id="photoPreview" class="photo-preview"></div>
          </div>

          <div class="form-section">
            <label class="toggle-container">
              <input type="checkbox" id="includeLocation" name="includeLocation">
              <span class="toggle-slider"></span>
              <span class="toggle-label"><i class="fas fa-map-marker-alt"></i> Include Location</span>
            </label>
            <div id="map" class="map-container"></div>
          </div>

          <div class="form-section">
            <label class="toggle-container">
              <input type="checkbox" id="asGuest" name="asGuest">
              <span class="toggle-slider"></span>
              <span class="toggle-label"><i class="fas fa-user-secret"></i> Post as Guest</span>
            </label>
          </div>

          <button type="submit" class="submit-btn" id="submitBtn">
            <i class="fas fa-paper-plane"></i> Publish Story
          </button>
          <div id="formError" class="form-error"></div>
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
        this._location = { lat: e.latlng.lat, lon: e.latlng.lng };
      });
    } catch (error) {
      document.getElementById('map').innerHTML = `
        <div class="map-error">
          <i class="fas fa-map-marked-alt"></i>
          <p>Map could not be loaded</p>
        </div>`;
    }
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

  _takePhoto() {
    this._stopCamera();
    this._usingFrontCamera = false;
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    }).then(stream => {
      this._stream = stream;
      const video = document.createElement('video');
      video.srcObject = stream;
      video.playsInline = true;
      video.play();

      const preview = document.getElementById('photoPreview');
      preview.innerHTML = '';
      preview.appendChild(video);

      const controls = document.createElement('div');
      controls.className = 'camera-controls';

      const switchBtn = document.createElement('button');
      switchBtn.textContent = 'Switch Camera';
      switchBtn.addEventListener('click', () => this._switchCamera());

      const captureBtn = document.createElement('button');
      captureBtn.textContent = 'Capture';
      captureBtn.addEventListener('click', () => this._capturePhoto(video));

      controls.append(switchBtn, captureBtn);
      preview.appendChild(controls);
    }).catch(err => alert('Camera error: ' + err.message));
  }

  _capturePhoto(video) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (this._usingFrontCamera) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      const filename = `story-${Date.now()}.jpg`;
      this._photoFile = new File([blob], filename, { type: 'image/jpeg' });
      const reader = new FileReader();
      reader.onload = (e) => {
        document.getElementById('photoPreview').innerHTML = `
          <div class="preview-container">
            <img src="${e.target.result}" alt="Preview" class="photo-preview-img">
          </div>`;
      };
      reader.readAsDataURL(this._photoFile);
      this._stopCamera();
    }, 'image/jpeg', 0.8);
  }

  _stopCamera() {
    if (this._stream) {
      this._stream.getTracks().forEach(t => t.stop());
      this._stream = null;
    }
  }

  _cleanup() {
    window.removeEventListener('hashchange', this._stopCamera);
    this._stopCamera();
  }

  async _handleSubmit() {
    const submitBtn = document.getElementById('submitBtn');
    const errorElement = document.getElementById('formError');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
    errorElement.textContent = '';

    try {
      const header = document.getElementById('header').value.trim();
      const content = document.getElementById('description').value.trim();
      const description = `[HEADER]${header}[/HEADER]\n${content}`;

      if (!header || !content) throw new Error('Header and content are required');
      if (!this._photoFile) {
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> Please upload or take a photo.`;
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish Story';
        return;
      }

      const formData = new FormData();
      formData.append('description', description);
      formData.append('photo', this._photoFile);
      if (this._includeLocation && this._location) {
        formData.append('lat', this._location.lat.toString());
        formData.append('lon', this._location.lon.toString());
      }

      const asGuest = document.getElementById('asGuest').checked;
      const token = localStorage.getItem(CONFIG.USER_TOKEN_KEY);
      let response = null;

      if (asGuest) {
        response = await addStoryAsGuest(formData);
      } else if (token) {
        response = await addStory(formData, token);
      } else {
        throw new Error('Please login or post as guest');
      }

      if (response?.success) {
        // Tambahkan ID jika tidak ada (untuk IndexedDB)
        if (!response.data.id) {
          response.data.id = `local-${Date.now()}`;
        }
        await saveData(response.data);
        document.getElementById('storyForm').reset();
        document.getElementById('photoPreview').innerHTML = '';
        this._photoFile = null;
        alert('Story published successfully!');
        window.location.hash = '#/stories';
      } else {
        throw new Error(response?.message || 'Failed to submit story');
      }

    } catch (error) {
      console.error('Submission error:', error);
      errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish Story';
    }
  }
}
