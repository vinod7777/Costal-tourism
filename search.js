import { beaches } from './beaches.js';

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
                <div class="group bg-surface-light dark:bg-surface-dark rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1" data-weather-widget data-lat="15.5167" data-lon="73.7667">
                    <div class="relative">
                        <img alt="${beach.name}" class="w-full h-48 object-cover" src="https://source.unsplash.com/random/400x300?beach,${beach.name.split(' ')[0]}">
                        <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                            <h3 class="text-white text-lg font-bold">${beach.name}</h3>
                            <p class="text-gray-300 text-sm">${beach.state_ut}</p>
                        </div>
                    </div>
                    <div class="p-4 space-y-4">
                        <div class="flex justify-around text-center text-text-muted-light dark:text-text-muted-dark">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">pool</span>
                                <span class="text-xs font-medium">Swim</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">surfing</span>
                                <span class="text-xs font-medium">Surf</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">scuba_diving</span>
                                <span class="text-xs font-medium">Dive</span>
                            </div>
                        </div>
                        <div class="border-t border-border-light dark:border-border-dark my-2"></div>
                        <div class="grid grid-cols-3 gap-2 text-center">
                            <div>
                                <p class="text-xs text-text-muted-light dark:text-text-muted-dark">Temp</p>
                                <p class="font-semibold text-sm weather-temp">--°C</p>
                            </div>
                            <div>
                                <p class="text-xs text-text-muted-light dark:text-text-muted-dark">Waves</p>
                                <p class="font-semibold text-sm weather-waves">--m</p>
                            </div>
                            <div>
                                <p class="text-xs text-text-muted-light dark:text-text-muted-dark">Wind</p>
                                <p class="font-semibold text-sm weather-wind">--km/h</p>
                            </div>
                        </div>
                        <div class="pt-2 flex gap-2">
                            <a href="beachdetail.html?beach=${encodeURIComponent(beach.name)}" class="text-center block w-full bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">View Details</a>
                            <a href="beachdetail.html?beach=${encodeURIComponent(beach.name)}" class="text-center block w-full bg-primary/10 text-primary rounded-lg py-2 text-sm font-semibold hover:bg-primary/20 transition-colors">
                                More Info
                            </a>
                        </div>
                    </div>
                </div>
            `;
            beachList.innerHTML += beachCard;
        });
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        filteredBeaches = allBeaches.filter(beach => {
            const nameMatch = beach.name.toLowerCase().includes(searchTerm);
            const stateMatch = beach.state_ut.toLowerCase().includes(searchTerm);
            const stateFilterMatch = selectedState === 'All' || beach.state_ut === selectedState;
            // Activity filter logic can be added here when data is available
            // For now, we assume all activities are available at all beaches
            const activityFilterMatch = selectedActivity === 'All' || activities.includes(selectedActivity);


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
    activityFilterOptions.innerHTML = ['All', ...activities].map(activity =>
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

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!stateFilterContainer.contains(e.target)) {
            stateFilterOptions.classList.add('hidden');
        }
        if (!activityFilterContainer.contains(e.target)) {
            activityFilterOptions.classList.add('hidden');
        }
    });


    // Initial render
    applyFilters();
});