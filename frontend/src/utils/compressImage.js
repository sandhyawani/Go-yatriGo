import imageCompression from "browser-image-compression";

/**
 * Compresses an image file before upload.
 * @param {File} file The original file
 * @param {number} maxSizeMB The maximum size in MB (default: 1)
 * @param {number} maxWidthOrHeight The maximum width/height (default: 1200)
 * @returns {Promise<File>} Compressed file, or original if failed or not an image
 */
export const compressImage = async (file, maxSizeMB = 1, maxWidthOrHeight = 1200) => {
  if (!file) return file;

  // Skip if it is not an image file (e.g. video files)
  if (!file.type || !file.type.startsWith("image/")) {
    return file;
  }

  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    // Preserve the original file name and type properties
    return new File([compressedFile], file.name, {
      type: file.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Image compression failed, using original file:", error);
    return file;
  }
};
