import { useState, useCallback } from "react";
import {
     fetchBookingPackagesByPlayer,
     fetchBookingPackagesByPlayerToken,
     fetchBookingPackageSessionsByPlayerToken
} from "../../../../../../shared/services/bookings";
import { fetchFieldScheduleById } from "../../../../../../shared/services/fieldSchedules";

/**
 * Hook quản lý gói đặt sân cố định
 * @param {Object} user - Thông tin user
 * @param {string|number} playerId - ID của người chơi
 */
export function useBookingPackages(user, playerId) {
     const [bookingPackages, setBookingPackages] = useState([]);
     const [isLoadingPackages, setIsLoadingPackages] = useState(false);
     const [packageError, setPackageError] = useState("");
     const [packageSessionsMap, setPackageSessionsMap] = useState({});
     const [expandedPackageSessions, setExpandedPackageSessions] = useState({});
     const [sessionScheduleDataMap, setSessionScheduleDataMap] = useState({});

     // Chuẩn hóa dữ liệu gói đặt sân cố định
     const normalizePackageData = useCallback((pkg, fallbackIndex = 0) => {
          const pkgId = pkg?.bookingPackageId || pkg?.bookingPackageID || pkg?.id || pkg?.packageId;
          const fallbackId = pkgId || `pkg-${fallbackIndex}`;
          return {
               id: fallbackId,
               bookingPackageId: pkgId || fallbackId,
               userId: pkg?.userId || pkg?.UserId || pkg?.userID,
               fieldId: pkg?.fieldId || pkg?.fieldID,
               fieldName: pkg?.fieldName || pkg?.field?.name || `Sân #${pkg?.fieldId || pkg?.fieldID || "?"}`,
               packageName: pkg?.packageName || pkg?.name || "Gói đặt sân cố định",
               startDate: pkg?.startDate || pkg?.startDay || pkg?.start_time,
               endDate: pkg?.endDate || pkg?.endDay || pkg?.end_time,
               totalPrice: Number(pkg?.totalPrice ?? pkg?.price ?? 0),
               bookingStatus: pkg?.bookingStatus || pkg?.status || "",
               paymentStatus: pkg?.paymentStatus || pkg?.paymentState || "",
               qrCodeUrl: pkg?.qrcode || pkg?.qrCode || pkg?.QRCode || pkg?.qrCodeUrl || null,
               qrExpiresAt: pkg?.qrexpiresAt || pkg?.qrExpiresAt || pkg?.QRExpiresAt || null,
               createdAt: pkg?.createdAt || pkg?.CreatedAt || null
          };
     }, []);

     // Chuẩn hóa buổi đặt sân cố định
     const normalizePackageSession = useCallback((session) => {
          if (!session) return null;
          const packageId = session.bookingPackageId ||
               session.bookingPackageID ||
               session.packageId ||
               session.packageID ||
               session?.bookingPackage?.bookingPackageId;
          const startTime = session.startTime || session.slotStartTime || session.sessionStart || session.start || session.startHour;
          const endTime = session.endTime || session.slotEndTime || session.sessionEnd || session.end || session.endHour;
          let slotName = session.slotName || session.slot || session.timeRange;
          if (!slotName && startTime && endTime) {
               slotName = `${startTime} - ${endTime}`;
          }
          return {
               id: session.packageSessionId || session.bookingPackageSessionId || session.sessionId || session.id || `${packageId || "pkg"}-${session.sessionDate || session.date || Math.random()}`,
               bookingPackageId: packageId,
               date: session.sessionDate || session.date || session.sessionDay || session.startDate,
               startTime,
               endTime,
               slotName,
               status: session.status || session.sessionStatus || session.state || "",
               fieldName: session.fieldName || session.field?.name || "",
               scheduleId: session.scheduleId || session.scheduleID || null,
               pricePerSession: session.pricePerSession || session.price || null,
               sessionStatus: session.sessionStatus || session.status || ""
          };
     }, []);

     // Tải gói đặt sân cố định
     const loadBookingPackages = useCallback(async () => {
          if (!user) {
               setBookingPackages([]);
               setPackageSessionsMap({});
               setSessionScheduleDataMap({});
               return;
          }

          setIsLoadingPackages(true);
          setPackageError("");
          setPackageSessionsMap({});
          setSessionScheduleDataMap({});
          setExpandedPackageSessions({});

          try {
               let packageList = [];
               let apiResult = await fetchBookingPackagesByPlayerToken();
               if (apiResult.success) {
                    packageList = apiResult.data || [];
               } else if (playerId) {
                    apiResult = await fetchBookingPackagesByPlayer(playerId);
                    if (apiResult.success) {
                         packageList = apiResult.data || [];
                    } else {
                         setPackageError(apiResult.error || "Không thể tải lịch sử gói đặt sân cố định.");
                    }
               } else {
                    setPackageError(apiResult.error || "Không thể tải lịch sử gói đặt sân cố định.");
               }

               const normalizedPackages = packageList.map((pkg, index) => normalizePackageData(pkg, index));
               setBookingPackages(normalizedPackages);

               // Tải buổi đặt sân cố định
               if (normalizedPackages.length > 0) {
                    try {
                         const sessionResp = await fetchBookingPackageSessionsByPlayerToken();
                         if (sessionResp.success && sessionResp.data) {
                              const groupedSessions = {};
                              const sessionsArray = Array.isArray(sessionResp.data) ? sessionResp.data : [];
                              const normalizedSessions = sessionsArray.map(normalizePackageSession).filter(Boolean);

                              normalizedSessions.forEach((session) => {
                                   if (!session.bookingPackageId) return;
                                   const packageIdKey = String(session.bookingPackageId);
                                   if (!groupedSessions[packageIdKey]) {
                                        groupedSessions[packageIdKey] = [];
                                   }
                                   groupedSessions[packageIdKey].push(session);
                              });

                              Object.keys(groupedSessions).forEach((key) => {
                                   const sessions = groupedSessions[key];
                                   sessions.sort((a, b) => {
                                        const dateA = new Date(a.date || 0).getTime();
                                        const dateB = new Date(b.date || 0).getTime();
                                        return dateA - dateB;
                                   });
                                   const numKey = Number(key);
                                   if (!isNaN(numKey) && numKey.toString() === key) {
                                        groupedSessions[numKey] = sessions;
                                   }
                              });

                              setPackageSessionsMap(groupedSessions);

                              // Tải lịch trình cho mỗi buổi
                              const schedulePromises = normalizedSessions
                                   .filter(s => s.scheduleId)
                                   .map(async (session) => {
                                        try {
                                             const scheduleResult = await fetchFieldScheduleById(session.scheduleId);
                                             if (scheduleResult.success && scheduleResult.data) {
                                                  return { scheduleId: session.scheduleId, data: scheduleResult.data };
                                             }
                                        } catch (error) {
                                             console.error(`Error fetching schedule ${session.scheduleId}:`, error);
                                        }
                                        return null;
                                   });

                              const scheduleResults = await Promise.all(schedulePromises);
                              const scheduleMap = {};
                              scheduleResults.forEach(result => {
                                   if (result && result.scheduleId) {
                                        scheduleMap[result.scheduleId] = result.data;
                                   }
                              });
                              setSessionScheduleDataMap(scheduleMap);
                         }
                    } catch (error) {
                         console.error("Error fetching package sessions:", error);
                         setPackageSessionsMap({});
                         setSessionScheduleDataMap({});
                    }
               }
          } catch (error) {
               console.error("Error loading booking packages:", error);
               setPackageError(error.message || "Không thể tải lịch sử gói đặt sân cố định.");
               setBookingPackages([]);
               setPackageSessionsMap({});
               setSessionScheduleDataMap({});
          } finally {
               setIsLoadingPackages(false);
          }
     }, [playerId, user, normalizePackageData, normalizePackageSession]);

     // Toggle hiển thị sessions của package
     const togglePackageSessions = useCallback((packageId) => {
          setExpandedPackageSessions(prev => ({
               ...prev,
               [packageId]: !prev[packageId]
          }));
     }, []);

     // Format ngày buổi đặt sân
     const formatSessionDateLabel = useCallback((dateStr) => {
          if (!dateStr) return "Chưa có ngày";
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
               return parsed.toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
               });
          }
          return dateStr;
     }, []);

     // Format thời gian buổi đặt sân
     const formatSessionTimeRange = useCallback((session) => {
          if (!session) return "Chưa rõ thời gian";
          if (session.slotName) return session.slotName;
          if (session.startTime && session.endTime) return `${session.startTime} - ${session.endTime}`;
          return session.startTime || session.endTime || "Chưa rõ thời gian";
     }, []);

     return {
          bookingPackages,
          isLoadingPackages,
          packageError,
          packageSessionsMap,
          expandedPackageSessions,
          sessionScheduleDataMap,
          loadBookingPackages,
          togglePackageSessions,
          formatSessionDateLabel,
          formatSessionTimeRange
     };
}

export default useBookingPackages;
