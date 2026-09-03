import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Sparkles, CheckCircle2, Lock } from "lucide-react";
import { motion } from "framer-motion";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-text-primary font-sans selection:bg-brand/30 py-10 md:py-16 flex items-center justify-center">
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 relative z-10">
        <Link
          to="/"
          className="inline-flex items-center text-brand-600 hover:text-brand-700 transition-colors mb-6 font-bold text-xs uppercase tracking-wider group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-10 md:p-12 shadow-xl backdrop-blur-sm"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-brand-50 border border-brand-100 rounded-2xl text-brand">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary">
                  Privacy <span className="text-brand">Policy</span>
                </h1>
                <p className="text-xs font-semibold text-text-muted mt-1 uppercase tracking-wider">
                  How We Protect & Manage Your Data
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold self-start sm:self-auto">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              <span>Last updated: May 2026</span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8 text-sm sm:text-base text-text-secondary leading-relaxed">
            <section className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5">
              <h2 className="text-base font-bold text-text-primary mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-100 text-brand text-xs font-extrabold">1</span>
                Introduction
              </h2>
              <p>
                Welcome to Go YatriGo. Go YatriGo is a travel-based social networking platform designed to connect travelers, help users explore destinations, and build safe group travel experiences. We respect your privacy and are deeply committed to protecting your personal data with transparent security practices.
              </p>
            </section>

            <section className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5">
              <h2 className="text-base font-bold text-text-primary mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-100 text-brand text-xs font-extrabold">2</span>
                Data We Collect
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl">
                  <span className="text-xs font-bold text-text-primary block mb-1">Identity & Profile Data</span>
                  <p className="text-xs text-text-muted">Name, handle, bio, travel interests, profile pictures.</p>
                </div>
                <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl">
                  <span className="text-xs font-bold text-text-primary block mb-1">Contact Details</span>
                  <p className="text-xs text-text-muted">Verified email address, optional contact number.</p>
                </div>
                <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl">
                  <span className="text-xs font-bold text-text-primary block mb-1">Travel & Location</span>
                  <p className="text-xs text-text-muted">Itineraries, trip location filters, emergency contacts.</p>
                </div>
                <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl">
                  <span className="text-xs font-bold text-text-primary block mb-1">Technical Telemetry</span>
                  <p className="text-xs text-text-muted">Encrypted session tokens, browser and device metadata.</p>
                </div>
              </div>
            </section>

            <section className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5">
              <h2 className="text-base font-bold text-text-primary mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-100 text-brand text-xs font-extrabold">3</span>
                Security & Data Safeguards
              </h2>
              <p className="mb-3">
                We employ industry standard security protocols to safeguard your account:
              </p>
              <ul className="space-y-2 pl-2">
                <li className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  <span>End-to-end encrypted sessions and hashed password vaults.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Opt-in location sharing with granular visibility toggles in your privacy settings.</span>
                </li>
              </ul>
            </section>

            <section className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5">
              <h2 className="text-base font-bold text-text-primary mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-100 text-brand text-xs font-extrabold">4</span>
                Your Privacy Rights
              </h2>
              <p>
                You can review, export, or permanently delete your account and associated trip data at any time from your Account Settings.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;