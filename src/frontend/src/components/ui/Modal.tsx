import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal content */
  children: ReactNode;
  /** Optional class name for the modal content */
  className?: string;
}

/**
 * Modal component with backdrop and centered content.
 *
 * @example
 * <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
 *   <Modal.Header>Title</Modal.Header>
 *   <Modal.Body>Content</Modal.Body>
 *   <Modal.Footer>Actions</Modal.Footer>
 * </Modal>
 */
const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ isOpen, onClose, children, className }, ref) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          aria-hidden="true"
        />
        {/* Content */}
        <div
          ref={ref}
          className={cn(
            'relative z-10 w-full min-w-96 max-w-md mx-4 bg-white rounded-lg shadow-xl',
            className
          )}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

/**
 * Modal.Header - Top section with title.
 */
const ModalHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4 border-b border-neutral-200', className)}
        {...props}
      />
    );
  }
);

ModalHeader.displayName = 'ModalHeader';

/**
 * Modal.Body - Main content area.
 */
const ModalBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('px-6 py-4', className)} {...props} />;
  }
);

ModalBody.displayName = 'ModalBody';

/**
 * Modal.Footer - Bottom section for actions.
 */
const ModalFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'px-6 py-4 border-t border-neutral-200 flex items-center gap-3',
          className
        )}
        {...props}
      />
    );
  }
);

ModalFooter.displayName = 'ModalFooter';

// Compound component pattern
const ModalCompound = Object.assign(Modal, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
});

export { ModalCompound as Modal };
