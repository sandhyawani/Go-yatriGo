// import React, { useState } from "react";
// import {
//   ShieldCheck,
//   MapPin,
//   MessageSquare,
//   X,
//   Send,
//   CheckCircle,
// } from "lucide-react";
// import axiosInstance from "../../api/axios";

// const SafeCheckInModal = ({ journey, isOpen, onClose, onSuccess }) => {
//   const [checkInType, setCheckInType] = useState("Reached Destination");
//   const [location, setLocation] = useState(journey?.destination || "");
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);

//   if (!isOpen || !journey) return null;

//   const checkInTypes = [
//     "Started Journey",
//     "Reached Destination",
//     "Reached Accommodation",
//     "Returning Home",
//     "Reached Home Safely",
//   ];

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const res = await axiosInstance.post(`/journeys/${journey._id}/checkin`, {
//         checkInType,
//         location,
//         message,
//       });

//       if (res.data.success) {
//         if (onSuccess) onSuccess(res.data.timelineEntry);
//         onClose();
//       }
//     } catch (err) {
//       console.error("Safe check-in error:", err);
//       alert(err.response?.data?.message || "Failed to broadcast check-in");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
//       <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 sm:rounded-3xl rounded-t-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
//         {/* Header */}
//         <div className="bg-white dark:bg-slate-900 p-5 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white relative">
//           <button
//             onClick={onClose}
//             className="absolute top-5 right-5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
//           >
//             <X className="w-5 h-5" />
//           </button>
//           <div className="flex items-center gap-3">
//             <div className="p-2.5 bg-[#6C4DF6] rounded-2xl">
//               <ShieldCheck className="w-6 h-6 text-white animate-bounce" />
//             </div>
//             <div>
//               <h3 className="text-lg font-bold">Safe Check-In Broadcast</h3>
//               <p className="text-xs text-slate-500 dark:text-slate-400">
//                 Linked to Go yatriGo SOS System
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Form Body */}
//         <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
//           <div>
//             <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
//               Select Check-In Milestone
//             </label>
//             <div className="grid grid-cols-1 gap-2">
//               {checkInTypes.map((type) => (
//                 <button
//                   key={type}
//                   type="button"
//                   onClick={() => setCheckInType(type)}
//                   className={`flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition-all active:scale-98 ${
//                     checkInType === type
//                       ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 shadow-sm"
//                       : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400"
//                   }`}
//                 >
//                   {type}
//                   {checkInType === type && (
//                     <CheckCircle className="w-4 h-4 text-[#6C4DF6]" />
//                   )}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <div>
//             <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center">
//               <MapPin className="w-4 h-4 mr-1 text-emerald-500" /> Current
//               Location / Checkpoint
//             </label>
//             <input
//               type="text"
//               value={location}
//               onChange={(e) => setLocation(e.target.value)}
//               placeholder="e.g. Baga Beach, Goa"
//               className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
//             />
//           </div>

//           <div>
//             <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center">
//               <MessageSquare className="w-4 h-4 mr-1 text-emerald-500" />{" "}
//               Quick Status Note (Optional)
//             </label>
//             <textarea
//               value={message}
//               onChange={(e) => setMessage(e.target.value)}
//               placeholder="e.g. Reached hotel safely, resting now!"
//               rows="3"
//               className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
//             />
//           </div>

//           {/* Footer Action */}
//               onClick={onClose}
//               className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#6C4DF6] hover:bg-[#5b3ee0] text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
//             >
//               <Send className="w-4 h-4" />
//               {loading ? "Broadcasting..." : "Broadcast Safely"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default SafeCheckInModal;
import React, { useState } from "react";
import {
  ShieldCheck,
  MapPin,
  MessageSquare,
  X,
  Send,
  CheckCircle,
} from "lucide-react";
import axiosInstance from "../../api/axios";

const SafeCheckInModal = ({ journey, isOpen, onClose, onSuccess }) => {
  const [checkInType, setCheckInType] = useState("Reached Destination");
  const [location, setLocation] = useState(journey?.destination || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !journey) return null;

  const checkInTypes = [
    "Started Journey",
    "Reached Destination",
    "Reached Accommodation",
    "Returning Home",
    "Reached Home Safely",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/journeys/${journey._id}/checkin`, {
        checkInType,
        location,
        message,
      });

      if (res.data.success) {
        if (onSuccess) onSuccess(res.data.timelineEntry);
        onClose();
      }
    } catch (err) {
      console.error("Safe check-in error:", err);
      alert(err.response?.data?.message || "Failed to broadcast check-in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 sm:rounded-3xl rounded-t-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 p-5 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#6C4DF6] rounded-2xl">
              <ShieldCheck className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Safe Check-In Broadcast</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Linked to Go yatriGo SOS System
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Select Check-In Milestone
            </label>
            <div className="grid grid-cols-1 gap-2">
              {checkInTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCheckInType(type)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition-all active:scale-98 ${
                    checkInType === type
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {type}
                  {checkInType === type && (
                    <CheckCircle className="w-4 h-4 text-[#6C4DF6]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-1 text-emerald-500" /> Current
              Location / Checkpoint
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Baga Beach, Goa"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center">
              <MessageSquare className="w-4 h-4 mr-1 text-emerald-500" />{" "}
              Quick Status Note (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Reached hotel safely, resting now!"
              rows="3"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Footer Action */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#6C4DF6] hover:bg-[#5b3ee0] text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {loading ? "Broadcasting..." : "Broadcast Safely"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SafeCheckInModal;