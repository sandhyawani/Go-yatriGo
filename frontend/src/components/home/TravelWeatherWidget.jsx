import React from "react";
import { CloudRain, Sun, Wind, MapPin } from "lucide-react";
import Card from "../common/Card";

const TravelWeatherWidget = ({ destination }) => {
  if (!destination) return null;
  const destName = destination.split(",")[0].trim();

  return (
    <Card variant="default" padding="md" className="mb-[var(--spacing-section)] relative overflow-hidden group">
      {}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z' fill='%237C3AED' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>
      
      {}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#F3E8FF] rounded-full blur-2xl group-hover:bg-[#E9D5FF] transition-colors duration-700" />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#7C3AED]" />
            Weather at Destination
          </h3>
          <p className="text-xl font-black mt-1 text-slate-800">{destName}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-slate-800">22°C</p>
          <p className="text-xs font-semibold text-[#7C3AED] flex items-center justify-end gap-1 mt-0.5">
            <Sun className="w-3.5 h-3.5" /> Mostly Sunny
          </p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-[var(--border-default)]">
        <div className="flex flex-col items-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Tomorrow</p>
          <CloudRain className="w-4 h-4 my-1.5 text-slate-600" />
          <p className="text-[11px] font-bold text-slate-700">19°C</p>
        </div>
        <div className="flex flex-col items-center border-x border-[var(--border-default)]">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Wind</p>
          <Wind className="w-4 h-4 my-1.5 text-slate-600" />
          <p className="text-[11px] font-bold text-slate-700">12 km/h</p>
        </div>
        <div className="flex flex-col items-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Advice</p>
          <div className="text-[10px] font-medium text-slate-600 text-center leading-tight mt-1 px-1">
            Pack a light jacket.
          </div>
        </div>
      </div>
    </Card>);

};

export default TravelWeatherWidget;