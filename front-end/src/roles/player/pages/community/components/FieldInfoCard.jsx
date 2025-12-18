import { List, Building2, MapPin, ExternalLink } from "lucide-react";

const FieldInfoCard = ({ field, fieldId }) => {
     if (!field && (!fieldId || fieldId === 0)) {
          return null;
     }

     // Loading state
     if (!field && fieldId && fieldId !== 0) {
          return (
               <div className="mt-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                         <MapPin className="w-5 h-5 text-gray-400 animate-pulse" />
                         <span className="text-gray-400 text-sm">Đang tải thông tin sân...</span>
                    </div>
               </div>
          );
     }

     // lấy dữ liệu sân
     const fieldName = field?.name || field?.Name || field?.fieldName || field?.FieldName;
     const complexName = field?.complexName || field?.ComplexName;
     const address = field?.address || field?.Address;
     if (!fieldName && !complexName && !address) {
          return null;
     }

     return (
          <div className="my-3 p-3 bg-teal-50 rounded-xl border border-teal-200 relative">
               <div className="space-y-1">
                    {/* Field Name */}
                    {fieldName && (
                         <div className="flex items-center gap-2">
                              <List className="w-4 h-4 text-teal-600 flex-shrink-0" />
                              <span className="text-teal-900 font-semibold">{fieldName}</span>
                         </div>
                    )}

                    {/* Complex Name */}
                    {complexName && (
                         <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <p className="text-teal-600 text-sm">{complexName}</p>
                         </div>
                    )}

                    {/* Address with Google Maps link */}
                    {address && (
                         <div className="flex items-center gap-2 flex-wrap">
                              <MapPin className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                              <p className="text-teal-600 text-sm">{address}</p>
                              <span
                                   className="text-xs flex items-center gap-1 text-gray-500 hover:underline font-semibold hover:text-blue-600 cursor-pointer"
                                   onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
                                   }}
                              >
                                   <ExternalLink className="w-4 h-4 text-blue-500" />
                                   Xem trên Google Maps
                              </span>
                         </div>
                    )}
               </div>
          </div>
     );
};

export default FieldInfoCard;
