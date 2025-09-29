import { beaches } from './beaches.js';

// Helper function to safely query for an element
const $ = (selector, parent = document) => parent.querySelector(selector);

// Helper function to update text content safely
const updateText = (selector, text, parent = document) => {
    const el = $(selector, parent);
    if (el) el.textContent = text;
};

// Function to capitalize the first letter of a string
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

document.addEventListener('DOMContentLoaded', () => {
    // Get the beach name from the URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const beachName = urlParams.get('beach');

    if (!beachName) {
        document.getElementById('beach-name').textContent = 'Beach not found!';
        return;
    }

    // Find the beach data from the imported list
    const allBeaches = beaches.beaches_in_india;
    const beach = allBeaches.find(b => b.name === beachName);

    if (beach) {
        // Populate the page with the beach data
        document.title = `${beach.name} - Coastal Guide`;
        
        // Header section
        $('#beach-name').textContent = `${beach.name}, ${beach.state_ut}`;

        // Update the main beach image
        const beachImageDiv = $('#beach-image');
        if (beachImageDiv) {
            const imageUrl = beach.gallery && beach.gallery.length > 0 ? beach.gallery[0] : `https://source.unsplash.com/random/1200x600?beach,${beach.name.split(' ')[0]}`;
            beachImageDiv.style.backgroundImage = `linear-gradient(0deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 40%), url('${imageUrl}')`;
        }

        // Populate Photo Gallery
        const galleryContainer = $('#photo-gallery-section .grid');
        if (galleryContainer && beach.gallery && beach.gallery.length > 0) {
            galleryContainer.innerHTML = beach.gallery.slice(0, 3).map((imgUrl, index) => `
                <div class="group flex flex-col gap-3">
                    <div class="w-full overflow-hidden rounded-lg">
                        <div class="aspect-video w-full bg-cover bg-center bg-no-repeat transition-transform duration-300 group-hover:scale-105" style="background-image: url('${imgUrl}');"></div>
                    </div>
                    <div>
                        <p class="font-medium text-background-dark dark:text-background-light">View #${index + 1}</p>
                        <p class="text-sm text-background-dark/70 dark:text-background-light/70">${beach.name}</p>
                    </div>
                </div>
            `).join('');
        } else if (galleryContainer) {
            galleryContainer.innerHTML = '<p class="text-background-dark/70 dark:text-background-light/70 col-span-full">No gallery images available for this beach.</p>';
        }

        // Populate Activities
        const activitiesContainer = $('#activities-section .flex-wrap');
        if (activitiesContainer && beach.activities && beach.activities.length > 0) {
            activitiesContainer.innerHTML = beach.activities.map(activity => `
                <div class="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">${capitalize(activity)}</div>
            `).join('');
        } else if (activitiesContainer) {
            activitiesContainer.innerHTML = '<p class="text-background-dark/70 dark:text-background-light/70">No specific activities listed.</p>';
        }

        // Populate Weather & Tides
        // This connects to the weather.js functionality via data attributes.
        const weatherTidesSection = $('#weather-tides-section');
        if (weatherTidesSection) {
            weatherTidesSection.setAttribute('data-weather-widget', '');
            weatherTidesSection.setAttribute('data-lat', beach.lat);
            weatherTidesSection.setAttribute('data-lon', beach.lon);
            // Trigger weather.js to fetch data for this new widget
            document.dispatchEvent(new CustomEvent('weather-widget-added', { detail: weatherTidesSection }));
        }

        // Populate Nearby Hotels & Restaurants
        const nearbyContainer = $('#nearby-section .space-y-6');
        if (nearbyContainer) {
            if (beach.nearby && beach.nearby.length > 0) {
                nearbyContainer.innerHTML = beach.nearby.map(item => `
                    <div class="flex flex-col gap-4 overflow-hidden rounded-xl border border-primary/20 bg-background-light p-4 shadow-sm transition-shadow hover:shadow-lg dark:bg-background-dark sm:flex-row sm:items-center">
                        <div class="h-40 w-full flex-shrink-0 rounded-lg bg-cover bg-center sm:h-32 sm:w-48" style="background-image: url('${item.image || 'https://source.unsplash.com/random/400x300?hotel'}');"></div>
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-background-dark dark:text-background-light">${item.name}</h3>
                            <p class="mt-1 text-sm text-background-dark/70 dark:text-background-light/70">${item.description}</p>
                            <button class="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90">Book Now</button>
                        </div>
                    </div>
                `).join('');
            } else {
                nearbyContainer.innerHTML = '<p class="text-background-dark/70 dark:text-background-light/70">No nearby places listed.</p>';
            }
        }

    } else {
        document.getElementById('beach-name').textContent = 'Beach not found!';
        console.error(`Beach with name "${beachName}" not found in beaches.js`);
    }
});