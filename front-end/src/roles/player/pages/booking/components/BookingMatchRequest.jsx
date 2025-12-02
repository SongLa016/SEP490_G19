import React from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { Badge, Button } from "../../../../../shared/components/ui";

export default function BookingMatchRequest({ booking, user, matchRequestData, handlers }) {
     const { bookingIdToRequest, refreshingRequests, refreshRequestForBooking, extractRequestId } = matchRequestData;
     const { hasExistingMatchRequest } = handlers;

     const req = bookingIdToRequest[booking.id];
     const hasRequest = hasExistingMatchRequest(booking);

     if (!hasRequest) return null;

     const currentRequestId = extractRequestId(req) || booking.matchRequestId || booking.matchRequestID || booking.MatchRequestID;
     const isPlaceholder = req?.placeholder === true;
     const badgeConfig = req ? handlers.getRequestBadgeConfig(req) : {
          text: "Đã ghép thành công",
          className: "border-teal-200 text-teal-700 bg-teal-50"
     };
     const requestLocked = req ? handlers.isRequestLocked(req) : false;
     const requestStatus = handlers.normalizeRequestStatus(req);
     const isMatched = requestStatus === "matched";
     const acceptedParticipants = isMatched ? handlers.getAcceptedParticipants(req) : [];
     const canRefresh = !isMatched && (isPlaceholder || (req ? !requestLocked : Boolean(currentRequestId)));

     return (
          <div className="mt-3 flex flex-col gap-2">
               <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${badgeConfig.className}`}>
                         {isMatched ? 'Đã ghép đôi' : 'Đã yêu cầu'} • {badgeConfig.text}
                    </Badge>
                    {canRefresh && (
                         <Button
                              variant="outline"
                              className="px-3 !rounded-full py-2 text-sm flex items-center gap-2"
                              onClick={() => refreshRequestForBooking(booking.id, currentRequestId || booking.bookingId)}
                              disabled={refreshingRequests[currentRequestId || booking.bookingId]}
                         >
                              {refreshingRequests[currentRequestId] ? (
                                   <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Đang tải...</span>
                                   </>
                              ) : (
                                   <>
                                        <RefreshCw className="w-4 h-4" />
                                        <span>Tải đội tham gia</span>
                                   </>
                              )}
                         </Button>
                    )}
               </div>

               {isMatched && acceptedParticipants.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                         <div className="text-xs font-semibold text-green-800 mb-1">Đội đối thủ:</div>
                         {acceptedParticipants.map((p, idx) => (
                              <div key={idx} className="text-xs text-green-700">
                                   • {p.teamName || p.fullName} ({p.playerCount || 0} người)
                              </div>
                         ))}
                    </div>
               )}
          </div>
     );
}