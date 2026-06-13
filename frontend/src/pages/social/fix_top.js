const fs = require('fs');
const file = 'c:/Users/sandh/OneDrive/Desktop/my pro/frontend/src/pages/social/TravelBuddyDetails.jsx';
let content = fs.readFileSync(file, 'utf8');

// The file is currently messed up from lines 1 to 50ish. Let's find the first occurrence of "  const [loading, setLoading] = useState(true);"
// and replace everything before it with the correct imports and component definition.
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
  fs.writeFileSync(file, content);
  console.log('Fixed top of file successfully.');
} else {
  console.log('Marker not found.');
}
