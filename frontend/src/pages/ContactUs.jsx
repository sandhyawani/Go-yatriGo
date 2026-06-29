/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, jsx-a11y/alt-text, jsx-a11y/img-redundant-alt */
import { showToast } from "../utils/showToast";
import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import axios from "../api/axios";

// Validators
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INITIAL_FORM = { name: "", email: "", subject: "", message: "" };

const validate = ({ name, email, subject, message }) => {
  if (!name.trim()) return "Full name is required.";
  if (!email.trim()) return "Email address is required.";
  if (!EMAIL_REGEX.test(email)) return "Please enter a valid email address.";
  if (!subject.trim()) return "Subject is required.";
  if (!message.trim()) return "Message cannot be empty.";
  if (message.trim().length < 10)
    return "Message must be at least 10 characters.";
  return null;
};

// Static contact info
const CONTACT_INFO = [
  {
    icon: Mail,
    title: "Email",
    detail: "support@gogoyatrigo.com",
    href: "mailto:support@gogoyatrigo.com",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: Phone,
    title: "Phone",
    detail: "+91 (800) YATRI-GO",
    href: "tel:+918009284446",
    color: "from-purple-400 to-purple-600",
  },
  {
    icon: MapPin,
    title: "Office",
    detail: "Cyber City, Gurugram, India",
    href: "https://maps.google.com/?q=Cyber+City+Gurugram",
    color: "from-purple-500 to-fuchsia-500",
  },
];

const inputClass =
  "w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 font-medium outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all placeholder:text-slate-400 text-sm shadow-sm";
const labelClass =
  "text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block";

// Component
const ContactUs = () => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validate(formData);
    if (error) {
      showToast.error("Check your details");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post("/contact", formData);
      showToast.success("Message Sent", "Our team will reply shortly.");
      setFormData(INITIAL_FORM);
    } catch (err) {
      showToast.error("Transmission Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-purple-500/30 py-10 md:py-16 flex items-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 w-full">
        {/* ── Header ── */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/50 border border-purple-200 text-[10px] font-bold uppercase tracking-wider mb-4 text-purple-700"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>24/7 Support</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3"
          >
            Get in <span className="text-purple-600">Touch.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-sm md:text-base font-medium"
          >
            Send us a message and we'll respond as soon as possible.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-purple-500/5 overflow-hidden flex flex-col md:flex-row"
        >
          {/* ── Contact Methods (Sidebar) ── */}
          <div className="bg-purple-600 w-full md:w-2/5 p-8 text-white relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500 rounded-full blur-3xl -ml-32 -mb-32 opacity-50 pointer-events-none" />

            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-6">Contact Information</h3>
              <div className="space-y-6">
                {CONTACT_INFO.map(
                  ({ icon: Icon, title, detail, href }, idx) => (
                    <a
                      key={title}
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel={
                        href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="flex items-start gap-4 group hover:-translate-y-1 transition-transform"
                    >
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                        <Icon className="w-5 h-5 text-purple-100" />
                      </div>
                      <div>
                        <p className="text-[11px] text-purple-200 uppercase tracking-wider font-bold mb-0.5">
                          {title}
                        </p>
                        <p className="text-sm font-semibold">{detail}</p>
                      </div>
                    </a>
                  ),
                )}
              </div>
            </div>

            <div className="relative z-10 mt-12 pt-8 border-t border-white/20">
              <p className="text-xs text-purple-200 leading-relaxed font-medium">
                We're committed to your safety. Join thousands of travelers who
                trust our protocol.
              </p>
            </div>
          </div>

          {/* ── Contact Form ── */}
          <div className="w-full md:w-3/5 p-8 md:p-10">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contact-name" className={labelClass}>
                    Your Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    placeholder="Jane Doe"
                    className={inputClass}
                    value={formData.name}
                    maxLength={100}
                    onChange={handleChange("name")}
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className={labelClass}>
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    placeholder="jane@example.com"
                    className={inputClass}
                    value={formData.email}
                    onChange={handleChange("email")}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className={labelClass}>
                  Subject
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  placeholder="What can we help you with?"
                  className={inputClass}
                  value={formData.subject}
                  maxLength={150}
                  onChange={handleChange("subject")}
                />
              </div>

              <div>
                <label htmlFor="contact-message" className={labelClass}>
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  placeholder="Tell us everything..."
                  className={`${inputClass} resize-none`}
                  value={formData.message}
                  maxLength={2000}
                  onChange={handleChange("message")}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold">
                    Your data is secure
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2 text-sm"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                  <Send
                    className={`w-4 h-4 ${isSubmitting ? "animate-pulse" : ""}`}
                  />
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactUs;
