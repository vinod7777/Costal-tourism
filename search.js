import { beaches } from './assets/js/beaches.js';

document.addEventListener('DOMContentLoaded', () => {
    const allBeaches = beaches.beaches_in_india;
    const beachListContainer = document.getElementById('beach-list');
    const noResultsDiv = document.getElementById('no-results');
    const searchInput = document.getElementById('search-input');
    const stateFilterButton = document.getElementById('state-filter-button');
    const stateFilterLabel = document.getElementById('state-filter-label');
    const stateFilterOptions = document.getElementById('state-filter-options');
    const activityFilterButton = document.getElementById('activity-filter-button');
    const activityFilterLabel = document.getElementById('activity-filter-label');
    const activityFilterOptions = document.getElementById('activity-filter-options');

    let currentFilters = {
        searchTerm: '',
        state: 'All States',
        activity: 'All Activities'
    };

    // --- Filter Setup ---
    function setupFilters() {
        // States
        const states = ['All States', ...new Set(allBeaches.map(b => b.state_ut))].sort();
        stateFilterOptions.innerHTML = states.map(state => `<button class="block w-full px-4 py-2 text-left text-sm hover:bg-primary/10">${state}</button>`).join('');

        // Activities
        const activities = ['All Activities', ...new Set(allBeaches.flatMap(b => b.activities))].sort();
        activityFilterOptions.innerHTML = activities.map(act => `<button class="block w-full px-4 py-2 text-left text-sm hover:bg-primary/10">${act}</button>`).join('');

        // Generic filter dropdown logic
        function setupDropdown(button, options, filterKey, label) {
            button.addEventListener('click', () => options.classList.toggle('hidden'));
            options.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON') {
                    currentFilters[filterKey] = e.target.textContent;
                    label.textContent = e.target.textContent;
                    options.classList.add('hidden');
                    filterAndRenderBeaches();
                }
            });
        }

        setupDropdown(stateFilterButton, stateFilterOptions, 'state', stateFilterLabel);
        setupDropdown(activityFilterButton, activityFilterOptions, 'activity', activityFilterLabel);

        document.addEventListener('click', (e) => {
            if (!stateFilterButton.parentElement.contains(e.target)) stateFilterOptions.classList.add('hidden');
            if (!activityFilterButton.parentElement.contains(e.target)) activityFilterOptions.classList.add('hidden');
        });
    }

    // --- Beach Rendering ---
    function renderBeaches(beachesToRender) {
        if (beachesToRender.length === 0) {
            noResultsDiv.classList.remove('hidden');
            beachListContainer.classList.add('hidden');
        } else {
            noResultsDiv.classList.add('hidden');
            beachListContainer.classList.remove('hidden');
            beachListContainer.innerHTML = beachesToRender.map(createBeachCard).join('');
            // Notify weather.js that new widgets have been added
            document.dispatchEvent(new CustomEvent('beach-cards-rendered'));
            // Wire up map buttons
            if (window.wireMapButtons) {
                window.wireMapButtons();
            }
        }
    }

    function createBeachCard(beach) {
        return `
            <div class="group relative overflow-hidden rounded-xl bg-surface-light shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-surface-dark" data-lat="${beach.lat}" data-lon="${beach.lon}">
                <a href="beachdetail.html?id=${beach.id}" class="block">
                    <img class="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-105" src="${beach.image}" alt="${beach.name}" />
                </a>
                <div class="p-4">
                    <h3 class="text-lg font-bold">
                        <a href="beachdetail.html?id=${beach.id}" class="hover:text-primary">${beach.name}</a>
                    </h3>
                    <p class="text-sm text-text-muted-light dark:text-text-muted-dark">${beach.state_ut}</p>
                    <div class="mt-2 flex flex-wrap gap-2">
                        ${beach.activities.map(activity => `<span class="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary dark:bg-primary/20">${activity}</span>`).join('')}
                    </div>
                </div>
                <div class="absolute right-4 top-4 z-10 rounded-lg bg-black/50 p-2 text-white backdrop-blur-sm" data-weather-widget data-lat="${beach.lat}" data-lon="${beach.lon}">
                    <p class="weather-temp text-lg font-bold">--°C</p>
                </div>
                <div class="absolute bottom-4 right-4 z-10">
                    <button class="btn-show-on-map rounded-full bg-white/80 p-2 text-text-light shadow-md backdrop-blur-sm transition-colors hover:bg-white" title="Show on map">
                        <span class="material-symbols-outlined">location_on</span>
                    </button>
                </div>
            </div>
        `;
    }

    // --- Filtering Logic ---
    function filterAndRenderBeaches() {
        let filtered = [...allBeaches];

        // Search term filter
        if (currentFilters.searchTerm) {
            const term = currentFilters.searchTerm.toLowerCase();
            filtered = filtered.filter(b =>
                b.name.toLowerCase().includes(term) ||
                b.state_ut.toLowerCase().includes(term)
            );
        }

        // State filter
        if (currentFilters.state !== 'All States') {
            filtered = filtered.filter(b => b.state_ut === currentFilters.state);
        }

        // Activity filter
        if (currentFilters.activity !== 'All Activities') {
            filtered = filtered.filter(b => b.activities.includes(currentFilters.activity));
        }

        renderBeaches(filtered);
    }

    // --- Event Listeners ---
    searchInput.addEventListener('input', (e) => {
        currentFilters.searchTerm = e.target.value;
        filterAndRenderBeaches();
    });

    document.getElementById('btn-locate').addEventListener('click', () => {
        // This relies on app.js to fire the 'beaches-sorted-by-distance' event
    });

    document.addEventListener('beaches-sorted-by-distance', (e) => {
        const sortedBeaches = e.detail;
        renderBeaches(sortedBeaches);
    });

    // --- Initialization ---
    function initialize() {
        setupFilters();

        // Check for URL params to pre-filter
        const urlParams = new URLSearchParams(window.location.search);
        const stateFromUrl = urlParams.get('state');
        if (stateFromUrl) {
            currentFilters.state = stateFromUrl;
            stateFilterLabel.textContent = stateFromUrl;
        }

        filterAndRenderBeaches();
    }

    initialize();
});