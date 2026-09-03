import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Sparkles, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const Terms = () => {
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
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary">
                  Terms & <span className="text-brand">Conditions</span>
                </h1>
                <p className="text-xs font-semibold text-text-muted mt-1 uppercase tracking-wider">
                  Go YatriGo Platform Agreement
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
                Acceptance of Terms
              </h2>
              <p>
                By accessing and using Go YatriGo, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, you should not access or use our platform.
              </p>
            </section>

            <section className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5">
              <h2 className="text-base font-bold text-text-primary mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-100 text-brand text-xs font-extrabold">2</span>
                Description of Service
              </h2>
              <p>
                Go YatriGo is a travel networking platform connecting travelers, squads, and adventure enthusiasts. We provide services including connecting users, sharing travel experiences, coordinating itinerary dispatches, and collaborative trip planning.
              </p>
            </section>

            <section className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5">
              <h2 className="text-base font-bold text-text-primary mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-100 text-brand text-xs font-extrabold">3</span>
                User Conduct & Community Safety
              </h2>
              <p className="mb-3">
                You agree to use our services exclusively for lawful and respectful travel-related interactions:
              </p>
              <ul className="space-y-2 pl-2">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Users must provide accurate, verified registration details.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Users are responsible for maintaining account credential confidentiality.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Harassment, fraudulent itineraries, or spamming will lead to immediate account suspension.</span>
                </li>
              </ul>
            </section>

            <section className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5">
              <h2 className="text-base font-bold text-text-primary mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-100 text-brand text-xs font-extrabold">4</span>
                Intellectual Property
              </h2>
              <p>
                The service, logo, branding, and original platform architecture are and will remain the exclusive property of Go YatriGo and its licensors.
              </p>
            </section>

            <section className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5">
              <h2 className="text-base font-bold text-text-primary mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-100 text-brand text-xs font-extrabold">5</span>
                Contact & Support
              </h2>
              <p>
                If you have questions regarding these Terms & Conditions, reach out directly at{" "}
                <a href="mailto:support@gogoyatrigo.com" className="text-brand font-semibold hover:underline">
                  support@gogoyatrigo.com
                </a>.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;