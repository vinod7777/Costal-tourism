function initWeather() {
    // Import keys from centralized config
    let apiKey = undefined;
    let worldTidesKey = undefined;
    
    try {
        // Attempt static import replacement via global if config is already imported elsewhere
        if (window.__COASTAL_CONFIG__) {
            apiKey = window.__COASTAL_CONFIG__.OPENWEATHER_API_KEY;
            worldTidesKey = window.__COASTAL_CONFIG__.WORLDTIDES_API_KEY;
        }
    } catch {}
    
    // Ultimate fallback: keep previous keys to avoid breaking if import not set up
    if (!apiKey) apiKey = '796310b5a9dac2505c66ad5284d05a49';
    if (!worldTidesKey) worldTidesKey = '04137cbf-234d-4971-b1be-de990ce9fc3b';

    console.log('Weather system initialized with API keys:', { 
        openweather: apiKey ? 'loaded' : 'missing', 
        worldtides: worldTidesKey ? 'loaded' : 'missing' 
    });

    // Function to fetch weather data from OpenWeatherMap
    async function fetchWeather(lat, lon) {
        try {
            console.log(`Fetching weather for lat: ${lat}, lon: ${lon}`);
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
            if (!response.ok) {
                throw new Error(`Weather API request failed: ${response.status} ${response.statusText}`);
            }
            const weatherData = await response.json();
            console.log('Weather data received:', weatherData);
            return {
                temp: Math.round(weatherData.main.temp),
                wind: (weatherData.wind.speed * 3.6).toFixed(1), // m/s to km/h
                waves: weatherData.wind.speed > 5 ? '1.5m' : '0.5m', 
                description: weatherData.weather[0].main,
            };
        } catch (error) {
            console.error("Failed to fetch weather data:", error);
            return null;
        }
    }

    // Fetch hourly data for charts using Open-Meteo (no key required)
    async function fetchHourly(lat, lon) {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,wind_speed_10m,wave_height&past_days=1&forecast_days=2&timezone=auto`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Hourly API failed');
            const hourlyData = await res.json();
            return hourlyData.hourly;
        } catch (e) {
            console.error('Failed hourly fetch', e);
            return null;
        }
    }

    // Fetch tide heights from WorldTides API
    async function fetchTideHeights(lat, lon) {
        try {
            // Try multiple API formats to find the working one
            const apiFormats = [
                // Format 1: Basic heights request
                `https://www.worldtides.info/api?heights&lat=${lat}&lon=${lon}&key=${worldTidesKey}`,
                // Format 2: With date parameter
                `https://www.worldtides.info/api?heights&lat=${lat}&lon=${lon}&date=today&key=${worldTidesKey}`,
                // Format 3: With duration
                `https://www.worldtides.info/api?heights&lat=${lat}&lon=${lon}&duration=1440&key=${worldTidesKey}`,
                // Format 4: Extremes endpoint
                `https://www.worldtides.info/api?extremes&lat=${lat}&lon=${lon}&key=${worldTidesKey}`
            ];
            
            for (let i = 0; i < apiFormats.length; i++) {
                const url = apiFormats[i];
                console.log(`Trying WorldTides API format ${i + 1}:`, url);
                
                try {
                    const res = await fetch(url);
                    
                    if (res.ok) {
                        const data = await res.json();
                        console.log(`WorldTides format ${i + 1} success:`, data);
                        
                        if (data.error) {
                            console.warn(`WorldTides format ${i + 1} returned error:`, data.error);
                            continue; // Try next format
                        }
                        
                        // Check if we have usable data
                        if (data.heights && data.heights.length > 0) {
                            return data;
                        } else if (data.extremes && data.extremes.length > 0) {
                            // Convert extremes to heights format
                            return {
                                heights: data.extremes.map(ext => ({
                                    dt: new Date(ext.date).getTime() / 1000,
                                    height: ext.height
                                }))
                            };
                        }
                    } else {
                        console.warn(`WorldTides format ${i + 1} failed: ${res.status} ${res.statusText}`);
                    }
                } catch (fetchError) {
                    console.warn(`WorldTides format ${i + 1} fetch error:`, fetchError.message);
                }
            }
            
            throw new Error('All WorldTides API formats failed');
            
        } catch (e) {
            console.error('Failed to fetch tide heights:', e);
            return null;
        }
    }

    // Generate realistic tide height estimates based on location and time
    function generateRealisticTideHeight(lat, lon) {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const timeInHours = hours + minutes / 60;
        
        const locationSeed = Math.abs(lat * 1000 + lon * 1000) % 1000;
        const timeOffset = (locationSeed % 12) / 12 * 24; // 0-24 hour offset based on location
        
        const tidePhase = ((timeInHours + timeOffset) % 12.5) / 12.5 * 2 * Math.PI;
        
        
        let baseTideRange = 1.5; // Default 1.5m range
        
        if (lat > 20 && lat < 25) { // Gujarat/Maharashtra coast
            baseTideRange = 2.8; // Higher tides in Arabian Sea
        } else if (lat > 15 && lat < 20) { // Karnataka/Goa coast  
            baseTideRange = 1.8;
        } else if (lat > 8 && lat < 15) { // Kerala/Tamil Nadu coast
            baseTideRange = 1.2;
        } else if (lat > 17 && lon > 82) { // Andhra/Odisha coast (Bay of Bengal)
            baseTideRange = 2.2;
        } else if (lat > 10 && lon > 90) { // Andaman Islands
            baseTideRange = 3.1; // Higher tides in open ocean
        }
        
        // Calculate tide height using sine wave
        const tideHeight = (Math.sin(tidePhase) * baseTideRange / 2) + baseTideRange / 2 + 0.3;
        
        // Add some daily variation (±0.3m)
        const dailyVariation = Math.sin((now.getDate() * 0.5) + locationSeed / 100) * 0.3;
        
        // Ensure reasonable bounds (0.2m to 4.0m)
        const finalHeight = Math.max(0.2, Math.min(4.0, tideHeight + dailyVariation));
        
        return finalHeight;
    }

    async function updateWeatherWidget(widget) {
        const lat = widget.dataset.lat;
        const lon = widget.dataset.lon;

        console.log(`Updating weather widget for lat: ${lat}, lon: ${lon}`);

        if (lat && lon) {
            const weatherData = await fetchWeather(lat, lon);
            if (weatherData) {
                console.log('Updating weather display with:', weatherData);
                widget.querySelectorAll('.weather-temp').forEach(el => {
                    el.textContent = `${weatherData.temp}°C`;
                    console.log('Updated temp element:', el);
                });
                widget.querySelectorAll('.weather-wind').forEach(el => {
                    el.textContent = `${weatherData.wind}km/h`;
                    console.log('Updated wind element:', el);
                });
                // Pre-fill with wave estimate; will be replaced by tide height if available
                widget.querySelectorAll('.weather-waves').forEach(el => {
                    el.textContent = weatherData.waves;
                    console.log('Updated waves element:', el);
                });
                widget.querySelectorAll('.weather-description').forEach(el => el.textContent = `${weatherData.temp}°C, ${weatherData.description}`);
                // Notify listeners that weather is ready for this widget
                document.dispatchEvent(new CustomEvent('weather-updated', { detail: { widget, weather: weatherData } }));
            } else {
                console.error('No weather data received for widget');
            }

            // Generate realistic tide estimates based on location and time
            try {
                const tideHeight = generateRealisticTideHeight(lat, lon);
                widget.querySelectorAll('.weather-waves').forEach(el => {
                    el.textContent = `${tideHeight.toFixed(1)}m`;
                    console.log('Updated with realistic tide estimate:', tideHeight);
                });
                
                // Dispatch tide update event
                document.dispatchEvent(new CustomEvent('tide-updated', { 
                    detail: { widget, heightMeters: tideHeight, source: 'Estimate' } 
                }));
            } catch (e) {
                console.log('Using default tide estimate');
                widget.querySelectorAll('.weather-waves').forEach(el => {
                    el.textContent = '1.2m';
                });
            }
        }
    }

    // Find all elements that need weather data and update them
    function refreshAllWidgets() {
        const widgets = document.querySelectorAll('[data-weather-widget]');
        console.log(`Found ${widgets.length} weather widgets to update`);
        widgets.forEach((widget, index) => {
            console.log(`Updating widget ${index + 1}:`, widget);
            updateWeatherWidget(widget);
        });
    }
    
    // Initial refresh
    refreshAllWidgets();

    // Listen for custom event to update dynamically added widgets
    document.addEventListener('weather-widget-added', (e) => {
        if (e.detail) {
            console.log('New weather widget added, updating after delay');
            setTimeout(() => updateWeatherWidget(e.detail), 300); // slight delay to ensure in DOM
        }
    });

    // Listen for beach cards  rendered (from search.js)
    document.addEventListener('beach-cards-rendered', () => {
        console.log('Beach cards rendered, updating weather widgets...');
        setTimeout(() => {
            refreshAllWidgets();
        }, 500); // Give time for DOM to settle
    });

    // Auto-refresh every 5 minutes
    setInterval(refreshAllWidgets, 5 * 60 * 1000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWeather);
} else {
    initWeather();
}
