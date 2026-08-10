import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

export interface DailyChallengeSubmitModalProps {
  isOpen: boolean;
  unansweredCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

export const DailyChallengeSubmitModal: React.FC<DailyChallengeSubmitModalProps> = ({
  isOpen,
  unansweredCount,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Daily Challenge?"
      description={`You have ${unansweredCount} unanswered question${unansweredCount !== 1 ? 's' : ''}. Unanswered questions will count as incorrect.`}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} id="dc-modal-keep-answering">
            Keep Answering
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm} id="dc-modal-submit-anyway">
            Submit Anyway
          </Button>
        </>
      }
    >
      <p className="text-slate-300 text-sm leading-relaxed">
        You still have{' '}
        <strong className="text-white">
          {unansweredCount} question{unansweredCount !== 1 ? 's' : ''}
        </strong>{' '}
        left unanswered. If you submit now, those questions will be marked as incorrect.
      </p>
      <p className="text-slate-400 text-xs mt-3">
        You can go back and complete them, or submit your current answers.
      </p>
    </Modal>
  );
};
