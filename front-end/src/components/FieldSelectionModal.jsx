import React, { useState, useEffect } from 'react';
import { Search, MapPin, Building2, ExternalLink, List } from "lucide-react";
import { Modal } from './ui/modal';
import { Button, Input } from './ui/index';
import { fetchFields } from '../services/fields';

const FieldSelectionModal = ({
     isOpen,
     onClose,
     onFieldSelect,
     selectedField = null
}) => {
     const [searchField, setSearchField] = useState("");
     const [fields, setFields] = useState([]);
     const [loading, setLoading] = useState(false);
     const [activeFieldTab, setActiveFieldTab] = useState("all");
     const [activeTypeTab, setActiveTypeTab] = useState("all");

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

          // Filter by area
          let matchesArea = true;
          if (activeFieldTab !== "all") {
               const address = field.address.toLowerCase();
               if (activeFieldTab === "hoan-kiem" && !address.includes("hoàn kiếm")) matchesArea = false;
               if (activeFieldTab === "ba-dinh" && !address.includes("ba đình")) matchesArea = false;
               if (activeFieldTab === "dong-da" && !address.includes("đống đa")) matchesArea = false;
               if (activeFieldTab === "cau-giay" && !address.includes("cầu giấy")) matchesArea = false;
               if (activeFieldTab === "hai-ba-trung" && !address.includes("hai bà trưng")) matchesArea = false;
          }

          // Filter by type
          let matchesType = true;
          if (activeTypeTab !== "all") {
               if (activeTypeTab === "5vs5" && field.typeName !== "5vs5") matchesType = false;
               if (activeTypeTab === "7vs7" && field.typeName !== "7vs7") matchesType = false;
               if (activeTypeTab === "11vs11" && field.typeName !== "11vs11") matchesType = false;
          }

          return matchesSearch && matchesArea && matchesType;
     });

     // Count fields by area for tab badges
     const getFieldCountByArea = (area) => {
          if (area === "all") return fields.length;

          const address = area.toLowerCase();
          return fields.filter(field => {
               const fieldAddress = field.address.toLowerCase();
               if (address === "hoan-kiem" && fieldAddress.includes("hoàn kiếm")) return true;
               if (address === "ba-dinh" && fieldAddress.includes("ba đình")) return true;
               if (address === "dong-da" && fieldAddress.includes("đống đa")) return true;
               if (address === "cau-giay" && fieldAddress.includes("cầu giấy")) return true;
               if (address === "hai-ba-trung" && fieldAddress.includes("hai bà trưng")) return true;
               return false;
          }).length;
     };

     // Count fields by type for tab badges
     const getFieldCountByType = (type) => {
          if (type === "all") return fields.length;
          return fields.filter(field => field.typeName === type).length;
     };

     const handleFieldSelect = (field) => {
          onFieldSelect(field);
          onClose();
          setSearchField("");
     };

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

                    {/* Area Tabs */}
                    <div className="flex flex-wrap gap-2">
                         <Button
                              onClick={() => setActiveFieldTab("all")}
                              size="sm"
                              className={`px-3 py-0.5  text-xs rounded-full transition-colors flex items-center gap-1 ${activeFieldTab === "all"
                                   ? "bg-teal-500 text-white"
                                   : "bg-gray-100 text-teal-600 hover:bg-gray-200 hover:text-teal-600"
                                   }`}
                         >
                              Tất cả
                              <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${activeFieldTab === "all" ? "bg-teal-600" : "bg-gray-300"
                                   }`}>
                                   {getFieldCountByArea("all")}
                              </span>
                         </Button>
                         <Button
                              onClick={() => setActiveFieldTab("hoan-kiem")}
                              size="sm"
                              className={`px-3 py-0.5 text-xs rounded-full transition-colors flex items-center gap-1 ${activeFieldTab === "hoan-kiem"
                                   ? "bg-teal-500 text-white"
                                   : "bg-gray-100 text-teal-600 hover:bg-gray-200 hover:text-teal-600"
                                   }`}
                         >
                              Hoàn Kiếm
                              <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${activeFieldTab === "hoan-kiem" ? "bg-teal-600" : "bg-gray-300"
                                   }`}>
                                   {getFieldCountByArea("hoan-kiem")}
                              </span>
                         </Button>
                         <Button
                              onClick={() => setActiveFieldTab("ba-dinh")}
                              size="sm"
                              className={`px-3 py-0.5 text-xs rounded-full transition-colors flex items-center gap-1 ${activeFieldTab === "ba-dinh"
                                   ? "bg-teal-500 text-white"
                                   : "bg-gray-100 text-teal-600 hover:bg-gray-200 hover:text-teal-600"
                                   }`}
                         >
                              Ba Đình
                              <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${activeFieldTab === "ba-dinh" ? "bg-teal-600" : "bg-gray-300"
                                   }`}>
                                   {getFieldCountByArea("ba-dinh")}
                              </span>
                         </Button>
                         <Button
                              onClick={() => setActiveFieldTab("dong-da")}
                              size="sm"
                              className={`px-3 py-0.5 text-xs rounded-full transition-colors flex items-center gap-1 ${activeFieldTab === "dong-da"
                                   ? "bg-teal-500 text-white"
                                   : "bg-gray-100 text-teal-600 hover:bg-gray-200 hover:text-teal-600"
                                   }`}
                         >
                              Đống Đa
                              <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${activeFieldTab === "dong-da" ? "bg-teal-600" : "bg-gray-300"
                                   }`}>
                                   {getFieldCountByArea("dong-da")}
                              </span>
                         </Button>
                         <Button
                              onClick={() => setActiveFieldTab("cau-giay")}
                              size="sm"
                              className={`px-3 py-0.5 text-xs rounded-full transition-colors flex items-center gap-1 ${activeFieldTab === "cau-giay"
                                   ? "bg-teal-500 text-white"
                                   : "bg-gray-100 text-teal-600 hover:bg-gray-200"
                                   }`}
                         >
                              Cầu Giấy
                              <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${activeFieldTab === "cau-giay" ? "bg-teal-600" : "bg-gray-300"
                                   }`}>
                                   {getFieldCountByArea("cau-giay")}
                              </span>
                         </Button>
                         <Button
                              onClick={() => setActiveFieldTab("hai-ba-trung")}
                              size="sm"
                              className={`px-3 py-0.5 text-xs rounded-full transition-colors flex items-center gap-1 ${activeFieldTab === "hai-ba-trung"
                                   ? "bg-teal-500 text-white"
                                   : "bg-gray-100 text-teal-600 hover:bg-gray-200 hover:text-teal-600"
                                   }`}
                         >
                              Hai Bà Trưng
                              <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${activeFieldTab === "hai-ba-trung" ? "bg-teal-600" : "bg-gray-300"
                                   }`}>
                                   {getFieldCountByArea("hai-ba-trung")}
                              </span>
                         </Button>
                    </div>

                    {/* Field Type Tabs */}
                    <div className="flex flex-wrap gap-2">
                         <Button
                              onClick={() => setActiveTypeTab("all")}
                              size="sm"
                              className={`px-3 py-0.5 text-xs rounded-full transition-colors flex items-center gap-1 ${activeTypeTab === "all"
                                   ? "bg-blue-500 text-white"
                                   : "bg-gray-100 text-blue-600 hover:bg-gray-200 hover:text-blue-600"
                                   }`}
                         >
                              Tất cả loại
                              <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${activeTypeTab === "all" ? "bg-blue-600" : "bg-gray-300"
                                   }`}>
                                   {getFieldCountByType("all")}
                              </span>
                         </Button>
                         <Button
                              onClick={() => setActiveTypeTab("5vs5")}
                              size="sm"
                              className={`px-3 py-0.5 text-xs rounded-full transition-colors flex items-center gap-1 ${activeTypeTab === "5vs5"
                                   ? "bg-blue-500 text-white"
                                   : "bg-gray-100 text-blue-600 hover:bg-gray-200 hover:text-blue-600"
                                   }`}
                         >
                              Sân 5vs5
                              <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${activeTypeTab === "5vs5" ? "bg-blue-600" : "bg-gray-300"
                                   }`}>
                                   {getFieldCountByType("5vs5")}
                              </span>
                         </Button>
                         <Button
                              onClick={() => setActiveTypeTab("7vs7")}
                              size="sm"
                              className={`px-3 py-0.5 text-xs rounded-full transition-colors flex items-center gap-1 ${activeTypeTab === "7vs7"
                                   ? "bg-blue-500 text-white"
                                   : "bg-gray-100 text-blue-600 hover:bg-gray-200 hover:text-blue-600"
                                   }`}
                         >
                              Sân 7vs7
                              <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${activeTypeTab === "7vs7" ? "bg-blue-600" : "bg-gray-300"
                                   }`}>
                                   {getFieldCountByType("7vs7")}
                              </span>
                         </Button>
                         <Button
                              onClick={() => setActiveTypeTab("11vs11")}
                              size="sm"
                              className={`px-3 py-0.5 text-xs rounded-full transition-colors flex items-center gap-1 ${activeTypeTab === "11vs11"
                                   ? "bg-blue-500 text-white"
                                   : "bg-gray-100 text-blue-600 hover:bg-gray-200 hover:text-blue-600    "
                                   }`}
                         >
                              Sân 11vs11
                              <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${activeTypeTab === "11vs11" ? "bg-blue-600" : "bg-gray-300"
                                   }`}>
                                   {getFieldCountByType("11vs11")}
                              </span>
                         </Button>
                    </div>

                    {/* Results Info */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                         <span>
                              {activeFieldTab === "all" ? "Tất cả sân" :
                                   activeFieldTab === "hoan-kiem" ? "Sân tại Hoàn Kiếm" :
                                        activeFieldTab === "ba-dinh" ? "Sân tại Ba Đình" :
                                             activeFieldTab === "dong-da" ? "Sân tại Đống Đa" :
                                                  activeFieldTab === "cau-giay" ? "Sân tại Cầu Giấy" :
                                                       activeFieldTab === "hai-ba-trung" ? "Sân tại Hai Bà Trưng" : "Sân"}
                              {activeTypeTab !== "all" && ` - ${activeTypeTab}`}
                         </span>
                         <span className="text-teal-600 font-medium">
                              {filteredFields.length} sân
                         </span>
                    </div>

                    {/* Fields List */}
                    <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-teal-500 scrollbar-track-transparent space-y-2">
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
                                             className="p-3 border border-teal-200 rounded-lg hover:scale-95 hover:border-teal-300 hover:bg-teal-50 cursor-pointer transition-all duration-300"
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

                                   {filteredFields.length === 0 && !loading && (
                                        <div className="text-center py-8 text-gray-500">
                                             <MapPin className="w-12 h-12 mx-auto mb-2 text-red-300" />
                                             <p className="text-red-500 font-semibold">
                                                  {activeFieldTab === "all" && activeTypeTab === "all" ? "Không tìm thấy sân bóng nào" :
                                                       `Không có sân ${activeTypeTab !== "all" ? activeTypeTab : ""} ${activeFieldTab !== "all" ? `tại ${activeFieldTab === "hoan-kiem" ? "Hoàn Kiếm" :
                                                            activeFieldTab === "ba-dinh" ? "Ba Đình" :
                                                                 activeFieldTab === "dong-da" ? "Đống Đa" :
                                                                      activeFieldTab === "cau-giay" ? "Cầu Giấy" :
                                                                           activeFieldTab === "hai-ba-trung" ? "Hai Bà Trưng" : "khu vực này"}` : ""}`}
                                             </p>
                                             {searchField && (
                                                  <p className="text-gray-400 text-sm mt-2">
                                                       Thử tìm kiếm với từ khóa khác hoặc chọn tab khác
                                                  </p>
                                             )}
                                        </div>
                                   )}
                              </>
                         )}
                    </div>
               </div>
          </Modal>
     );
};

export default FieldSelectionModal;
