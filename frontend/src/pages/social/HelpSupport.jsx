import React, { useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, ChevronDown, ChevronUp, MessageSquare, LifeBuoy, ShieldCheck, FileText, Send, Ticket } from "lucide-react";
import { showToast } from "../../utils/showToast";

const faqs = [
  {
    question: "How do I report an unsafe user or group?",
    answer: "You can report any user or group directly from their profile or group page by clicking the three dots menu and selecting 'Report'. Our moderation team reviews all reports within 24 hours."
  },
  {
    question: "What happens when I activate an SOS Alert?",
    answer: "When you toggle the SOS Alert in your Emergency Contacts, an immediate SMS and email notification is sent to all your designated primary contacts with your last known location."
  },
  {
    question: "How can I share my live trip location?",
    answer: "Go to your Emergency Contacts page and ensure 'Location Sharing' is enabled. Your active trips will then securely share your progress with your emergency contacts."
  },
  {
    question: "How do I delete my account?",
    answer: "You can permanently delete your account from the Account Security (Settings) page in the 'Danger Zone' section."
  }
];

const mockTickets = [
  { id: "#TKT-8291", issue: "Reported suspicious group", status: "Resolved", date: "2 days ago" },
  { id: "#TKT-8245", issue: "Location tracking not updating", status: "In Progress", date: "5 days ago" }
];

const HelpSupport = () => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [reportIssue, setReportIssue] = useState("");
  const [reportType, setReportType] = useState("Bug");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tickets, setTickets] = useState([]);

  React.useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { data } = await require("../../api/axios").default.get("/support/tickets", { withCredentials: true });
        setTickets(data.tickets || data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTickets();
  }, []);

  const toggleFaq = (index) => {
    if (activeFaq === index) {
      setActiveFaq(null);
    } else {
      setActiveFaq(index);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportIssue.trim()) return;
    setIsSubmitting(true);
    try {
      const { data } = await require("../../api/axios").default.post("/support/tickets", { 
        issueType: reportType, 
        subject: `Report: ${reportType} Issue`, 
        description: reportIssue 
      }, { withCredentials: true });
      showToast.success("Issue reported successfully. Our team will review it.");
      setReportIssue("");
      
      // Update tickets list locally
      setTickets(prev => [data.ticket, ...prev]);
    } catch (err) {
      showToast.error("Failed to report issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className=" bg-slate-50 pt-14 md:pt-0 pb-20">
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
        
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-brand-500" />
            Help & Support
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">We are here to ensure your safety and address any issues.</p>
        </div>

        {/* Contact Support Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/contactus" className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-brand-200 hover:shadow-md transition-all group flex items-start gap-4">
            <div className="p-3 bg-brand-50 rounded-2xl text-brand-600 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Contact Us</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Reach out to our concierge team directly for dedicated support.</p>
            </div>
          </Link>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all group flex items-start gap-4">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Safety Center</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Learn about our moderation, safety protocols, and community rules.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* FAQ Accordion */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-6">
                <FileText className="w-4 h-4 text-slate-400" />
                Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden transition-all bg-slate-50/50">
                    <button 
                      onClick={() => toggleFaq(idx)} 
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 focus:outline-none"
                    >
                      <span className="text-sm font-bold text-slate-700 pr-4">{faq.question}</span>
                      {activeFaq === idx ? (
                        <ChevronUp className="w-4 h-4 text-brand-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {activeFaq === idx && (
                      <div className="p-4 pt-0 text-sm text-slate-500 leading-relaxed border-t border-slate-100 bg-white">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Report Issue Form */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                Report an Issue
              </h2>
              <p className="text-xs text-slate-500 mb-6">Encountered a bug or an unsafe situation? Let us know.</p>
              
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <label className={`p-3 rounded-xl border text-center cursor-pointer transition-colors text-sm font-bold ${reportType === 'Bug' ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                    <input type="radio" className="hidden" name="reportType" checked={reportType === 'Bug'} onChange={() => setReportType('Bug')} />
                    Technical Bug
                  </label>
                  <label className={`p-3 rounded-xl border text-center cursor-pointer transition-colors text-sm font-bold ${reportType === 'Safety' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                    <input type="radio" className="hidden" name="reportType" checked={reportType === 'Safety'} onChange={() => setReportType('Safety')} />
                    Safety Concern
                  </label>
                </div>
                <div>
                  <textarea 
                    rows="4"
                    value={reportIssue}
                    onChange={(e) => setReportIssue(e.target.value)}
                    required
                    placeholder="Describe the issue in detail..."
                    className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none"
                  ></textarea>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2">
                  {isSubmitting ? "Submitting..." : "Submit Report"} <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
            
          </div>

          <div className="space-y-8">
            
            {/* Ticket History */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-6">
                <Ticket className="w-4 h-4 text-slate-400" />
                Recent Tickets
              </h2>
              <div className="space-y-3">
                {tickets.map((ticket, i) => (
                  <div key={ticket._id || i} className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{ticket.trackingId || 'TICKET'}</span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 truncate">{ticket.subject || ticket.category}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
                {tickets.length === 0 && <p className="text-xs text-slate-400">No recent tickets.</p>}
              </div>
            </div>

            {/* Safety Guidelines Snippet */}
            <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-6 text-white shadow-md">
              <h3 className="text-sm font-black mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Safety First
              </h3>
              <ul className="space-y-3 text-xs text-brand-100 font-medium">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-brand-300 rounded-full mt-1.5 shrink-0" />
                  Always meet new travel buddies in public places.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-brand-300 rounded-full mt-1.5 shrink-0" />
                  Keep your emergency contacts updated.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-brand-300 rounded-full mt-1.5 shrink-0" />
                  Never share financial information in chats.
                </li>
              </ul>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default HelpSupport;
