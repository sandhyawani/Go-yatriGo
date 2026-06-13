import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { motion } from "framer-motion";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl w-full">
        <Link to="/" className="inline-flex items-center text-brand-400 hover:text-brand-300 transition-colors mb-8 font-bold text-sm uppercase tracking-wider group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-sm"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-brand-500/20 rounded-xl">
              <Shield className="w-8 h-8 text-brand-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Privacy Policy</h1>
          </div>
          <div className="prose prose-invert prose-brand max-w-none text-white/80 leading-relaxed">
            <p className="text-sm text-white/50 mb-8 uppercase tracking-widest font-bold">Last Updated: May 26, 2026</p>
            
            <h2 className="text-xl font-bold text-white mb-4 mt-8">1. Introduction</h2>
            <p className="mb-4">
              Welcome to Go YatriGo. Go YatriGo is a travel-based social networking platform designed to connect travelers, help users explore destinations, and create safe group travel experiences. The application allows users to create accounts, upload posts and stories, join or create travel groups, chat with approved members, and plan trips together.
            </p>
            <p className="mb-4">
              Users can share travel experiences through images, videos, captions, emojis, and location-based posts. The platform also provides features such as likes, comments, notifications, emergency contact management, user ratings, privacy controls, and reporting systems to ensure a secure and interactive community environment. Go YatriGo focuses on improving travel collaboration, social engagement, and traveler safety through a modern MERN stack web application.
            </p>
            <p className="mb-6">
              We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
            </p>

            <h2 className="text-xl font-bold text-white mb-4 mt-8">2. Data We Collect</h2>
            <p className="mb-6">
              We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
            </p>
            <ul className="list-disc pl-5 mb-6 space-y-2">
              <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
              <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
              <li><strong>Profile Data</strong> includes your username and password, purchases or orders made by you, your interests, preferences, feedback and survey responses.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mb-4 mt-8">3. How We Use Your Data</h2>
            <p className="mb-6">
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul className="list-disc pl-5 mb-6 space-y-2">
              <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
              <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
              <li>Where we need to comply with a legal or regulatory obligation.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mb-4 mt-8">4. Data Security</h2>
            <p className="mb-6">
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
            </p>

            <h2 className="text-xl font-bold text-white mb-4 mt-8">5. Your Legal Rights</h2>
            <p className="mb-6">
              Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data and (where the lawful ground of processing is consent) to withdraw consent.
            </p>

            <h2 className="text-xl font-bold text-white mb-4 mt-8">6. Contact Us</h2>
            <p className="mb-6">
              If you have any questions about this privacy policy or our privacy practices, please contact us at privacy@amistar-goyatri.com.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
