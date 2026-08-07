import imageCompression from "browser-image-compression";

export const isImageFile = (file) => {
  if (!file) return false;
  if (file.type && file.type.startsWith("image/")) return true;
  const ext = file.name?.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "avif", "bmp", "tiff", "tif", "svg"].includes(ext);
};

export const compressImage = async (file, maxSizeMB = 1, maxWidthOrHeight = 1200) => {
  if (!file) return file;

  if (!isImageFile(file)) {
    return file;
  }

  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true
  };

  try {
    const compressedFile = await imageCompression(file, options);
    const outputType = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";
    return new File([compressedFile], file.name, {
      type: outputType,
      lastModified: Date.now()
    });
  } catch (error) {
    console.error("Image compression failed, using original file:", error);
    return file;
  }
};