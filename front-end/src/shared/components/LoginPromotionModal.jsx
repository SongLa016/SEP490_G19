import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Heart, Calendar, Zap, ShieldCheck, Gift } from "lucide-react";
import { Button } from "./ui";
import { useNavigate } from "react-router-dom";

/**
 * LoginPromotionModal - Modal khuyến khích đăng nhập/đăng ký
 * Hiển thị khi user chưa đăng nhập, giới thiệu các tính năng có sẵn khi có tài khoản
 */
export const LoginPromotionModal = ({ user, onClose }) => {
     const navigate = useNavigate();
     const [isVisible, setIsVisible] = useState(false);

     useEffect(() => {
          // Chỉ hiển thị nếu user chưa đăng nhập
          if (!user) {
               // Kiểm tra xem user đã đóng modal trước đó chưa (trong session này)
               const hasClosedModal = sessionStorage.getItem('loginPromotionModalClosed');
               if (!hasClosedModal) {
                    // Delay một chút để trang load xong
                    const timer = setTimeout(() => {
                         setIsVisible(true);
                    }, 1000);
                    return () => clearTimeout(timer);
               }
          }
     }, [user]);

     const handleClose = () => {
          setIsVisible(false);
          // Lưu vào sessionStorage để không hiển thị lại trong session này
          sessionStorage.setItem('loginPromotionModalClosed', 'true');
          if (onClose) onClose();
     };

     const handleLogin = () => {
          handleClose();
          navigate('/auth');
     };

     if (!isVisible || user) return null;

     return (
          <AnimatePresence>
               {isVisible && (
                    <>
                         {/* Backdrop */}
                         <motion.div
                              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onClick={handleClose}
                         />

                         {/* Modal */}
                         <motion.div
                              className="fixed inset-0 z-50 flex items-center justify-center p-4"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onClick={(e) => e.stopPropagation()}
                         >
                              <motion.div
                                   className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden"
                                   initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                   animate={{ scale: 1, opacity: 1, y: 0 }}
                                   exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                   transition={{ type: "spring", duration: 0.5 }}
                              >
                                   {/* Close Button */}
                                   <button
                                        onClick={handleClose}
                                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors z-10"
                                        aria-label="Đóng"
                                   >
                                        <X className="w-5 h-5 text-gray-600" />
                                   </button>

                                   {/* Content */}
                                   <div className="px-10 pt-7 pb-3">
                                        {/* Logo/Title */}
                                        <div className="text-center mb-3">
                                             <motion.div
                                                  className="inline-block mb-4"
                                                  animate={{
                                                       scale: [1, 1.1, 1],
                                                  }}
                                                  transition={{
                                                       duration: 2,
                                                       repeat: Infinity,
                                                       ease: "easeInOut",
                                                  }}
                                             >
                                                  <div className="text-3xl font-extrabold bg-gradient-to-r from-teal-500 via-teal-600 to-teal-700 bg-clip-text text-transparent">
                                                       Tham gia cùng chúng tôi
                                                  </div>
                                             </motion.div>
                                             <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                                  Đăng nhập để trải nghiệm
                                             </h2>
                                             <p className="text-gray-600 text-sm leading-relaxed">
                                                  Trải nghiệm đầy đủ các tính năng miễn phí và tiện lợi khi đặt sân bóng
                                             </p>
                                        </div>

                                        {/* Features Grid */}
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                             <motion.div
                                                  className="bg-teal-50 rounded-xl p-4 border border-teal-100"
                                                  whileHover={{ scale: 1.05 }}
                                                  transition={{ type: "spring", stiffness: 300 }}
                                             >
                                                  <Star className="w-6 h-6 text-teal-600 mb-2" />
                                                  <p className="text-xs font-semibold text-teal-900">Đánh giá & Review</p>
                                                  <p className="text-xs text-teal-700 mt-1">Chia sẻ trải nghiệm</p>
                                             </motion.div>

                                             <motion.div
                                                  className="bg-pink-50 rounded-xl p-4 border border-pink-100"
                                                  whileHover={{ scale: 1.05 }}
                                                  transition={{ type: "spring", stiffness: 300 }}
                                             >
                                                  <Heart className="w-6 h-6 text-pink-600 mb-2" />
                                                  <p className="text-xs font-semibold text-pink-900">Yêu thích</p>
                                                  <p className="text-xs text-pink-700 mt-1">Lưu sân yêu thích</p>
                                             </motion.div>

                                             <motion.div
                                                  className="bg-blue-50 rounded-xl p-4 border border-blue-100"
                                                  whileHover={{ scale: 1.05 }}
                                                  transition={{ type: "spring", stiffness: 300 }}
                                             >
                                                  <Calendar className="w-6 h-6 text-blue-600 mb-2" />
                                                  <p className="text-xs font-semibold text-blue-900">Lịch sử đặt</p>
                                                  <p className="text-xs text-blue-700 mt-1">Quản lý đơn hàng</p>
                                             </motion.div>

                                             <motion.div
                                                  className="bg-yellow-50 rounded-xl p-4 border border-yellow-100"
                                                  whileHover={{ scale: 1.05 }}
                                                  transition={{ type: "spring", stiffness: 300 }}
                                             >
                                                  <Gift className="w-6 h-6 text-yellow-600 mb-2" />
                                                  <p className="text-xs font-semibold text-yellow-900">Thông báo</p>
                                                  <p className="text-xs text-yellow-700 mt-1">Cập nhật mới nhất</p>
                                             </motion.div>
                                        </div>

                                        {/* Benefits List */}
                                        <div className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl p-4 mb-3 border border-teal-200">
                                             <div className="flex items-start gap-3">
                                                  <Zap className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                                                  <div>
                                                       <p className="text-sm font-semibold text-teal-900 mb-1">
                                                            Trải nghiệm khi đăng ký:
                                                       </p>
                                                       <ul className="text-xs text-teal-800 space-y-1">
                                                            <li className="flex items-center gap-2">
                                                                 <ShieldCheck className="w-3 h-3" />
                                                                 Đặt sân nhanh chóng, tiện lợi
                                                            </li>
                                                            <li className="flex items-center gap-2">
                                                                 <Calendar className="w-3 h-3" />
                                                                 Quản lý lịch sử đặt sân dễ dàng
                                                            </li>
                                                            <li className="flex items-center gap-2">
                                                                 <Star className="w-3 h-3" />
                                                                 Đánh giá và chia sẻ trải nghiệm
                                                            </li>
                                                       </ul>
                                                  </div>
                                             </div>
                                        </div>

                                        {/* CTA Button */}
                                        <motion.div
                                             whileHover={{ scale: 1.02 }}
                                             whileTap={{ scale: 0.98 }}
                                        >
                                             <Button
                                                  onClick={handleLogin}
                                                  className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-200"
                                             >
                                                  Đăng nhập hoặc đăng ký
                                             </Button>
                                        </motion.div>

                                        {/* Skip Link */}
                                        <button
                                             onClick={handleClose}
                                             className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                        >
                                             Bỏ qua
                                        </button>
                                   </div>
                              </motion.div>
                         </motion.div>
                    </>
               )}
          </AnimatePresence>
     );
};

export default LoginPromotionModal;

