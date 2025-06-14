import StoryPresenter from './story-presenter';
import CONFIG from '../../config';
import { showFormattedDate } from '../../utils';
import { initMap, addMarkers } from '../../utils/map';

export default class StoryPage {
  constructor() {
    this._map = null;
    this._presenter = StoryPresenter;
    this._abortController = new AbortController();
    this._stories = [];
    this._currentPage = 1;
    this._isLoading = false;
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
      await this._presenter.init(this);
      this._setupEventListeners();
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error in afterRender:', error);
      }
    }
  }

  async _initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    try {
      this._map = await initMap('map', {
        center: CONFIG.DEFAULT_MAP_CENTER,
        zoom: CONFIG.DEFAULT_MAP_ZOOM,
      });
    } catch (error) {
      console.error('Map init failed:', error);
      mapContainer.innerHTML = `<p class="map-error">Failed to load map</p>`;
    }
  }

  renderStories(stories) {
    this._stories = stories;
    const container = document.getElementById('stories');
    container.innerHTML = this._generateStoryCards(stories);
  }

  appendStories(stories) {
    this._stories = [...this._stories, ...stories];
    const container = document.getElementById('stories');
    container.insertAdjacentHTML('beforeend', this._generateStoryCards(stories));
  }

  _generateStoryCards(stories) {
    return stories.map((story) => {
      let header = 'My Story';
      let content = story.description;
      const match = content.match(/\[HEADER\](.*?)\[\/HEADER\]/);
      if (match) {
        header = match[1];
        content = content.replace(match[0], '').trim();
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
    this._map.eachLayer(layer => {
      if (layer instanceof L.Marker) this._map.removeLayer(layer);
    });
    const locStories = stories.filter(s => s.lat && s.lon);
    addMarkers(this._map, locStories);
  }

  updateLoadButton(isLoading, hasMore) {
    const btn = document.getElementById('loadMoreBtn');
    const noMore = document.querySelector('.no-more');
    if (!btn) return;

    btn.disabled = isLoading;
    btn.innerHTML = isLoading
      ? '<i class="fas fa-spinner fa-spin"></i> Loading...'
      : 'Load More Stories';

    if (!hasMore) {
      btn.style.display = 'none';
      if (noMore) noMore.style.display = 'block';
    } else {
      btn.style.display = 'inline-block';
      if (noMore) noMore.style.display = 'none';
    }
  }

  showError(error) {
    const message = error.message.includes('auth')
      ? 'Please login to view stories'
      : 'Failed to load stories. Please try again';

    const el = document.createElement('div');
    el.className = 'error-message';
    el.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    document.querySelector('.story-container').prepend(el);
    setTimeout(() => el.remove(), 4000);
  }

  _setupEventListeners() {
    document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
      this._presenter.loadMoreStories();
    });

    document.getElementById('refreshBtn')?.addEventListener('click', () => {
      this._presenter.loadStories();
    });

    document.addEventListener('click', (e) => {
      const card = e.target.closest('.story-card');
      if (card) {
        const id = card.dataset.id;
        window.location.hash = `#/stories/${id}`;
      }
    });
  }
}
