import React, { useState } from 'react';
import { getAvatarUrl } from '../../utils/avatar';

const Avatar = ({ pic, img, name, className }) => {
  const [error, setError] = useState(false);
  
  // getAvatarUrl might return the ui-avatars URL if no pic/img,
  // but if we want to use our custom fallback, we should check if we actually have an image.
  // Actually, getAvatarUrl handles checking valid pic/img. Let's use it, but if it returns ui-avatars we know it's a fallback.
  const avatarUrl = getAvatarUrl(pic, img, name);
  const isUiAvatar = avatarUrl && avatarUrl.includes('ui-avatars.com');
  const showFallback = error || isUiAvatar;
  
  const getInitials = (name) => {
    if (!name) return "EX";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (showFallback) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold ${className}`}>
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img 
      loading="lazy"
      src={avatarUrl} 
      alt={name || "User"} 
      className={className} 
      onError={() => setError(true)}
    />
  );
};

export default Avatar;
