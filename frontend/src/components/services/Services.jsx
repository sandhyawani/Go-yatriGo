import React from "react";
import { Hotel, Users, Utensils, ArrowRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const categories = [
  {
    name: "Luxury Hotels",
    icon: <Hotel className="w-6 h-6" />,
    path: "/hotelhome",
    description: "Discover curated stays from boutique heritage homes to 5-star resorts.",
    color: "bg-blue-50 text-blue-600",
    action: "View Stays"
  },
  {
    name: "Travel Groups",
    icon: <Users className="w-6 h-6" />,
    path: "/social/buddy",
    description: "Connect with like-minded travelers and plan adventures together.",
    color: "bg-emerald-50 text-emerald-600",
    action: "Join Groups"
  },
  {
    name: "Fine Dining",
    icon: <Utensils className="w-6 h-6" />,
    path: "/restauranthome",
    description: "Reserve tables at top-rated restaurants and explore culinary gems.",
    color: "bg-rose-50 text-rose-600",
    action: "Book Table"
  },
  {
    name: "Local Events",
    icon: <Calendar className="w-6 h-6" />,
    path: "/activities",
    description: "Explore unique local experiences, workshops, and seasonal festivals.",
    color: "bg-purple-50 text-purple-600",
    action: "See Events"
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const Services = () => {
  return (
    <section className="py-6 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight"
          >
            Your journey, <span className="text-brand-500">all in one place</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mt-1 text-slate-500 max-w-xl mx-auto text-xs"
          >
            Unified travel planning for the modern explorer.
          </motion.p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {categories?.map((category) => (
            <motion.div key={category.name} variants={item}>
              <Link
                to={category.path}
                className="group relative h-full block p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-500 overflow-hidden"
              >
                {/* Background Accent */}
                <div className={`absolute top-0 right-0 w-20 h-20 -mr-10 -mt-10 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${category.color.split(' ')[0]}`} />
                
                <div className={`inline-flex items-center justify-center p-2.5 rounded-xl mb-3 transition-transform duration-500 group-hover:scale-110 ${category.color}`}>
                  {React.cloneElement(category.icon, { className: "w-5 h-5" })}
                </div>
                
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                  {category.name}
                </h4>
                
                <p className="mt-2 text-slate-500 text-[10px] leading-relaxed line-clamp-2">
                  {category.description}
                </p>

                <div className="mt-4 flex items-center text-brand-600 font-bold text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                  <span>{category.action}</span>
                  <ArrowRight className="ml-1.5 w-3 h-3" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Services;
