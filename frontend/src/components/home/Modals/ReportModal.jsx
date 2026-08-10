import React from "react";
import GlobalReportModal from "../../modals/ReportModal";

export const ReportModal = ({
  isOpen,
  onClose,
  targetId,
  targetType,
  reportedUserId,
}) => {
  if (!isOpen) return null;

  return (
    <GlobalReportModal
      isOpen={isOpen}
      onClose={onClose}
      targetId={targetId}
      targetType={targetType}
      reportedUserId={reportedUserId}
    />
  );
};

export default ReportModal;
