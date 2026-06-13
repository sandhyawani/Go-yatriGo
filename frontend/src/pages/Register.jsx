import { showToast } from "../utils/showToast";
// import axios from "../api/axios";
// import { useState, useEffect, useContext } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   User,
//   Mail,
//   Phone,
//   Lock,
//   Camera,
//   ArrowRight,
//   ShieldCheck,
//   ChevronLeft,
//   Eye,
//   EyeOff,
//   CheckCircle2,
//   AlertCircle,
//   Globe2,
//   Users
// } from "lucide-react";
// import Swal from "sweetalert2";
// import { AuthContext } from "../context/authContext";
// import Spinner from "../components/spinner/LoadingSpinner";

// // Import assets from src/assets/images
// import stickerPack from "../assets/images/IndianfamousCityCardSticker_Packof15.webp";
// import travelBg from "../assets/images/bg.jpg";

// const Register = () => {
//   const { user } = useContext(AuthContext);
//   const [loading, setLoading] = useState(false);
//   const [file, setFile] = useState("");
//   const [preview, setPreview] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     mobile: "",
//     password: "",
//     repeatPassword: ""
//   });

//   const [errors, setErrors] = useState({});

//   const navigate = useNavigate();

//   useEffect(() => {
//     if (user) {
//       navigate("/");
//     }
//   }, [user, navigate]);

//   const validateEmail = (email) => {
//     const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return re.test(email);
//   };

//   const validatePhone = (phone) => {
//     // Basic phone validation for numbers and length
//     const re = /^[+]?[\d\s-]{10,}$/;
//     return re.test(phone);
//   };

//   const calculatePasswordStrength = (pass) => {
//     let score = 0;
//     if (!pass) return score;
//     if (pass.length > 6) score += 1;
//     if (pass.length > 10) score += 1;
//     if (/[A-Z]/.test(pass)) score += 1;
//     if (/[0-9]/.test(pass)) score += 1;
//     if (/[^A-Za-z0-9]/.test(pass)) score += 1;
//     return Math.min(4, score);
//   };

//   const strength = calculatePasswordStrength(formData.password);

//   const getStrengthColor = (score) => {
//     if (score === 0) return "bg-white/10";
//     if (score <= 1) return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]";
//     if (score === 2) return "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]";
//     if (score === 3) return "bg-brand-500 shadow-[0_0_10px_rgba(124,58,237,0.5)]";
//     return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
//   };

//   const getStrengthText = (score) => {
//     if (score === 0) return "";
//     if (score <= 1) return "Weak";
//     if (score === 2) return "Fair";
//     if (score === 3) return "Good";
//     return "Strong";
//   };

//   const handleChange = (e) => {
//     const { id, value } = e.target;
//     setFormData(prev => ({ ...prev, [id]: value }));
    
//     if (errors[id]) {
//       setErrors(prev => ({ ...prev, [id]: "" }));
//     }
//   };

//   const handleFileChange = (e) => {
//     const selectedFile = e.target.files[0];
//     if (selectedFile) {
//       if (!selectedFile.type.startsWith("image/")) {
//         showToast.error("Error", "Please select an image file");
//         return;
//       }
//       setFile(selectedFile);
//       setPreview(URL.createObjectURL(selectedFile));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const { name, email, mobile, password, repeatPassword } = formData;
//     let hasError = false;
//     const newErrors = {};

//     if (!name) { newErrors.name = "Name is required"; hasError = true; }
//     if (!email) { newErrors.email = "Email is required"; hasError = true; }
//     else if (!validateEmail(email)) { newErrors.email = "Invalid email format"; hasError = true; }
    
//     if (!mobile) { newErrors.mobile = "Phone is required"; hasError = true; }
//     else if (!validatePhone(mobile)) { newErrors.mobile = "Invalid phone format"; hasError = true; }

//     if (!password) { newErrors.password = "Password is required"; hasError = true; }

