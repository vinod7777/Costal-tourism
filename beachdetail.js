import { beaches } from './assets/js/beaches.js';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const beachId = urlParams.get('id');

    const beach = beaches.beaches_in_india.find(b => b.id === beachId);

    if (beach) {
        populateBeachDetails(beach);
    } else {
        displayError();
    }
});

function populateBeachDetails(beach) {
    // Set page title
    document.title = `${beach.name} - Coastal Guide`;

    // Set header image and name
    const beachImage = document.getElementById('beach-image');
    const beachName = document.getElementById('beach-name');
    if (beachImage) {
        beachImage.style.backgroundImage = `linear-gradient(0deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 40%), url("${beach.image}")`;
    }
    if (beachName) {
        beachName.textContent = `${beach.name}, ${beach.state_ut}`;
    }

    // Set description
    const beachDescription = document.getElementById('beach-description');
    if (beachDescription) {
        beachDescription.textContent = beach.description || 'No description available for this beach.';
    }

    // Populate gallery
    const galleryContainer = document.getElementById('beach-gallery');
    if (galleryContainer && beach.gallery && beach.gallery.length > 0) {
        galleryContainer.innerHTML = beach.gallery.map(imgUrl => `
            <a href="${imgUrl}" target="_blank" class="block overflow-hidden rounded-lg group">
                <img src="${imgUrl.replace('w=1200&h=800', 'w=400&h=300')}" alt="Photo of ${beach.name}" class="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-300">
            </a>
        `).join('');
    } else if(galleryContainer) {
        galleryContainer.innerHTML = `<p class="text-text-muted-light dark:text-text-muted-dark col-span-full">No gallery images available.</p>`;
    }

    // Populate activities
    const activitiesContainer = document.getElementById('beach-activities');
    if (activitiesContainer && beach.activities && beach.activities.length > 0) {
        activitiesContainer.innerHTML = beach.activities.map(activity => `
            <li class="flex items-center gap-3 bg-surface-light dark:bg-surface-dark p-3 rounded-lg shadow-sm">
                <span class="material-symbols-outlined text-primary">${getActivityIcon(activity)}</span>
                <span class="font-medium">${activity}</span>
            </li>
        `).join('');
    } else if (activitiesContainer) {
        activitiesContainer.innerHTML = `<p class="text-text-muted-light dark:text-text-muted-dark col-span-full">No specific activities listed.</p>`;
    }

    // Set coordinates for weather and nearby places
    const weatherInfo = document.getElementById('weather-info');
    if (weatherInfo) {
        weatherInfo.dataset.lat = beach.lat;
        weatherInfo.dataset.lon = beach.lon;
        // Trigger weather update
        document.dispatchEvent(new CustomEvent('weather-widget-added', { detail: weatherInfo }));
    }
}

function displayError() {
    document.getElementById('beach-name').textContent = 'Beach Not Found';
    document.getElementById('beach-description').textContent = 'The beach you are looking for could not be found. Please go back and select a different beach.';
    // Hide other sections
    ['photo-gallery-section', 'activities-section', 'weather-tides-section', 'nearby-section'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function getActivityIcon(activity) {
    const iconMap = {
        'swim': 'pool',
        'sunbathe': 'wb_sunny',
        'walk': 'directions_walk',
        'photography': 'photo_camera',
        'surf': 'surfing',
        'jet ski': 'jet_ski',
        'snorkel': 'scuba_diving',
        'dive': 'scuba_diving',
        'family': 'family_restroom',
        'sunset': 'wb_twilight',
        'history': 'history_edu',
        'street food': 'ramen_dining',
        'relax': 'beach_access',
        'kayak': 'kayaking',
        'camel ride': 'stroller'
    };
    return iconMap[activity.toLowerCase()] || 'beach_access';
}