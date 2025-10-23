// Minimal Glode 3B placeholder client
// Exports a simple API that emulates an LLM's `generate` method.

export const GLODE3B = {
  async generate(prompt) {
    // Lightweight simulated response — replace with real API call when available.
    return {
      text: `Simulated Glode-3B response for prompt: "${prompt.slice(0,120)}${
        prompt.length > 120 ? '...' : ''
      }"`,
    };
  },
};

// Helper to initialize a Leaflet map and add beach markers
export function initBeachMap({ containerId = 'hero-map', onMarkerClick } = {}) {
  // Lazy-load Leaflet if not already present
  if (typeof L === 'undefined') {
    console.warn('Leaflet not loaded. Ensure leaflet.js is included.');
    return null;
  }

  const map = L.map(containerId, { zoomControl: false }).setView([20.5937, 78.9629], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  const beaches = [
    { name: 'Rushikonda Beach', lat: 17.781, lon: 83.385 },
    { name: 'Varkala Beach', lat: 8.7333, lon: 76.7167 },
    { name: 'Marina Beach', lat: 13.0500, lon: 80.2820 },
    { name: 'Baga Beach', lat: 15.544, lon: 73.747 },
    { name: 'Radhanagar Beach', lat: 11.9416, lon: 92.9739 },
  ];

  beaches.forEach((b) => {
    const marker = L.marker([b.lat, b.lon]).addTo(map).bindPopup(`<strong>${b.name}</strong>`);
    marker.on('click', () => onMarkerClick && onMarkerClick(b));
  });

  return map;
}
