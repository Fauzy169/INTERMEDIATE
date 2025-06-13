import StoryPresenter from './story-presenter';
import CONFIG from '../../config';
import { getStories, getStoriesWithLocation } from '../../data/api';
import { showFormattedDate } from '../../utils';
import { initMap, addMarkers } from '../../utils/map';

export default class StoryPage {
  constructor() {
    this._map = null;
    this._presenter = new StoryPresenter(this);
    this._abortController = new AbortController();
    this._stories = []; // Initialize stories array
    this._currentPage = 1; // Initialize current page
    this._isLoading = false; // Initialize loading state
    this._hasMore = true;
  }

  async render() {
    return `
      <section class="story-container">
        <div class="story-header">
          <h1><i class="fas fa-book-open"></i> Stories</h1>
          <button id="refreshBtn" class="refresh-btn">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
        
        <div id="map" class="map-container"></div>
        
        <div id="stories" class="stories-grid"></div>
        
        <div class="load-more-container">
          <button id="loadMoreBtn" class="load-more-btn ${this._hasMore ? '' : 'hidden'}">
            ${this._isLoading ? 
              '<i class="fas fa-spinner fa-spin"></i> Loading...' : 
              'Load More Stories'}
          </button>
          ${!this._hasMore ? 
            '<p class="no-more">No more stories to load</p>' : ''}
        </div>
      </section>
    `;
  }

  async afterRender() {
    try {
      await this._initMap();
      await this._presenter.loadStories();
      this._setupEventListeners();
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error in afterRender:', error);
      }
    }
  }

  async _initMap() {
    try {
      this._map = initMap('map', {
        center: CONFIG.DEFAULT_MAP_CENTER,
        zoom: CONFIG.DEFAULT_MAP_ZOOM,
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

  async _loadStories(loadMore = false) {
    await this._presenter.loadStories(loadMore);
    if (this._isLoading) return;
    
    try {
      this._isLoading = true;
      this._updateLoadButton();
  
      const token = localStorage.getItem(CONFIG.USER_TOKEN_KEY);
      const pageSize = CONFIG.PAGE_SIZE || 10;
      
      let response;
      if (token) {
        response = await getStoriesWithLocation(this._currentPage, pageSize);
      } else {
        response = await getStories(this._currentPage, pageSize);
      }

      if (!response.listStory) {
        throw new Error('Invalid API response structure');
      }
  
      this._lastResponseCount = response.listStory.length;
      
      if (response.listStory.length === 0) {
        this._hasMore = false;
        this._updateLoadButton();
        return;
      }
      
      const newStories = response.listStory.filter(newStory => 
        !this._stories.some(existingStory => existingStory.id === newStory.id)
      );
      
      this._stories = [...this._stories, ...newStories];
      
      if (!loadMore) {
        this._renderStories();
      } else {
        this._appendStories(newStories);
      }
      
      this._updateMapMarkers();
  
      if (response.listStory.length < pageSize) {
        this._hasMore = false;
      }
  
    } catch (error) {
      console.error('Error loading stories:', error);
      this._showError(error);
      this._currentPage = Math.max(1, this._currentPage - 1);
    } finally {
      this._isLoading = false;
      this._updateLoadButton();
    }
  }

  renderStories(stories) {
    this._stories = stories;
    const storiesContainer = document.getElementById('stories');
    storiesContainer.innerHTML = this._generateStoryCards(stories);
  }

  appendStories(stories) {
    this._stories = [...this._stories, ...stories];
    const storiesContainer = document.getElementById('stories');
    storiesContainer.insertAdjacentHTML('beforeend', this._generateStoryCards(stories));
  }

  _generateStoryCards(stories = this._stories) {
    return stories.map(story => {
      let header = 'My Story';
      let content = story.description;
      
      const headerMatch = story.description.match(/\[HEADER\](.*?)\[\/HEADER\]/);
      if (headerMatch) {
        header = headerMatch[1];
        content = story.description.replace(headerMatch[0], '').trim();
      }
  
      return `
        <article class="story-card" data-id="${story.id}">
          <div class="story-image-container">
            <img src="${story.photoUrl}" alt="${header}" class="story-image">
          </div>
          <div class="story-content">
            <div class="story-header">
              <h3>${header}</h3>
              <time>${showFormattedDate(story.createdAt)}</time>
            </div>
            <p class="story-description">${content}</p>
          </div>
        </article>
      `;
    }).join('');
  }

  updateMapMarkers(stories) {
    if (!this._map) return;

    // Clear existing markers
    this._map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        this._map.removeLayer(layer);
      }
    });

    const storiesWithLocation = stories.filter(s => s.lat && s.lon);
    if (storiesWithLocation.length > 0) {
      addMarkers(this._map, storiesWithLocation);
      
      if (this._currentPage === 1) {
        const markerGroup = new L.featureGroup(
          storiesWithLocation.map(s => L.marker([s.lat, s.lon]))
        );
        this._map.fitBounds(markerGroup.getBounds().pad(0.2));
      }
    }
  }

  _setupEventListeners() {
    document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
    this._presenter.loadMoreStories();
  });

    document.getElementById('refreshBtn')?.addEventListener('click', () => {
    this._presenter.refreshStories();
  });

    document.addEventListener('click', (e) => {
      const storyCard = e.target.closest('.story-card');
      if (storyCard) {
        const storyId = storyCard.dataset.id;
        window.location.hash = `#/stories/${storyId}`;
      }

      const mapPin = e.target.closest('.map-pin-btn');
      if (mapPin && this._map) {
        const lat = parseFloat(mapPin.dataset.lat);
        const lon = parseFloat(mapPin.dataset.lon);
        this._map.flyTo([lat, lon], 15);
      }
    });
  }

  
updateLoadButton(isLoading, hasMore) {
    const btn = document.getElementById('loadMoreBtn');
    const noMore = document.querySelector('.no-more');
    
    if (!btn) return;

    btn.disabled = isLoading;
    
    if (isLoading) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    } else {
      btn.innerHTML = 'Load More Stories';
    }
    
    if (!hasMore) {
      btn.style.display = 'hidden';
      if (noMore) noMore.style.display = 'block';
    } else {
      btn.style.display = 'hidden';
      if (noMore) noMore.style.display = 'none';
    }
  }

  
showError(error) {
    const errorMessage = error.message.includes('authentication')
      ? 'Please login to view all stories'
      : 'Failed to load stories. Please try again';
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message slide-up';
    errorElement.innerHTML = `
      <i class="fas fa-exclamation-circle"></i>
      <span>${errorMessage}</span>
    `;
    
    const container = document.querySelector('.story-container');
    container.prepend(errorElement);
    
    setTimeout(() => {
      errorElement.remove();
    }, 5000);
  }
  _cleanup() {
    this._abortController.abort();
    if (this._map) {
      this._map.remove();
      this._map = null;
    }
  }
}