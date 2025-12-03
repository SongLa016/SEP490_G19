import { useState } from "react";
import RecurringOpponentSelection from "./RecurringOpponentSelection";
import { createMatchRequest, createCommunityPost } from "../utils/communityStore";

export default function RecurringOpponentModal({
     isOpen,
     onClose,
     booking,
     user,
     level,
     note,
     onSuccess
}) {
     const [isProcessing, setIsProcessing] = useState(false);

     const handleOpponentSelection = async (selectedOption, recurringSessions) => {
          setIsProcessing(true);
          try {
               // Chuyển danh sách session từ FE (RecurringOpponentSelection) sang dạng backend/local store cần
               const normalizedSessions = Array.isArray(recurringSessions) ? recurringSessions : [];

               const baseData = {
                    ownerId: user?.id,
                    level,
                    note: note.trim(),
                    fieldName: booking.fieldName,
                    address: booking.fieldAddress || booking.address || "",
                    price: booking.price || 0,
                    createdByName: user?.name || "Người dùng",
                    isRecurring: true,
                    recurringSessions: normalizedSessions,
                    recurringType: selectedOption
               };

               if (selectedOption === "individual") {
                    // Create individual requests for each session
                    const requests = createMatchRequest(baseData);
                    // Handle the response (could be single request or array)
                    if (Array.isArray(requests)) {
                         // Multiple requests created
                    } else {
                         // Single request created
                    }
               } else {
                    // Create single request for all sessions or first session
                    const requestNote = selectedOption === "all"
                         ? `${note} - Tất cả ${normalizedSessions.length} buổi`
                         : `${note} - Buổi đầu tiên`;

                    const firstSession = normalizedSessions[0] || {};
                    createMatchRequest({
                         ...baseData,
                         note: requestNote,
                         date: firstSession.date || booking.date,
                         slotName: firstSession.slotName || booking.slotName || booking.time || ""
                    });
                    // Request created successfully
               }

               // Create community post
               const firstSession = (normalizedSessions && normalizedSessions[0]) || {};
               createCommunityPost({
                    userId: user?.id,
                    content: `Tìm đối cho lịch cố định ${booking.fieldName} - ${normalizedSessions.length} buổi`,
                    location: booking.fieldAddress || booking.address || "",
                    time: `${firstSession.date || booking.date} ${firstSession.slotName || booking.slotName || booking.time || ""}`,
                    authorName: user?.name || "Người dùng",
                    bookingId: booking.id,
                    fieldName: booking.fieldName,
                    date: booking.date,
                    slotName: booking.slotName || booking.time || ""
               });

               onSuccess();
          } catch (error) {
               console.error("Error creating recurring opponent requests:", error);
          } finally {
               setIsProcessing(false);
          }
     };

     if (!isOpen || !booking) return null;

     return (
          <RecurringOpponentSelection
               isRecurring={true}
               recurringSessions={[]} // sẽ được truyền từ BookingHistory qua opponentData nếu cần mở rộng sau
               onOpponentSelection={handleOpponentSelection}
               onClose={onClose}
          />
     );
}
