import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export const ErrorDisplay = ({
     type = 'error',
     title,
     message,
     onClose,
     className = ''
}) => {
     const getIconAndColors = () => {
          switch (type) {
               case 'success':
                    return {
                         icon: CheckCircle,
                         bgColor: 'bg-green-50',
                         borderColor: 'border-green-200',
                         textColor: 'text-green-700',
                         iconColor: 'text-green-500',
                         titleColor: 'text-green-800'
                    };
               case 'warning':
                    return {
                         icon: AlertCircle,
                         bgColor: 'bg-yellow-50',
                         borderColor: 'border-yellow-200',
                         textColor: 'text-yellow-700',
                         iconColor: 'text-yellow-500',
                         titleColor: 'text-yellow-800'
                    };
               case 'info':
                    return {
                         icon: Info,
                         bgColor: 'bg-blue-50',
                         borderColor: 'border-blue-200',
                         textColor: 'text-blue-700',
                         iconColor: 'text-blue-500',
                         titleColor: 'text-blue-800'
                    };
               default: // error
                    return {
                         icon: AlertCircle,
                         bgColor: 'bg-red-50',
                         borderColor: 'border-red-200',
                         textColor: 'text-red-700',
                         iconColor: 'text-red-500',
                         titleColor: 'text-red-800'
                    };
          }
     };

     const { icon: Icon, bgColor, borderColor, textColor, iconColor, titleColor } = getIconAndColors();

     return (
          <div className={`mb-4 rounded-lg border ${borderColor} ${bgColor} ${textColor} px-4 py-3 text-sm animate-in slide-in-from-top-2 duration-300 ${className}`}>
               <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${iconColor} flex-shrink-0`} />
                    <div className="flex-1">
                         {title && (
                              <p className={`font-medium ${titleColor}`}>{title}</p>
                         )}
                         <p className={`${textColor} ${title ? 'mt-1' : ''}`}>{message}</p>
                    </div>
                    {onClose && (
                         <button
                              onClick={onClose}
                              className={`${textColor} hover:opacity-70 transition-opacity`}
                         >
                              <X className="w-4 h-4" />
                         </button>
                    )}
               </div>
          </div>
     );
};

export default ErrorDisplay;
