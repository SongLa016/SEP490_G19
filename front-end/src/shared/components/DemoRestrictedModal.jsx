import React from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "./ui/index";
import { Database, UserPlus, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

export default function DemoRestrictedModal({ isOpen, onClose, featureName }) {
     const navigate = useNavigate();
     
     const handleCreateAccount = () => {
          navigate("/register");
     };

     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               title={`Tính năng ${featureName} cần tài khoản để lưu trữ dữ liệu`}
               size="md"
          >
               <div className="text-center py-6">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                         <Database className="w-8 h-8 text-blue-600" />
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                         Lưu trữ dữ liệu an toàn
                    </h3>

                    <p className="text-gray-600 mb-6">
                         Tính năng <strong>{featureName}</strong> cần tài khoản để lưu trữ dữ liệu của bạn.
                         Tạo tài khoản miễn phí để sử dụng đầy đủ các tính năng và đồng bộ dữ liệu.
                    </p>

                    <div className="space-y-3">
                         <Button
                              onClick={handleCreateAccount}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                         >
                              <UserPlus className="w-4 h-4" />
                              Tạo tài khoản miễn phí
                              <ArrowRight className="w-4 h-4" />
                         </Button>

                         <Button
                              variant="outline"
                              onClick={onClose}
                              className="w-full"
                         >
                              Đóng
                         </Button>
                    </div>

                    <p className="text-xs text-gray-500 mt-4">
                         🎁 Hoàn toàn miễn phí - Không giới hạn thời gian sử dụng
                    </p>
               </div>
          </Modal>
     );
}
