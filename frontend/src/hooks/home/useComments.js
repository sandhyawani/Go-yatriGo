import { useState, useCallback } from "react";
import homeService from "../../services/homeService";
import { showToast } from "../../utils/showToast";
import Swal from "sweetalert2";

export const useComments = (setMemories) => {
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [isSubmittingComment, setIsSubmittingComment] = useState({});
  const [commentsLoadingMap, setCommentsLoadingMap] = useState({});

  const handleOpenComments = useCallback(async (postId) => {
    if (activeCommentPost === postId) {
      setActiveCommentPost(null);
      return;
    }
    setActiveCommentPost(postId);
    setCommentsLoadingMap((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await homeService.fetchComments(postId);
      if (res.data.success) {
        setMemories((prev) =>
          prev.map((m) =>
            m._id === postId
              ? { ...m, comments: res.data.comments || res.data.memory?.comments || [] }
              : m
          )
        );
      }
    } catch (err) {
      showToast.error("Failed to load comments");
    } finally {
      setCommentsLoadingMap((prev) => ({ ...prev, [postId]: false }));
    }
  }, [activeCommentPost, setMemories]);

  const handleCommentSubmit = useCallback(async (e, postId) => {
    e.preventDefault();
    if (isSubmittingComment[postId]) return;
    const text = commentText[postId];
    if (!text?.trim()) return;

    setIsSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await homeService.submitComment(postId, text);
      if (res.data.success) {
        setCommentText((prev) => ({ ...prev, [postId]: "" }));
        setMemories((prev) =>
          prev.map((m) => {
            if (m._id !== postId) return m;
            if (res.data.memory?.comments) {
              return {
                ...m,
                comments: res.data.memory.comments,
                commentsCount: res.data.memory.comments.length,
              };
            }
            if (res.data.comment) {
              const currentComments = Array.isArray(m.comments) ? m.comments : [];
              const exists = currentComments.some((c) => c._id === res.data.comment._id);
              if (exists) return m;
              const newComments = [...currentComments, res.data.comment];
              return {
                ...m,
                comments: newComments,
                commentsCount: newComments.length,
              };
            }
            return m;
          })
        );
      }
    } catch (err) {
      showToast.error("Failed to post comment");
    } finally {
      setIsSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  }, [commentText, isSubmittingComment, setMemories]);

  const handleDeleteComment = useCallback(async (postId, commentId) => {
    const { isConfirmed } = await Swal.fire({
      title: "Delete this comment?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
    });

    if (!isConfirmed) return;

    try {
      const res = await homeService.deleteComment(postId, commentId);
      if (res.data.success) {
        showToast.success("Comment deleted");
        setMemories((prev) =>
          prev.map((m) => {
            if (m._id !== postId) return m;
            if (res.data.memory?.comments) {
              return {
                ...m,
                comments: res.data.memory.comments,
                commentsCount: res.data.memory.comments.length,
              };
            }
            const currentComments = Array.isArray(m.comments) ? m.comments : [];
            const newComments = currentComments.filter((c) => c._id !== commentId);
            return {
              ...m,
              comments: newComments,
              commentsCount: newComments.length,
            };
          })
        );
      }
    } catch (err) {
      showToast.error("Failed to delete comment");
    }
  }, [setMemories]);

  return {
    activeCommentPost,
    setActiveCommentPost,
    commentText,
    setCommentText,
    isSubmittingComment,
    setIsSubmittingComment,
    commentsLoadingMap,
    setCommentsLoadingMap,
    handleOpenComments,
    handleCommentSubmit,
    handleDeleteComment,
  };
};

export default useComments;
