import React, { useState, useEffect } from 'react';
import { getAvatarUrl } from '../../utils/avatar';

const Avatar = ({ pic, img, profilePic, avatar, user, name, className }) => {
  const [error, setError] = useState(false);
  
  // Extract final name and image URL from props or nested user object
  const finalName = name || user?.name || user?.username || "User";
  const finalPic = pic || profilePic || avatar || img || user?.profilePic || user?.pic || user?.avatar || user?.img || user?.profilePicture || user?.userPic;
  const finalImg = img || user?.img || user?.pic || user?.avatar || user?.profilePic;

  useEffect(() => {
    setError(false);
  }, [finalPic, finalImg]);

  const avatarUrl = getAvatarUrl(user || finalPic, finalImg, finalName);
  const isUiAvatar = !avatarUrl || avatarUrl.includes('ui-avatars.com') || avatarUrl.includes('no-image-icon');
  const showFallback = error || isUiAvatar;
  
  const getInitials = (str) => {
    if (!str || typeof str !== 'string') return "EX";
    const parts = str.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  // Generate a consistent, harmonious gradient based on the user's name
  const getGradient = (str = "") => {
    const gradients = [
      "from-violet-500 to-purple-600",
      "from-purple-500 to-indigo-600",
      "from-fuchsia-500 to-pink-600",
      "from-indigo-500 to-blue-600",
      "from-rose-500 to-red-600",
      "from-emerald-500 to-teal-600"
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  if (showFallback) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br ${getGradient(finalName)} text-white font-black select-none shrink-0 uppercase shadow-xs ${className}`}>
        {getInitials(finalName)}
      </div>
    );
  }

  return (
    <img 
      loading="lazy"
      src={avatarUrl} 
      alt={finalName} 
      className={className} 
      onError={() => setError(true)}
    />
  );
};

export default Avatar;
