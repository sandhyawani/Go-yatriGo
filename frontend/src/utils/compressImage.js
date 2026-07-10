import imageCompression from "browser-image-compression";

/**
 * Returns true if the file is any kind of image, including HEIC/HEIF from iOS
 * which may report file.type as "" or "image/heic" / "image/heif".
 */
export const isImageFile = (file) => {
  if (!file) return false;
  if (file.type && file.type.startsWith("image/")) return true;
  // iOS HEIC files often have an empty MIME type — fall back to extension
  const ext = file.name?.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "avif", "bmp", "tiff", "tif", "svg"].includes(ext);
};

/**
 * Compresses an image file before upload.
 * Handles HEIC/HEIF files from iOS (empty or non-standard MIME type).
 * @param {File} file The original file
 * @param {number} maxSizeMB The maximum size in MB (default: 1)
 * @param {number} maxWidthOrHeight The maximum width/height (default: 1200)
 * @returns {Promise<File>} Compressed file, or original if failed or not an image
 */
export const compressImage = async (file, maxSizeMB = 1, maxWidthOrHeight = 1200) => {
  if (!file) return file;

  // Skip if it is not an image file (e.g. video files)
  if (!isImageFile(file)) {
    return file;
  }

  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    // Preserve the original file name; use jpeg as fallback type for HEIC/HEIF
    const outputType = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";
    return new File([compressedFile], file.name, {
      type: outputType,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Image compression failed, using original file:", error);
    return file;
  }
};

