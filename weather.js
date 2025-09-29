document.addEventListener('DOMContentLoaded', () => {
    const apiKey = '796310b5a9dac2505c66ad5284d05a49';

    // Function to fetch weather data from OpenWeatherMap
    async function fetchWeather(lat, lon) {
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
            if (!response.ok) {
                throw new Error(`Weather API request failed: ${response.statusText}`);
            }
            const data = await response.json();
            return {
                temp: Math.round(data.main.temp),
                wind: (data.wind.speed * 3.6).toFixed(1), // m/s to km/h
                // Note: OpenWeatherMap free tier doesn't provide wave height. 
                // This is a placeholder. You might need a marine-specific API for accurate wave data.
                waves: data.wind.speed > 5 ? '1.5m' : '0.5m', 
                description: data.weather[0].main,
            };
        } catch (error) {
            console.error("Failed to fetch weather data:", error);
            return null;
        }
    }

    async function updateWeatherWidget(widget) {
        const lat = widget.dataset.lat;
        const lon = widget.dataset.lon;

        if (lat && lon) {
            const weatherData = await fetchWeather(lat, lon);
            if (weatherData) {
                widget.querySelectorAll('.weather-temp').forEach(el => el.textContent = `${weatherData.temp}°C`);
                widget.querySelectorAll('.weather-wind').forEach(el => el.textContent = `${weatherData.wind}km/h`);
                widget.querySelectorAll('.weather-waves').forEach(el => el.textContent = weatherData.waves);
                widget.querySelectorAll('.weather-description').forEach(el => el.textContent = `${weatherData.temp}°C, ${weatherData.description}`);
            }
        }
    }

    // Find all elements that need weather data and update them
    const weatherWidgets = document.querySelectorAll('[data-weather-widget]');
    weatherWidgets.forEach(updateWeatherWidget);

    // Listen for custom event to update dynamically added widgets
    document.addEventListener('weather-widget-added', (e) => {
        if (e.detail) {
            updateWeatherWidget(e.detail);
        }
    });
});