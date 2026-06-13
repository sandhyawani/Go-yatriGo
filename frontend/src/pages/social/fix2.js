const fs = require('fs');
const file = 'c:/Users/sandh/OneDrive/Desktop/my pro/frontend/src/pages/social/TravelBuddyDetails.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix top of file
const marker = '  const [loading, setLoading] = useState(true);';
const index = content.indexOf(marker);

if (index !== -1) {
  const correctTop = `import React, { useState, useEffect, useContext } from "react";
import axios from "../../api/axios";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  MapPin, 
  Calendar, 
  ArrowLeft, 
  MessageSquare,
  MoreVertical,
  AlertTriangle, 
  UserCheck,
  UserPlus,
  ShieldCheck,
  Clock,
  Lock,
  Globe,
  Heart,
  Award,
  Star,
  ShieldAlert
} from "lucide-react";
import { showToast } from "../../utils/showToast";
import { AuthContext } from "../../context/authContext";
import { getAvatarUrl } from "../../utils/avatar";
import ReportModal from "../../components/modals/ReportModal";

const TravelBuddyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [trip, setTrip] = useState(null);
  const [reportModal, setReportModal] = useState({ isOpen: false });
  const [requestMessage, setRequestMessage] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showCancelJoinModal, setShowCancelJoinModal] = useState(false);
`;

  content = correctTop + content.substring(index);
}

// 2. Fix syntax error for imgLoaded
const syntaxErrorTarget = `{trip.coverImage ? (
                  {!imgLoaded && !imgError && <div className="absolute inset-0 bg-slate-200 animate-pulse" />}
                <img src={trip.coverImage} alt={\`\${trip.title} group cover photo\`} onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)} className={\`w-full h-full object-cover transition-opacity \${imgLoaded ? 'opacity-100' : 'opacity-0'} \${imgError ? 'hidden' : ''}\`} />
                {imgError && <div className="absolute inset-0 bg-[#EEEDFE] flex items-center justify-center"><MapPin className="w-12 h-12 text-[#AFA9EC]" /></div>}
                ) : (`;

const syntaxErrorFix = `{trip.coverImage ? (
                  <>
                  {!imgLoaded && !imgError && <div className="absolute inset-0 bg-slate-200 animate-pulse" />}
                  <img src={trip.coverImage} alt={\`\${trip.title} group cover photo\`} onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)} className={\`w-full h-full object-cover transition-opacity \${imgLoaded ? 'opacity-100' : 'opacity-0'} \${imgError ? 'hidden' : ''}\`} />
                  {imgError && <div className="absolute inset-0 bg-[#EEEDFE] flex items-center justify-center"><MapPin className="w-12 h-12 text-[#AFA9EC]" /></div>}
                  </>
                ) : (`;

content = content.replace(syntaxErrorTarget, syntaxErrorFix);

fs.writeFileSync(file, content);
console.log('Fixed syntax error and top of file.');
