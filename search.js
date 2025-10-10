import { beaches } from './assets/js/beaches.js';

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const beachList = document.getElementById('beach-list');
    const noResults = document.getElementById('no-results');
    const stateFilterContainer = document.getElementById('state-filter-container');
    const stateFilterButton = document.getElementById('state-filter-button');
    const stateFilterLabel = document.getElementById('state-filter-label');
    const stateFilterOptions = document.getElementById('state-filter-options');
    const activityFilterContainer = document.getElementById('activity-filter-container');
    const activityFilterButton = document.getElementById('activity-filter-button');
    const activityFilterLabel = document.getElementById('activity-filter-label');
    const activityFilterOptions = document.getElementById('activity-filter-options');

    let allBeaches = beaches.beaches_in_india;
    let filteredBeaches = [...allBeaches];

    let selectedState = 'All';
    let selectedActivity = 'All';

    const activities = ['Swim', 'Surf', 'Dive'];

    function renderBeaches() {
        beachList.innerHTML = '';
        if (filteredBeaches.length === 0) {
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');
        }
        filteredBeaches.forEach(beach => {
            const beachCard = `
                <div class="group bg-surface-light dark:bg-surface-dark rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1" data-weather-widget data-lat="${beach.lat}" data-lon="${beach.lon}">
                    <div class="relative">
                        <img alt="${beach.name}" class="w-full h-48 object-cover" src="${beach.image || `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format`}" 
                             onerror="this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format'"
                             onload="this.style.opacity='1'" 
                             style="opacity: 0; transition: opacity 0.3s ease;">
                        <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                            <h3 class="text-white text-lg font-bold">${beach.name}</h3>
                            <p class="text-gray-300 text-sm">${beach.state_ut}</p>
                        </div>
                    </div>
                    <div class="p-4 space-y-4">
                        <div class="flex flex-wrap gap-2">
                            ${beach.activities.slice(0, 3).map(act => `<span class="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">${act}</span>`).join('')}
                        </div>
                        <div class="border-t border-border-light dark:border-border-dark my-2"></div>
                        <div class="grid grid-cols-4 gap-2 text-center">
                            <div>
                                <p class="text-xs text-text-muted-light dark:text-text-muted-dark">Temp</p>
                                <p class="font-semibold text-sm weather-temp">--°C</p>
                                <p class="text-[11px] text-text-muted-light dark:text-text-muted-dark">Today <span class="temp-delta text-green-500">--</span></p>
                            </div>
                            <div>
                                <p class="text-xs text-text-muted-light dark:text-text-muted-dark">Tide</p>
                                <p class="font-semibold text-sm weather-waves">--m</p>
                                <p class="text-[11px] text-text-muted-light dark:text-text-muted-dark">Today <span class="tide-delta text-green-500">--</span></p>
                            </div>
                            <div>
                                <p class="text-xs text-text-muted-light dark:text-text-muted-dark">Wind</p>
                                <p class="font-semibold text-sm weather-wind">--km/h</p>
                            </div>
                             <div>
                                <p class="text-xs text-text-muted-light dark:text-text-muted-dark">Dist.</p>
                                <p class="font-semibold text-sm beach-distance">${beach.distance ? `${beach.distance.toFixed(0)}km` : '--'}</p>
                            </div>
                        </div>
                        <div class="pt-2 flex gap-2">
                            <a href="beachdetail.html?beach=${encodeURIComponent(beach.name)}" class="text-center block w-full bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">View Details</a>
                            <a href="#" class="btn-show-on-map text-center block w-full bg-primary/10 text-primary rounded-lg py-2 text-sm font-semibold hover:bg-primary/20 transition-colors">
                                On Map
                            </a>
                        </div>
                    </div>
                </div>
            `;
            beachList.innerHTML += beachCard;
        });
        
        // Dispatch event for weather system to update widgets
        document.dispatchEvent(new CustomEvent('beach-cards-rendered'));
        
        // Also trigger weather widget updates directly if weather system is loaded
        setTimeout(() => {
            if (window.initWeather) {
                console.log('Manually triggering weather updates for new beach cards');
                const widgets = document.querySelectorAll('[data-weather-widget]');
                widgets.forEach(widget => {
                    document.dispatchEvent(new CustomEvent('weather-widget-added', { detail: widget }));
                });
            }
        }, 100);
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        filteredBeaches = allBeaches.filter(beach => {
            const nameMatch = beach.name.toLowerCase().includes(searchTerm);
            const stateMatch = beach.state_ut.toLowerCase().includes(searchTerm);
            const stateFilterMatch = selectedState === 'All' || beach.state_ut === selectedState;
            const activityFilterMatch = selectedActivity === 'All' || beach.activities.map(a => a.toLowerCase()).includes(selectedActivity.toLowerCase());


            return (nameMatch || stateMatch) && stateFilterMatch && activityFilterMatch;
        });
        renderBeaches();
    }

    // Populate State Filter
    const states = ['All', ...new Set(allBeaches.map(beach => beach.state_ut))];
    stateFilterOptions.innerHTML = states.map(state =>
        `<a href="#" class="block px-4 py-2 text-sm hover:bg-primary/10" data-value="${state}">${state}</a>`
    ).join('');

    // Populate Activity Filter
    const allActivities = [...new Set(allBeaches.flatMap(b => b.activities))].sort();
    activityFilterOptions.innerHTML = ['All', ...allActivities].map(activity =>
        `<a href="#" class="block px-4 py-2 text-sm hover:bg-primary/10" data-value="${activity}">${activity}</a>`
    ).join('');


    // Event Listeners
    searchInput.addEventListener('input', applyFilters);

    stateFilterButton.addEventListener('click', () => {
        stateFilterOptions.classList.toggle('hidden');
    });

    activityFilterButton.addEventListener('click', () => {
        activityFilterOptions.classList.toggle('hidden');
    });

    stateFilterOptions.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            selectedState = e.target.dataset.value;
            stateFilterLabel.textContent = selectedState;
            stateFilterOptions.classList.add('hidden');
            applyFilters();
        }
    });

    activityFilterOptions.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            selectedActivity = e.target.dataset.value;
            activityFilterLabel.textContent = selectedActivity;
            activityFilterOptions.classList.add('hidden');
            applyFilters();
        }
    });

    
    document.addEventListener('click', (e) => {
        if (!stateFilterContainer.contains(e.target)) {
            stateFilterOptions.classList.add('hidden');
        }
        if (!activityFilterContainer.contains(e.target)) {
            activityFilterOptions.classList.add('hidden');
        }
    });

    
    document.addEventListener('beaches-sorted-by-distance', (e) => {
        allBeaches = e.detail; 
        applyFilters(); 
    });

    
    document.addEventListener('beach-cards-rendered', () => {
        if (window.wireMapButtons) {
            window.wireMapButtons();
        }
        document.querySelectorAll('[data-weather-widget]').forEach(widget => document.dispatchEvent(new CustomEvent('weather-widget-added', { detail: widget })));
    });

    // Initial render
    applyFilters();
});