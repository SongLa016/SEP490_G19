import React from "react";
import { User, Phone, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Badge, Button } from "../../../../../shared/components/ui";

export default function BookingParticipants({ booking, user, matchRequestData, handlers }) {
     const {
          bookingIdToRequest,
          requestJoins,
          processingParticipants
     } = matchRequestData;
     const {
          extractRequestId,
          filterParticipantsForDisplay,
          extractParticipants,
          getRequestOwnerId,
          getRequestBadgeConfig,
          getAcceptedParticipants,
          isRequestLocked,
          normalizeParticipantStatus,
          participantNeedsOwnerAction,
          getParticipantId,
          handleAcceptParticipant, // xử lý khi nhấn nút "Chấp nhận" đội tham gia
          handleRejectParticipant, // xử lý khi nhấn nút "Từ chối" đội tham gia
     } = handlers;

     const req = bookingIdToRequest[booking.id];
     if (!req) return null;   // 
     // lấy requestId từ matchRequest object
     const requestId = extractRequestId(req);
     const participants = requestId
          ? (requestJoins[requestId] || extractParticipants(req))
          : extractParticipants(req);
     const requestOwnerId = getRequestOwnerId(req);
     const displayParticipants = filterParticipantsForDisplay(participants, req);

     if (!displayParticipants || displayParticipants.length === 0) return null;

     const isRequestOwner = user && requestOwnerId && String(requestOwnerId) === String(user?.userID || user?.UserID || user?.id || user?.userId);
     const badgeConfig = getRequestBadgeConfig(req);
     const acceptedTeams = getAcceptedParticipants(req);
     const requestLocked = isRequestLocked(req);

     return (
          <div className="mt-3 p-3 rounded-xl border border-teal-100 bg-white/70">
               <div className="flex flex-col gap-1 mb-3">
                    <div className="font-semibold text-teal-800">Đội tham gia</div>
                    <Badge variant="outline" className={`text-xs w-fit ${badgeConfig.className}`}>
                         {badgeConfig.text}
                    </Badge>
                    {requestLocked && acceptedTeams.length > 0 && (
                         <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
                              Trận đấu đã được xác nhận với {acceptedTeams.length} đội.
                         </div>
                    )}
               </div>
               <div className="space-y-2">
                    {displayParticipants.map((j) => {
                         const participantId = getParticipantId(j);
                         const participantTeamName = j.teamName || j.fullName || j.participantName || j.userName || `User: ${j.userId || participantId}`;
                         const participantStatus = normalizeParticipantStatus(j);
                         const needsOwnerAction = participantNeedsOwnerAction(j);
                         const processingKey = `${requestId}-${participantId}`;
                         const isProcessing = processingParticipants[processingKey];

                         return (
                              <div key={participantId || Math.random()} className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-sm transition-shadow">
                                   <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 space-y-2">
                                             <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="font-semibold text-gray-900">{participantTeamName}</span>
                                                  {j.playerCount && (
                                                       <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                            {j.playerCount} người
                                                       </Badge>
                                                  )}
                                                  <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                                                       {participantStatus}
                                                  </Badge>
                                             </div>

                                             {j.fullName && j.fullName !== participantTeamName && (
                                                  <div className="text-sm text-gray-600 flex items-center gap-1">
                                                       <User className="w-3 h-3" />
                                                       <span>{j.fullName}</span>
                                                  </div>
                                             )}

                                             {j.contactPhone && (
                                                  <div className="text-sm text-gray-600 flex items-center gap-1">
                                                       <Phone className="w-3 h-3" />
                                                       <span>{j.contactPhone}</span>
                                                  </div>
                                             )}

                                             {j.note && j.note.trim() && (
                                                  <div className="text-sm text-gray-600 italic">
                                                       "{j.note}"
                                                  </div>
                                             )}
                                        </div>

                                        {isRequestOwner && needsOwnerAction && !requestLocked && (
                                             <div className="flex gap-2">
                                                  <Button
                                                       onClick={() => handleAcceptParticipant(booking.id, requestId, j)}
                                                       disabled={isProcessing}
                                                       className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-1"
                                                  >
                                                       {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                                       Chấp nhận
                                                  </Button>
                                                  <Button
                                                       onClick={() => handleRejectParticipant(booking.id, requestId, j)}
                                                       disabled={isProcessing}
                                                       className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1"
                                                  >
                                                       {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                                       Từ chối
                                                  </Button>
                                             </div>
                                        )}
                                   </div>
                              </div>
                         );
                    })}
               </div>
          </div>
     );
}