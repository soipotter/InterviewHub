import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

export interface UnansweredModalProps {
  isOpen: boolean;
  onClose: () => void;
  unansweredCount: number;
  totalQuestions: number;
  onConfirmSubmit: () => void;
}

export const UnansweredModal: React.FC<UnansweredModalProps> = ({
  isOpen,
  onClose,
  unansweredCount,
  totalQuestions,
  onConfirmSubmit,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Unanswered Questions Remaining"
      description={`You have ${unansweredCount} unanswered ${
        unansweredCount === 1 ? 'question' : 'questions'
      } out of ${totalQuestions}.`}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="outline" size="sm" onClick={onClose}>
            Review Questions
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              onClose();
              onConfirmSubmit();
            }}
          >
            Submit Anyway
          </Button>
        </div>
      }
    >
      <div className="py-2 text-xs text-slate-300 leading-relaxed">
        Submitting now will mark unanswered questions as incorrect. Would you like to go back and
        complete your answers, or submit the practice quiz now?
      </div>
    </Modal>
  );
};
