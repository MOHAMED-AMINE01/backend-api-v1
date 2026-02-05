
import requests
import asyncio
from datetime import datetime

class WeatherService:
    def __init__(self, city_name="Fès", lat=34.0331, lon=-5.0003):
        self.city_name = city_name
        self.lat = lat
        self.lon = lon
        self.base_url = "https://api.open-meteo.com/v1/forecast"
        self.current_weather = None

    async def fetch_weather(self):
        """
        Fetches current weather from Open-Meteo API.
        This is a blocking call made async using run_in_executor.
        """
        params = {
            "latitude": self.lat,
            "longitude": self.lon,
            "current_weather": "true",
            "timezone": "auto"
        }
        
        loop = asyncio.get_event_loop()
        try:
            # Using loop.run_in_executor because requests is blocking
            response = await loop.run_in_executor(None, lambda: requests.get(self.base_url, params=params, timeout=5))
            if response.status_code == 200:
                data = response.json()
                self.current_weather = {
                    "city": self.city_name,
                    "temperature": data["current_weather"]["temperature"],
                    "windspeed": data["current_weather"]["windspeed"],
                    "weathercode": data["current_weather"]["weathercode"],
                    "time": data["current_weather"]["time"],
                    "timestamp": datetime.now().isoformat()
                }
                print(f"[WEATHER] Successfully fetched: {self.current_weather['temperature']}°C")
                return self.current_weather
            else:
                print(f"[WEATHER] Error fetching weather: {response.status_code}")
                return None
        except Exception as e:
            print(f"[WEATHER] Exception: {e}")
            return None

# Singleton instance
weather_service = WeatherService()
