import React from "react";
import GlobalCreateStoryModal from "../../story/CreateStoryModal";

export const CreateStoryModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  return (
    <GlobalCreateStoryModal
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};

export default CreateStoryModal;
