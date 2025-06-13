// src/scripts/pages/story/detail-page.js
import { getStoryDetail } from '../../data/api';
import { showFormattedDate } from '../../utils';
import { initMap } from '../../utils/map';
import CONFIG from '../../config';

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

  // Add this to your afterRender() method in detail-page.js
async afterRender() {
  const { id } = this._parseUrl();
  
  // Handle back button with transition
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
  
  // Set up image transition
  const detailImage = document.querySelector('.story-detail-image');
  if (detailImage) {
    detailImage.style.viewTransitionName = 'story-detail-image';
  }
}

  _parseUrl() {
    const url = window.location.hash.slice(1).split('/');
    return {
      id: url[2]
    };
  }

  async _loadStory(id) {
    try {
      const token = localStorage.getItem(CONFIG.USER_TOKEN_KEY);
      const response = await getStoryDetail(id, token);
      
      // Check for valid response structure
      if (!response || typeof response !== 'object' || !response.story) {
        throw new Error('Invalid story data structure');
      }

      this._story = response.story;
      this._renderStory();
      
      if (this._story.lat && this._story.lon) {
        this._initMap();
      }
    } catch (error) {
      console.error('Error loading story:', error);
      this._showError(error);
    }
  }

  _initMap() {
  try {
    const mapContainer = document.getElementById('storyMap');
    if (!mapContainer) return;

    this._map = initMap('storyMap', {
      center: [this._story.lat, this._story.lon],
      zoom: 12,
    });
    
    // Parse header dari description
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
      
      // Clean up any remaining malformed tags
      description = description.replace(/\[HEADER\].*$/s, '').trim();
      description = description.replace(/^.*\[\/HEADER\]/s, '').trim();
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
          ${showLogin ? `
            <a href="#/login" class="btn btn-primary">Login</a>
          ` : ''}
        </div>
      </div>
    `;
  }
}