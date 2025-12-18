import React, { useState, useEffect } from 'react';
import { Search, MapPin, Building2, ExternalLink, List } from "lucide-react";
import { Modal, Button, Input } from '../../../../../shared/components/ui';
import { fetchFields } from '../../../../../shared/index';

const FieldSelectionModal = ({
     isOpen,
     onClose,
     onFieldSelect,
     selectedField = null
}) => {
     const [searchField, setSearchField] = useState("");
     const [fields, setFields] = useState([]);
     const [loading, setLoading] = useState(false);

     // Fetch fields from service
     useEffect(() => {
          const loadFields = async () => {
               setLoading(true);
               try {
                    const fieldsData = await fetchFields();
                    setFields(fieldsData);
               } catch (error) {
                    console.error('Error loading fields:', error);
               } finally {
                    setLoading(false);
               }
          };

          if (isOpen) {
               loadFields();
          }
     }, [isOpen]);

     // Filter fields based on search, area and type
     const filteredFields = fields.filter(field => {
          const matchesSearch = field.name.toLowerCase().includes(searchField.toLowerCase()) ||
               field.complexName.toLowerCase().includes(searchField.toLowerCase()) ||
               field.address.toLowerCase().includes(searchField.toLowerCase());
          return matchesSearch;
     });

     /**
      * Xử lý khi chọn sân - Nút "Chọn" bên cạnh mỗi sân
      * @param {Object} field - Thông tin sân được chọn
      */
     const handleFieldSelect = (field) => {
          onFieldSelect(field);
          onClose();
          setSearchField("");
     };

     /**
      * Xử lý khi đóng modal - Nút X hoặc click outside
      */
     const handleClose = () => {
          onClose();
          setSearchField("");
     };

     return (
          <Modal
               isOpen={isOpen}
               onClose={handleClose}
               title="Chọn sân bóng"
               className="max-w-2xl max-h-[100vh] px-2 bg-white rounded-2xl"
          >
               <div className="space-y-2">
                    {/* Search Input */}
                    <div className="relative">
                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                         <Input
                              placeholder="Tìm kiếm sân bóng..."
                              value={searchField}
                              onChange={(e) => setSearchField(e.target.value)}
                              className="pl-10 rounded-xl"
                         />
                    </div>



                    {/* Results Info */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                         <span>
                              Tổng số sân
                         </span>
                         <span className="text-teal-600 font-medium">
                              {filteredFields.length} sân
                         </span>
                    </div>

                    {/* Fields List */}
                    <div className="max-h-96 overflow-y-auto scrollbar-hidden space-y-2">
                         {loading ? (
                              <div className="text-center py-8 text-gray-500">
                                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-2"></div>
                                   <p>Đang tải danh sách sân...</p>
                              </div>
                         ) : (
                              <>
                                   {filteredFields.map((field) => (
                                        <div
                                             key={field.fieldId}
                                             className="p-3 border border-teal-200 rounded-2xl hover:scale-95 hover:border-teal-300 hover:bg-teal-50 cursor-pointer transition-all duration-300"
                                             onClick={() => handleFieldSelect(field)}
                                        >
                                             <div className="flex items-start justify-between">
                                                  <div className="flex-1">
                                                       <div className="flex items-center gap-2 mb-1">
                                                            <List className="w-4 h-4 text-teal-500" />
                                                            <h3 className="font-semibold text-teal-900">{field.name}</h3>
                                                       </div>
                                                       <p className="text-sm text-teal-600 mb-1 flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-500" /> {field.complexName} <span className="text-xs text-gray-500">•</span> {field.typeName}</p>
                                                       <p className="text-xs text-teal-600 mb-1 flex items-center gap-2"><MapPin className="w-4 h-4 text-yellow-500" /> {field.address} <span className="text-[10px] flex items-center gap-1 text-gray-500 hover:underline font-semibold hover:text-blue-600 cursor-pointer" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${field.address}`, '_blank')} ><ExternalLink className="w-4 h-4 text-blue-500" /> Xem trên Google Maps</span></p>
                                                       <div className="flex items-center gap-4 text-xs text-teal-600">
                                                            <span>{field.typeName}</span>
                                                            <span>•</span>
                                                            <span>{field.priceForSelectedSlot ? `${(field.priceForSelectedSlot / 1000).toFixed(0)}k/h` : 'Liên hệ'}</span>
                                                            <span>•</span>
                                                            <span>⭐ {field.rating.toFixed(1)}</span>
                                                       </div>
                                                  </div>
                                                  <Button
                                                       variant="outline"
                                                       size="sm"
                                                       className="ml-2 bg-teal-700 rounded-2xl hover:bg-teal-800 text-white"
                                                       onClick={() => handleFieldSelect(field)}
                                                  >
                                                       Chọn
                                                  </Button>
                                             </div>
                                        </div>
                                   ))}


                              </>
                         )}
                    </div>
               </div>
          </Modal>
     );
};

export default FieldSelectionModal;