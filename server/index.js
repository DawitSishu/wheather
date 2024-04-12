const express = require('express');
const axios = require('axios');
const NodeGeocoder = require('node-geocoder');
const { WebSocketServer } = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const geocoder = NodeGeocoder({
  provider: 'openstreetmap',
});

async function getLocationName(latitude, longitude) {
    try {
        const res = await geocoder.reverse({ lat: latitude, lon: longitude });
        const location = res[0].formattedAddress;
        return location;
    } catch (error) {
        throw new Error('Error fetching location name');
    }
}

async function fetchWeatherData(latitude, longitude) {
    try {
        // Assume calling a hypothetical weather API
        const response = await axios.get(`https://api.weather.com/forecast?lat=${latitude}&lon=${longitude}`);
        const { location, temperature, conditions } = response.data;
        return { location, temperature, conditions };
    } catch (error) {
        throw new Error('Error fetching weather data');
    }
}

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    // Dummy initial weather data
    let lastWeatherData = {
        location: 'Unknown',
        temperature: 0,
        conditions: 'Unknown'
    };

    // Send initial weather data to client
    ws.send(JSON.stringify(lastWeatherData));

    // Function to send updated weather data to client
    async function sendUpdatedWeatherData(latitude, longitude) {
        try {
            const location = await getLocationName(latitude, longitude);
            const weatherData = await fetchWeatherData(latitude, longitude);
            const updatedWeatherData = {
                location,
                ...weatherData
            };
            lastWeatherData = updatedWeatherData; // Update lastWeatherData
            ws.send(JSON.stringify(updatedWeatherData)); // Send updated data to client
        } catch (error) {
            console.error('Error sending updated weather data:', error.message);
        }
    }

    // Interval to fetch and send updated weather data every 30 seconds
    const intervalId = setInterval(() => {
        sendUpdatedWeatherData(lastWeatherData.latitude, lastWeatherData.longitude);
    }, 30000);

    // Handle WebSocket close event
    ws.on('close', () => {
        console.log('WebSocket client disconnected');
        clearInterval(intervalId); // Clear interval when client disconnects
    });
});

app.post('/api/weather', async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const location = await getLocationName(latitude, longitude);
        const weatherData = await fetchWeatherData(latitude, longitude);
        const responseData = {
            location,
            ...weatherData
        };
        // Broadcast updated weather data to all connected clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(responseData));
            }
        });
        res.json(responseData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
