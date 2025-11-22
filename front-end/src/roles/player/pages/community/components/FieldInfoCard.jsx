import { List, Building2, MapPin } from "lucide-react";

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

     // No field data
     if (!field || (!field.FieldName && !field.Location && !field.Address)) {
          return null;
     }

     return (
          <div className="mt-3 mb-3 p-3 bg-teal-50 rounded-xl border border-teal-200 relative">
               <div className="space-y-2 pr-6">
                    {/* Field Name */}
                    {field.FieldName && (
                         <div className="flex items-center gap-2">
                              <List className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <span className="text-teal-800 font-semibold text-sm">{field.FieldName}</span>
                         </div>
                    )}

                    {/* Complex Name */}
                    {field.ComplexName && (
                         <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <span className="text-teal-700 text-sm">{field.ComplexName}</span>
                         </div>
                    )}

                    {/* Address with Google Maps link */}
                    {(field.Location || field.Address) && (
                         <div className="flex items-center gap-2 flex-wrap">
                              <MapPin className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                              <span className="text-teal-700 text-sm">{field.Location || field.Address}</span>
                              <span
                                   className="text-gray-500 text-xs hover:underline font-semibold hover:text-blue-600 cursor-pointer"
                                   onClick={() => {
                                        const address = encodeURIComponent(field.Location || field.Address);
                                        window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
                                   }}
                              >
                                   Xem trên Google Maps
                              </span>
                         </div>
                    )}
               </div>
          </div>
     );
};

export default FieldInfoCard;

