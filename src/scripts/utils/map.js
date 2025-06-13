import CONFIG from '../config';

let mapInstance = null;
let tileLayers = {};

export const initMap = (elementId, options = {}) => {
  if (typeof L === 'undefined') {
    throw new Error('Leaflet library is not loaded. Please make sure Leaflet is properly included in your project.');
  }

  if (mapInstance) return mapInstance;

  const defaultOptions = {
    center: CONFIG.DEFAULT_MAP_CENTER,
    zoom: CONFIG.DEFAULT_MAP_ZOOM,
  };

  const mapOptions = { ...defaultOptions, ...options };
  
  mapInstance = L.map(elementId).setView(mapOptions.center, mapOptions.zoom);

  tileLayers.openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(mapInstance);

  return mapInstance;
};

export const addMarkers = (map, stories) => {
  if (typeof L === 'undefined') {
    console.error('Leaflet library is not loaded. Cannot add markers.');
    return;
  }

  stories.forEach(story => {
    if (story.lat && story.lon) {
      let header = story.name + "'s Story"; // Default header
      let content = story.description;
      
      // Parse header tags if they exist
      const headerMatch = story.description.match(/\[HEADER\](.*?)\[\/HEADER\]/s);
      if (headerMatch && headerMatch[1]) {
        header = headerMatch[1].trim();
        content = story.description.replace(/\[HEADER\].*?\[\/HEADER\]/s, '').trim();
      }

      const marker = L.marker([story.lat, story.lon]).addTo(map);
      marker.bindPopup(`
        <div class="map-popup">
          <h3>${header}</h3>
          <p>${content.substring(0, 100)}${content.length > 100 ? '...' : ''}</p>
          ${story.photoUrl ? `<img src="${story.photoUrl}" alt="${header}" class="map-popup-img">` : ''}
          <div class="map-popup-meta">
            <small>${new Date(story.createdAt).toLocaleDateString()}</small>
          </div>
        </div>
      `);
    }
  });
};

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        }),
        error => reject(error)
      );
    } else {
      reject(new Error('Geolocation is not supported by this browser.'));
    }
  });
};