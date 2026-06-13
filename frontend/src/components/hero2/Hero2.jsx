import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Hotel, Calendar } from "lucide-react";
import heroBg from "../../assets/images/hero-bg.png";

const Hero2 = () => {
  const { user } = React.useContext(require("../../context/authContext").AuthContext);

  return (
    <section className="relative min-h-[45vh] flex items-center pt-8 pb-4 overflow-hidden bg-slate-950">
      {/* Background with optimized overlay */}
      <motion.div 
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0"
      >
        <img
          src={heroBg}
          alt="Luxury India"
          className="h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950" />
      </motion.div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 w-full">
        <div className="flex flex-col items-center text-center">
          {/* Main Content */}
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-brand-500/20 border border-brand-500/30 text-brand-100 backdrop-blur-xl mb-3 uppercase tracking-widest">
                <Sparkles className="w-2.5 h-2.5 mr-1 text-brand-400" />
                Travel Redefined
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight"
            >
              Explore India, <span className="text-brand-400 italic">Together</span>.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }} 
              className="mt-3 text-xs text-slate-400 max-w-md mx-auto leading-relaxed"
            >
              Instagram-style travel social platform to connect with travelers.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 flex items-center justify-center gap-3"
            >
              <Link
                to={user ? "/hotelhome" : "/register"}
                className="btn-primary flex items-center space-x-2 group px-5 py-2.5 text-sm justify-center"
              >
                <span>{user ? "Dashboard" : "Get Started"}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/hotelhome"
                className="px-5 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/15 transition-all"
              >
                Destinations
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 flex items-center justify-center gap-6 border-t border-white/10 pt-6"
            >
              {[
                { label: "Hotels", count: "500+" },
                { label: "Groups", count: "1.2k+" },
                { label: "Events", count: "50+" },
              ]?.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-white font-black text-sm">{stat.count}</p>
                  <p className="text-slate-500 text-[8px] font-bold uppercase tracking-tighter">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero2;
