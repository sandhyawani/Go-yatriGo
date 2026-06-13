export const getAvatarUrl = (pic, img, name) => {
  if (img && typeof img === "string" && img.trim() !== "" && !img.includes("no-image-icon") && !img.includes("undefined") && !img.includes("null")) {
    return img;
  }
  if (pic && typeof pic === "string" && pic.trim() !== "" && !pic.includes("no-image-icon") && !pic.includes("undefined") && !pic.includes("null")) {
    return pic;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Explorer")}&background=6C4DF6&color=fff&bold=true`;
};