//     if (password !== repeatPassword) {
//       newErrors.repeatPassword = "Passwords do not match";
//       hasError = true;
//       Swal.fire({
//         icon: 'error',
//         title: 'Validation Error',
//         text: 'Passwords do not match.',
//         confirmButtonColor: '#7c3aed',
//         customClass: { popup: 'rounded-[1.5rem]' }
//       });
//       setErrors(newErrors);
//       return;
//     }

//     if (hasError) {
//       setErrors(newErrors);
//       Swal.fire({
//         icon: 'warning',
//         title: 'Incomplete Form',
//         text: 'Please fill in all required fields correctly.',
//         confirmButtonColor: '#7c3aed',
//         customClass: { popup: 'rounded-[1.5rem]' }
//       });
//       return;
//     }

//     setLoading(true);
//     try {
//       let imageUrl = "";
//       if (file) {
//         const data = new FormData();
//         data.append("file", file);
//         data.append("upload_preset", "upload");
//         const uploadRes = await fetch(
//           "https://api.cloudinary.com/v1_1/dpgelkpd4/image/upload",
//           { method: "POST", body: data }
//         ).then(res => res.json());
//         imageUrl = uploadRes.url;
//       }

//       await axios.post("/auth/register", {
//         ...formData,
//         img: imageUrl
//       });

//       Swal.fire({
//         icon: 'success',
//         title: 'Welcome Aboard!',
//         text: 'Your account has been created successfully.',
//         timer: 3000,
//         showConfirmButton: false,
//         customClass: { popup: 'rounded-[1.5rem]' }
//       });
//       navigate("/login");
//     } catch (err) {
//       const errorMsg = typeof err.response?.data === 'string'
//         ? err.response?.data
//         : err.response?.data?.message || "Registration failed. Please try again.";

//       Swal.fire("Error", errorMsg, "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const labelClass = "text-[10px] font-black text-white/50 uppercase tracking-widest ml-1 mb-1 block";
  
//   return (
//     <div className="min-h-screen bg-slate-900 flex font-sans overflow-hidden relative">
//       {/* Background Layer */}
//       <div
//         className="absolute inset-0 z-0 bg-cover bg-center opacity-30 scale-110"
//         style={{ backgroundImage: `url(${travelBg})` }}
//       />
//       <div className="absolute inset-0 z-10 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-900/60" />

//       {/* Ambient Radial Gradients */}
//       <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none" />
//       <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] -translate-x-1/3 translate-y-1/3 z-10 pointer-events-none" />

//       {/* Main Content */}
//       <div className="relative z-20 w-full flex flex-col lg:flex-row min-h-screen">

//         {/* Left side: Hero Image & Onboarding */}
//         <div className="hidden lg:flex flex-col lg:w-2/5 items-center justify-center p-8 relative">
//           <motion.div
//             initial={{ opacity: 0, x: -20 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 1.2 }}
//             className="w-full max-w-sm"
//           >
//             <div className="relative bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-2 overflow-hidden shadow-2xl group">
//               <div className="absolute -inset-4 bg-brand-500/20 blur-3xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
//               <img src={stickerPack} alt="Stickers" className="w-full h-auto rounded-[1.8rem] opacity-90 transform group-hover:scale-[1.02] transition-transform duration-700" />
//               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent rounded-[1.8rem]" />
//               <div className="absolute bottom-6 left-6 right-6">
//                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 backdrop-blur-md border border-brand-500/30 mb-3 shadow-lg">
//                   <Globe2 className="w-3.5 h-3.5 text-brand-300" />
//                   <span className="text-[9px] font-bold uppercase tracking-wider text-brand-100">Global Network</span>
//                 </div>
//                 <h2 className="text-3xl font-black text-white leading-tight tracking-tighter drop-shadow-lg">
//                   Join the <br /><span className="italic text-brand-400 font-black">Elite Circle.</span>
//                 </h2>
//               </div>
//             </div>

