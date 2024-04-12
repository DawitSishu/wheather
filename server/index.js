const express = require("express");
const axios = require("axios");
const NodeGeocoder = require("node-geocoder");
const { WebSocketServer } = require("ws");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const geocoder = NodeGeocoder({
  provider: "openstreetmap",
});

async function getLocationName(latitude, longitude) {
  try {
    const res = await geocoder.reverse({ lat: latitude, lon: longitude });
    const location = res[0].formattedAddress;
    return location;
  } catch (error) {
    throw new Error("Error fetching location name");
  }
}

async function fetchWeatherData(latitude, longitude) {
  try {
    const response = await axios.get(
      `https://api.weatherapi.com/v1/current.json?key=d1fa0f5579cb4097a48171654241204&q=${latitude},${longitude}`
    );
    const { location, current } = response.data;
    const {
      temp_c: temperature,
      condition: { text: conditions },
    } = current;
    const { name: locationName } = location;
    return { location: locationName, temperature, conditions };
  } catch (error) {
    throw new Error("Error fetching weather data");
  }
}

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  let lastWeatherData = {
    location: "Unknown",
    temperature: 0,
    conditions: "Unknown",
  };

  ws.send(JSON.stringify(lastWeatherData));

  async function sendUpdatedWeatherData(latitude, longitude) {
    try {
      const location = await getLocationName(latitude, longitude);
      const weatherData = await fetchWeatherData(latitude, longitude);
      const updatedWeatherData = {
        location,
        ...weatherData,
      };
      lastWeatherData = updatedWeatherData; 
      ws.send(JSON.stringify(updatedWeatherData));
    } catch (error) {
      console.error("Error sending updated weather data:", error.message);
    }
  }

  const intervalId = setInterval(() => {
    sendUpdatedWeatherData(lastWeatherData.latitude, lastWeatherData.longitude);
  }, 30000);

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
    clearInterval(intervalId); 
  });
});

app.post("/api/weather", async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const location = await getLocationName(latitude, longitude);
    const weatherData = await fetchWeatherData(latitude, longitude);
    const responseData = {
      location,
      ...weatherData,
    };
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
