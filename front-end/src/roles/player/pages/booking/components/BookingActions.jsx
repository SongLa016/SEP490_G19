import React from "react";
import { Receipt, CreditCard, Trash2, Star, UserSearchIcon } from "lucide-react";
import { Button } from "../../../../../shared/components/ui";

export default function BookingActions({ booking, user, handlers }) {
     const {
          handleViewInvoice,
          handleContinuePayment,
          handleCancel,
          handleRating,
          handleFindOpponent,
          isPendingUnpaidWithin2Hours,
          shouldShowCancelButton,
          shouldShowFindOpponentButton,
          hasExistingMatchRequest
     } = handlers;

     const canShowFindOpponent = shouldShowFindOpponentButton(booking) && !hasExistingMatchRequest(booking);

     return (
          <div className="mt-4 pt-3 border-t border-teal-100 flex flex-wrap gap-2">
               <Button variant="secondary" onClick={() => handleViewInvoice(booking)} className="px-2 !py-1 text-sm rounded-3xl">
                    <Receipt className="w-4 h-4 mr-2" /> Xem hóa đơn
               </Button>

               {user && (
                    <>
                         {isPendingUnpaidWithin2Hours(booking) && (
                              <Button
                                   onClick={() => handleContinuePayment(booking)}
                                   className="px-3 py-2 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-3xl"
                              >
                                   <CreditCard className="w-4 h-4 mr-2" />
                                   Tiếp tục thanh toán
                              </Button>
                         )}

                         {shouldShowCancelButton(booking) && (
                              <Button variant="destructive" onClick={() => handleCancel(booking.id)} className="px-3 rounded-3xl py-2 text-sm">
                                   <Trash2 className="w-4 h-4 mr-2" />
                                   Hủy đặt
                              </Button>
                         )}

                         {booking.status === "completed" && (
                              <Button
                                   onClick={() => handleRating(booking)}
                                   className="px-3 py-2 text-sm bg-yellow-50 text-yellow-700 border-yellow-400 hover:text-yellow-700 hover:bg-yellow-100 hover:border-yellow-600 transition-colors rounded-3xl"
                              >
                                   <Star className="w-4 h-4 mr-2" />
                                   Đánh giá
                              </Button>
                         )}

                         {canShowFindOpponent && (
                              <Button
                                   variant="secondary"
                                   onClick={() => handleFindOpponent(booking)}
                                   className="px-4 !rounded-full py-2.5 text-sm font-medium bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                              >
                                   <UserSearchIcon className="w-4 h-4" />
                                   <span>Tìm đối thủ</span>
                              </Button>
                         )}
                    </>
               )}
          </div>
     );
}
