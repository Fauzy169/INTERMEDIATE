import CONFIG from '../config';

let mapInstance = null;
let tileLayers = {};

/**
 * Tunggu hingga elemen DOM tersedia, maksimal 10x percobaan
 */
const waitForElement = (id, retries = 10, delay = 100) =>
  new Promise((resolve, reject) => {
    const attempt = (remaining) => {
      const el = document.getElementById(id);
      if (el) {
        resolve(el);
      } else if (remaining <= 0) {
        reject(new Error(`Element #${id} not found after waiting.`));
      } else {
        setTimeout(() => attempt(remaining - 1), delay);
      }
    };
    attempt(retries);
  });

/**
 * Inisialisasi peta Leaflet
 * @param {string} elementId - ID elemen HTML tempat map akan dirender
 * @param {object} options - Opsi tambahan (center, zoom, dll)
 * @returns {object} mapInstance
 */
export const initMap = async (elementId, options = {}) => {
  if (typeof L === 'undefined') {
    throw new Error('Leaflet library is not loaded. Please make sure Leaflet is properly included in your project.');
  }

  // Pastikan elemen sudah tersedia di DOM
  await waitForElement(elementId);

  // Bersihkan map lama jika ada
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  const defaultOptions = {
    center: CONFIG.DEFAULT_MAP_CENTER,
    zoom: CONFIG.DEFAULT_MAP_ZOOM,
  };

  const mapOptions = { ...defaultOptions, ...options };

  mapInstance = L.map(elementId).setView(mapOptions.center, mapOptions.zoom);

  tileLayers.openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  });

  tileLayers.openStreetMap.addTo(mapInstance);

  return mapInstance;
};

/**
 * Tambahkan marker ke peta dari daftar story
 * @param {object} map - Instance Leaflet map
 * @param {Array} stories - Daftar cerita dengan lat, lon, deskripsi
 */
export const addMarkers = (map, stories) => {
  if (typeof L === 'undefined') {
    console.error('Leaflet library is not loaded. Cannot add markers.');
    return;
  }

  stories.forEach(story => {
    if (story.lat && story.lon) {
      let header = story.name || "User's Story";
      let content = story.description;

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

/**
 * Ambil lokasi user saat ini dengan Promise
 * @returns {Promise<{lat: number, lon: number}>}
 */
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

/**
 * Ambil instance aktif dari map (opsional)
 * @returns {object|null}
 */
export const getMapInstance = () => mapInstance;
