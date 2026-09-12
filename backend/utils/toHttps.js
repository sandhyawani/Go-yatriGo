const toHttps = (url) => {
  if (!url || typeof url !== "string") return url;
  const trimmed = url.trim();

  if (/^\/\//.test(trimmed)) {
    return "https:" + trimmed;
  }

  if (/^http:\/\/[^/]*cloudinary\.com/i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }

  if (/http:\/\/[^/]*cloudinary\.com/i.test(trimmed)) {
    return trimmed.replace(/http:\/\/([^/]*cloudinary\.com)/gi, "https://$1");
  }

  if (/^http:\/\/(images\.unsplash\.com|ui-avatars\.com)/i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }

  return trimmed;
};

const normalizeUserUrls = (user) => {
  if (!user) return user;
  const target = (typeof user.toObject === "function") ? user.toObject() : { ...user };

  if (target.avatar) target.avatar = toHttps(target.avatar);
  if (target.pic) target.pic = toHttps(target.pic);
  if (target.img) target.img = toHttps(target.img);
  if (target.profilePic) target.profilePic = toHttps(target.profilePic);
  if (target.profilePicture) target.profilePicture = toHttps(target.profilePicture);
  if (target.userPic) target.userPic = toHttps(target.userPic);
  if (target.coverImage) target.coverImage = toHttps(target.coverImage);
  if (target.coverPic) target.coverPic = toHttps(target.coverPic);
  if (target.govId) target.govId = toHttps(target.govId);

  if (Array.isArray(target.followers)) {
    target.followers = target.followers.map((f) =>
      f && typeof f === "object" ? normalizeUserUrls(f) : f
    );
  }
  if (Array.isArray(target.following)) {
    target.following = target.following.map((f) =>
      f && typeof f === "object" ? normalizeUserUrls(f) : f
    );
  }

  return target;
};

const normalizeJourneyUrls = (journey) => {
  if (!journey) return journey;
  const target = (typeof journey.toObject === "function") ? journey.toObject() : { ...journey };

  if (target.coverImage) target.coverImage = toHttps(target.coverImage);
  if (target.image) target.image = toHttps(target.image);

  if (target.creator && typeof target.creator === "object") {
    target.creator = normalizeUserUrls(target.creator);
  }

  if (Array.isArray(target.members)) {
    target.members = target.members.map((m) => {
      const memObj = m && typeof m.toObject === "function" ? m.toObject() : { ...m };
      if (memObj.user && typeof memObj.user === "object") {
        memObj.user = normalizeUserUrls(memObj.user);
      }
      return memObj;
    });
  }

  if (Array.isArray(target.timeline)) {
    target.timeline = target.timeline.map((item) => {
      const itemObj = item && typeof item.toObject === "function" ? item.toObject() : { ...item };
      if (itemObj.photoUrl) itemObj.photoUrl = toHttps(itemObj.photoUrl);
      if (itemObj.mediaUrl) itemObj.mediaUrl = toHttps(itemObj.mediaUrl);
      return itemObj;
    });
  }

  return target;
};

const normalizePostUrls = (post) => {
  if (!post) return post;
  const target = (typeof post.toObject === "function") ? post.toObject() : { ...post };

  if (target.image) target.image = toHttps(target.image);
  if (target.mediaUrl) target.mediaUrl = toHttps(target.mediaUrl);
  if (target.mediaUrls && Array.isArray(target.mediaUrls)) {
    target.mediaUrls = target.mediaUrls.map((u) => toHttps(u));
  }
  if (target.userPic) target.userPic = toHttps(target.userPic);

  if (target.userId && typeof target.userId === "object") {
    target.userId = normalizeUserUrls(target.userId);
  }

  if (Array.isArray(target.comments)) {
    target.comments = target.comments.map((c) => {
      const cObj = c && typeof c.toObject === "function" ? c.toObject() : { ...c };
      if (cObj.userPic) cObj.userPic = toHttps(cObj.userPic);
      if (cObj.userId && typeof cObj.userId === "object") {
        cObj.userId = normalizeUserUrls(cObj.userId);
      }
      return cObj;
    });
  }

  return target;
};

const sanitizeCloudinaryUrls = (data) => {
  if (!data) return data;
  if (typeof data === "string") {
    return toHttps(data);
  }
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      data[i] = sanitizeCloudinaryUrls(data[i]);
    }
    return data;
  }
  if (typeof data === "object") {
    if (
      data instanceof Date ||
      data instanceof RegExp ||
      (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(data)) ||
      data._bsontype === "ObjectID" ||
      data._bsontype === "ObjectId"
    ) {
      return data;
    }

    const target = (typeof data.toObject === "function") ? data.toObject() : data;
    for (const key of Object.keys(target)) {
      const val = target[key];
      if (typeof val === "string") {
        if (/cloudinary\.com|images\.unsplash\.com|ui-avatars\.com/i.test(val) || /^http:\/\//i.test(val)) {
          target[key] = toHttps(val);
        }
      } else if (typeof val === "object" && val !== null) {
        target[key] = sanitizeCloudinaryUrls(val);
      }
    }
    return target;
  }
  return data;
};

module.exports = {
  toHttps,
  normalizeUserUrls,
  normalizeJourneyUrls,
  normalizePostUrls,
  sanitizeCloudinaryUrls
};
