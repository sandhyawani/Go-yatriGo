import React from 'react';
import { Shield, Map, AlertTriangle, Phone, CheckCircle2, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const TravelSafetyGuidelines = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-7xl mx-auto pb-16 pt-10 lg:pt-4">
      <div className="max-w-2xl mx-auto px-4 md:px-6 space-y-5">
        
        {}
        <div className="flex items-center gap-3 mb-5">
          <button
          onClick={() => navigate('/settings')}
          className="p-1.5 hover:bg-slate-200 rounded-full transition-colors">

            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800">Travel Safety Guidelines</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Best practices for a safe and enjoyable journey</p>
          </div>
        </div>

        {}
        <div
        className="p-6 shadow-sm"
        style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '24px', borderLeft: '4px solid #22C55E' }}>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F0FDF4' }}>
              <Shield className="w-5 h-5" style={{ color: '#22C55E' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Your Safety is Our Priority</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Whether you're exploring a new city or embarking on a wilderness adventure, these guidelines will help you stay secure, prepared, and connected.
              </p>
            </div>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mb-3">
              <Map className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Pre-Trip Preparation</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-600">Research your destination's local customs, laws, and emergency numbers.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-600">Share your itinerary and accommodation details with trusted friends or family.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-600">Keep digital copies of important documents (passport, ID, insurance).</span>
              </li>
            </ul>
          </div>

          {}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Personal Safety</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-600">Stay aware of your surroundings and avoid isolated areas at night.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-600">Keep valuables concealed and use anti-theft bags in crowded tourist spots.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-600">Trust your instincts. If a situation feels unsafe, leave immediately.</span>
              </li>
            </ul>
          </div>

          {}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow md:col-span-2">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mb-3">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Using Go YatriGo Safety Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <h4 className="font-bold text-slate-700 text-sm mb-1">Emergency Contacts</h4>
                <p className="text-xs text-slate-500 mb-3">Add up to 5 emergency contacts. The primary contact will be alerted first when SOS is triggered.</p>
                <Link to="/emergency-contacts" className="text-brand-500 text-xs font-bold hover:underline">Manage Contacts &rarr;</Link>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <h4 className="font-bold text-slate-700 text-sm mb-1">SOS Alert System</h4>
                <p className="text-xs text-slate-500 mb-3">Enable the SOS button in Safety Settings to quickly share your live location with your contacts in an emergency.</p>
                <Link to="/settings/safety" className="text-brand-500 text-xs font-bold hover:underline">Configure SOS &rarr;</Link>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="text-center mt-6 p-4 bg-slate-100/70 rounded-2xl">
          <p className="text-xs text-slate-600 font-medium">In case of an immediate life-threatening emergency, always contact local emergency services (e.g., 911, 112) first.</p>
        </div>

      </div>
    </div>);

};

export default TravelSafetyGuidelines;