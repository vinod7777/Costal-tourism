import { beaches } from './assets/js/beaches.js';

const $ = (selector, parent = document) => parent.querySelector(selector);

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const beachName = urlParams.get('beach');

    if (!beachName) {
        showError('No beach specified in URL');
        return;
    }

    const allBeaches = beaches.beaches_in_india;
    const beach = allBeaches.find(b => b.name === beachName);

    if (!beach) {
        showError(`Beach "${beachName}" not found`);
        console.error(`Beach with name "${beachName}" not found in beaches.js`);
        return;
    }

    function showError(message) {
        const nameEl = document.getElementById('beach-name');
        if (nameEl) nameEl.textContent = message;
        
        const descEl = document.getElementById('beach-description');
        if (descEl) descEl.innerHTML = `
            <div class="text-center py-8">
                <p class="text-lg text-background-dark/70 dark:text-background-light/70 mb-4">${message}</p>
                <a href="searchbeach.html" class="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                    <span class="material-symbols-outlined">arrow_back</span>
                    Back to Beach Search
                </a>
            </div>
        `;
    }

    document.title = `${beach.name} - Coastal Guide`;

    const nameHeader = $('#beach-name');
    if (nameHeader) nameHeader.textContent = `${beach.name}, ${beach.state_ut}`;

    const imgDiv = $('#beach-image');
    if (imgDiv) {
        const imageUrl = beach.gallery && beach.gallery.length > 0 ? beach.gallery[0] : 
                        beach.image ? beach.image.replace('w=800&h=600', 'w=1200&h=800') : 
                        `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop&auto=format`;
        imgDiv.style.backgroundImage = `linear-gradient(0deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 40%), url('${imageUrl}')`;
    }

    const desc = $('#beach-description');
    if (desc) desc.textContent = beach.description || `Explore ${beach.name} located in ${beach.state_ut}.`;

    // Populate photo gallery
    const galleryContainer = $('#beach-gallery');
    if (galleryContainer) {
        populateGallery(beach);
    }

    const activitiesList = $('#beach-activities');
    if (activitiesList) {
        if (Array.isArray(beach.activities) && beach.activities.length) {
            activitiesList.innerHTML = beach.activities.map(a => `
                <li class="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-background-light dark:bg-background-dark">
                    <span class="font-medium text-background-dark dark:text-background-light">${capitalize(a)}</span>
                    <span class="activity-rating text-xs font-semibold rounded-full px-2 py-0.5 bg-gray-100 text-gray-700" data-activity="${a}">Checking...</span>
                </li>
            `).join('');
        } else {
            activitiesList.innerHTML = '<li class="p-3 text-background-dark/70 dark:text-background-light/70">No specific activities listed.</li>';
        }
    }

    const facilitiesList = $('#beach-facilities');
    if (facilitiesList) {
        if (Array.isArray(beach.facilities) && beach.facilities.length) {
            facilitiesList.innerHTML = beach.facilities.map(f => `
                <li class="flex items-center gap-2 py-1">
                    <span class="material-symbols-outlined text-primary text-sm">check_circle</span>
                    <span>${capitalize(f)}</span>
                </li>
            `).join('');
        } else {
            facilitiesList.innerHTML = '<li class="text-background-dark/70 dark:text-background-light/70">Facilities information not available.</li>';
        }
    }

    // Weather widget hookup into #weather-info
    const weatherContainer = $('#weather-info');
    if (weatherContainer) {
        weatherContainer.setAttribute('data-weather-widget', '');
        weatherContainer.setAttribute('data-lat', beach.lat);
        weatherContainer.setAttribute('data-lon', beach.lon);
        document.dispatchEvent(new CustomEvent('weather-widget-added', { detail: weatherContainer }));
    }

    // Optional: activity safety ratings when weather arrives
    function rateActivity(activity, windKmh, waveStr) {
        const waveM = parseFloat(String(waveStr).replace(/[^0-9.]/g, '')) || 0.5;
        const wind = parseFloat(windKmh) || 0;
        let score = 3;
        if (activity.toLowerCase().includes('swim')) {
            if (waveM > 1.8 || wind > 35) score = 1; else if (waveM > 1.0 || wind > 25) score = 2;
        } else if (activity.toLowerCase().includes('surf')) {
            if (wind < 10 && waveM < 0.8) score = 2; else if (waveM > 3.0 || wind > 50) score = 1; else score = 3;
        } else if (activity.toLowerCase().includes('jet') || activity.toLowerCase().includes('kayak')) {
            if (wind > 40 || waveM > 2.0) score = 1; else if (wind > 25 || waveM > 1.2) score = 2;
        } else if (activity.toLowerCase().includes('snorkel') || activity.toLowerCase().includes('dive')) {
            if (wind > 35 || waveM > 1.5) score = 1; else if (wind > 20 || waveM > 1.0) score = 2;
        } else {
            if (wind > 40 || waveM > 2.5) score = 2;
        }
        return score;
    }

    function applySafetyRatings(weather) {
        const wind = weather.wind;
        const waves = weather.waves;
        document.querySelectorAll('.activity-rating').forEach(tag => {
            const act = tag.getAttribute('data-activity') || '';
            const score = rateActivity(act, wind, waves);
            const label = score === 3 ? 'Safe' : score === 2 ? 'Caution' : 'Unsafe';
            const cls = score === 3 ? 'bg-green-100 text-green-700' : score === 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
            tag.textContent = label;
            tag.className = `activity-rating text-xs font-semibold rounded-full px-2 py-0.5 ${cls}`;
        });
    }

    document.addEventListener('weather-updated', (e) => {
        if (e.detail && e.detail.widget === weatherContainer) {
            applySafetyRatings(e.detail.weather);
        }
    });

    // Function to populate photo gallery with beach-specific images
    function populateGallery(beach) {
        const galleryContainer = $('#beach-gallery');
        if (!galleryContainer) return;

        // Create gallery images array
        let galleryImages = [];
        
        // Use beach gallery if available, otherwise create from main image
        if (beach.gallery && beach.gallery.length > 0) {
            galleryImages = beach.gallery.map((img, index) => ({
                url: img,
                title: generateImageTitle(beach.name, index),
                description: generateImageDescription(beach.name, index)
            }));
        } else if (beach.image) {
            // Create multiple variations of the main image
            const baseImage = beach.image.replace('w=800&h=600', 'w=600&h=400');
            galleryImages = [
                {
                    url: baseImage,
                    title: `${beach.name} Beach View`,
                    description: 'Main beach panorama'
                },
                {
                    url: baseImage.replace('?w=600&h=400', '?w=600&h=400&sat=-20'),
                    title: `${beach.name} Coastline`,
                    description: 'Scenic coastal view'
                },
                {
                    url: baseImage.replace('?w=600&h=400', '?w=600&h=400&con=20'),
                    title: `${beach.name} Waters`,
                    description: 'Crystal clear waters'
                }
            ];
        }

        // Add additional curated images based on beach location
        const additionalImages = getAdditionalBeachImages(beach);
        galleryImages = [...galleryImages, ...additionalImages];

        // Limit to 6 images maximum
        galleryImages = galleryImages.slice(0, 6);

        // Render gallery
        if (galleryImages.length === 0) {
            galleryContainer.innerHTML = `
                <div class="text-center py-8 col-span-full">
                    <div class="text-gray-400 dark:text-gray-600">
                        <span class="material-symbols-outlined text-4xl mb-4 block">photo_library</span>
                        <p class="text-lg">No gallery images available</p>
                        <p class="text-sm">Check back later for photos</p>
                    </div>
                </div>
            `;
            return;
        }

        galleryContainer.innerHTML = galleryImages.map(img => `
            <div class="group flex flex-col gap-3">
                <div class="w-full overflow-hidden rounded-lg cursor-pointer" onclick="openImageModal('${img.url}', '${img.title}')">
                    <div class="aspect-video w-full bg-cover bg-center bg-no-repeat transition-transform duration-300 group-hover:scale-105 bg-gray-200 dark:bg-gray-700" 
                         style="background-image: url('${img.url}')">
                    </div>
                </div>
                <div>
                    <p class="font-medium text-background-dark dark:text-background-light">${img.title}</p>
                    <p class="text-sm text-background-dark/70 dark:text-background-light/70">${img.description}</p>
                </div>
            </div>
        `).join('');
    }

    // Generate contextual image titles
    function generateImageTitle(beachName, index) {
        const titles = [
            `${beachName} Panorama`,
            `${beachName} Shoreline`,
            `${beachName} Sunset View`,
            `${beachName} Beach Activities`,
            `${beachName} Coastal Beauty`,
            `${beachName} Waters`
        ];
        return titles[index] || `${beachName} View ${index + 1}`;
    }

    // Generate contextual image descriptions
    function generateImageDescription(beachName, index) {
        const descriptions = [
            'Stunning beach panorama',
            'Beautiful shoreline view',
            'Breathtaking sunset colors',
            'Beach activities and fun',
            'Natural coastal beauty',
            'Crystal clear waters'
        ];
        return descriptions[index] || 'Beautiful beach scenery';
    }

    // Get additional curated images based on beach characteristics
    function getAdditionalBeachImages(beach) {
        const additionalImages = [];
        const beachName = beach.name.toLowerCase();
        const state = beach.state_ut.toLowerCase();

        // Add region-specific images
        if (state.includes('goa')) {
            additionalImages.push({
                url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&h=400&fit=crop&auto=format',
                title: 'Goa Beach Culture',
                description: 'Vibrant beach atmosphere'
            });
        } else if (state.includes('kerala')) {
            additionalImages.push({
                url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&h=400&fit=crop&auto=format',
                title: 'Kerala Backwaters',
                description: 'Serene coastal backwaters'
            });
        } else if (state.includes('andaman')) {
            additionalImages.push({
                url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&h=400&fit=crop&auto=format',
                title: 'Tropical Paradise',
                description: 'Pristine island beauty'
            });
        } else if (state.includes('gujarat')) {
            additionalImages.push({
                url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop&auto=format',
                title: 'Gujarat Coastline',
                description: 'Dramatic coastal landscape'
            });
        }

        // Add activity-based images
        if (beach.activities.includes('Surf')) {
            additionalImages.push({
                url: 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=600&h=400&fit=crop&auto=format',
                title: 'Surfing Waves',
                description: 'Perfect waves for surfing'
            });
        }

        if (beach.activities.includes('Snorkel') || beach.activities.includes('Dive')) {
            additionalImages.push({
                url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&h=400&fit=crop&auto=format',
                title: 'Underwater World',
                description: 'Marine life and coral reefs'
            });
        }

        return additionalImages;
    }

    // Image modal function (simple version)
    window.openImageModal = function(imageUrl, title) {
        // Create a simple modal overlay
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="relative max-w-4xl max-h-full">
                <img src="${imageUrl}" alt="${title}" class="max-w-full max-h-full object-contain rounded-lg">
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75">
                    <span class="material-symbols-outlined">close</span>
                </button>
                <div class="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-4 py-2 rounded">
                    <p class="font-semibold">${title}</p>
                </div>
            </div>
        `;
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        document.body.appendChild(modal);
    };
});