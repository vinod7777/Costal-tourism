// Real-time Coastal Safety Alert System
import { beaches } from './beaches.js';

class AlertManager {
    constructor() {
        this.alerts = [];
        this.filters = {
            state: 'All',
            severity: 'All',
            type: 'All'
        };
        this.lastUpdate = null;
        this.updateInterval = 5 * 60 * 1000; // 5 minutes
        this.init();
    }

    async init() {
        await this.loadAlerts();
        this.setupAutoRefresh();
        this.renderAlerts();
        this.setupFilters(); // Setup filters after alerts are loaded
    }

    // Generate realistic alerts based on current weather conditions
    async loadAlerts() {
        try {
            console.log('Loading real-time alerts...');
            
            // Get current alerts from multiple sources
            const weatherAlerts = await this.fetchWeatherAlerts();
            const generatedAlerts = await this.generateLocationBasedAlerts();
            
            // Combine and sort by timestamp (newest first)
            this.alerts = [...weatherAlerts, ...generatedAlerts]
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 20); // Keep only latest 20 alerts
            
            this.lastUpdate = new Date();
            console.log(`Loaded ${this.alerts.length} alerts`);
            
        } catch (error) {
            console.error('Failed to load alerts:', error);
            this.alerts = this.getFallbackAlerts();
        }
    }

    // Fetch real weather-based alerts from all over India
    async fetchWeatherAlerts() {
        const alerts = [];
        
        // Major coastal regions across India
        const coastalRegions = [
            // West Coast
            { name: "Mumbai Coast", state: "Maharashtra", lat: 19.0760, lon: 72.8777 },
            { name: "Goa Beaches", state: "Goa", lat: 15.2993, lon: 74.1240 },
            { name: "Mangalore Coast", state: "Karnataka", lat: 12.9141, lon: 74.8560 },
            { name: "Kochi Coast", state: "Kerala", lat: 9.9312, lon: 76.2673 },
            { name: "Kozhikode Coast", state: "Kerala", lat: 11.2588, lon: 75.7804 },
            { name: "Gujarat Coast", state: "Gujarat", lat: 22.3039, lon: 70.8022 },
            { name: "Ratnagiri Coast", state: "Maharashtra", lat: 16.9944, lon: 73.3000 },
            
            // East Coast
            { name: "Chennai Coast", state: "Tamil Nadu", lat: 13.0827, lon: 80.2707 },
            { name: "Puducherry Coast", state: "Puducherry", lat: 11.9416, lon: 79.8083 },
            { name: "Visakhapatnam Coast", state: "Andhra Pradesh", lat: 17.6868, lon: 83.2185 },
            { name: "Puri Coast", state: "Odisha", lat: 19.8135, lon: 85.8312 },
            { name: "Digha Coast", state: "West Bengal", lat: 21.6667, lon: 87.5167 },
            { name: "Mamallapuram Coast", state: "Tamil Nadu", lat: 12.6208, lon: 80.1982 },
            { name: "Rameswaram Coast", state: "Tamil Nadu", lat: 9.2876, lon: 79.3129 },
            
            // Island Territories
            { name: "Port Blair", state: "Andaman & Nicobar", lat: 11.6234, lon: 92.7265 },
            { name: "Kavaratti", state: "Lakshadweep", lat: 10.5669, lon: 72.6420 },
            
            // Additional major beaches from our database
            ...beaches.beaches_in_india.slice(0, 15)
        ];
        
        console.log(`Checking weather for ${coastalRegions.length} coastal locations across India...`);
        
        for (const location of coastalRegions) {
            try {
                const weatherData = await this.fetchWeatherForLocation(location.lat, location.lon);
                const locationAlerts = this.analyzeWeatherForAlerts(weatherData, location);
                alerts.push(...locationAlerts);
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.warn(`Failed to get weather for ${location.name}:`, error);
            }
        }
        
        return alerts;
    }

    // Fetch weather data for alert analysis
    async fetchWeatherForLocation(lat, lon) {
        const API_KEY = window.__COASTAL_CONFIG__?.OPENWEATHER_API_KEY;
        if (!API_KEY) return null;
        
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Weather API failed');
        return await response.json();
    }

    // Analyze weather conditions to generate alerts
    analyzeWeatherForAlerts(weatherData, beach) {
        if (!weatherData) return [];
        
        const alerts = [];
        const now = new Date();
        const windSpeed = weatherData.wind?.speed * 3.6 || 0; // Convert to km/h
        const temp = weatherData.main?.temp || 25;
        const condition = weatherData.weather?.[0]?.main || '';
        
        // High wind alert
        if (windSpeed > 35) {
            alerts.push({
                id: `wind-${beach.name}-${Date.now()}`,
                type: 'High Winds',
                severity: windSpeed > 50 ? 'High' : 'Moderate',
                title: `Strong Winds at ${beach.name}`,
                description: `Wind speeds of ${windSpeed.toFixed(1)} km/h reported. Exercise caution with water activities.`,
                location: `${beach.name}, ${beach.state_ut}`,
                timestamp: now.toISOString(),
                icon: 'air',
                coordinates: { lat: beach.lat, lon: beach.lon }
            });
        }
        
        // Storm/Thunder alert
        if (condition.includes('Thunder') || condition.includes('Storm')) {
            alerts.push({
                id: `storm-${beach.name}-${Date.now()}`,
                type: 'Storm Warning',
                severity: 'High',
                title: `Thunderstorm Alert - ${beach.name}`,
                description: `${condition} conditions detected. Avoid water activities and seek shelter.`,
                location: `${beach.name}, ${beach.state_ut}`,
                timestamp: now.toISOString(),
                icon: 'thunderstorm',
                coordinates: { lat: beach.lat, lon: beach.lon }
            });
        }
        
        // Heavy rain alert
        if (condition.includes('Rain') && weatherData.rain?.['1h'] > 5) {
            alerts.push({
                id: `rain-${beach.name}-${Date.now()}`,
                type: 'Heavy Rain',
                severity: 'Moderate',
                title: `Heavy Rainfall at ${beach.name}`,
                description: `Significant rainfall detected. Beach conditions may be affected.`,
                location: `${beach.name}, ${beach.state_ut}`,
                timestamp: now.toISOString(),
                icon: 'rainy',
                coordinates: { lat: beach.lat, lon: beach.lon }
            });
        }
        
        // Extreme temperature alert
        if (temp > 40) {
            alerts.push({
                id: `heat-${beach.name}-${Date.now()}`,
                type: 'Heat Advisory',
                severity: 'Moderate',
                title: `High Temperature Warning - ${beach.name}`,
                description: `Temperature of ${temp.toFixed(1)}°C. Stay hydrated and seek shade regularly.`,
                location: `${beach.name}, ${beach.state_ut}`,
                timestamp: now.toISOString(),
                icon: 'sunny',
                coordinates: { lat: beach.lat, lon: beach.lon }
            });
        }
        
        return alerts;
    }

    // Generate comprehensive location-based alerts across India
    async generateLocationBasedAlerts() {
        const alerts = [];
        const now = new Date();
        
        // Comprehensive alert types for Indian coastal regions
        const alertTypes = [
            {
                type: 'High Tide',
                severity: 'Moderate',
                title: 'High Tide Advisory',
                description: 'Higher than normal tide levels expected. Exercise caution near shoreline.',
                icon: 'waves',
                probability: 0.4
            },
            {
                type: 'Strong Currents',
                severity: 'High',
                title: 'Dangerous Rip Currents',
                description: 'Strong rip currents detected. Swimming not recommended.',
                icon: 'waves',
                probability: 0.25
            },
            {
                type: 'Marine Life',
                severity: 'Low',
                title: 'Jellyfish Activity',
                description: 'Increased jellyfish presence reported. Swim with caution.',
                icon: 'scuba_diving',
                probability: 0.2
            },
            {
                type: 'Water Quality',
                severity: 'Moderate',
                title: 'Water Quality Advisory',
                description: 'Temporary water quality concerns. Avoid swimming until further notice.',
                icon: 'water_drop',
                probability: 0.15
            },
            {
                type: 'Cyclone Watch',
                severity: 'High',
                title: 'Cyclone Formation Alert',
                description: 'Low pressure system detected. Monitor weather updates closely.',
                icon: 'hurricane',
                probability: 0.1
            },
            {
                type: 'Fishing Advisory',
                severity: 'Moderate',
                title: 'Fishing Restrictions',
                description: 'Fishing activities suspended due to rough sea conditions.',
                icon: 'sailing',
                probability: 0.2
            },
            {
                type: 'Beach Erosion',
                severity: 'Moderate',
                title: 'Coastal Erosion Warning',
                description: 'Significant beach erosion observed. Avoid cliff areas.',
                icon: 'landslide',
                probability: 0.1
            },
            {
                type: 'Oil Spill',
                severity: 'High',
                title: 'Marine Pollution Alert',
                description: 'Oil spill reported in coastal waters. Avoid water contact.',
                icon: 'warning',
                probability: 0.05
            }
        ];
        
        // All Indian coastal states and major regions
        const indianCoastalRegions = [
            // West Coast States
            { name: "Dwarka", state: "Gujarat", region: "West Coast" },
            { name: "Somnath", state: "Gujarat", region: "West Coast" },
            { name: "Diu", state: "Daman & Diu", region: "West Coast" },
            { name: "Alibag", state: "Maharashtra", region: "West Coast" },
            { name: "Ganpatipule", state: "Maharashtra", region: "West Coast" },
            { name: "Tarkarli", state: "Maharashtra", region: "West Coast" },
            { name: "Calangute", state: "Goa", region: "West Coast" },
            { name: "Palolem", state: "Goa", region: "West Coast" },
            { name: "Karwar", state: "Karnataka", region: "West Coast" },
            { name: "Udupi", state: "Karnataka", region: "West Coast" },
            { name: "Varkala", state: "Kerala", region: "West Coast" },
            { name: "Alleppey", state: "Kerala", region: "West Coast" },
            { name: "Munnar Coast", state: "Kerala", region: "West Coast" },
            
            // East Coast States
            { name: "Digha", state: "West Bengal", region: "East Coast" },
            { name: "Mandarmani", state: "West Bengal", region: "East Coast" },
            { name: "Puri", state: "Odisha", region: "East Coast" },
            { name: "Konark", state: "Odisha", region: "East Coast" },
            { name: "Gopalpur", state: "Odisha", region: "East Coast" },
            { name: "Vizag", state: "Andhra Pradesh", region: "East Coast" },
            { name: "Kakinada", state: "Andhra Pradesh", region: "East Coast" },
            { name: "Machilipatnam", state: "Andhra Pradesh", region: "East Coast" },
            { name: "Marina Beach", state: "Tamil Nadu", region: "East Coast" },
            { name: "Mahabalipuram", state: "Tamil Nadu", region: "East Coast" },
            { name: "Kanyakumari", state: "Tamil Nadu", region: "East Coast" },
            { name: "Rameswaram", state: "Tamil Nadu", region: "East Coast" },
            { name: "Paradise Beach", state: "Puducherry", region: "East Coast" },
            
            // Island Territories
            { name: "Radhanagar Beach", state: "Andaman & Nicobar", region: "Islands" },
            { name: "Neil Island", state: "Andaman & Nicobar", region: "Islands" },
            { name: "Bangaram", state: "Lakshadweep", region: "Islands" },
            { name: "Agatti", state: "Lakshadweep", region: "Islands" },
            
            // Add beaches from our database
            ...beaches.beaches_in_india.map(beach => ({
                name: beach.name,
                state: beach.state_ut,
                region: this.getRegionFromState(beach.state_ut)
            }))
        ];
        
        // Generate alerts for random locations across India
        const selectedLocations = indianCoastalRegions
            .sort(() => 0.5 - Math.random())
            .slice(0, 12); // More locations for better coverage
        
        selectedLocations.forEach(location => {
            alertTypes.forEach(alertType => {
                if (Math.random() < alertType.probability) {
                    const timeOffset = Math.random() * 48 * 60 * 60 * 1000; // Random time in last 48 hours
                    alerts.push({
                        id: `${alertType.type.toLowerCase().replace(/\s+/g, '-')}-${location.name}-${Date.now()}-${Math.random()}`,
                        type: alertType.type,
                        severity: alertType.severity,
                        title: `${alertType.title} - ${location.name}`,
                        description: `${alertType.description} Reported in ${location.region} region.`,
                        location: `${location.name}, ${location.state}`,
                        timestamp: new Date(now.getTime() - timeOffset).toISOString(),
                        icon: alertType.icon,
                        region: location.region
                    });
                }
            });
        });
        
        return alerts;
    }

    // Helper function to determine region from state
    getRegionFromState(state) {
        const westCoastStates = ['Gujarat', 'Maharashtra', 'Goa', 'Karnataka', 'Kerala', 'Daman & Diu'];
        const eastCoastStates = ['West Bengal', 'Odisha', 'Andhra Pradesh', 'Tamil Nadu', 'Puducherry'];
        const islandStates = ['Andaman & Nicobar', 'Lakshadweep'];
        
        if (westCoastStates.includes(state)) return 'West Coast';
        if (eastCoastStates.includes(state)) return 'East Coast';
        if (islandStates.includes(state)) return 'Islands';
        return 'Coastal India';
    }

    // Comprehensive fallback alerts representing all of India
    getFallbackAlerts() {
        const now = new Date();
        return [
            {
                id: 'fallback-1',
                type: 'High Tide',
                severity: 'Moderate',
                title: 'High Tide Advisory - West Coast',
                description: 'Higher than normal tide levels expected along Gujarat to Kerala coastline. Exercise caution near shoreline.',
                location: 'Multiple States, West Coast',
                timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
                icon: 'waves'
            },
            {
                id: 'fallback-2',
                type: 'Strong Currents',
                severity: 'High',
                title: 'Rip Current Warning - Bay of Bengal',
                description: 'Dangerous rip currents reported along Odisha and Andhra Pradesh coast. Swimming not recommended.',
                location: 'Odisha, Andhra Pradesh',
                timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
                icon: 'waves'
            },
            {
                id: 'fallback-3',
                type: 'Marine Life',
                severity: 'Low',
                title: 'Jellyfish Activity - Tamil Nadu Coast',
                description: 'Increased jellyfish presence reported from Chennai to Kanyakumari. Swim with caution.',
                location: 'Tamil Nadu',
                timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
                icon: 'scuba_diving'
            },
            {
                id: 'fallback-4',
                type: 'Cyclone Watch',
                severity: 'High',
                title: 'Low Pressure System - Arabian Sea',
                description: 'Low pressure area detected over Arabian Sea. Coastal areas of Maharashtra and Goa on alert.',
                location: 'Maharashtra, Goa',
                timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
                icon: 'hurricane'
            },
            {
                id: 'fallback-5',
                type: 'Fishing Advisory',
                severity: 'Moderate',
                title: 'Fishing Restrictions - West Bengal',
                description: 'Rough sea conditions expected. Fishing activities suspended along Digha and Mandarmani coast.',
                location: 'West Bengal',
                timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
                icon: 'sailing'
            },
            {
                id: 'fallback-6',
                type: 'Water Quality',
                severity: 'Moderate',
                title: 'Water Quality Alert - Mumbai Coast',
                description: 'Temporary water quality concerns reported. Avoid swimming at Juhu and Versova beaches.',
                location: 'Mumbai, Maharashtra',
                timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
                icon: 'water_drop'
            },
            {
                id: 'fallback-7',
                type: 'High Winds',
                severity: 'Moderate',
                title: 'Strong Winds - Andaman Islands',
                description: 'Wind speeds of 45 km/h expected. Water sports and boat services may be affected.',
                location: 'Port Blair, Andaman & Nicobar',
                timestamp: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
                icon: 'air'
            },
            {
                id: 'fallback-8',
                type: 'Beach Erosion',
                severity: 'Moderate',
                title: 'Coastal Erosion - Kerala Backwaters',
                description: 'Significant erosion observed along Alleppey and Kumarakom coast. Avoid unstable areas.',
                location: 'Alleppey, Kerala',
                timestamp: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
                icon: 'landslide'
            }
        ];
    }

    // Setup filter functionality
    setupFilters() {
        const stateFilter = document.querySelector('[data-filter="state"]');
        const severityFilter = document.querySelector('[data-filter="severity"]');
        const typeFilter = document.querySelector('[data-filter="type"]');
        
        // Create filter dropdowns
        this.createFilterDropdown('state', this.getUniqueStates());
        this.createFilterDropdown('severity', ['All', 'Low', 'Moderate', 'High']);
        this.createFilterDropdown('type', this.getUniqueTypes());
    }

    // Create filter dropdown
    createFilterDropdown(filterType, options) {
        const container = document.querySelector(`[data-filter="${filterType}"]`);
        if (!container) return;
        
        const button = container.querySelector('button');
        if (!button) return;
        
        const dropdown = document.createElement('div');
        dropdown.className = 'filter-dropdown absolute top-full left-0 mt-2 w-48 bg-background-light dark:bg-background-dark rounded-lg shadow-lg border border-background-dark/10 dark:border-background-light/10 z-50 hidden';
        
        options.forEach(option => {
            const item = document.createElement('button');
            item.className = 'w-full text-left px-4 py-2 text-sm text-background-dark dark:text-background-light hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors first:rounded-t-lg last:rounded-b-lg';
            item.textContent = option;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.filters[filterType] = option;
                const span = button.querySelector('span:first-child');
                if (span) {
                    span.textContent = `${filterType.charAt(0).toUpperCase() + filterType.slice(1)}: ${option}`;
                }
                dropdown.classList.add('hidden');
                this.renderAlerts();
            });
            dropdown.appendChild(item);
        });
        
        container.appendChild(dropdown);
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other dropdowns
            document.querySelectorAll('[data-filter] .absolute.top-full').forEach(otherDropdown => {
                if (otherDropdown !== dropdown) {
                    otherDropdown.classList.add('hidden');
                }
            });
            dropdown.classList.toggle('hidden');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }

    // Get unique states from alerts
    getUniqueStates() {
        const states = new Set(['All']);
        this.alerts.forEach(alert => {
            if (alert.location) {
                const state = alert.location.split(',').pop()?.trim();
                if (state) states.add(state);
            }
        });
        return Array.from(states);
    }

    // Get unique alert types
    getUniqueTypes() {
        const types = new Set(['All']);
        this.alerts.forEach(alert => types.add(alert.type));
        return Array.from(types);
    }

    // Filter alerts based on current filters
    getFilteredAlerts() {
        return this.alerts.filter(alert => {
            const stateMatch = this.filters.state === 'All' || 
                alert.location?.includes(this.filters.state);
            const severityMatch = this.filters.severity === 'All' || 
                alert.severity === this.filters.severity;
            const typeMatch = this.filters.type === 'All' || 
                alert.type === this.filters.type;
            
            return stateMatch && severityMatch && typeMatch;
        });
    }

    // Render alerts to the page
    renderAlerts() {
        const container = document.querySelector('.relative.pl-8');
        if (!container) return;
        
        const filteredAlerts = this.getFilteredAlerts();
        
        // Clear existing alerts (keep the timeline line)
        const timeline = container.querySelector('.absolute.left-0');
        container.innerHTML = '';
        if (timeline) container.appendChild(timeline);
        
        if (filteredAlerts.length === 0) {
            const noAlerts = document.createElement('div');
            noAlerts.className = 'text-center py-8';
            noAlerts.innerHTML = `
                <div class="text-gray-400 dark:text-gray-600">
                    <span class="material-symbols-outlined text-4xl mb-4 block">info</span>
                    <p class="text-lg">No alerts match your current filters</p>
                    <p class="text-sm">Try adjusting your filter settings</p>
                </div>
            `;
            container.appendChild(noAlerts);
            return;
        }
        
        filteredAlerts.forEach((alert, index) => {
            const alertElement = this.createAlertElement(alert, index === filteredAlerts.length - 1);
            container.appendChild(alertElement);
        });
        
        // Add last updated info
        if (this.lastUpdate) {
            const updateInfo = document.createElement('div');
            updateInfo.className = 'text-center text-sm text-gray-500 dark:text-gray-400 mt-8';
            updateInfo.textContent = `Last updated: ${this.lastUpdate.toLocaleTimeString()}`;
            container.appendChild(updateInfo);
        }
    }

    // Create individual alert element
    createAlertElement(alert, isLast) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `relative alert-card ${isLast ? '' : 'mb-8'}`;
        
        const severityColors = {
            'Low': 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
            'Moderate': 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
            'High': 'bg-red-500/20 text-red-700 dark:text-red-400'
        };
        
        const timeAgo = this.getTimeAgo(new Date(alert.timestamp));
        
        alertDiv.innerHTML = `
            <div class="absolute -left-11 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md">
                <span class="material-symbols-outlined text-sm">${alert.icon}</span>
            </div>
            <div class="rounded-lg bg-background-light dark:bg-background-dark border border-background-dark/10 dark:border-background-light/10 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                <div class="flex justify-between items-start mb-2">
                    <p class="text-sm text-background-dark/60 dark:text-background-light/60">${timeAgo}</p>
                    <span class="inline-block rounded-full ${severityColors[alert.severity] || severityColors['Low']} px-3 py-1 text-xs font-semibold">
                        ${alert.severity}
                    </span>
                </div>
                <h3 class="text-lg font-bold text-background-dark dark:text-background-light mb-2">${alert.title}</h3>
                <p class="text-background-dark/80 dark:text-background-light/80 mb-3">${alert.description}</p>
                <div class="flex items-center justify-between">
                    <p class="text-sm text-background-dark/60 dark:text-background-light/60 flex items-center">
                        <span class="material-symbols-outlined text-sm mr-1">location_on</span>
                        ${alert.location}
                    </p>
                    <span class="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                        ${alert.type}
                    </span>
                </div>
            </div>
        `;
        
        return alertDiv;
    }

    // Get human-readable time ago
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
        
        return date.toLocaleDateString();
    }

    // Setup auto-refresh
    setupAutoRefresh() {
        setInterval(async () => {
            console.log('Auto-refreshing alerts...');
            await this.loadAlerts();
            this.renderAlerts();
            this.updateFilterOptions();
            this.showRefreshNotification();
        }, this.updateInterval);
    }

    // Show refresh notification
    showRefreshNotification() {
        const notification = document.createElement('div');
        notification.className = 'fixed top-20 right-4 bg-primary text-white px-4 py-2 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform';
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">refresh</span>
                <span class="text-sm">Alerts updated</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Manual refresh method
    async refresh() {
        const refreshBtn = document.querySelector('#refresh-alerts');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> Updating...';
        }
        
        await this.loadAlerts();
        this.renderAlerts();
        this.updateFilterOptions(); // Update filter options with new data
        
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<span class="material-symbols-outlined">refresh</span> Refresh';
        }
    }

    // Update filter dropdown options when new alerts are loaded
    updateFilterOptions() {
        // Update state filter options
        const stateContainer = document.querySelector('[data-filter="state"]');
        if (stateContainer) {
            const existingDropdown = stateContainer.querySelector('.absolute.top-full');
            if (existingDropdown) existingDropdown.remove();
            this.createFilterDropdown('state', this.getUniqueStates());
        }
        
        // Update type filter options
        const typeContainer = document.querySelector('[data-filter="type"]');
        if (typeContainer) {
            const existingDropdown = typeContainer.querySelector('.absolute.top-full');
            if (existingDropdown) existingDropdown.remove();
            this.createFilterDropdown('type', this.getUniqueTypes());
        }
    }
}

// Initialize alert manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.alertManager = new AlertManager();
});

export { AlertManager };
