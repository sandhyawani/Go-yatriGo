export const toHttps = (url) => {
  if (!url || typeof url !== "string") return url;
  const trimmed = url.trim();

  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  if (/^\/\//.test(trimmed)) {
    return "https:" + trimmed;
  }

  // Preserve localhost / 127.0.0.1 for local development
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(trimmed)) {
    return trimmed;
  }

  if (/^http:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }

  if (/http:\/\/[^/]*cloudinary\.com/i.test(trimmed)) {
    return trimmed.replace(/http:\/\/([^/]*cloudinary\.com)/gi, "https://$1");
  }

  return trimmed;
};

export const sanitizeCloudinaryUrls = (data) => {
  if (!data) return data;
  if (typeof data === "string") {
    return toHttps(data);
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeCloudinaryUrls(item));
  }
  if (typeof data === "object") {
    if (data instanceof Date || data instanceof RegExp) {
      return data;
    }
    const copy = Array.isArray(data) ? [...data] : { ...data };
    for (const key of Object.keys(copy)) {
      const val = copy[key];
      if (typeof val === "string") {
        if (/cloudinary\.com|images\.unsplash\.com|ui-avatars\.com/i.test(val) || /^http:\/\//i.test(val)) {
          copy[key] = toHttps(val);
        }
      } else if (typeof val === "object" && val !== null) {
        copy[key] = sanitizeCloudinaryUrls(val);
      }
    }
    return copy;
  }
  return data;
};

export default toHttps;
