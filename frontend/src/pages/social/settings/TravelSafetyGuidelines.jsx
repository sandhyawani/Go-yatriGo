import React from 'react';
import { Shield, Map, AlertTriangle, Phone, CheckCircle2, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const TravelSafetyGuidelines = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-7xl mx-auto pb-20">
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Travel Safety Guidelines</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Best practices for a safe and enjoyable journey</p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-brand-500 to-blue-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <Shield className="w-12 h-12 mb-4 text-brand-100" />
            <h2 className="text-2xl font-bold mb-2">Your Safety is Our Priority</h2>
            <p className="text-brand-50 max-w-lg">
              Whether you're exploring a new city or embarking on a wilderness adventure, these guidelines will help you stay secure, prepared, and connected.
            </p>
          </div>
          {/* Decorative Background Pattern */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-20 -mb-10 w-40 h-40 bg-brand-300 opacity-20 rounded-full blur-2xl"></div>
        </div>

        {/* Guidelines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Preparation */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-4">
              <Map className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Pre-Trip Preparation</h3>
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

          {/* Card 2: Personal Safety */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Personal Safety</h3>
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

          {/* Card 3: App Features */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow md:col-span-2">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Using Go YatriGo Safety Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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

        {/* Footer info */}
        <div className="text-center mt-10 p-6 bg-slate-200/50 rounded-3xl">
          <p className="text-sm text-slate-600 font-medium">In case of an immediate life-threatening emergency, always contact local emergency services (e.g., 911, 112) first.</p>
        </div>

      </div>
    </div>
  );
};

export default TravelSafetyGuidelines;
