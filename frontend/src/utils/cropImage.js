/**
 * @typedef {{ x: number, y: number, width: number, height: number }} PixelCrop
 * @typedef {{ horizontal: boolean, vertical: boolean }} FlipOptions
 */

export const createImage = (url) => {
  if (!url || typeof url !== "string") {
    return Promise.reject(
      new Error("createImage: url must be a non-empty string"),
    );
  }

  return new Promise((resolve, reject) => {
    const image = new Image();

    const onLoad = () => {
      cleanup();
      resolve(image);
    };
    const onError = (err) => {
      cleanup();
      reject(
        new Error(
          `createImage: failed to load "${url}" — ${err.message ?? err}`,
        ),
      );
    };

    const cleanup = () => {
      image.removeEventListener("load", onLoad);
      image.removeEventListener("error", onError);
    };

    image.addEventListener("load", onLoad);
    image.addEventListener("error", onError);

    // Set this before src or cross-origin images can taint the canvas.
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
};

export const getRadianAngle = (degrees) => (degrees * Math.PI) / 180;

export const rotateSize = (width, height, rotation) => {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};

const releaseCanvas = (canvas) => {
  canvas.width = 0;
  canvas.height = 0;
};

/**
 * Adapted from https://github.com/DominicTobias/react-image-crop
 */
export default async function getCroppedImg(
  imageSrc,
  pixelCrop,
  rotation = 0,
  flip = { horizontal: false, vertical: false },
  mimeType = "image/jpeg",
  quality = 0.95,
) {
  if (!pixelCrop || pixelCrop.width <= 0 || pixelCrop.height <= 0) {
    throw new Error(
      "getCroppedImg: pixelCrop must have positive width and height",
    );
  }

  const image = await createImage(imageSrc);

  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation,
  );

  const canvas = document.createElement("canvas");
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error(
      "getCroppedImg: could not get 2D context for rotation canvas",
    );
  }

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  const croppedCtx = croppedCanvas.getContext("2d");
  if (!croppedCtx) {
    throw new Error("getCroppedImg: could not get 2D context for crop canvas");
  }

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  releaseCanvas(canvas);
  const dataUrl = croppedCanvas.toDataURL(mimeType, quality);
  releaseCanvas(croppedCanvas);

  return dataUrl;
}

