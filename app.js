import { beaches } from './beaches.js';

/* app.js
   Leaflet map + Nominatim search + reverse geocode + sample beach markers
   - Uses the public Nominatim instance (rate-limited). Use debounce and caching.
   - For production: consider LocationIQ / Geoapify or run a serverless proxy.
*/

/* ---------- Configuration ---------- */
const DEFAULT_CENTER = [20.5937, 78.9629]; // center of India
const DEFAULT_ZOOM = 5;
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const EMAIL_CONTACT = "your-email@example.com"; // include an email param to identify your app (politeness)

/* ---------- Helpers ---------- */
function debounce(fn, wait = 400) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}
function el(id) { return document.getElementById(id); }

/* ---------- Initialize Map ---------- */
const map = L.map('map').setView(DEFAULT_CENTER, DEFAULT_ZOOM);

// OSM tiles (public). Keep usage polite.
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19
}).addTo(map);

/* ---------- Load beaches from beaches.js ---------- */
const allBeachesData = beaches.beaches_in_india;

const beachLayerGroup = L.layerGroup().addTo(map);

function addBeachMarker(b) {
  const m = L.marker([b.lat, b.lon]).addTo(beachLayerGroup);
  const popupHtml = `
    <div style="min-width:200px">
      <strong>${b.name}</strong><br/>
      ${b.state_ut ? `<small>${b.state_ut}</small><br/>` : ''}
      Activities: ${b.activities.join(', ')}<br/>
      <a href="#" data-id="${b.id}" class="more-link">More</a>
    </div>`;
  m.bindPopup(popupHtml);
  return m;
}

/* populate sample list and map */
function populateSampleBeaches() {
  const list = el('beach-list');
  list.innerHTML = '';
  allBeachesData.forEach(b => {
    addBeachMarker(b);
    const card = document.createElement('div');
    card.className = 'bg-white p-3 rounded shadow';
    card.innerHTML = `
      <h3 class="font-semibold">${b.name}</h3>
      <p class="text-sm text-slate-600">${b.state_ut}</p>
      <p class="text-sm mt-2">Activities: ${b.activities.join(', ')}</p>
      ${b.distance ? `<p class="text-sm text-slate-500">Distance: ${b.distance.toFixed(2)} km</p>` : ''}
      <a href="beachdetail.html?beach=${encodeURIComponent(b.name)}" class="mt-2 inline-block px-3 py-1 bg-blue-600 text-white rounded">View Details</a>
      <button data-lat="${b.lat}" data-lon="${b.lon}" class="mt-2 px-3 py-1 bg-blue-600 text-white rounded btn-center">Show on map</button>
    `;
    list.appendChild(card);
  });

  // wire "Show on map" buttons
  document.querySelectorAll('.btn-center').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const lat = +e.target.dataset.lat, lon = +e.target.dataset.lon;
      map.setView([lat, lon], 13);
    });
  });
}
populateSampleBeaches();

/* ---------- Nominatim forward geocoding (search) ---------- */
const searchInput = el('search');
const suggestionsBox = el('suggestions');

