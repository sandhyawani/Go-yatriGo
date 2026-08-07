import React, { useState, useEffect } from 'react';
import { getAvatarUrl } from '../../utils/avatar';

const Avatar = ({ pic, img, profilePic, avatar, user, name, className }) => {
  const [error, setError] = useState(false);


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

  if (showFallback) {
    return (
      <div className={`flex items-center justify-center bg-[#7C3AED] text-white font-semibold select-none shrink-0 uppercase rounded-full border-2 border-white shadow-sm ${className}`}>
        {getInitials(finalName)}
      </div>);

  }

  return (
    <img
    loading="lazy"
    src={avatarUrl}
    alt={finalName}
    className={`rounded-full border-2 border-white shadow-sm object-cover ${className}`}
    onError={() => setError(true)} />);


};

export default Avatar;