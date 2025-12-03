import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/index";
import { UserPlus, X, ArrowRight, Gift, Star, CheckCircle } from "lucide-react";

// Inline DemoTopBanner component
function DemoTopBanner({ isVisible, onClose, onSignUp }) {
     const [isDismissed, setIsDismissed] = useState(false);
     const navigate = useNavigate();

     if (!isVisible || isDismissed) return null;

     const handleSignUp = () => {
          navigate("/register");
          if (onSignUp) onSignUp();
     };

     const handleDismiss = () => {
          setIsDismissed(true);
          if (onClose) onClose();
     };

     return (
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-3 px-4 relative overflow-hidden">
               <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12"></div>
               </div>

               <div className="relative z-10 max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                         <div className="flex items-center space-x-2">
                              <Gift className="w-5 h-5 text-yellow-300" />
                              <span className="font-bold text-sm">🎉 Hoàn toàn miễn phí!</span>
                         </div>
                         <div className="hidden sm:block">
                              <span className="text-sm">
                                   Tạo tài khoản miễn phí để lưu trữ dữ liệu và truy cập đầy đủ tính năng
                              </span>
                         </div>
                         <div className="sm:hidden">
                              <span className="text-sm font-medium">Tạo tài khoản miễn phí</span>
                         </div>
                    </div>

                    <div className="flex items-center  space-x-3">
                         <Button
                              onClick={handleSignUp}
                              className="bg-white text-blue-600 hover:text-blue-800 hover:bg-gray-100 font-semibold px-4 py-1.5 text-sm rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                         >
                              <UserPlus className="w-4 h-4 mr-1" />
                              Tạo tài khoản
                              <ArrowRight className="w-4 h-4 ml-1" />
                         </Button>

                         <Button
                              onClick={handleDismiss}
                              variant="ghost"
                              size="sm"
                              className="text-white hover:bg-white/20 hover:text-white p-2 rounded-2xl"
                         >
                              <X className="w-4 h-4" />
                         </Button>
                    </div>
               </div>
          </div>
     );
}

// Inline DemoAccountPrompt component
function DemoAccountPrompt({ isVisible, onClose, onSignUp }) {
     const [isMinimized, setIsMinimized] = useState(false);
     const navigate = useNavigate();

     if (!isVisible) return null;

     const handleSignUp = () => {
          navigate("/register");
          if (onSignUp) onSignUp();
     };

     if (isMinimized) {
          return (
               <div className="fixed bottom-4 right-4 z-50">
                    <div className="py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer rounded-2xl"
                         onClick={() => setIsMinimized(false)}>
                         <div className="flex items-center space-x-2">
                              <UserPlus className="w-5 h-5" />
                              <span className="text-sm font-medium">Tạo tài khoản miễn phí</span>
                              <ArrowRight className="w-4 h-4" />
                         </div>
                    </div>
               </div>
          );
     }

     return (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm ">
               <div className="p-5 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 shadow-xl rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                   <UserPlus className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                   <h3 className="font-bold text-gray-900">Tạo tài khoản miễn phí</h3>
                                   <p className="text-xs text-gray-600">Để lưu trữ dữ liệu và truy cập đầy đủ tính năng</p>
                              </div>
                         </div>
                         <div className="flex items-center space-x-1">
                              <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => setIsMinimized(true)}
                                   className="text-gray-400 hover:text-gray-600 p-1"
                              >
                                   <X className="w-4 h-4" />
                              </Button>
                         </div>
                    </div>

                    <div className="space-y-2 mb-4">
                         <div className="flex items-center space-x-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-gray-700">Lưu trữ dữ liệu sân bóng vĩnh viễn</span>
                         </div>
                         <div className="flex items-center space-x-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-gray-700">Tạo và quản lý khuyến mãi</span>
                         </div>
                         <div className="flex items-center space-x-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-gray-700">Báo cáo doanh thu chi tiết</span>
                         </div>
                         <div className="flex items-center space-x-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-gray-700">Đồng bộ dữ liệu trên mọi thiết bị</span>
                         </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-xl p-3 mb-4">
                         <div className="flex items-center space-x-2">
                              <Gift className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">
                                   Hoàn toàn miễn phí - Không giới hạn thời gian!
                              </span>
                         </div>
                    </div>

                    <div className="space-y-2">
                         <Button
                              onClick={handleSignUp}
                              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
                         >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Tạo tài khoản ngay
                              <ArrowRight className="w-4 h-4 ml-2" />
                         </Button>

                         <div className="text-center">
                              <span className="text-xs text-gray-500">
                                   Đã có tài khoản?
                                   <button
                                        onClick={() => navigate("/login")}
                                        className="text-blue-600 hover:text-blue-700 font-medium ml-1"
                                   >
                                        Đăng nhập
                                   </button>
                              </span>
                         </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                         <div className="flex items-center justify-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                   <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              ))}
                              <span className="text-xs text-gray-600 ml-2">4.9/5 từ 1000+ chủ sân</span>
                         </div>
                    </div>
               </div>
          </div>
     );
}

export default function DemoAccountPromotionManager({ isDemo = false }) {
     const [showTopBanner, setShowTopBanner] = useState(isDemo);
     const [showAccountPrompt] = useState(isDemo);

     const handleSignUp = (source) => {
          // Track sign up attempts for analytics
     };

     const handleCloseTopBanner = () => {
          setShowTopBanner(false);
     };

     if (!isDemo) return null;

     return (
          <>
               {/* Top Banner - Always visible */}
               <DemoTopBanner
                    isVisible={showTopBanner}
                    onClose={handleCloseTopBanner}
                    onSignUp={() => handleSignUp('top-banner')}
               />

               {/* Account Prompt - Floating card */}
               <DemoAccountPrompt
                    isVisible={showAccountPrompt}
                    onSignUp={() => handleSignUp('account-prompt')}
               />
          </>
     );
}
