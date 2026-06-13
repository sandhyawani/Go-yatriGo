import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Hero3 = () => {
  return (
    <section className="py-24 bg-slate-900 overflow-hidden relative">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Sparkles className="w-3 h-3" />
              <span>Ready for adventure?</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Explore India, one <span className="text-brand-400">extraordinary</span> memory at a time
            </h2>
            
            <p className="mt-6 text-slate-400 text-lg leading-relaxed">
              Connect with fellow travelers, form groups, and share amazing moments across Indian destinations without jumping between separate systems. From heritage routes to city breaks, Go Go YatriGo keeps the essentials in one place.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link to="/register" className="btn-primary px-8 py-4 flex items-center justify-center space-x-2">
                <span>Start Your Journey</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/hotelhome" className="px-8 py-4 rounded-2xl border border-slate-700 text-white font-bold hover:bg-slate-800 transition-all text-center">
                Explore Destinations
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="space-y-4 pt-12">
              <motion.img
                whileHover={{ y: -10 }}
                src="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80"
                alt="Goa coastline"
                className="h-64 w-full rounded-[2.5rem] object-cover shadow-2xl border border-slate-800"
              />
              <motion.img
                whileHover={{ y: -10 }}
                src="https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80"
                alt="Indian street food"
                className="h-72 w-full rounded-[2.5rem] object-cover shadow-2xl border border-slate-800"
              />
            </div>
            <div className="space-y-4">
              <motion.img
                whileHover={{ y: -10 }}
                src="https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80"
                alt="New Delhi landmark"
                className="h-[500px] w-full rounded-[2.5rem] object-cover shadow-2xl border border-slate-800"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero3;
