import { notificationService } from "../../services/notificationService";
import { showToast } from "../../utils/showToast";

export const useFriendRequests = (dispatch) => {
  const handleAcceptRequest = async (e, requesterId) => {
    e.stopPropagation();
    try {
      await notificationService.acceptFollowRequest(requesterId);
      dispatch({ type: "REMOVE_FOLLOW_REQUEST", payload: requesterId });
      showToast.success("Follow request accepted");
    } catch (err) {
      showToast.error("Failed to accept request");
    }
  };

  const handleRejectRequest = async (e, requesterId) => {
    e.stopPropagation();
    try {
      await notificationService.rejectFollowRequest(requesterId);
      dispatch({ type: "REMOVE_FOLLOW_REQUEST", payload: requesterId });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptMessage = async (e, roomId, notificationId) => {
    e.stopPropagation();
    try {
      await notificationService.acceptMessageRequest(roomId);
      dispatch({ type: "REMOVE_NOTIFICATION_BY_ID", payload: notificationId });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectMessage = async (e, roomId, notificationId) => {
    e.stopPropagation();
    try {
      await notificationService.rejectMessageRequest(roomId);
      dispatch({ type: "REMOVE_NOTIFICATION_BY_ID", payload: notificationId });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptJoin = async (e, groupId, requestId, notificationId) => {
    e.stopPropagation();
    try {
      await notificationService.manageJoinRequest(groupId, requestId, "Approved");
      dispatch({ type: "REMOVE_NOTIFICATION_BY_ID", payload: notificationId });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectJoin = async (e, groupId, requestId, notificationId) => {
    e.stopPropagation();
    try {
      await notificationService.manageJoinRequest(groupId, requestId, "Rejected");
      dispatch({ type: "REMOVE_NOTIFICATION_BY_ID", payload: notificationId });
    } catch (err) {
      console.error(err);
    }
  };

  return {
    handleAcceptRequest,
    handleRejectRequest,
    handleAcceptMessage,
    handleRejectMessage,
    handleAcceptJoin,
    handleRejectJoin
  };
};
export default useFriendRequests;

