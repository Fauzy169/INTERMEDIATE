import CONFIG from '../../config';
import {
  getStories,
  getStoriesWithLocation,
} from '../../data/api';
import { saveData, getAllData } from '../../data/database';

const StoryPresenter = {
  async init(view) {
    this._view = view;
    this._stories = [];
    this._isLoading = false;
    this._currentPage = 1;
    this._hasMore = true;

    this.loadStories();
  },

  async loadStories(loadMore = false) {
    if (this._isLoading) return;

    this._isLoading = true;
    this._view.updateLoadButton(this._isLoading, this._hasMore);

    try {
      const token = localStorage.getItem(CONFIG.USER_TOKEN_KEY);
      const pageSize = CONFIG.PAGE_SIZE || 10;

      const response = token
        ? await getStoriesWithLocation(this._currentPage, pageSize)
        : await getStories(this._currentPage, pageSize);

      if (!response.listStory) throw new Error('Invalid API response structure');

      const newStories = response.listStory.filter(newStory =>
        !this._stories.some(existingStory => existingStory.id === newStory.id)
      );

      // Simpan cerita ke IndexedDB
      for (const story of newStories) {
        await saveData(story);
      }

      if (loadMore) {
        this._stories = [...this._stories, ...newStories];
        this._view.appendStories(newStories);
      } else {
        this._stories = newStories;
        this._view.renderStories(newStories);
      }

      this._view.updateMapMarkers(this._stories);
      this._hasMore = response.listStory.length >= pageSize;

    } catch (error) {
      console.error('Error loading stories:', error);

      // Fallback ke IndexedDB
      const cached = await getAllData();
      if (cached.length > 0) {
        console.warn('Using cached stories');
        this._stories = cached;
        this._view.renderStories(cached);
        this._view.updateMapMarkers(cached);
        this._hasMore = false;
      } else {
        this._view.showError(error);
      }

      this._currentPage = Math.max(1, this._currentPage - 1);
    } finally {
      this._isLoading = false;
      this._view.updateLoadButton(this._isLoading, this._hasMore);
    }
  },

  loadMoreStories() {
    if (!this._hasMore) return;
    this._currentPage++;
    this.loadStories(true);
  },
};

export default StoryPresenter;
