import React from "react";

export const renderClickableText = (text) => {
  if (!text) return "";

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(/^https?:\/\/[^\s]+$/)) {
      return (
        <a
          key={`${part}-${index}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 hover:underline break-all"
          onClick={(event) => event.stopPropagation()}
        >
          {part}
        </a>
      );
    }

    return part;
  });
};

export const formatLocation = (location) => {
  if (!location) return "";

  const parts = location.split(",").map((part) => part.trim());
  const shortLocation = parts.slice(0, 2).join(", ");

  return shortLocation.length > 30
    ? `${shortLocation.slice(0, 27)}...`
    : shortLocation;
};

export const getTravelTag = (post) => {
  if (post?.postType && post.postType !== "general") {
    const labels = {
      travel_memory: "Travel Memory",
      travel_photo: "Travel Photo",
      travel_video: "Travel Video",
      document: "Document",
      profile_update: "Profile Update",
    };

    return labels[post.postType] || null;
  }

  if (post?.tags?.length) {
    return post.tags[0];
  }

  return null;
};

export const getAllComments = (post) => {
  return Array.isArray(post?.comments) ? post.comments : [];
};

export const getVisibleComments = (post) => {
  return getAllComments(post).filter(
    (comment) =>
      comment &&
      typeof comment === "object" &&
      typeof comment.text === "string" &&
      !comment.hidden &&
      !comment.deleted
  );
};

export const getPreviewComments = (post) => {
  return getVisibleComments(post).slice(-3);
};

export const getTotalCommentCount = (post) => {
  if (post?.commentsCount !== undefined && post?.commentsCount !== null) {
    return post.commentsCount;
  }

  return getAllComments(post).filter(
    (comment) =>
      comment &&
      (typeof comment === "string" ||
        (typeof comment === "object" && !comment.deleted))
  ).length;
};

export const getVisibleCommentCount = (post) => {
  return getVisibleComments(post).length;
};