async function nominatimSearch(q) {
  if (!q || q.length < 2) return [];
  // cache in localStorage to reduce requests
  const cacheKey = `nom_${q.toLowerCase()}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const url = `${NOMINATIM_BASE}/search?format=json&limit=6&q=${encodeURIComponent(q)}&addressdetails=1&accept-language=en&email=${encodeURIComponent(EMAIL_CONTACT)}`;
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error('Nominatim error');
    const data = await res.json();
    // store small cache for 1 day
    localStorage.setItem(cacheKey, JSON.stringify(data));
    setTimeout(() => localStorage.removeItem(cacheKey), 24*60*60*1000);
    return data;
  } catch (err) {
    console.error('Search failed', err);
    alert('Search request failed. Check the browser console for details.');
    return [];
  }
}

function renderSuggestions(items) {
  if (!items.length) {
    suggestionsBox.classList.add('hidden');
    suggestionsBox.innerHTML = '';
    return;
  }
  suggestionsBox.classList.remove('hidden');
  suggestionsBox.innerHTML = items.map(it => {
    const name = it.display_name;
    return `<div class="p-2 suggestion hover:bg-slate-100" data-lat="${it.lat}" data-lon="${it.lon}">${name}</div>`;
  }).join('');
}

/* debounce calling Nominatim */
const debouncedSearch = debounce(async (q) => {
  const items = await nominatimSearch(q);
  renderSuggestions(items);
}, 450);

/* wire input */
searchInput.addEventListener('input', (e) => {
  const q = e.target.value.trim();
  if (q.length < 2) {
    suggestionsBox.classList.add('hidden');
    return;
  }
  debouncedSearch(q);
});

/* click suggestion -> center map + add marker */
suggestionsBox.addEventListener('click', (ev) => {
  const target = ev.target.closest('.suggestion');
  if (!target) return;
  const lat = parseFloat(target.dataset.lat);
  const lon = parseFloat(target.dataset.lon);
  map.setView([lat, lon], 13);
  // add a temporary marker
  const tmp = L.marker([lat, lon]).addTo(map);
  tmp.bindPopup(target.textContent).openPopup();
  suggestionsBox.classList.add('hidden');
});

/* hide suggestions if click outside */
document.addEventListener('click', (ev) => {
  if (!el('search').contains(ev.target) && !suggestionsBox.contains(ev.target)) {
    suggestionsBox.classList.add('hidden');
  }
});

/* ---------- Reverse geocode on map click ---------- */
map.on('click', async (e) => {
  const { lat, lng } = e.latlng;
  const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en&email=${encodeURIComponent(EMAIL_CONTACT)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Reverse geocode error');
    const data = await res.json();
    const name = data.display_name || 'Unknown location';
    L.popup()
      .setLatLng([lat, lng])
      .setContent(`<div><strong>${name}</strong><br/><button id="save-this" class="mt-2 px-3 py-1 bg-green-600 text-white rounded">Add as Beach</button></div>`)
      .openOn(map);

    // wire "Add as Beach" button (one-time)
    map.once('popupopen', () => {
      const btn = document.getElementById('save-this');
      if (!btn) return;
      btn.addEventListener('click', async () => {
        // Save logic: add to sampleBeaches or send to Firestore (see optional section)
        const newBeach = {
          id: 'b_local_' + Date.now(),
          name: data.name || data.display_name,
          lat, lon,
          activities: []
        };
        // Note: this is just a temporary local addition
        allBeachesData.push(newBeach);
        addBeachMarker(newBeach);
        // A full implementation would require re-rendering the list
        alert('Beach added locally. To persist, save to your backend / Firestore.');
        map.closePopup();
      });
    });

  } catch (err) {
    console.error(err);
    alert('Reverse geocode failed.');
  }
});

/* ---------- "My Location" button ---------- */
function haversineDistance(coords1, coords2) {
  function toRad(x) {
    return x * Math.PI / 180;
  }

  const R = 6371; // km
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lon - coords1.lon);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords2.lat);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

el('btn-locate').addEventListener('click', () => {
  if (!navigator.geolocation) return alert('Geolocation not supported');
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    map.setView([latitude, longitude], 13);
    L.marker([latitude, longitude]).addTo(map).bindPopup('Your approximate location').openPopup();

    allBeachesData.forEach(beach => {
      beach.distance = haversineDistance({ lat: latitude, lon: longitude }, beach);
    });

    allBeachesData.sort((a, b) => a.distance - b.distance);

    populateSampleBeaches();

  }, err => alert('Location error: ' + err.message));
});

/* ---------- Basic accessibility: press Enter in search -> if suggestion exists open first ---------- */
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const first = suggestionsBox.querySelector('.suggestion');
    if (first) first.click();
  }
});