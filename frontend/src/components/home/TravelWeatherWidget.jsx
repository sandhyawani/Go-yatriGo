import React from "react";
import { CloudRain, Sun, Wind, MapPin, Droplets } from "lucide-react";
import Card from "../common/Card";

const TravelWeatherWidget = ({ destination }) => {
  if (!destination) return null;
  const destName = destination.split(",")[0].trim();

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
            22°C
          </p>
          <p className="text-[11px] font-bold text-brand-600 flex items-center justify-end gap-1 font-sans">
            <Sun className="w-3.5 h-3.5" /> Mostly Sunny
          </p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 font-sans">
        <div className="flex flex-col items-center text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">Tomorrow</p>
          <CloudRain className="w-3.5 h-3.5 my-1 text-slate-600" />
          <p className="text-[11px] font-bold text-slate-800">19°C</p>
        </div>
        <div className="flex flex-col items-center text-center border-x border-slate-100 px-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">Wind</p>
          <Wind className="w-3.5 h-3.5 my-1 text-slate-600" />
          <p className="text-[11px] font-bold text-slate-800">12 km/h</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">Humidity</p>
          <Droplets className="w-3.5 h-3.5 my-1 text-slate-600" />
          <p className="text-[11px] font-bold text-slate-800">64%</p>
        </div>
      </div>
    </Card>
  );
};

export default TravelWeatherWidget;