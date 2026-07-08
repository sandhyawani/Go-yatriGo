export const getAvatarUrl = (...args) => {
  const checkUrl = (url) => {
    return url && typeof url === "string" && url.trim() !== "" && !url.includes("no-image-icon") && !url.includes("undefined") && !url.includes("null") && (url.startsWith("http") || url.startsWith("/") || url.startsWith("data:image"));
  };

  let foundName = null;
  const candidates = [];

  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === "object") {
      if (arg.img) candidates.push(arg.img);
      if (arg.pic) candidates.push(arg.pic);
      if (arg.avatar) candidates.push(arg.avatar);
      if (arg.profilePic) candidates.push(arg.profilePic);
      if (arg.profilePicture) candidates.push(arg.profilePicture);
      if (arg.userPic) candidates.push(arg.userPic);
      if (arg.userImg) candidates.push(arg.userImg);
      if (arg.name || arg.username || arg.fullname) {
        foundName = foundName || arg.name || arg.username || arg.fullname;
      }
    } else if (typeof arg === "string") {
      if (arg.startsWith("http") || arg.startsWith("/") || arg.startsWith("data:image")) {
        candidates.push(arg);
      } else if (!foundName && arg.trim() !== "" && !arg.includes("no-image-icon") && !arg.includes("undefined") && !arg.includes("null")) {
        foundName = arg;
      }
    }
  }

  for (const url of candidates) {
    if (checkUrl(url)) {
      return url;
    }
  }

  const displayName = foundName || "Explorer";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=7c3aed&color=fff&bold=true`;
};

