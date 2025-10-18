import React from 'react';
import { X } from 'lucide-react';
import { Button } from './button';
import { cn } from '../../lib/utils';

const Modal = ({
     isOpen,
     onClose,
     title,
     children,
     className,
     showCloseButton = true,
     closeOnOverlayClick = true
}) => {
     if (!isOpen) return null;

     const handleOverlayClick = (e) => {
          if (closeOnOverlayClick && e.target === e.currentTarget) {
               onClose();
          }
     };

     return (
          <div
               className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
               onClick={handleOverlayClick}
          >
               <div
                    className={cn(
                         "bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden",
                         className
                    )}
               >
                    {/* Header */}
                    {title && (
                         <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                              {showCloseButton && (
                                   <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onClose}
                                        className="p-2"
                                   >
                                        <X className="w-5 h-5 text-gray-500" />
                                   </Button>
                              )}
                         </div>
                    )}

                    {/* Content */}
                    <div className="p-4 overflow-y-auto">
                         {children}
                    </div>
               </div>
          </div>
     );
};

export { Modal };
