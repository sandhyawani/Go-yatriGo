import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { motion } from "framer-motion";

const Terms = () => {
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
              <FileText className="w-8 h-8 text-brand-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Terms and Conditions</h1>
          </div>
          <div className="prose prose-invert prose-brand max-w-none text-white/80 leading-relaxed">
            <p className="text-sm text-white/50 mb-8 uppercase tracking-widest font-bold">Last Updated: May 26, 2026</p>
            
            <h2 className="text-xl font-bold text-white mb-4 mt-8">1. Acceptance of Terms</h2>
            <p className="mb-6">
              By accessing and using Go YatriGo, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2 className="text-xl font-bold text-white mb-4 mt-8">2. Description of Service</h2>
            <p className="mb-6">
              Go YatriGo is a travel networking platform that connects travelers worldwide. We provide services including but not limited to connecting users, sharing travel experiences, and planning trips.
            </p>

            <h2 className="text-xl font-bold text-white mb-4 mt-8">3. User Conduct</h2>
            <p className="mb-6">
              You agree to use our services only for lawful purposes. You are prohibited from posting or transmitting to or from this site any unlawful, threatening, libelous, defamatory, obscene, pornographic, or other material that would violate any law.
            </p>
            <ul className="list-disc pl-5 mb-6 space-y-2">
              <li>Users must provide accurate registration information.</li>
              <li>Users are responsible for maintaining the confidentiality of their account.</li>
              <li>Users agree to notify us immediately of any unauthorized use of their account.</li>
            </ul>

            <h2 className="text-xl font-bold text-white mb-4 mt-8">4. Intellectual Property</h2>
            <p className="mb-6">
              The service and its original content, features, and functionality are and will remain the exclusive property of Go YatriGo and its licensors.
            </p>

            <h2 className="text-xl font-bold text-white mb-4 mt-8">5. Termination</h2>
            <p className="mb-6">
              We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>

            <h2 className="text-xl font-bold text-white mb-4 mt-8">6. Limitation of Liability</h2>
            <p className="mb-6">
              In no event shall Go  YatriGo, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
            </p>

            <h2 className="text-xl font-bold text-white mb-4 mt-8">7. Contact Us</h2>
            <p className="mb-6">
              If you have any questions about these Terms, please contact us at support@amistar-goyatri.com.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;

