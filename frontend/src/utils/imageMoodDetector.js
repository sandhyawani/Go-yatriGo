export const detectImageMood = (imageUrl) => {
  return new Promise((resolve) => {
    const fallback = { mood: "Wanderlust", language: "Global Mix" };

    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (!ctx) {
          resolve(fallback);
          return;
        }

        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(img, 0, 0, 64, 64);

        const imageData = ctx.getImageData(0, 0, 64, 64).data;
        let r = 0,g = 0,b = 0,count = 0;

        for (let i = 0; i < imageData.length; i += 16) {
          r += imageData[i];
          g += imageData[i + 1];
          b += imageData[i + 2];
          count++;
        }

        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;

        const brightness = l;

        if (brightness < 60) {
          resolve({ mood: "Night Explorer", language: "Punjabi Beats" });
          return;
        }

        if (b > r && b > g + 20) {
          resolve({ mood: "Ocean Vibes", language: "English Chill" });
          return;
        }

        if (g > r && g > b) {
          resolve({ mood: "Mountain Echoes", language: "Marathi Vibes" });
          return;
        }

        if (r > 150 && g > 100 && b < 100) {
          if (brightness < 120) {
            resolve({ mood: "Campfire Sessions", language: "Hindi Hits" });
          } else {
            resolve({ mood: "Sunrise Trails", language: "Hindi Hits" });
          }
          return;
        }

        resolve(fallback);
      };

      img.onerror = () => {
        resolve(fallback);
      };

      img.src = imageUrl;
    } catch (error) {
      console.error("Mood detection failed", error);
      resolve(fallback);
    }
  });
};