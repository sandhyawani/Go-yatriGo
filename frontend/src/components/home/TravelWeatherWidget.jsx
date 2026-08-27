import React, { useState, useEffect } from "react";
import { CloudRain, Sun, Wind, MapPin, Droplets, Cloud } from "lucide-react";
import Card from "../common/Card";

const getWeatherIcon = (desc) => {
  const d = (desc || "").toLowerCase();
  if (d.includes("rain") || d.includes("drizzle") || d.includes("shower")) return <CloudRain className="w-3.5 h-3.5" />;
  if (d.includes("cloud") || d.includes("overcast") || d.includes("haze") || d.includes("fog")) return <Cloud className="w-3.5 h-3.5" />;
  return <Sun className="w-3.5 h-3.5" />;
};

const TravelWeatherWidget = ({ destination }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  const destName = destination ? destination.split(",")[0].trim() : "";

  useEffect(() => {
    if (!destName) return;
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const apiKey = process.env.REACT_APP_WEATHER_API_KEY;
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(destName)}&appid=${apiKey}&units=metric`);
        if (!weatherRes.ok) throw new Error("Failed to fetch current weather");
        const weatherData = await weatherRes.json();
        
        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(destName)}&appid=${apiKey}&units=metric`);
        let tomorrowMaxTemp = "--";
        if (forecastRes.ok) {
            const forecastData = await forecastRes.json();
            const today = new Date();
            const tomorrowDate = new Date(today);
            tomorrowDate.setDate(tomorrowDate.getDate() + 1);
            const tomorrowStr = tomorrowDate.toISOString().split("T")[0];
            
            if (forecastData.list) {
                const tomorrowForecasts = forecastData.list.filter(item => item.dt_txt.startsWith(tomorrowStr));
                if (tomorrowForecasts.length > 0) {
                    tomorrowMaxTemp = Math.round(Math.max(...tomorrowForecasts.map(item => item.main.temp_max)));
                }
            }
        }

        if (weatherData.main) {
            setWeather({
              temp: Math.round(weatherData.main.temp),
              desc: weatherData.weather[0].description,
              wind: Math.round(weatherData.wind.speed * 3.6),
              humidity: weatherData.main.humidity,
              tomorrowTemp: tomorrowMaxTemp,
            });
        }
      } catch (err) {
        console.error("Failed to fetch weather", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [destName]);

  if (!destination) return null;

  return (
    <Card
      variant="default"
      padding="sm"
      className="relative overflow-hidden group border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 !p-3.5 sm:!p-4"
    >
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-400 flex items-center gap-1.5 font-sans">
            <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>Weather at Destination</span>
          </h3>
          <p className="text-base sm:text-lg font-extrabold mt-0.5 text-slate-900 font-heading truncate">
            {destName}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading leading-tight">
            {loading ? "..." : (weather ? `${weather.temp}°C` : "--°C")}
          </p>
          <p className="text-[11px] font-bold text-brand-600 flex items-center justify-end gap-1 font-sans">
            {weather ? getWeatherIcon(weather.desc) : <Sun className="w-3.5 h-3.5" />} 
            <span className="ml-1">{loading ? "Loading..." : (weather ? weather.desc : "--")}</span>
          </p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 font-sans">
        <div className="flex flex-col items-center text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">Tomorrow</p>
          <Sun className="w-3.5 h-3.5 my-1 text-slate-600" />
          <p className="text-[11px] font-bold text-slate-800">{loading ? "..." : (weather ? `${weather.tomorrowTemp}°C` : "--°C")}</p>
        </div>
        <div className="flex flex-col items-center text-center border-x border-slate-100 px-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">Wind</p>
          <Wind className="w-3.5 h-3.5 my-1 text-slate-600" />
          <p className="text-[11px] font-bold text-slate-800">{loading ? "..." : (weather ? `${weather.wind} km/h` : "--")}</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">Humidity</p>
          <Droplets className="w-3.5 h-3.5 my-1 text-slate-600" />
          <p className="text-[11px] font-bold text-slate-800">{loading ? "..." : (weather ? `${weather.humidity}%` : "--")}</p>
        </div>
      </div>
    </Card>
  );
};

export default TravelWeatherWidget;