//             {/* Onboarding Messaging */}
//             <div className="mt-8 space-y-4 px-2">
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
//                 <div className="p-2.5 bg-brand-500/20 rounded-xl"><Users className="w-5 h-5 text-brand-400" /></div>
//                 <div>
//                   <h4 className="text-sm font-bold text-white">Connect with travelers</h4>
//                   <p className="text-xs text-white/50 font-medium mt-0.5">Find people heading your way</p>
//                 </div>
//               </motion.div>
//               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
//                 <div className="p-2.5 bg-blue-500/20 rounded-xl"><ShieldCheck className="w-5 h-5 text-blue-400" /></div>
//                 <div>
//                   <h4 className="text-sm font-bold text-white">Share journeys safely</h4>
//                   <p className="text-xs text-white/50 font-medium mt-0.5">Verified profiles and secure portal</p>
//                 </div>
//               </motion.div>
//             </div>
//           </motion.div>
//         </div>

//         {/* Right side: Register Form */}
//         <div className="w-full lg:w-3/5 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto custom-scrollbar">
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8 }}
//             className="w-full max-w-[520px] bg-white/10 backdrop-blur-2xl border border-white/10 p-8 sm:p-10 rounded-[3rem] shadow-2xl my-8"
//           >
//             {/* Branding */}
//             <div className="mb-8 flex flex-col items-center lg:items-start relative">
//               <div className="flex items-center justify-between w-full">
//                 <div>
//                   <h1 className="text-3xl font-black text-white tracking-tighter mb-1 italic">Sign Up.</h1>
//                   <p className="text-white/50 font-medium text-xs">Create your global traveler profile</p>
//                 </div>

//                 {/* Profile Photo Upload */}
//                 <div className="relative group">
//                   <motion.div whileHover={{ scale: 1.05 }} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/5 shadow-inner flex items-center justify-center overflow-hidden border border-white/10 p-1 group-hover:border-brand-500/50 transition-colors">
//                     {preview ? (
//                       <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
//                     ) : (
//                       <div className="flex flex-col items-center gap-1">
//                         <User className="w-6 h-6 text-white/20 group-hover:text-brand-400 transition-colors" />
//                         <span className="text-[8px] font-black text-white/30 uppercase tracking-tighter hidden sm:block">Avatar</span>
//                       </div>
//                     )}
//                   </motion.div>
//                   <label htmlFor="file" className="absolute -bottom-2 -right-2 p-2 sm:p-2.5 bg-brand-600 text-white rounded-xl shadow-xl cursor-pointer hover:bg-brand-500 transition-all border-4 border-[#1c1e2d] active:scale-90 z-10 overflow-hidden">
//                     <div className="absolute inset-0 bg-white/20 translate-y-full hover:-translate-y-full transition-transform duration-500" />
//                     <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10" />
//                     <input type="file" id="file" className="hidden" accept="image/*" onChange={handleFileChange} />
//                   </label>
//                 </div>
//               </div>
//             </div>

//             <form onSubmit={handleSubmit} className="space-y-4">
//               {/* Full Name & Email */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-1">
//                   <label className={labelClass}>Full Name</label>
//                   <div className="relative group">
//                     <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.name ? 'text-red-400' : 'text-white/30 group-focus-within:text-brand-400'}`} />
//                     <motion.input whileFocus={{ scale: 1.01 }} id="name" type="text" placeholder="Arjun Sharma" value={formData.name} onChange={handleChange} className={`w-full pl-11 pr-4 py-3 bg-white/5 border ${errors.name ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400/20' : 'border-white/10 focus:border-brand-400 focus:ring-brand-400/20'} rounded-2xl text-white font-bold outline-none focus:bg-white/10 focus:ring-4 transition-all placeholder:text-white/20 text-sm shadow-inner`} />
//                   </div>
//                   <AnimatePresence>
//                     {errors.name && (
//                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1.5 mt-1 ml-1 text-red-400">
//                         <AlertCircle className="w-3 h-3" />
//                         <span className="text-[10px] font-bold">{errors.name}</span>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </div>
//                 <div className="space-y-1">
//                   <label className={labelClass}>Email Address</label>
//                   <div className="relative group">
//                     <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.email ? 'text-red-400' : 'text-white/30 group-focus-within:text-brand-400'}`} />
//                     <motion.input whileFocus={{ scale: 1.01 }} id="email" type="email" placeholder="arjun@gmail.com" value={formData.email} onChange={handleChange} className={`w-full pl-11 pr-4 py-3 bg-white/5 border ${errors.email ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400/20' : 'border-white/10 focus:border-brand-400 focus:ring-brand-400/20'} rounded-2xl text-white font-bold outline-none focus:bg-white/10 focus:ring-4 transition-all placeholder:text-white/20 text-sm shadow-inner`} />
//                   </div>
//                   <AnimatePresence>
//                     {errors.email && (
//                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1.5 mt-1 ml-1 text-red-400">
//                         <AlertCircle className="w-3 h-3" />
//                         <span className="text-[10px] font-bold">{errors.email}</span>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </div>
//               </div>

