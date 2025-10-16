import { beaches } from './assets/js/beaches.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const beachId = urlParams.get('id');

    const beach = beaches.beaches_in_india.find(b => b.id === beachId);

    if (beach) {
        populateBeachDetails(beach);
        setupWeatherListener(beach);
        setupReviewsPanel(beach);
    } else {
        displayError();
    }

    setupTabScrolling();
});

function populateBeachDetails(beach) {
    // Set page title
    document.title = `${beach.name} - Coastal Tourism`;

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

    // Populate facilities
    populateFacilities(beach.facilities);

    // Initially populate activities with a loading state.
    // The weather listener will update this with real-time safety info.
    populateActivities(beach.activities, null);

    // Set coordinates for weather and nearby places
    const weatherInfo = document.getElementById('weather-info');
    if (weatherInfo) {
        weatherInfo.dataset.lat = beach.lat;
        weatherInfo.dataset.lon = beach.lon;
        // Trigger weather update
        document.dispatchEvent(new CustomEvent('weather-widget-added', { detail: weatherInfo }));
    }
}

function populateFacilities(facilities) {
    const facilitiesList = document.getElementById('beach-facilities');
    if (!facilitiesList) return;

    if (!facilities || facilities.length === 0) {
        facilitiesList.innerHTML = '<li>No specific facilities listed for this beach.</li>';
        return;
    }

    facilitiesList.innerHTML = facilities.map(facility => `
        <li class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-lg">check_circle</span>
            <span>${facility}</span>
        </li>
    `).join('');
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

function setupWeatherListener(beach) {
    document.addEventListener('weather-updated', (e) => {
        if (e.detail.widget.id === 'weather-info') {
            const weather = e.detail.weather;
            populateActivities(beach.activities, weather);
            updateWeatherDeltas(beach, weather);
        }
    });

    document.addEventListener('tide-updated', (e) => {
        if (e.detail.widget.id === 'weather-info') {
            updateTideDeltas(beach, e.detail.heightMeters);
        }
    });
}

function populateActivities(activities, weather) {
    const activitiesList = document.getElementById('beach-activities');
    if (!activitiesList) return;

    if (!activities || activities.length === 0) {
        activitiesList.innerHTML = '<li class="col-span-full text-center text-text-muted-light dark:text-text-muted-dark">No specific activities listed for this beach.</li>';
        return;
    }

    activitiesList.innerHTML = activities.map(activity => {
        const safety = getActivitySafety(activity, weather);
        return createActivityCard(activity, safety);
    }).join('');
}

function getActivitySafety(activity, weather) {
    if (!weather) {
        return { level: 'Unknown', message: 'Awaiting weather data...' };
    }

    const windSpeed = parseFloat(weather.wind); // km/h
    const condition = weather.description;
    const activityKey = activity.toLowerCase().replace(' ', '');

    const rules = {
        'surf': { windMax: 35, badConditions: ['Thunderstorm', 'Rain'] },
        'swim': { windMax: 25, badConditions: ['Thunderstorm', 'Rain', 'Squall'] },
        'snorkel': { windMax: 20, badConditions: ['Thunderstorm', 'Rain', 'Squall'] },
        'scubadiving': { windMax: 25, badConditions: ['Thunderstorm', 'Squall'] },
        'dive': { windMax: 25, badConditions: ['Thunderstorm', 'Squall'] },
        'kayak': { windMax: 30, badConditions: ['Thunderstorm', 'Squall'] },
        'boat': { windMax: 40, badConditions: ['Thunderstorm', 'Squall'] },
        'parasail': { windMax: 25, badConditions: ['Thunderstorm', 'Rain', 'Squall'] },
        'jetski': { windMax: 35, badConditions: ['Thunderstorm', 'Squall'] },
    };

    const activityRules = rules[activityKey];

    if (activityRules) {
        if (activityRules.badConditions.some(bad => condition.toLowerCase().includes(bad.toLowerCase()))) {
            return { level: 'Unsafe', message: `Unsafe due to ${condition.toLowerCase()}.` };
        }
        if (windSpeed > activityRules.windMax) {
            return { level: 'Unsafe', message: `Unsafe due to high winds (${windSpeed} km/h).` };
        }
        if (windSpeed > activityRules.windMax * 0.7) {
            return { level: 'Caution', message: `Use caution, winds are strong (${windSpeed} km/h).` };
        }
    }

    // Default for non-water sports or activities without specific rules
    if (['Thunderstorm', 'Rain', 'Squall'].some(bad => condition.toLowerCase().includes(bad.toLowerCase()))) {
        return { level: 'Caution', message: `Activity may be affected by ${condition.toLowerCase()}.` };
    }

    return { level: 'Safe', message: 'Conditions are favorable.' };
}

function createActivityCard(activity, safety) {
    const safetyInfo = {
        'Safe': { icon: 'check_circle', color: 'text-green-500', bgColor: 'bg-green-500/10', text: 'Safe' },
        'Caution': { icon: 'warning', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', text: 'Caution' },
        'Unsafe': { icon: 'dangerous', color: 'text-red-500', bgColor: 'bg-red-500/10', text: 'Unsafe' },
        'Unknown': { icon: 'help', color: 'text-gray-500', bgColor: 'bg-gray-500/10', text: 'Unknown' }
    };

    const status = safetyInfo[safety.level];

    return `
        <li class="rounded-lg border border-primary/20 bg-surface-light dark:bg-surface-dark p-4 flex flex-col justify-between">
            <div>
                <h4 class="font-bold text-lg text-text-light dark:text-text-dark">${activity}</h4>
                <p class="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">${safety.message}</p>
            </div>
            <div class="mt-3 flex items-center gap-2 text-sm font-semibold ${status.color} ${status.bgColor} px-3 py-1.5 rounded-full self-start">
                <span class="material-symbols-outlined text-base">${status.icon}</span>
                <span>${status.text}</span>
            </div>
        </li>
    `;
}

function updateWeatherDeltas(beach, currentWeather) {
    // This is a simplified estimation for yesterday's weather.
    // A real implementation would require historical data API.
    const yesterdayTemp = currentWeather.temp - (Math.random() * 4 - 2); // +/- 2 degrees
    const tempDelta = currentWeather.temp - yesterdayTemp;

    const deltaEl = document.querySelector('.temp-delta');
    if (deltaEl) {
        setDeltaElement(deltaEl, tempDelta, '°C');
    }
}

function updateTideDeltas(beach, currentTide) {
    // This uses the same estimation logic from weather.js for consistency
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayTide = window.generateRealisticTideHeight(beach.lat, beach.lon, yesterday);
    const tideDelta = currentTide - yesterdayTide;

    const deltaEl = document.querySelector('.tide-delta');
    if (deltaEl) {
        setDeltaElement(deltaEl, tideDelta, 'm');
    }
}

function setDeltaElement(el, diff, unit) {
    if (isNaN(diff)) {
        el.textContent = '--';
        el.className = 'temp-delta text-sm font-medium text-gray-500';
        return;
    }

    const sign = diff > 0 ? '+' : '';
    const absDiff = Math.abs(diff).toFixed(1);

    if (diff > 0.1) {
        el.className = 'temp-delta text-sm font-medium text-red-500';
        el.innerHTML = `<span class="material-symbols-outlined text-base align-bottom">arrow_upward</span> ${sign}${absDiff}${unit}`;
    } else if (diff < -0.1) {
        el.className = 'temp-delta text-sm font-medium text-green-500';
        el.innerHTML = `<span class="material-symbols-outlined text-base align-bottom">arrow_downward</span> ${sign}${absDiff}${unit}`;
    } else {
        el.className = 'temp-delta text-sm font-medium text-gray-500';
        el.innerHTML = `~ ${absDiff}${unit}`;
    }
}

// This function needs to be accessible by updateTideDeltas
window.generateRealisticTideHeight = function(lat, lon, date = new Date()) {
    const now = date;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeInHours = hours + minutes / 60;
    
    const locationSeed = Math.abs(lat * 1000 + lon * 1000) % 1000;
    const timeOffset = (locationSeed % 12) / 12 * 24;
    
    const tidePhase = ((timeInHours + timeOffset) % 12.5) / 12.5 * 2 * Math.PI;
    
    let baseTideRange = 1.5; // Default
    if (lat > 20 && lat < 25) { baseTideRange = 2.8; }
    else if (lat > 15 && lat < 20) { baseTideRange = 1.8; }
    else if (lat > 8 && lat < 15) { baseTideRange = 1.2; }
    else if (lat > 17 && lon > 82) { baseTideRange = 2.2; }
    else if (lat > 10 && lon > 90) { baseTideRange = 3.1; }
    
    const tideHeight = (Math.sin(tidePhase) * baseTideRange / 2) + baseTideRange / 2 + 0.3;
    const dailyVariation = Math.sin((now.getDate() * 0.5) + locationSeed / 100) * 0.3;
    const finalHeight = Math.max(0.2, Math.min(4.0, tideHeight + dailyVariation));
    
    return finalHeight;
}

function setupTabScrolling() {
    const nav = document.getElementById('detail-nav');
    if (!nav) return;

    const links = nav.querySelectorAll('a');
    const activeClasses = ['border-primary', 'text-primary'];
    const inactiveClasses = ['border-transparent', 'text-background-dark/70', 'dark:text-background-light/70'];

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // Remove active styles from all links
                links.forEach(l => {
                    l.classList.remove(...activeClasses);
                    l.classList.add(...inactiveClasses);
                });

                // Add active styles to the clicked link
                link.classList.add(...activeClasses);
                link.classList.remove(...inactiveClasses);
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function setupReviewsPanel(beach) {
    const auth = getAuth();
    const db = getFirestore();

    const reviewsTab = document.querySelector('a[href="#reviews-section"]');
    const reviewsPanel = document.getElementById('reviews-panel');
    const closeBtn = document.getElementById('close-reviews-panel');
    const overlay = document.getElementById('reviews-overlay');
    const reviewFormContainer = document.getElementById('review-form-container');

    const openPanel = () => {
        overlay.classList.remove('hidden');
        reviewsPanel.classList.remove('translate-x-full');
        setTimeout(() => overlay.classList.remove('opacity-0'), 10);
        loadReviews(beach.id);
    };

    const closePanel = () => {
        overlay.classList.add('opacity-0');
        reviewsPanel.classList.add('translate-x-full');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    };

    reviewsTab.addEventListener('click', (e) => {
        e.preventDefault();
        openPanel();
    });

    closeBtn.addEventListener('click', closePanel);
    overlay.addEventListener('click', closePanel);

    // Handle review form based on auth state
    onAuthStateChanged(auth, user => {
        if (user) {
            const formTemplate = document.getElementById('review-form-template');
            reviewFormContainer.innerHTML = formTemplate.innerHTML;
            const reviewForm = document.getElementById('add-review-form');
            reviewForm.addEventListener('submit', (e) => handleReviewSubmit(e, user, beach.id));
        } else {
            reviewFormContainer.innerHTML = `<p class="text-center text-text-muted-light dark:text-text-muted-dark">Please <a href="login.html" class="text-primary font-semibold hover:underline">log in</a> to leave a review.</p>`;
        }
    });

    async function loadReviews(beachId) {
        const reviewsList = document.getElementById('reviews-list');
        const loadingEl = document.getElementById('reviews-loading');
        loadingEl.classList.remove('hidden');
        reviewsList.innerHTML = ''; // Clear old reviews
        reviewsList.appendChild(loadingEl);

        const reviewsRef = collection(db, "beaches", beachId, "reviews");
        const q = query(reviewsRef, orderBy("createdAt", "desc"));

        try {
            const querySnapshot = await getDocs(q);
            loadingEl.classList.add('hidden');
            if (querySnapshot.empty) {
                reviewsList.innerHTML = `<p class="text-center text-text-muted-light dark:text-text-muted-dark">Be the first to leave a review for ${beach.name}!</p>`;
            } else {
                querySnapshot.forEach(doc => {
                    const review = doc.data();
                    const reviewEl = createReviewCard(review);
                    reviewsList.appendChild(reviewEl);
                });
            }
        } catch (error) {
            console.error("Error loading reviews:", error);
            loadingEl.classList.add('hidden');
            reviewsList.innerHTML = `<p class="text-center text-red-500">Could not load reviews. Please try again later.</p>`;
        }
    }

    function createReviewCard(review) {
        const card = document.createElement('div');
        card.className = 'border-b border-border-light dark:border-border-dark pb-4';
        const ratingStars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        const reviewDate = review.createdAt?.toDate().toLocaleDateString() || 'a while ago';
        const userName = review.userName || 'Anonymous';

        card.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="flex items-center justify-center size-9 rounded-full bg-primary/20 text-primary font-bold">${userName.charAt(0).toUpperCase()}</div>
                    <span class="font-semibold">${userName}</span>
                </div>
                <span class="text-sm text-text-muted-light dark:text-text-muted-dark">${reviewDate}</span>
            </div>
            <div class="mt-3 pl-12">
                <div class="flex items-center gap-2">
                    <p class="text-yellow-400">${ratingStars}</p>
                    <p class="text-xs text-text-muted-light dark:text-text-muted-dark">(${review.rating} out of 5)</p>
                </div>
                <p class="mt-1 text-text-light/90 dark:text-text-dark/90">${review.comment}</p>
            </div>
        `;
        return card;
    }

    async function handleReviewSubmit(e, user, beachId) {
        e.preventDefault();
        const form = e.target;
        const comment = form.querySelector('#review-comment').value;
        const rating = parseInt(form.querySelector('#review-rating').value, 10);

        if (!comment || !rating || rating < 1 || rating > 5) {
            alert("Please provide a valid comment and a rating between 1 and 5.");
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            await addDoc(collection(db, "beaches", beachId, "reviews"), {
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                comment: comment,
                rating: rating,
                createdAt: serverTimestamp()
            });
            
            form.reset();
        } catch (error) {
            console.error("Error adding review: ", error);
            alert("Failed to submit review. Please try again.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Review';
            loadReviews(beachId); // Refresh reviews after button is re-enabled
        }
    }
}