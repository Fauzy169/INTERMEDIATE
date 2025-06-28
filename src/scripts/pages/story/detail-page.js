import L from 'leaflet';
import { getStoryDetail } from '../../data/api';
import { showFormattedDate } from '../../utils';
import { initMap } from '../../utils/map';
import CONFIG from '../../config';
import { saveData } from '../../data/database';
import { getData } from '../../data/database';

export default class StoryDetailPage {
  constructor() {
    this._story = null;
    this._map = null;
  }

  async render() {
    return `
      <section class="container">
        <a href="#/stories" class="back-link">← Back to Stories</a>
        <div id="storyDetail" class="story-detail"></div>
      </section>
    `;
  }

  async afterRender() {
    const { id } = this._parseUrl();

    const backLink = document.querySelector('.back-link');
    if (backLink) {
      backLink.addEventListener('click', (e) => {
        e.preventDefault();

        if (!document.startViewTransition) {
          window.location.hash = '#/stories';
          return;
        }

        document.startViewTransition(() => {
          window.location.hash = '#/stories';
        });
      });
    }

    await this._loadStory(id);

    const detailImage = document.querySelector('.story-detail-image');
    if (detailImage) {
      detailImage.style.viewTransitionName = 'story-detail-image';
    }

    // Tambahkan tombol simpan offline
    document.getElementById('saveOfflineBtn')?.addEventListener('click', async () => {
      try {
        await saveData(this._story);
        alert('Cerita berhasil disimpan untuk offline!');
      } catch (err) {
        console.error('Save error:', err);
        alert('Gagal menyimpan cerita: ' + err.message);
      }
    });
  }

  _parseUrl() {
    const url = window.location.hash.slice(1).split('/');
    return { id: url[2] };
  }

  async _loadStory(id) {
    try {
      const token = localStorage.getItem(CONFIG.USER_TOKEN_KEY);
      const response = await getStoryDetail(id, token);
      if (!response || typeof response !== 'object' || !response.story) {
        throw new Error('Invalid story data structure');
      }

      this._story = response.story;
      this._renderStory();

      if (this._story.lat && this._story.lon) {
        await this._initMap();
      }
    } catch (error) {
      console.error('Error loading story:', error);

      try {
        const fallback = await getData(id);
        if (fallback) {
          this._story = fallback;
          this._renderStory();
          if (this._story.lat && this._story.lon) {
            await this._initMap();
          }
          return;
        }
      } catch (dbErr) {
        console.error('Fallback load failed:', dbErr);
      }

      this._showError(error);
    }
  }

  async _initMap() {
    try {
      const mapContainer = document.getElementById('storyMap');
      if (!mapContainer) return;

      this._map = await initMap('storyMap', {
        center: [this._story.lat, this._story.lon],
        zoom: 12,
      });

      let header = this._story.name + "'s Story";
      let description = this._story.description;

      const headerMatch = description.match(/\[HEADER\](.*?)\[\/HEADER\]/s);
      if (headerMatch && headerMatch[1]) {
        header = headerMatch[1].trim();
        description = description.replace(/\[HEADER\].*?\[\/HEADER\]/s, '').trim();
      }

      L.marker([this._story.lat, this._story.lon]).addTo(this._map)
        .bindPopup(`
          <h3>${header}</h3>
          <p>${description}</p>
        `)
        .openPopup();
    } catch (mapError) {
      console.error('Map initialization failed:', mapError);
      const mapContainer = document.getElementById('storyMap');
      if (mapContainer) {
        mapContainer.innerHTML = `
          <div class="map-error">
            <i class="fas fa-map-marked-alt"></i>
            <p>Map could not be loaded</p>
          </div>
        `;
      }
    }
  }

  _renderStory() {
    try {
      let description = this._story.description;
      let header = this._story.name;

      const headerRegex = /\[HEADER\](.*?)\[\/HEADER\]/s;
      const headerMatch = description.match(headerRegex);

      if (headerMatch && headerMatch[1]) {
        header = headerMatch[1].trim();
        description = description.replace(headerRegex, '').trim();
      }

      document.getElementById('storyDetail').innerHTML = `
        <article class="story-detail-card">
          <img src="${this._story.photoUrl}" alt="${header}'s story" 
               class="story-detail-image" 
               onerror="this.onerror=null;this.src='https://via.placeholder.com/400x300?text=Image+Not+Available'">
          <div class="story-detail-content">
            <h2>${header}</h2>
            <time datetime="${this._story.createdAt}">${showFormattedDate(this._story.createdAt)}</time>
            <p>${description}</p>

            ${this._story.lat && this._story.lon ? `
              <div class="story-detail-location">
                <h3>Location</h3>
                <div id="storyMap" class="map-container"></div>
                <small>Coordinates: ${this._story.lat.toFixed(4)}, ${this._story.lon.toFixed(4)}</small>
              </div>
            ` : ''}

            <button id="saveOfflineBtn" class="submit-btn" style="margin-top: 20px;">
              <i class="fas fa-save"></i> Simpan Cerita untuk Offline
            </button>
          </div>
        </article>
      `;
    } catch (renderError) {
      console.error('Error rendering story:', renderError);
      this._showError(new Error('Failed to display story details'));
    }
  }

  _showError(error) {
    let errorMessage = 'The story you\'re looking for doesn\'t exist or may have been removed.';
    let errorTitle = 'Story Not Found';
    let showLogin = false;

    if (error.message.includes('authentication') || error.message.includes('Missing authentication')) {
      errorMessage = 'Please login to view this story';
      errorTitle = 'Authentication Required';
      showLogin = true;
    } else if (error.message.includes('not found')) {
      errorMessage = 'Story not found';
    } else if (error.message.includes('Invalid API') || error.message.includes('Invalid story')) {
      errorMessage = 'The story data is not in the expected format';
      errorTitle = 'Data Format Error';
    }

    document.getElementById('storyDetail').innerHTML = `
      <div class="error-message">
        <h2>${errorTitle}</h2>
        <p>${errorMessage}</p>
        <div class="error-actions">
          <a href="#/stories" class="btn">Back to Stories</a>
          ${showLogin ? `<a href="#/login" class="btn btn-primary">Login</a>` : ''}
        </div>
      </div>
    `;
  }
}