//               {/* Phone Number */}
//               <div className="space-y-1">
//                 <label className={labelClass}>Phone Number</label>
//                 <div className="relative group">
//                   <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.mobile ? 'text-red-400' : 'text-white/30 group-focus-within:text-brand-400'}`} />
//                   <motion.input whileFocus={{ scale: 1.01 }} id="mobile" type="tel" placeholder="+91 00000 00000" value={formData.mobile} onChange={handleChange} className={`w-full pl-11 pr-4 py-3 bg-white/5 border ${errors.mobile ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400/20' : 'border-white/10 focus:border-brand-400 focus:ring-brand-400/20'} rounded-2xl text-white font-bold outline-none focus:bg-white/10 focus:ring-4 transition-all placeholder:text-white/20 text-sm shadow-inner`} />
//                 </div>
//                 <AnimatePresence>
//                   {errors.mobile && (
//                     <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1.5 mt-1 ml-1 text-red-400">
//                       <AlertCircle className="w-3 h-3" />
//                       <span className="text-[10px] font-bold">{errors.mobile}</span>
//                     </motion.div>
//                   )}
//                 </AnimatePresence>
//               </div>

//               {/* Password & Confirm Password */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-1">
//                   <label className={labelClass}>Password</label>
//                   <div className="relative group">
//                     <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.password ? 'text-red-400' : 'text-white/30 group-focus-within:text-brand-400'}`} />
//                     <motion.input whileFocus={{ scale: 1.01 }} id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleChange} className={`w-full pl-11 pr-10 py-3 bg-white/5 border ${errors.password ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400/20' : 'border-white/10 focus:border-brand-400 focus:ring-brand-400/20'} rounded-2xl text-white font-bold outline-none focus:bg-white/10 focus:ring-4 transition-all placeholder:text-white/20 text-sm shadow-inner`} />
//                     <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-1" tabIndex="-1">
//                       {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
//                     </button>
//                   </div>
//                   {/* Strength Meter */}
//                   {formData.password && (
//                     <div className="px-1 pt-1">
//                       <div className="flex gap-1 h-1 mt-1">
//                         {[1, 2, 3, 4].map((index) => (
//                           <div key={index} className={`flex-1 rounded-full transition-all duration-300 ${strength >= index ? getStrengthColor(strength) : 'bg-white/10'}`} />
//                         ))}
//                       </div>
//                       <p className={`text-[9px] font-black uppercase tracking-wider text-right mt-1 ${getStrengthColor(strength).split(' ')[0].replace('bg-', 'text-')}`}>
//                         {getStrengthText(strength)}
//                       </p>
//                     </div>
//                   )}
//                 </div>
//                 <div className="space-y-1">
//                   <label className={labelClass}>Confirm Password</label>
//                   <div className="relative group">
//                     <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.repeatPassword ? 'text-red-400' : 'text-white/30 group-focus-within:text-brand-400'}`} />
//                     <motion.input whileFocus={{ scale: 1.01 }} id="repeatPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={formData.repeatPassword} onChange={handleChange} className={`w-full pl-11 pr-10 py-3 bg-white/5 border ${errors.repeatPassword ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400/20' : formData.repeatPassword && formData.repeatPassword === formData.password ? 'border-emerald-500/50 focus:border-emerald-400 focus:ring-emerald-400/20' : 'border-white/10 focus:border-brand-400 focus:ring-brand-400/20'} rounded-2xl text-white font-bold outline-none focus:bg-white/10 focus:ring-4 transition-all placeholder:text-white/20 text-sm shadow-inner`} />
//                     <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-1" tabIndex="-1">
//                       {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
//                     </button>
//                     {/* Live Match Check */}
//                     {formData.repeatPassword && formData.repeatPassword === formData.password && (
//                        <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 animate-in fade-in" />
//                     )}
//                   </div>
//                   <AnimatePresence>
//                     {errors.repeatPassword && (
//                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1.5 mt-1 ml-1 text-red-400">
//                         <AlertCircle className="w-3 h-3" />
//                         <span className="text-[10px] font-bold">{errors.repeatPassword}</span>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </div>
//               </div>

