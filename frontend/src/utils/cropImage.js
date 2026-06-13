// export const createImage = (url) =>
//   new Promise((resolve, reject) => {
//     const image = new Image();
//     image.addEventListener("load", () => resolve(image));
//     image.addEventListener("error", (error) => reject(error));
//     image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues on CodeSandbox
//     image.src = url;
//   });

// export function getRadianAngle(degreeValue) {
//   return (degreeValue * Math.PI) / 180;
// }

// /**
//  * Returns the new bounding area of a rotated rectangle.
//  */
// export function rotateSize(width, height, rotation) {
//   const rotRad = getRadianAngle(rotation);

//   return {
//     width:
//       Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
//     height:
//       Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
//   };
// }

// /**
//  * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
//  */
// export default async function getCroppedImg(
//   imageSrc,
//   pixelCrop,
//   rotation = 0,
//   flip = { horizontal: false, vertical: false }
// ) {
//   const image = await createImage(imageSrc);
//   const canvas = document.createElement("canvas");
//   const ctx = canvas.getContext("2d");

//   if (!ctx) {
//     return null;
//   }

//   const rotRad = getRadianAngle(rotation);

//   // calculate bounding box of the rotated image
//   const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
//     image.width,
//     image.height,
//     rotation
//   );

//   // set canvas size to match the bounding box
//   canvas.width = bBoxWidth;
//   canvas.height = bBoxHeight;

//   // translate canvas context to a central location to allow rotating and flipping around the center
//   ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
//   ctx.rotate(rotRad);
//   ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
//   ctx.translate(-image.width / 2, -image.height / 2);

//   // draw rotated image
//   ctx.drawImage(image, 0, 0);

//   const croppedCanvas = document.createElement("canvas");
//   const croppedCtx = croppedCanvas.getContext("2d");

//   if (!croppedCtx) {
//     return null;
//   }

//   // Set the size of the cropped canvas
//   croppedCanvas.width = pixelCrop.width;
//   croppedCanvas.height = pixelCrop.height;

//   // Draw the cropped image onto the new canvas
//   croppedCtx.drawImage(
//     canvas,
//     pixelCrop.x,
//     pixelCrop.y,
//     pixelCrop.width,
//     pixelCrop.height,
//     0,
//     0,
//     pixelCrop.width,
//     pixelCrop.height
//   );

//   // As Base64 string
//   return croppedCanvas.toDataURL("image/jpeg", 0.95);
// }



// ─── Types (JSDoc) ────────────────────────────────────────────────────────────

/**
 * @typedef {{ x: number, y: number, width: number, height: number }} PixelCrop
 * @typedef {{ horizontal: boolean, vertical: boolean }} FlipOptions
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Loads an image from a URL and returns an HTMLImageElement.
 * Sets `crossOrigin` BEFORE `src` to avoid tainting the canvas on CORS origins.
 * Cleans up event listeners after resolution to prevent memory leaks.
 *
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
export const createImage = (url) => {
  // Fix #5 — reject immediately on empty/missing URL instead of loading the page
  if (!url || typeof url !== 'string') {
    return Promise.reject(new Error('createImage: url must be a non-empty string'));
  }

  return new Promise((resolve, reject) => {
    const image = new Image();

    const onLoad  = () => { cleanup(); resolve(image); };
    const onError = (err) => { cleanup(); reject(new Error(`createImage: failed to load "${url}" — ${err.message ?? err}`)); };

    // Fix #1 — store references so we can remove them after use
    const cleanup = () => {
      image.removeEventListener('load',  onLoad);
      image.removeEventListener('error', onError);
    };

    image.addEventListener('load',  onLoad);
    image.addEventListener('error', onError);

    // Fix #2 — crossOrigin MUST be set before src, otherwise the browser may
    // send the first request without CORS headers, tainting the canvas.
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
};

/**
 * Converts degrees to radians.
 * @param {number} degrees
 * @returns {number}
 */
export const getRadianAngle = (degrees) => (degrees * Math.PI) / 180;

/**
 * Returns the bounding box dimensions of a rectangle after rotation.
 * @param {number} width
 * @param {number} height
 * @param {number} rotation - degrees
 * @returns {{ width: number, height: number }}
 */
export const rotateSize = (width, height, rotation) => {
  const rotRad = getRadianAngle(rotation);
  return {
    width:  Math.abs(Math.cos(rotRad) * width)  + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width)  + Math.abs(Math.cos(rotRad) * height),
  };
};

/**
 * Releases the GPU-backed bitmap of a canvas as early as possible.
 * Browsers don't GC canvas memory until the object is collected;
 * zeroing width/height signals the compositor to free it immediately.
 * @param {HTMLCanvasElement} canvas
 */
const releaseCanvas = (canvas) => {
  canvas.width  = 0;
  canvas.height = 0;
};

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Crops, rotates, and flips an image, returning it as a Base64 data URL.
 *
 * Adapted from https://github.com/DominicTobias/react-image-crop
 *
 * @param {string}      imageSrc   — URL or data URL of the source image
 * @param {PixelCrop}   pixelCrop  — crop rectangle in pixels
 * @param {number}      [rotation=0]   — clockwise rotation in degrees
 * @param {FlipOptions} [flip]         — horizontal/vertical flip flags
 * @param {'image/jpeg'|'image/png'|'image/webp'} [mimeType='image/jpeg']
 *   — output format. Use 'image/png' to preserve transparency.
 * @param {number} [quality=0.95] — compression quality (jpeg/webp only, 0–1)
 * @returns {Promise<string>} Base64 data URL of the cropped image
 * @throws {Error} if the image can't be loaded, canvas context is unavailable,
 *                 or the crop area is invalid
 */
export default async function getCroppedImg(
  imageSrc,
  pixelCrop,
  rotation  = 0,
  flip      = { horizontal: false, vertical: false },
  mimeType  = 'image/jpeg',
  quality   = 0.95
) {
  // Fix #4 — validate crop dimensions up front
  if (
    !pixelCrop ||
    pixelCrop.width  <= 0 ||
    pixelCrop.height <= 0
  ) {
    throw new Error('getCroppedImg: pixelCrop must have positive width and height');
  }

  const image = await createImage(imageSrc); // Fix #5 — createImage now validates url

  // Fix #8 — compute rotRad once; pass to rotateSize to avoid recomputing
  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // ── Full-image rotated canvas ─────────────────────────────────────────────

  const canvas = document.createElement('canvas');
  canvas.width  = bBoxWidth;
  canvas.height = bBoxHeight;

  const ctx = canvas.getContext('2d');
  // Fix #3 — throw instead of returning null so callers don't silently swallow failures
  if (!ctx) throw new Error('getCroppedImg: could not get 2D context for rotation canvas');

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(
    flip.horizontal ? -1 : 1,
    flip.vertical   ? -1 : 1
  );
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  // ── Cropped canvas ────────────────────────────────────────────────────────

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width  = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  const croppedCtx = croppedCanvas.getContext('2d');
  // Fix #3 — throw, not return null
  if (!croppedCtx) throw new Error('getCroppedImg: could not get 2D context for crop canvas');

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Fix #6 — release GPU-backed bitmap of the intermediate canvas immediately
  releaseCanvas(canvas);

  // Fix #7 — caller controls output format; PNG preserves transparency
  const dataUrl = croppedCanvas.toDataURL(mimeType, quality);

  // Fix #6 — release cropped canvas bitmap too
  releaseCanvas(croppedCanvas);

  return dataUrl;
}