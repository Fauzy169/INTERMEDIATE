// src/scripts/pages/add-story/add-story-page.js
import CONFIG from '../../config';
import { addStory, addStoryAsGuest } from '../../data/api';
import { initMap } from '../../utils/map';

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
            <input 
              type="text" 
              id="header" 
              name="header" 
              placeholder="Enter story title/header" 
              required
            >
          </div>

          <div class="form-section">
            <label class="form-label">
              <i class="fas fa-align-left"></i>
              <span>Story Description</span>
            </label>
            <textarea 
              id="description" 
              name="description" 
              placeholder="Tell us about your experience..." 
              required
            ></textarea>
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
              <span class="toggle-label">
                <i class="fas fa-map-marker-alt"></i> Include Location
              </span>
            </label>
            <div id="map" class="map-container"></div>
          </div>

          <div class="form-section">
            <label class="toggle-container">
              <input type="checkbox" id="asGuest" name="asGuest">
              <span class="toggle-slider"></span>
              <span class="toggle-label">
                <i class="fas fa-user-secret"></i> Post as Guest
              </span>
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
        if (this._marker) {
          this._map.removeLayer(this._marker);
        }
        this._marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(this._map);
        this._location = { lat: e.latlng.lat, lon: e.latlng.lng };
      });
    } catch (error) {
      console.error('Map initialization failed:', error);
      document.getElementById('map').innerHTML = `
        <div class="map-error">
          <i class="fas fa-map-marked-alt"></i>
          <p>Map could not be loaded</p>
        </div>
      `;
    }
  }

  _toggleLocation(show) {
    const mapElement = document.getElementById('map');
    mapElement.style.display = show ? 'block' : 'none';
    if (show && !this._location) {
      this._getUserLocation();
    }
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
      
      if (this._marker) {
        this._map.removeLayer(this._marker);
      }
      
      this._marker = L.marker([this._location.lat, this._location.lon])
        .addTo(this._map)
        .bindPopup(`Your location (accuracy: ${Math.round(this._location.accuracy)}m)`)
        .openPopup();
      
      this._map.setView([this._location.lat, this._location.lon], 15);
      
    } catch (error) {
      console.error('Location error:', error);
      this._showLocationError();
    }
  }

  async _takePhoto() {
    try {
      this._stopCamera();
      this._usingFrontCamera = false;
      
      this._stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      const video = document.createElement('video');
      video.srcObject = this._stream;
      video.playsInline = true;
      video.play();

      const photoPreview = document.getElementById('photoPreview');
      photoPreview.innerHTML = '';
      photoPreview.appendChild(video);

      const controls = document.createElement('div');
      controls.className = 'camera-controls';

      const switchBtn = document.createElement('button');
      switchBtn.textContent = 'Switch Camera';
      switchBtn.addEventListener('click', () => this._switchCamera());

      const captureBtn = document.createElement('button');
      captureBtn.textContent = 'Capture';
      captureBtn.addEventListener('click', () => this._capturePhoto(video));

      controls.append(switchBtn, captureBtn);
      photoPreview.appendChild(controls);

    } catch (error) {
      console.error('Camera error:', error);
      alert('Could not access camera: ' + error.message);
    }
  }

  async _switchCamera() {
    this._stopCamera();
    this._usingFrontCamera = !this._usingFrontCamera;
    
    try {
      this._stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this._usingFrontCamera ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      const video = document.querySelector('#photoPreview video');
      video.srcObject = this._stream;
      video.play();
    } catch (error) {
      console.error('Switch camera error:', error);
      alert('Failed to switch camera: ' + error.message);
    }
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
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `story-${timestamp}.jpg`;
      
      this._photoFile = new File([blob], filename, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(this._photoFile);
      const fileInput = document.getElementById('photoInput');
      fileInput.files = dataTransfer.files;

      this._formData = new FormData();
      this._formData.append('photo', this._photoFile);

      this._showPhotoPreview(canvas.toDataURL('image/jpeg', 0.8));
      this._stopCamera();

    }, 'image/jpeg', 0.8);
  }

  _showPhotoPreview(imageSrc) {
    const photoPreview = document.getElementById('photoPreview');
    photoPreview.innerHTML = `
      <div class="preview-container">
        <img src="${imageSrc}" alt="Preview" class="photo-preview-img">
        <div class="preview-overlay">
          <button type="button" class="retake-btn">
            <i class="fas fa-redo"></i> Retake
          </button>
        </div>
      </div>
    `;

    document.querySelector('.retake-btn').addEventListener('click', () => {
      document.getElementById('photoInput').value = '';
      this._photoFile = null;
      this._formData = new FormData();
      this._takePhoto();
    });
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
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      alert('Photo must be less than 1MB');
      return;
    }

    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newFilename = `story-upload-${timestamp}.${extension}`;
    
    this._photoFile = new File([file], newFilename, {
      type: file.type,
      lastModified: file.lastModified
    });

    this._formData = new FormData();
    this._formData.append('photo', this._photoFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('photoPreview').innerHTML = `
        <div class="preview-container">
          <img src="${e.target.result}" alt="Preview" class="photo-preview-img">
          <div class="preview-overlay">
            <button type="button" class="retake-btn">
              <i class="fas fa-redo"></i> Retake
            </button>
          </div>
        </div>
      `;
      document.querySelector('.retake-btn').addEventListener('click', () => {
        document.getElementById('photoInput').value = '';
        this._photoFile = null;
        this._formData = new FormData();
        document.getElementById('photoPreview').innerHTML = '';
      });
    };
    reader.readAsDataURL(file);
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

      if (content.includes('[HEADER]') || content.includes('[/HEADER]')) {
    if (!content.match(/\[HEADER\].*\[\/HEADER\]/s)) {
      throw new Error('Invalid header tags. Use [HEADER]...[/HEADER] format');
    }
  }
      
      if (!header || !content) throw new Error('Header and content are required');
      if (!this._photoFile) throw new Error('Photo is required');

      const description = `[HEADER]${header}[/HEADER]\n${content}`;

      const formData = new FormData();
      formData.append('description', description);
      formData.append('photo', this._photoFile);
      
      if (this._includeLocation && this._location) {
        formData.append('lat', this._location.lat.toString());
        formData.append('lon', this._location.lon.toString());
      }

      const asGuest = document.getElementById('asGuest').checked;
      const token = localStorage.getItem(CONFIG.USER_TOKEN_KEY);

      if (asGuest) {
        const response = await addStoryAsGuest(formData);
        if (!response || !response.success) {
          throw new Error(response?.message || 'Failed to add story as guest');
        }
      } else if (token) {
        const response = await addStory(formData, token);
        if (!response || !response.success) {
          throw new Error(response?.message || 'Failed to add story');
        }
      } else {
        throw new Error('Please login or post as guest');
      }

      alert('Story published successfully!');
      window.location.hash = '#/stories';

    } catch (error) {
      console.error('Submission error:', error);
      errorElement.innerHTML = `
        <i class="fas fa-exclamation-circle"></i> ${error.message}
      `;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish Story';
    }
  }
}