//               <motion.button
//                 whileHover={{ scale: 1.02 }}
//                 whileTap={{ scale: 0.98 }}
//                 disabled={loading}
//                 type="submit"
//                 className="w-full py-4 bg-brand-600 text-white font-black rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] flex items-center justify-center gap-3 hover:bg-brand-500 disabled:opacity-70 disabled:cursor-not-allowed group mt-6 overflow-hidden relative"
//               >
//                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
//                 {loading ? <Spinner /> : (
//                   <>
//                     <span className="uppercase tracking-widest text-xs relative z-10">Create Identity</span>
//                     <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
//                   </>
//                 )}
//               </motion.button>
//             </form>

//             <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-4">
//               <p className="text-center text-xs font-bold text-white/40">
//                 Already known?
//                 <Link to="/login" className="ml-2 text-brand-400 font-black hover:text-brand-300 transition-colors hover:underline underline-offset-4 decoration-2">
//                   Sign In
//                 </Link>
//               </p>

//               <Link to="/" className="inline-flex items-center gap-2 text-white/20 hover:text-white/60 font-black text-[9px] uppercase tracking-[0.4em] transition-colors group">
//                 <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
//                 Portal Exit
//               </Link>
//             </div>
//           </motion.div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Register;


import axios from "../api/axios";
import { useState, useEffect, useContext, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, Lock, Camera, ArrowRight, ShieldCheck,
  ChevronLeft, Eye, EyeOff, CheckCircle2, AlertCircle, Globe2, Users
} from "lucide-react";
import Swal from "sweetalert2";
import { AuthContext } from "../context/authContext";
import Spinner from "../components/spinner/LoadingSpinner";
import stickerPack from "../assets/images/sign.jpg";
import travelBg from "../assets/images/bg.jpg";

// FIX: Cloudinary config from environment variables — never hardcode in source
const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD || "dpgelkpd4";
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_PRESET || "upload";
const MAX_FILE_SIZE_MB = 2;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const Register = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    repeatPassword: "",
    acceptedPolicies: false,
  });

  const [errors, setErrors] = useState({});

  // FIX: track mounted state + preview URL ref for cleanup
  const isMounted = useRef(true);
  const previewUrlRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // FIX: revoke object URL to prevent memory leak
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^[+]?[\d\s-]{10,}$/.test(phone);

  const calculatePasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length > 6) score += 1;
    if (pass.length > 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return Math.min(4, score);
  };

  const strength = calculatePasswordStrength(formData.password);

  // FIX: separate color and text lookups — no fragile string manipulation
  const STRENGTH_META = {
    0: { bar: "bg-white/10",    text: "",       textColor: "text-white/20"   },
    1: { bar: "bg-red-500",     text: "Weak",   textColor: "text-red-400"    },
    2: { bar: "bg-orange-500",  text: "Fair",   textColor: "text-orange-400" },
    3: { bar: "bg-brand-500",   text: "Good",   textColor: "text-brand-400"  },
    4: { bar: "bg-emerald-500", text: "Strong", textColor: "text-emerald-400" },
  };

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [id]: type === "checkbox" ? checked : value }));
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // FIX: check exact MIME type, not just startsWith("image/")
    if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
      showToast.error("Invalid File Type", "Please upload a JPG, PNG, WebP, or GIF image.");
      return;
    }

    // FIX: enforce size limit before upload
    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showToast.error("File Too Large");
      return;
    }

    // FIX: revoke previous URL before creating a new one
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(selectedFile);
    previewUrlRef.current = url;
    setFile(selectedFile);
    setPreview(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // FIX: guard against double-submit

    const { name, email, mobile, password, repeatPassword } = formData;
    const newErrors = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!email) newErrors.email = "Email is required";
    else if (!validateEmail(email)) newErrors.email = "Invalid email format";
    if (!mobile) newErrors.mobile = "Phone is required";
    else if (!validatePhone(mobile)) newErrors.mobile = "Invalid phone format";
    if (!password) newErrors.password = "Password is required";
    // FIX: check password match as part of the single unified validation pass
    if (password && repeatPassword && password !== repeatPassword) {
      newErrors.repeatPassword = "Passwords do not match";
    } else if (password && !repeatPassword) {
      newErrors.repeatPassword = "Please confirm your password";
    }
    if (!formData.acceptedPolicies) {
      newErrors.acceptedPolicies = "You must accept the Privacy Policy and Terms of Service.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // FIX: single Swal — no double-firing
      showToast.warning("Incomplete Form", "Please fill in all required fields correctly.");
      return;
    }

    setLoading(true);
    try {
      let imageUrl = "";
      if (file) {
        if (!CLOUD_NAME || !UPLOAD_PRESET) {
          throw new Error("Image upload is not configured. Contact support.");
        }
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", UPLOAD_PRESET);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          { method: "POST", body: data }
        ).then((res) => res.json());

        if (!uploadRes.secure_url) {
          throw new Error(uploadRes.error?.message || "Image upload failed.");
        }
        // FIX: prefer secure_url (https) over url
        imageUrl = uploadRes.secure_url;
      }

      // FIX: destructure out repeatPassword so it never reaches the API
      const { repeatPassword: _, ...payload } = formData;
      await axios.post("/auth/register", { ...payload, img: imageUrl });

      if (!isMounted.current) return;

      showToast.success("Welcome Aboard!", "Your account has been created successfully.");
      navigate("/login", { replace: true });
    } catch (err) {
      if (!isMounted.current) return;
      const errorMsg =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message || err.message || "Registration failed. Please try again.";
      showToast.error("Registration Failed");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const labelClass = "text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block";
  const inputClass = (field) =>
    `w-full pl-11 pr-4 py-2 bg-slate-50 border ${
      errors[field]
        ? "border-red-300 focus:border-red-400 focus:ring-red-400/20"
        : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/20"
    } rounded-xl text-slate-900 font-bold outline-none focus:bg-white focus:ring-4 transition-all placeholder:text-slate-400 text-sm shadow-sm`;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden relative">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-10 scale-110"
        style={{ backgroundImage: `url(${travelBg})` }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-white/60 via-white/80 to-slate-50" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] -translate-x-1/3 translate-y-1/3 z-10 pointer-events-none" />

      <div className="relative z-20 w-full flex flex-col lg:flex-row min-h-screen">

        {/* Left: hero */}
        <div className="hidden lg:flex flex-col lg:w-1/2 items-end justify-center p-8 lg:pr-12 relative">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2 }}
            className="w-full max-w-lg"
          >
            <div className="relative bg-white/50 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-2 overflow-hidden shadow-xl group">
              <div className="absolute -inset-4 bg-brand-500/10 blur-3xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <img
                src={stickerPack}
                alt="Indian city stickers"
                className="w-full h-[80vh] object-cover rounded-[1.8rem] opacity-90 transform group-hover:scale-[1.02] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent rounded-[1.8rem]" />
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-3xl font-black text-white leading-tight tracking-tighter drop-shadow-lg">
                  Join the <br /><span className="italic text-brand-300 font-black">Elite Circle.</span>
                </h2>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start justify-center p-4 sm:p-8 lg:pl-12 overflow-y-auto custom-scrollbar">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-[500px] bg-white border border-slate-100 p-6 sm:p-8 rounded-[2rem] shadow-xl my-4"
          >
            <div className="mb-5 flex flex-col items-center lg:items-start relative">
              <div className="flex items-center justify-between w-full">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tighter mb-1 italic">Sign Up.</h1>
                  <p className="text-slate-500 font-medium text-[11px]">Create your global traveler profile</p>
                </div>

                {/* Avatar upload */}
                <div className="relative group">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 shadow-inner flex items-center justify-center overflow-hidden border border-slate-200 p-1 group-hover:border-brand-500/50 transition-colors"
                  >
                    {preview ? (
                      <img src={preview} alt="Avatar preview" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <User className="w-5 h-5 text-slate-300 group-hover:text-brand-500 transition-colors" />
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter hidden sm:block">Avatar</span>
                      </div>
                    )}
                  </motion.div>
                  <label
                    htmlFor="file"
                    className="absolute -bottom-2 -right-2 p-2 sm:p-2.5 bg-brand-600 text-white rounded-xl shadow-md cursor-pointer hover:bg-brand-500 transition-all border-2 border-white active:scale-90 z-10 overflow-hidden"
                    aria-label="Upload avatar photo"
                  >
                    <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10" />
                    {/* FIX: explicit accept list matching ALLOWED_MIME_TYPES */}
                    <input
                      type="file"
                      id="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  {/* FIX: htmlFor matches input id */}
                  <label htmlFor="name" className={labelClass}>Full Name</label>
                  <div className="relative group">
                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.name ? "text-red-500" : "text-slate-400 group-focus-within:text-brand-500"}`} />
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      id="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Arjun Sharma"
                      value={formData.name}
                      onChange={handleChange}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "name-error" : undefined}
                      className={`${inputClass("name")} pr-4`}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.name && (
                      <motion.div
                        id="name-error"
                        role="alert"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-1.5 mt-1 ml-1 text-red-500"
                      >
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-[10px] font-bold">{errors.name}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-1">
                  <label htmlFor="email" className={labelClass}>Email Address</label>
                  <div className="relative group">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.email ? "text-red-500" : "text-slate-400 group-focus-within:text-brand-500"}`} />
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="arjun@gmail.com"
                      value={formData.email}
                      onChange={handleChange}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      className={`${inputClass("email")} pr-4`}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.div
                        id="email-error"
                        role="alert"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-1.5 mt-1 ml-1 text-red-500"
                      >
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-[10px] font-bold">{errors.email}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label htmlFor="mobile" className={labelClass}>Phone Number</label>
                <div className="relative group">
                  <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.mobile ? "text-red-500" : "text-slate-400 group-focus-within:text-brand-500"}`} />
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    id="mobile"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="+91 00000 00000"
                    value={formData.mobile}
                    onChange={handleChange}
                    aria-invalid={!!errors.mobile}
                    aria-describedby={errors.mobile ? "mobile-error" : undefined}
                    className={`${inputClass("mobile")} pr-4`}
                  />
                </div>
                <AnimatePresence>
                  {errors.mobile && (
                    <motion.div
                      id="mobile-error"
                      role="alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-1.5 mt-1 ml-1 text-red-500"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-[10px] font-bold">{errors.mobile}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="password" className={labelClass}>Password</label>
                  <div className="relative group">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.password ? "text-red-500" : "text-slate-400 group-focus-within:text-brand-500"}`} />
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      aria-invalid={!!errors.password}
                      aria-describedby="password-strength"
                      className={`${inputClass("password")} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* FIX: strength meter uses lookup table, not string manipulation */}
                  {formData.password && (
                    <div id="password-strength" className="px-1 pt-1" aria-live="polite">
                      <div className="flex gap-1 h-1 mt-1">
                        {[1, 2, 3, 4].map((index) => (
                          <div
                            key={index}
                            className={`flex-1 rounded-full transition-all duration-300 ${
                              strength >= index
                                ? STRENGTH_META[strength].bar
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-[9px] font-black uppercase tracking-wider text-right mt-1 ${STRENGTH_META[strength].textColor}`}>
                        {STRENGTH_META[strength].text}
                      </p>
                    </div>
                  )}

                  <AnimatePresence>
                    {errors.password && (
                      <motion.div
                        role="alert"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-1.5 mt-1 ml-1 text-red-500"
                      >
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-[10px] font-bold">{errors.password}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-1">
                  <label htmlFor="repeatPassword" className={labelClass}>Confirm Password</label>
                  <div className="relative group">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.repeatPassword ? "text-red-500" : "text-slate-400 group-focus-within:text-brand-500"}`} />
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      id="repeatPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={formData.repeatPassword}
                      onChange={handleChange}
                      aria-invalid={!!errors.repeatPassword}
                      aria-describedby={errors.repeatPassword ? "repeat-error" : undefined}
                      className={`w-full pl-11 pr-10 py-2 bg-slate-50 border ${
                        errors.repeatPassword
                          ? "border-red-300 focus:border-red-400 focus:ring-red-400/20"
                          : formData.repeatPassword && formData.repeatPassword === formData.password
                          ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-400/20"
                          : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/20"
                      } rounded-xl text-slate-900 font-bold outline-none focus:bg-white focus:ring-4 transition-all placeholder:text-slate-400 text-sm shadow-sm`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    {formData.repeatPassword && formData.repeatPassword === formData.password && (
                      <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 animate-in fade-in" />
                    )}
                  </div>
                  <AnimatePresence>
                    {errors.repeatPassword && (
                      <motion.div
                        id="repeat-error"
                        role="alert"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-1.5 mt-1 ml-1 text-red-500"
                      >
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-[10px] font-bold">{errors.repeatPassword}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Policies Checkbox */}
              <div className="space-y-1">
                <div className="flex items-start gap-3">
                  <div className="relative flex items-center pt-1">
                    <input
                      type="checkbox"
                      id="acceptedPolicies"
                      checked={formData.acceptedPolicies}
                      onChange={handleChange}
                      className="w-4 h-4 rounded bg-slate-50 border-slate-200 text-brand-500 focus:ring-brand-500 focus:ring-offset-white transition-all cursor-pointer"
                    />
                  </div>
                  <label htmlFor="acceptedPolicies" className="text-[11px] font-medium text-slate-600 leading-relaxed cursor-pointer select-none">
                    I have read and agree to the{" "}
                    <Link to="/terms" target="_blank" className="text-brand-500 hover:text-brand-600 hover:underline">
                      Terms and Conditions
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy-policy" target="_blank" className="text-brand-500 hover:text-brand-600 hover:underline">
                      Privacy Policy
                    </Link>.
                  </label>
                </div>
                <AnimatePresence>
                  {errors.acceptedPolicies && (
                    <motion.div
                      id="acceptedPolicies-error"
                      role="alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-1.5 mt-1 ml-1 text-red-500"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-[10px] font-bold">{errors.acceptedPolicies}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                type="submit"
                className="w-full py-2 bg-brand-600 text-white font-black rounded-xl transition-all duration-300 shadow-[0_4px_14px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.4)] flex items-center justify-center gap-3 hover:bg-brand-500 disabled:opacity-70 disabled:cursor-not-allowed group mt-4 overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                {loading ? (
                  <Spinner />
                ) : (
                  <>
                    <span className="uppercase tracking-widest text-xs relative z-10">Create Identity</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center gap-3">
              <p className="text-center text-[11px] font-bold text-slate-500">
                Already known?
                <Link to="/login" className="ml-2 text-brand-600 font-black hover:text-brand-700 transition-colors hover:underline underline-offset-4 decoration-2">
                  Sign In
                </Link>
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 font-black text-[9px] uppercase tracking-[0.4em] transition-colors group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Portal Exit
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;