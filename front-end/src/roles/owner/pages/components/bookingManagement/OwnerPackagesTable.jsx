import React, { useState, useEffect, useCallback } from "react";
import { Repeat, RefreshCw, CheckCircle, CheckSquare, Eye, AlertTriangle, RotateCcw, XCircle, Info, Calendar, Clock, DollarSign, MapPin, FileText, CreditCard, List, User, Phone, Mail } from "lucide-react";
import { Card, Table, TableHeader, TableHead, TableRow, TableBody, TableCell, Button, Modal } from "../../../../../shared/components/ui";
import {
  fetchBookingPackagesByOwnerToken,
  fetchBookingPackagesByOwner,
  confirmBookingPackage,
  completeBookingPackage,
  fetchBookingPackageSessionsByOwnerToken,
  cancelBookingPackageSession
} from "../../../../../shared/services/bookings";
import { fetchFieldScheduleById, updateFieldScheduleStatus, fetchFieldSchedulesByField } from "../../../../../shared/services/fieldSchedules";
import { API_BASE_URL } from "../../../../../shared/config/api";
import Swal from "sweetalert2";

// component hiển thị bảng danh sách gói đặt sân cố định của Owner
export default function OwnerPackagesTable({
  getStatusColor = () => "bg-gray-100 text-gray-800",
  getStatusText = (s) => s || "—",
  getPaymentStatusColor = () => "bg-gray-100 text-gray-800",
  getPaymentStatusText = (s) => s || "—",
  ownerId = null,
}) {
  const [bookingPackages, setBookingPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [packageSessions, setPackageSessions] = useState({});
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [selectedPackageForSessions, setSelectedPackageForSessions] = useState(null);
  const [userMap, setUserMap] = useState({});
  const [sessionScheduleDataMap, setSessionScheduleDataMap] = useState({});
  const [sessionUserMap, setSessionUserMap] = useState({});

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN");
  };

  // hàm lấy icon tương ứng với trạng thái booking
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <AlertTriangle className="w-3 h-3" />;
      case "confirmed":
      case "completed":
        return <CheckCircle className="w-3 h-3" />;
      case "cancelled":
        return <XCircle className="w-3 h-3" />;
      default:
        return <Info className="w-3 h-3" />;
    }
  };

  // hàm dịch trạng thái booking sang
  const getBookingStatusText = (status) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower.includes("pending")) return "Chờ xác nhận";
    if (statusLower.includes("confirm")) return "Đã xác nhận";
    if (statusLower.includes("complete")) return "Hoàn thành";
    if (statusLower.includes("cancel")) return "Đã hủy";
    return status || "—";
  };
  // hàm lấy màu tương ứng với trạng thái booking
  const getBookingStatusColor = (status) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower.includes("pending")) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (statusLower.includes("confirm")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (statusLower.includes("complete")) return "bg-green-100 text-green-800 border-green-200";
    if (statusLower.includes("cancel")) return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  // hàm dịch trạng thái thanh toán sang tiếng Việt
  const getPaymentStatusTextVi = (status) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower.includes("paid")) return "Đã thanh toán";
    if (statusLower.includes("pending")) return "Chưa thanh toán";
    if (statusLower.includes("refund")) return "Đã hoàn tiền";
    if (statusLower.includes("fail")) return "Thất bại";
    return status || "—";
  };

  const getPaymentStatusColorVi = (status) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower.includes("paid")) return "bg-green-100 text-green-800 border-green-200";
    if (statusLower.includes("pending") || statusLower.includes("unpaid")) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (statusLower.includes("refund")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (statusLower.includes("fail")) return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPaymentIcon = (status) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-3 h-3" />;
      case "unpaid":
        return <AlertTriangle className="w-3 h-3" />;
      case "refunded":
        return <RotateCcw className="w-3 h-3" />;
      case "failed":
        return <XCircle className="w-3 h-3" />;
      default:
        return <Info className="w-3 h-3" />;
    }
  };

  // hàm tải danh sách gói đặt sân cố định từ API
  const loadBookingPackages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let apiResult = await fetchBookingPackagesByOwnerToken();
      if (!apiResult.success && ownerId) {
        apiResult = await fetchBookingPackagesByOwner(ownerId);
      }

      if (!apiResult.success) {
        setError(apiResult.error || "Không thể tải danh sách gói sân cố định.");
        setBookingPackages([]);
        return;
      }

      const rawList = apiResult.data || [];
      const normalized = rawList.map(pkg => ({
        id: pkg.bookingPackageId || pkg.id,
        bookingPackageId: pkg.bookingPackageId || pkg.id,
        fieldId: pkg.fieldId || pkg.fieldID,
        fieldName: pkg.fieldName || "",
        packageName: pkg.packageName || "Gói sân cố định",
        startDate: pkg.startDate,
        endDate: pkg.endDate,
        totalPrice: Number(pkg.totalPrice) || 0,
        bookingStatus: pkg.bookingStatus || "",
        paymentStatus: pkg.paymentStatus || "",
        qrCodeUrl: pkg.qrcode || pkg.qrCode || pkg.QRCode || pkg.qrCodeUrl || null,
        qrExpiresAt: pkg.qrexpiresAt || pkg.qrExpiresAt || pkg.QRExpiresAt || null,
        createdAt: pkg.createdAt || pkg.CreatedAt || null,
        updatedAt: pkg.updatedAt || pkg.UpdatedAt || null,
        fieldStatus: pkg.fieldStatus || "",
        userId: pkg.userId || pkg.userID || pkg.UserId || pkg.UserID || null,
      }));
      setBookingPackages(normalized);
      const uniqueUserIds = [...new Set(normalized.filter(pkg => pkg.userId).map(pkg => pkg.userId))];
      if (uniqueUserIds.length > 0) {
        const fetchUsers = async () => {
          const userInfoMap = {};
          await Promise.all(
            uniqueUserIds.map(async (userId) => {
              try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/api/PlayerProfile/${userId}`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                });
                if (response.ok) {
                  const userData = await response.json();
                  const userName = userData.fullName || userData.FullName || userData.name || userData.Name || userData.email || userData.Email || `User #${userId}`;
                  const userPhone = userData.phone || userData.Phone || userData.phoneNumber || userData.PhoneNumber || userData.mobile || userData.Mobile || null;
                  const userEmail = userData.email || userData.Email || null;
                  userInfoMap[userId] = {
                    name: userName,
                    phone: userPhone,
                    email: userEmail
                  };
                } else {
                  userInfoMap[userId] = {
                    name: `User #${userId}`,
                    phone: null,
                    email: null
                  };
                }
              } catch (error) {
                console.error(`Error fetching user ${userId}:`, error);
                userInfoMap[userId] = {
                  name: `User #${userId}`,
                  phone: null,
                  email: null
                };
              }
            })
          );
          setUserMap(prev => ({ ...prev, ...userInfoMap }));
        };
        fetchUsers();
      }

      try {
        const sessionsResult = await fetchBookingPackageSessionsByOwnerToken();
        if (sessionsResult.success && sessionsResult.data) {
          const sessionsMap = {};
          sessionsResult.data.forEach(session => {
            const pkgId = session.bookingPackageId || session.bookingPackageID;
            if (pkgId) {
              if (!sessionsMap[pkgId]) {
                sessionsMap[pkgId] = [];
              }
              sessionsMap[pkgId].push(session);
            }
          });
          setPackageSessions(sessionsMap);
        }
      } catch (error) {
        console.error("Error loading package sessions:", error);
      }

      // Tự động hoàn thành các gói đã hết endDate và đã confirmed
      const now = new Date();
      const packagesToComplete = [];
      for (const pkg of normalized) {
        const status = (pkg.bookingStatus || "").toLowerCase();
        const isConfirmed = status.includes("confirm");
        const isCompleted = status.includes("complete");
        const endDate = pkg.endDate ? new Date(pkg.endDate) : null;
        if (endDate && isConfirmed && !isCompleted && endDate < now) {
          packagesToComplete.push(pkg.bookingPackageId);
        }
      }

      if (packagesToComplete.length > 0) {
        for (const pkgId of packagesToComplete) {
          try {
            const resp = await completeBookingPackage(pkgId);
            if (resp.success) {
              console.log(`Tự động hoàn thành gói ${pkgId}`);
            }
          } catch (error) {
            console.error(`Lỗi tự động hoàn thành gói ${pkgId}:`, error);
          }
        }
        setTimeout(async () => {
          const reloadResult = await fetchBookingPackagesByOwnerToken();
          if (reloadResult.success && reloadResult.data) {
            const reloaded = reloadResult.data.map(pkg => ({
              id: pkg.bookingPackageId || pkg.id,
              bookingPackageId: pkg.bookingPackageId || pkg.id,
              fieldId: pkg.fieldId || pkg.fieldID,
              fieldName: pkg.fieldName || "",
              packageName: pkg.packageName || "Gói sân cố định",
              startDate: pkg.startDate,
              endDate: pkg.endDate,
              totalPrice: Number(pkg.totalPrice) || 0,
              bookingStatus: pkg.bookingStatus || "",
              paymentStatus: pkg.paymentStatus || "",
              qrCodeUrl: pkg.qrcode || pkg.qrCode || pkg.QRCode || pkg.qrCodeUrl || null,
              qrExpiresAt: pkg.qrexpiresAt || pkg.qrExpiresAt || pkg.QRExpiresAt || null,
              createdAt: pkg.createdAt || pkg.CreatedAt || null,
              updatedAt: pkg.updatedAt || pkg.UpdatedAt || null,
              fieldStatus: pkg.fieldStatus || "",
            }));
            setBookingPackages(reloaded);
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error loading booking packages:", error);
      setError(error.message || "Không thể tải danh sách gói sân cố định.");
      setBookingPackages([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    loadBookingPackages();
  }, [loadBookingPackages]);

  // Fetch sessions khi mở modal chi tiết
  useEffect(() => {
    if (isDetailModalOpen && selectedPackage) {
      const fetchSessions = async () => {
        try {
          const sessionsResult = await fetchBookingPackageSessionsByOwnerToken();
          if (sessionsResult.success && sessionsResult.data) {
            const sessionsMap = {};
            sessionsResult.data.forEach(session => {
              const pkgId = session.bookingPackageId || session.bookingPackageID;
              if (pkgId) {
                if (!sessionsMap[pkgId]) {
                  sessionsMap[pkgId] = [];
                }
                sessionsMap[pkgId].push(session);
              }
            });
            setPackageSessions(prev => ({ ...prev, ...sessionsMap }));
          }
        } catch (error) {
          console.error("Error fetching package sessions:", error);
        }
      };
      fetchSessions();
    }
  }, [isDetailModalOpen, selectedPackage]);

  // hàm tải sessions khi mở modal danh sách buổi đặt
  useEffect(() => {
    if (isSessionsModalOpen && selectedPackageForSessions) {
      const fetchSessions = async () => {
        try {
          const sessionsResult = await fetchBookingPackageSessionsByOwnerToken();
          if (sessionsResult.success && sessionsResult.data) {
            const sessionsMap = {};
            const sessionsArray = sessionsResult.data;
            sessionsArray.forEach(session => {
              const pkgId = session.bookingPackageId || session.bookingPackageID;
              if (pkgId) {
                if (!sessionsMap[pkgId]) {
                  sessionsMap[pkgId] = [];
                }
                sessionsMap[pkgId].push(session);
              }
            });
            setPackageSessions(prev => ({ ...prev, ...sessionsMap }));

            // hàm tải schedule data cho tất cả sessions
            const scheduleIds = [...new Set(sessionsArray.filter(s => s.scheduleId || s.scheduleID).map(s => s.scheduleId || s.scheduleID))];
            if (scheduleIds.length > 0) {
              const schedulePromises = scheduleIds.map(async (scheduleId) => {
                try {
                  const scheduleResult = await fetchFieldScheduleById(scheduleId);
                  if (scheduleResult.success && scheduleResult.data) {
                    return { scheduleId, data: scheduleResult.data };
                  }
                } catch (error) {
                  console.error(`Error fetching schedule ${scheduleId}:`, error);
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

            // hàm tải user data cho tất cả sessions
            const userIds = [...new Set(sessionsArray.filter(s => s.userId || s.userID).map(s => s.userId || s.userID))];
            if (userIds.length > 0) {
              const userPromises = userIds.map(async (userId) => {
                try {
                  const token = localStorage.getItem("token");
                  const response = await fetch(`${API_BASE_URL}/api/PlayerProfile/${userId}`, {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                  });
                  if (response.ok) {
                    const userData = await response.json();
                    return {
                      userId,
                      name: userData.fullName || `User #${userId}`,
                      phone: userData.phone || null,
                      email: userData.email || null
                    };
                  }
                } catch (error) {
                  console.error(`Error fetching user ${userId}:`, error);
                }
                return { userId, name: `User #${userId}`, phone: null, email: null };
              });
              const userResults = await Promise.all(userPromises);
              const userInfoMap = {};
              userResults.forEach(result => {
                if (result && result.userId) {
                  userInfoMap[result.userId] = {
                    name: result.name,
                    phone: result.phone,
                    email: result.email
                  };
                }
              });
              setSessionUserMap(userInfoMap);
            }
          }
        } catch (error) {
          console.error("Error fetching package sessions:", error);
        }
      };
      fetchSessions();
    } else {
      // Reset khi đóng modal
      setSessionScheduleDataMap({});
      setSessionUserMap({});
    }
  }, [isSessionsModalOpen, selectedPackageForSessions]);

  // hàm xử lý xác nhận thanh toán gói đặt sân cố định
  const handleConfirmPackage = async (pkgId) => {
    const pkg = bookingPackages.find(p => (p.bookingPackageId || p.id) === pkgId);

    const result = await Swal.fire({
      icon: "question",
      title: "Xác nhận gói định kỳ",
      html: `
        <div class="text-left">
          <p class="mb-3">💳 <strong>Xác nhận thanh toán</strong> - Gói sân cố định sẽ chuyển sang trạng thái "Đã xác nhận" và thanh toán "Đã thanh toán"</p>
          ${pkg ? `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
              <p class="text-sm text-blue-800 font-semibold mb-1">📋 Thông tin gói sân cố định:</p>
              <div class="text-xs text-blue-700 space-y-1">
                ${pkg.userId && userMap[pkg.userId] ? `<p><strong>Khách hàng:</strong> ${userMap[pkg.userId].name || "—"}</p>` : ''}
                <p><strong>Tên gói:</strong> ${pkg.packageName || "—"}</p>
                <p><strong>Sân:</strong> ${pkg.fieldName || `Sân #${pkg.fieldId}`}</p>
                <p><strong>Từ ngày:</strong> ${formatDate(pkg.startDate)}</p>
                <p><strong>Đến ngày:</strong> ${formatDate(pkg.endDate)}</p>
                <p><strong>Số tiền:</strong> <span class="font-bold text-green-600">${(pkg.totalPrice || 0).toLocaleString("vi-VN")}₫</span></p>
                <p><strong>Trạng thái:</strong> ${getBookingStatusText((pkg.bookingStatus || "").toLowerCase())}</p>
                <p><strong>Thanh toán:</strong> ${getPaymentStatusTextVi((pkg.paymentStatus || "").toLowerCase())}</p>
              </div>
            </div>
            <div class="bg-green-50 border border-green-200 rounded-lg p-2">
              <p class="text-xs text-green-800">
                Sau khi xác nhận, gói sân cố định sẽ được kích hoạt và khách hàng có thể sử dụng các buổi đặt sân.
              </p>
            </div>
          ` : ''}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      width: '550px'
    });
    if (!result.isConfirmed) return;
    const resp = await confirmBookingPackage(pkgId);
    if (!resp.success) {
      await Swal.fire("Lỗi", resp.error || "Không thể xác nhận gói.", "error");
    } else {
      try {
        let sessionsToUpdate = packageSessions[pkgId] || [];
        if (!sessionsToUpdate || sessionsToUpdate.length === 0) {
          const sessionsResult = await fetchBookingPackageSessionsByOwnerToken();
          if (sessionsResult.success && sessionsResult.data) {
            sessionsToUpdate = sessionsResult.data.filter(session =>
              (session.bookingPackageId || session.bookingPackageID) === pkgId
            );
          }
        }
        if (sessionsToUpdate.length === 0) {
        } else {
          const normalizeDate = (dateValue) => {
            if (!dateValue) return null;
            if (typeof dateValue === 'string') {
              const dateMatch = dateValue.match(/^\d{4}-\d{2}-\d{2}/);
              return dateMatch ? dateMatch[0] : dateValue.split('T')[0];
            }
            if (dateValue instanceof Date) {
              return dateValue.toISOString().split('T')[0];
            }
            if (dateValue.year && dateValue.month && dateValue.day) {
              return `${dateValue.year}-${String(dateValue.month).padStart(2, '0')}-${String(dateValue.day).padStart(2, '0')}`;
            }
            return null;
          };
          const fieldId = pkg?.fieldId || pkg?.fieldID || pkg?.FieldID;

          if (!fieldId) {
            console.error(` No fieldId found in package ${pkgId}`);
            console.error(` Package data:`, pkg);
          } else {
            // hàm chuẩn bị thông tin sessions với fieldId, slotId, và date
            const sessionsInfo = sessionsToUpdate.map((session, index) => {
              const slotId = session.slotId || session.slotID || session.SlotID;
              const sessionDate = normalizeDate(session.sessionDate || session.date);
              const scheduleId = session.scheduleId || session.scheduleID || session.ScheduleID;
              return {
                sessionIndex: index,
                scheduleId: scheduleId ? Number(scheduleId) : null,
                slotId: slotId ? Number(slotId) : null,
                date: sessionDate,
                session: session
              };
            });

            // hàm tải tất cả schedules của field này
            const schedulesResult = await fetchFieldSchedulesByField(Number(fieldId));
            if (!schedulesResult.success || !schedulesResult.data) {
              console.error(` Failed to fetch schedules for field ${fieldId}`);
            } else {
              const allSchedules = schedulesResult.data;
              // Tìm schedule cho từng session dựa trên scheduleId hoặc (slotId + date)
              const sessionsToUpdateList = sessionsInfo.map(sessionInfo => {
                let targetSchedule = null;
                let slotIdToUse = sessionInfo.slotId;

                // Bước 1: Tìm schedule bằng scheduleId để lấy slotId (dù date không khớp)
                if (sessionInfo.scheduleId) {
                  const scheduleByScheduleId = allSchedules.find(s => {
                    const sId = s.scheduleId || s.ScheduleId || s.scheduleID || s.ScheduleID;
                    return sId && Number(sId) === Number(sessionInfo.scheduleId);
                  });

                  if (scheduleByScheduleId) {
                    // Lấy slotId từ schedule này
                    slotIdToUse = scheduleByScheduleId.slotId || scheduleByScheduleId.SlotId || scheduleByScheduleId.slotID || scheduleByScheduleId.SlotID;
                    const scheduleDate = normalizeDate(scheduleByScheduleId.date || scheduleByScheduleId.Date);
                    if (scheduleDate === sessionInfo.date) {
                      targetSchedule = scheduleByScheduleId;
                    } else {
                      // Date không khớp, sẽ tìm lại bằng slotId + date
                    }
                  }
                }

                // Bước 2: Tìm bằng slotId + date (nếu chưa tìm thấy hoặc date không khớp)
                if (!targetSchedule && slotIdToUse && sessionInfo.date) {
                  targetSchedule = allSchedules.find(s => {
                    const scheduleSlotId = s.slotId || s.SlotId || s.slotID || s.SlotID;
                    const scheduleDate = normalizeDate(s.date || s.Date);
                    return Number(scheduleSlotId) === Number(slotIdToUse) &&
                      scheduleDate === sessionInfo.date;
                  });

                  if (targetSchedule) {
                  }
                }

                if (targetSchedule) {
                  const scheduleId = targetSchedule.scheduleId || targetSchedule.ScheduleId || targetSchedule.scheduleID || targetSchedule.ScheduleID;
                  const finalSlotId = targetSchedule.slotId || targetSchedule.SlotId || targetSchedule.slotID || targetSchedule.SlotID;
                  return {
                    scheduleId: Number(scheduleId),
                    date: sessionInfo.date,
                    slotId: Number(finalSlotId),
                    sessionIndex: sessionInfo.sessionIndex
                  };
                }

                return null;
              }).filter(item => item !== null);
              if (sessionsToUpdateList.length > 0) {
                // hàm cập nhật từng schedule với delay nhỏ để tránh rate limiting
                const updatePromises = sessionsToUpdateList.map(async (item, index) => {
                  const { scheduleId, date, slotId } = item;

                  // Thêm delay nhỏ giữa các requests (100ms mỗi request)
                  if (index > 0) {
                    await new Promise(resolve => setTimeout(resolve, 100 * index));
                  }

                  try {
                    const updateResult = await updateFieldScheduleStatus(Number(scheduleId), "Booked");
                    if (updateResult.success) {
                      return { success: true, scheduleId, date, slotId };
                    } else {
                      return { success: false, scheduleId, date, slotId, error: updateResult.error };
                    }
                  } catch (error) {
                    return { success: false, scheduleId, date, slotId, error: error.message };
                  }
                });

                // hàm chờ tất cả updates hoàn thành
                const results = await Promise.allSettled(updatePromises);

                const successResults = results
                  .filter(r => r.status === 'fulfilled' && r.value?.success)
                  .map(r => r.value);
                const failedResults = results
                  .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success))
                  .map(r => r.status === 'rejected' ? r.reason : r.value);

                if (failedResults.length > 0) {
                  console.error(` Failed schedules:`, failedResults.map(r => ({
                    scheduleId: r?.scheduleId,
                    slotId: r?.slotId,
                    date: r?.date,
                    error: r?.error || r?.message
                  })));
                }
                console.log(` ========================================`);
              } else {
                console.warn(` No matching schedules found for any sessions`);
              }
            }
          }
        }
      } catch (error) {
        console.error(` Error updating FieldSchedules for package:`, error);
      }

      const amountText = pkg ? `<br/><br/><p class="text-sm"><strong>Số tiền:</strong> <span class="font-bold text-green-600">${(pkg.totalPrice || 0).toLocaleString("vi-VN")}₫</span></p>` : '';
      await Swal.fire({
        icon: "success",
        title: "Đã xác nhận thanh toán!",
        html: `Đã xác nhận gói sân cố định thành công. Trạng thái đã chuyển sang "Đã xác nhận" và thanh toán "Đã thanh toán".${amountText}`,
        confirmButtonColor: '#10b981'
      });
      loadBookingPackages();
    }
  };
  // hàm xử lý xác nhận hoàn thành gói đặt sân cố định
  const handleCompletePackage = async (pkgId) => {
    const result = await Swal.fire({
      icon: "question",
      title: "Hoàn thành gói định kỳ",
      text: "Đánh dấu gói sân cố định này đã hoàn thành?",
      showCancelButton: true,
      confirmButtonText: "Hoàn thành",
      cancelButtonText: "Hủy",
    });
    if (!result.isConfirmed) return;
    const resp = await completeBookingPackage(pkgId);
    if (!resp.success) {
      await Swal.fire("Lỗi", resp.error || "Không thể hoàn thành gói.", "error");
    } else {
      await Swal.fire("Thành công", "Đã hoàn thành gói sân cố định.", "success");
      loadBookingPackages();
    }
  };

  // hàm xử lý xác nhận hủy buổi đặt sân cố định
  const handleCancelSession = async (session) => {
    const sessionPrice = session.pricePerSession || session.price || 0;
    const result = await Swal.fire({
      icon: "warning",
      title: "Hủy buổi đặt",
      text: `Bạn có chắc chắn muốn hủy buổi đặt này? Số tiền ${sessionPrice ? Number(sessionPrice).toLocaleString("vi-VN") + "₫" : ""} sẽ được hoàn lại.`,
      showCancelButton: true,
      confirmButtonText: "Hủy buổi",
      cancelButtonText: "Không",
      confirmButtonColor: "#ef4444",
    });
    if (!result.isConfirmed) return;

    try {
      const sessionId = session.packageSessionId || session.id || session.sessionId;
      const scheduleId = session.scheduleId || session.scheduleID || session.ScheduleID;

      const resp = await cancelBookingPackageSession(sessionId);
      if (!resp.success) {
        await Swal.fire("Lỗi", resp.error || "Không thể hủy buổi đặt.", "error");
      } else {
        if (scheduleId && Number(scheduleId) > 0) {
          try {
            const updateResult = await updateFieldScheduleStatus(Number(scheduleId), "Available");
            if (updateResult.success) {
            } else {
              console.warn(` Failed to update schedule ${scheduleId}:`, updateResult.error);
            }
          } catch (error) {
            console.error(` Error updating schedule ${scheduleId}:`, error);
          }
        }
        // Lấy refundQr từ response - có thể ở nhiều vị trí
        const responseData = resp.data?.data || resp.data || {};
        const refundQr = responseData.refundQr || resp.data?.refundQr;
        const refundAmount = responseData.price || sessionPrice;

        if (refundQr) {
          await Swal.fire({
            icon: "success",
            title: "Đã hủy buổi đặt thành công",
            html: `
              <div class="text-center">
                <p class="mb-3 text-gray-700">Buổi đặt đã được hủy thành công.</p>
                ${refundAmount ? `<p class="text-sm font-semibold text-orange-600 mb-3">Số tiền hoàn lại: <span class="text-lg">${Number(refundAmount).toLocaleString("vi-VN")}₫</span></p>` : ''}
                <p class="text-sm text-gray-600 mb-3">Vui lòng quét mã QR để hoàn tiền cho khách hàng:</p>
                <div class="flex justify-center mb-3">
                  <img src="${refundQr}" alt="QR Code hoàn tiền" class="rounded-lg shadow-lg border-2 border-gray-200" style="max-width: 280px; width: 100%;" />
                </div>
                <p class="text-xs text-gray-500 italic">Lưu ý: Mã QR này dùng để quét và hoàn tiền cho khách hàng</p>
              </div>
            `,
            confirmButtonText: "Đã hiểu",
            width: "550px",
            customClass: {
              popup: 'rounded-2xl',
              confirmButton: 'rounded-xl bg-teal-600 hover:bg-teal-700'
            }
          });
        } else {
          await Swal.fire({
            icon: "success",
            title: "Đã hủy buổi đặt",
            text: refundAmount ? `Đã hủy buổi đặt thành công. Số tiền ${Number(refundAmount).toLocaleString("vi-VN")}₫ sẽ được hoàn lại.` : "Đã hủy buổi đặt thành công.",
            confirmButtonText: "Đóng"
          });
        }

        // Reload sessions để cập nhật trạng thái
        const sessionsResult = await fetchBookingPackageSessionsByOwnerToken();
        if (sessionsResult.success && sessionsResult.data) {
          const sessionsMap = {};
          sessionsResult.data.forEach(s => {
            const pkgId = s.bookingPackageId || s.bookingPackageID;
            if (pkgId) {
              if (!sessionsMap[pkgId]) {
                sessionsMap[pkgId] = [];
              }
              sessionsMap[pkgId].push(s);
            }
          });
          setPackageSessions(prev => ({ ...prev, ...sessionsMap }));
        }

        // Reload schedule và user data nếu modal đang mở
        if (isSessionsModalOpen && selectedPackageForSessions) {
          const fetchSessions = async () => {
            try {
              const sessionsResult = await fetchBookingPackageSessionsByOwnerToken();
              if (sessionsResult.success && sessionsResult.data) {
                const sessionsArray = sessionsResult.data;
                const sessionsMap = {};
                sessionsArray.forEach(session => {
                  const pkgId = session.bookingPackageId || session.bookingPackageID;
                  if (pkgId) {
                    if (!sessionsMap[pkgId]) {
                      sessionsMap[pkgId] = [];
                    }
                    sessionsMap[pkgId].push(session);
                  }
                });
                setPackageSessions(prev => ({ ...prev, ...sessionsMap }));

                // Reload schedule data
                const scheduleIds = [...new Set(sessionsArray.filter(s => s.scheduleId || s.scheduleID).map(s => s.scheduleId || s.scheduleID))];
                if (scheduleIds.length > 0) {
                  const schedulePromises = scheduleIds.map(async (scheduleId) => {
                    try {
                      const scheduleResult = await fetchFieldScheduleById(scheduleId);
                      if (scheduleResult.success && scheduleResult.data) {
                        return { scheduleId, data: scheduleResult.data };
                      }
                    } catch (error) {
                      console.error(`Error fetching schedule ${scheduleId}:`, error);
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
              }
            } catch (error) {
              console.error("Error reloading sessions:", error);
            }
          };
          fetchSessions();
        }
        loadBookingPackages();
      }
    } catch (error) {
      console.error("Error cancelling session:", error);
      await Swal.fire("Lỗi", "Có lỗi xảy ra khi hủy buổi đặt.", "error");
    }
  };

  const handleViewDetails = (pkg) => {
    setSelectedPackage(pkg);
    setIsDetailModalOpen(true);
  };

  const handleViewSessions = (pkg) => {
    setSelectedPackageForSessions(pkg);
    setIsSessionsModalOpen(true);
  };

  return (
    <>
      <Card className="mt-6 p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-teal-600" />
            Gói sân cố định
          </h3>
          <Button onClick={loadBookingPackages} variant="outline" className="rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
        </div>
        {error && (
          <div className="mb-3 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Đang tải gói sân cố định...</p>
          </div>
        ) : bookingPackages.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-600">Chưa có gói sân cố định nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="rounded-2xl border border-teal-300">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-blue-500 to-teal-500">
                  <TableHead className="text-white font-semibold">Khách hàng</TableHead>
                  <TableHead className="text-white font-semibold">Tên</TableHead>

                  <TableHead className="text-white font-semibold">Sân</TableHead>
                  <TableHead className="text-white font-semibold">Thời gian</TableHead>
                  <TableHead className="text-white font-semibold">Tổng giá</TableHead>
                  <TableHead className="text-white font-semibold">Trạng thái</TableHead>
                  <TableHead className="text-white font-semibold">Thanh toán</TableHead>
                  <TableHead className="text-center text-white font-semibold">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingPackages.map((pkg, idx) => {
                  const status = (pkg.bookingStatus || "").toLowerCase();
                  const isPending = status.includes("pending");
                  const isConfirmed = status.includes("confirm");
                  const isCompleted = status.includes("complete");

                  // Kiểm tra slot cuối cùng đã kết thúc chưa
                  const sessions = packageSessions[pkg.bookingPackageId] || packageSessions[pkg.id] || [];
                  let lastSlotEnded = false;
                  if (sessions.length > 0) {
                    const sortedSessions = [...sessions].sort((a, b) => {
                      const dateA = a.date ? new Date(a.date) : null;
                      const dateB = b.date ? new Date(b.date) : null;
                      if (!dateA && !dateB) return 0;
                      if (!dateA) return 1;
                      if (!dateB) return -1;
                      if (dateA.getTime() !== dateB.getTime()) {
                        return dateB.getTime() - dateA.getTime();
                      }
                      const endTimeA = a.endTime ? (typeof a.endTime === 'string' ? new Date(a.endTime) : a.endTime) : null;
                      const endTimeB = b.endTime ? (typeof b.endTime === 'string' ? new Date(b.endTime) : b.endTime) : null;
                      if (!endTimeA && !endTimeB) return 0;
                      if (!endTimeA) return 1;
                      if (!endTimeB) return -1;
                      return endTimeB.getTime() - endTimeA.getTime();
                    });
                    const lastSession = sortedSessions[0];
                    if (lastSession) {
                      const lastEndTime = lastSession.endTime ? (typeof lastSession.endTime === 'string' ? new Date(lastSession.endTime) : lastSession.endTime) : null;
                      if (lastEndTime) {
                        lastSlotEnded = lastEndTime < new Date();
                      } else {
                        const lastDate = lastSession.date ? new Date(lastSession.date) : null;
                        if (lastDate) {
                          const endOfDay = new Date(lastDate);
                          endOfDay.setHours(23, 59, 59, 999);
                          lastSlotEnded = endOfDay < new Date();
                        }
                      }
                    }
                  }

                  const showConfirm = isPending;
                  const showComplete = !isCompleted && isConfirmed && lastSlotEnded;

                  return (
                    <TableRow key={pkg.id}>
                      <TableCell>
                        {pkg.userId ? (
                          userMap[pkg.userId] ? (
                            <div className="text-sm truncate">
                              <div className="font-medium flex items-center gap-1 text-indigo-700">
                                <User className="w-3 h-3" />
                                {userMap[pkg.userId].name}</div>
                              {userMap[pkg.userId].phone && (
                                <div className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {userMap[pkg.userId].phone}
                                </div>
                              )}

                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">Đang tải...</div>
                          )
                        ) : (
                          <div className="text-sm text-gray-400">—</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium truncate text-teal-700">{pkg.packageName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium truncate text-teal-700">{pkg.fieldName || `Sân #${pkg.fieldId}`}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-gray-700">
                          <div className="truncate">
                            Từ: <span className="font-medium text-teal-700">{formatDate(pkg.startDate)}</span>
                          </div>
                          <div className="truncate">
                            Đến: <span className="font-medium text-teal-700">{formatDate(pkg.endDate)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-orange-500">{pkg.totalPrice?.toLocaleString("vi-VN")}₫</span>
                      </TableCell>

                      <TableCell>
                        {(() => {
                          const bookingStatus = (pkg.bookingStatus || "").toLowerCase();
                          const StatusIcon = getStatusIcon(bookingStatus);
                          return (
                            <span className={`inline-flex items-center truncate gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getBookingStatusColor(bookingStatus)}`}>
                              {StatusIcon}
                              {getBookingStatusText(bookingStatus)}
                            </span>
                          );
                        })()}
                      </TableCell>

                      <TableCell>
                        {(() => {
                          const payStatus = (pkg.paymentStatus || "").toLowerCase();
                          const PayIcon = getPaymentIcon(payStatus);
                          return (
                            <span className={`inline-flex items-center truncate gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentStatusColorVi(payStatus)}`}>
                              {PayIcon}
                              {getPaymentStatusTextVi(payStatus)}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-teal-600 hover:text-teal-700 rounded-full hover:bg-teal-50"
                            onClick={() => handleViewDetails(pkg)}
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-purple-600 hover:text-purple-700 rounded-full hover:bg-purple-50"
                            onClick={() => handleViewSessions(pkg)}
                            title="Danh sách buổi đặt"
                          >
                            <List className="w-4 h-4" />
                          </Button>
                          {showConfirm && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700 rounded-full hover:bg-green-50"
                              onClick={() => handleConfirmPackage(pkg.bookingPackageId)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {showComplete && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-emerald-600 hover:text-emerald-700 rounded-full hover:bg-emerald-50"
                              onClick={() => handleCompletePackage(pkg.bookingPackageId)}
                            >
                              <CheckSquare className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Modal chi tiết package */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedPackage(null);
        }}
        title="Thông tin gói sân cố định"
        className="max-w-3xl rounded-2xl border border-teal-200 shadow-lg bg-white"
      >
        {selectedPackage ? (
          <div className="space-y-6">
            {/* Khối thông tin gói */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-3">
                <Repeat className="w-5 h-5" />
                <span>Thông tin gói cố định</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-white/60 bg-white">
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" /> Tên gói
                  </p>
                  <p className="text-base font-semibold text-emerald-800 mt-1">{selectedPackage.packageName || "N/A"}</p>
                </div>
                <div className="p-3 rounded-xl border border-white/60 bg-white">
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" /> Sân
                  </p>
                  <p className="text-base font-semibold text-emerald-800 mt-1">{selectedPackage.fieldName || `Sân #${selectedPackage.fieldId || "N/A"}`}</p>
                </div>
              </div>
            </div>

            {/* Khối thời gian & giá */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex items-center gap-2 text-blue-800 font-semibold mb-3">
                <Calendar className="w-5 h-5" />
                <span>Thời gian & giá</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-white/70 bg-white">
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" /> Khoảng thời gian
                  </p>
                  <p className="text-sm font-semibold text-blue-800 mt-1">
                    Từ {new Date(selectedPackage.startDate).toLocaleDateString("vi-VN")} đến {new Date(selectedPackage.endDate).toLocaleDateString("vi-VN")}
                  </p>
                  {selectedPackage.createdAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Tạo: {new Date(selectedPackage.createdAt).toLocaleString("vi-VN")}
                    </p>
                  )}
                </div>
                <div className="p-3 rounded-xl border border-white/70 bg-white">
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-orange-600" /> Tổng giá
                  </p>
                  <p className="text-lg font-bold text-orange-600 mt-1">
                    {(selectedPackage.totalPrice || 0).toLocaleString("vi-VN")}₫
                  </p>
                </div>
              </div>
            </div>

            {/* Khối trạng thái */}
            <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
              <div className="flex items-center gap-2 text-amber-800 font-semibold mb-3">
                <CheckCircle className="w-5 h-5" />
                <span>Trạng thái</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-white/70 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-amber-600" />
                    Trạng thái booking
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor((selectedPackage.bookingStatus || "").toLowerCase())}`}>
                    {getStatusText((selectedPackage.bookingStatus || "").toLowerCase())}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-white/70 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    Trạng thái thanh toán
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentStatusColorVi((selectedPackage.paymentStatus || "").toLowerCase())}`}>
                    {getPaymentStatusTextVi((selectedPackage.paymentStatus || "").toLowerCase())}
                  </span>
                </div>
              </div>
            </div>


            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              {(() => {
                const status = (selectedPackage.bookingStatus || "").toLowerCase();
                const isPending = status.includes("pending");

                const showConfirm = isPending;

                return (
                  <div className="flex gap-3 ml-auto">
                    {showConfirm && (
                      <Button
                        onClick={() => {
                          handleConfirmPackage(selectedPackage.bookingPackageId);
                          setIsDetailModalOpen(false);
                          setSelectedPackage(null);
                        }}
                        className="rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Xác nhận
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        setSelectedPackage(null);
                      }}
                      className="rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
                    >
                      Đóng
                    </Button>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">Không tìm thấy thông tin gói.</p>
        )}
      </Modal>

      {/* Modal danh sách buổi đặt */}
      <Modal
        isOpen={isSessionsModalOpen}
        onClose={() => {
          setIsSessionsModalOpen(false);
          setSelectedPackageForSessions(null);
        }}
        title="Danh sách buổi đặt"
        className="max-w-3xl rounded-2xl border border-purple-200 shadow-lg bg-white"
      >
        {selectedPackageForSessions ? (
          <div className="space-y-2">
            {/* Thông tin gói */}
            {(() => {
              const sessions = packageSessions[selectedPackageForSessions.bookingPackageId] || packageSessions[selectedPackageForSessions.id] || [];
              const firstSession = sessions.length > 0 ? sessions[0] : null;
              const packageUserId = selectedPackageForSessions.userId || (firstSession ? (firstSession.userId || firstSession.userID) : null);
              const packageUserInfo = packageUserId ? sessionUserMap[packageUserId] : null;

              return (
                <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-2 text-purple-800 font-semibold mb-3">
                        <Repeat className="w-5 h-5" />
                        <span>{selectedPackageForSessions.packageName || "Gói sân cố định"}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">{selectedPackageForSessions.fieldName || `Sân #${selectedPackageForSessions.fieldId}`}</span>
                      </div>
                    </div>
                    <div>
                      {packageUserInfo && (
                        <div className="text-sm">
                          <div className="font-semibold text-xs text-indigo-800 mb-2 flex items-center gap-1">
                            <User className="w-4 h-4" />
                            Khách hàng
                          </div>
                          <div className="space-y-1 text-gray-700">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="font-medium">Tên:</span>
                              <span className="font-semibold text-indigo-700">{packageUserInfo.name}</span>
                            </div>
                            {packageUserInfo.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-indigo-600" />
                                <span className="font-medium">ĐT:</span>
                                <span>{packageUserInfo.phone}</span>
                              </div>
                            )}
                            {packageUserInfo.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                                <span className="font-medium">Email:</span>
                                <span>{packageUserInfo.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Danh sách sessions */}
            {(() => {
              const sessions = packageSessions[selectedPackageForSessions.bookingPackageId] || packageSessions[selectedPackageForSessions.id] || [];

              if (sessions.length === 0) {
                return (
                  <div className="text-center py-8 text-sm text-gray-600">
                    Chưa có buổi đặt nào cho gói này.
                  </div>
                );
              }

              const sortedSessions = [...sessions].sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : null;
                const dateB = b.date ? new Date(b.date) : null;
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1;
                if (!dateB) return -1;
                if (dateA.getTime() !== dateB.getTime()) {
                  return dateA.getTime() - dateB.getTime();
                }
                const startTimeA = a.startTime ? (typeof a.startTime === 'string' ? new Date(a.startTime) : a.startTime) : null;
                const startTimeB = b.startTime ? (typeof b.startTime === 'string' ? new Date(b.startTime) : b.startTime) : null;
                if (!startTimeA && !startTimeB) return 0;
                if (!startTimeA) return 1;
                if (!startTimeB) return -1;
                return startTimeA.getTime() - startTimeB.getTime();
              });

              // Đếm số buổi đã hủy và đã đặt
              const cancelledCount = sessions.filter(s => {
                const status = (s.sessionStatus || s.status || "").toLowerCase();
                return status.includes("cancel");
              }).length;
              const bookedCount = sessions.filter(s => {
                const status = (s.sessionStatus || s.status || "").toLowerCase();
                return !status.includes("cancel");
              }).length;

              return (
                <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-purple-800 font-semibold">
                      <Calendar className="w-5 h-5" />
                      <span>Danh sách buổi đặt ({sessions.length} buổi)</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="font-semibold">Đã đặt: {bookedCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                        <XCircle className="w-3.5 h-3.5" />
                        <span className="font-semibold">Đã hủy: {cancelledCount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {sortedSessions.map((session, idx) => {
                      // Lấy các thông tin từ JSON session
                      const packageSessionId = session.packageSessionId || session.id || session.sessionId;
                      const sessionDate = session.sessionDate || session.date ? new Date(session.sessionDate || session.date) : null;
                      const pricePerSession = session.pricePerSession || session.price;
                      const sessionStatus = session.sessionStatus || session.status || "";
                      const scheduleId = session.scheduleId || session.scheduleID;

                      // Lấy thông tin từ schedule
                      const scheduleData = scheduleId ? sessionScheduleDataMap[scheduleId] : null;
                      const scheduleStartTime = scheduleData?.startTime || null;
                      const scheduleEndTime = scheduleData?.endTime || null;
                      const scheduleSlotName = scheduleData?.slotName || null;

                      // Fallback về session time nếu không có schedule
                      const startTime = scheduleStartTime || (session.startTime ? (typeof session.startTime === 'string' ? new Date(session.startTime) : session.startTime) : null);
                      const endTime = scheduleEndTime || (session.endTime ? (typeof session.endTime === 'string' ? new Date(session.endTime) : session.endTime) : null);
                      const sessionStatusLower = sessionStatus.toLowerCase();
                      const isCancelled = sessionStatusLower.includes("cancel");
                      const isPast = endTime ? endTime < new Date() : false;

                      // Hàm lấy màu cho trạng thái
                      const getStatusBadgeClass = (status) => {
                        const statusLower = (status || "").toLowerCase();
                        if (statusLower.includes("cancel")) {
                          return "bg-red-100 text-red-700 border-red-200";
                        }
                        if (statusLower.includes("booking") || statusLower.includes("pending")) {
                          return "bg-green-100 text-teal-700 border-teal-200";
                        }
                        if (statusLower.includes("confirmed") || statusLower.includes("active")) {
                          return "bg-green-100 text-green-700 border-green-200";
                        }
                        if (statusLower.includes("completed")) {
                          return "bg-blue-100 text-blue-700 border-blue-200";
                        }
                        return "bg-gray-100 text-gray-700 border-gray-200";
                      };

                      const getStatusText = (status) => {
                        const statusLower = (status || "").toLowerCase();
                        if (statusLower.includes("cancel")) {
                          return "Đã hủy";
                        }
                        if (statusLower.includes("booking") || statusLower.includes("pending")) {
                          return "Đặt";
                        }
                      };

                      const getStatusIcon = (status) => {
                        const statusLower = (status || "").toLowerCase();
                        if (statusLower.includes("cancel")) {
                          return <XCircle className="w-4 h-4" />;
                        }
                        return <CheckCircle className="w-4 h-4" />;
                      };

                      return (
                        <div key={packageSessionId || idx} className="p-3 rounded-2xl border border-purple-300 bg-white">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="text-sm font-semibold text-purple-800">
                              Buổi {idx + 1}
                            </span>
                            {packageSessionId && (
                              <span className="text-xs text-gray-500">
                                #{packageSessionId}
                              </span>
                            )}
                            {sessionStatus && (
                              <span className={`px-2 py-0.5 flex items-center gap-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(sessionStatus)}`}>
                                {getStatusIcon(sessionStatus)}
                                {getStatusText(sessionStatus)}
                              </span>
                            )}
                          </div>

                          {/* Lịch trình, giá và button Hủy cùng 1 hàng */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            {/* Lịch trình */}
                            <div className="flex-1 min-w-[200px]">
                              <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-xs">
                                <div className="font-semibold text-blue-800 mb-1 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  Lịch trình
                                </div>
                                <div className="space-y-1 text-gray-700">
                                  {sessionDate && (
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="w-3 h-3 text-blue-600" />
                                      <span className="font-medium">Ngày:</span>
                                      <span>{sessionDate.toLocaleDateString("vi-VN")}</span>
                                    </div>
                                  )}
                                  {scheduleSlotName ? (
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3 h-3 text-blue-600" />
                                      <span className="font-medium">Giờ:</span>
                                      <span className="font-semibold">{scheduleSlotName}</span>
                                    </div>
                                  ) : startTime && endTime ? (
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3 h-3 text-blue-600" />
                                      <span className="font-medium">Giờ:</span>
                                      <span>
                                        {typeof startTime === 'string' ? startTime : startTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - {typeof endTime === 'string' ? endTime : endTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            {/* Giá */}
                            {pricePerSession && (
                              <div className="flex items-center gap-1.5 text-gray-700 p-2 rounded-lg bg-orange-50 border border-orange-100 text-xs">
                                <DollarSign className="w-3.5 h-3.5 text-orange-600" />
                                <span className="font-medium">Giá:</span>
                                <span className="font-bold text-orange-600">{Number(pricePerSession).toLocaleString("vi-VN")}₫</span>
                              </div>
                            )}

                            {/* Button Hủy */}
                            <div className="flex-shrink-0">
                              {!isCancelled && !isPast && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    handleCancelSession(session);
                                    // Reload sessions after cancel
                                    setTimeout(() => {
                                      const fetchSessions = async () => {
                                        try {
                                          const sessionsResult = await fetchBookingPackageSessionsByOwnerToken();
                                          if (sessionsResult.success && sessionsResult.data) {
                                            const sessionsMap = {};
                                            sessionsResult.data.forEach(s => {
                                              const pkgId = s.bookingPackageId || s.bookingPackageID;
                                              if (pkgId) {
                                                if (!sessionsMap[pkgId]) {
                                                  sessionsMap[pkgId] = [];
                                                }
                                                sessionsMap[pkgId].push(s);
                                              }
                                            });
                                            setPackageSessions(prev => ({ ...prev, ...sessionsMap }));
                                          }
                                        } catch (error) {
                                          console.error("Error fetching package sessions:", error);
                                        }
                                      };
                                      fetchSessions();
                                    }, 500);
                                  }}
                                  className="rounded-xl border-red-300 text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Hủy
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="flex justify-end items-center pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setIsSessionsModalOpen(false);
                  setSelectedPackageForSessions(null);
                }}
                className="rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
              >
                Đóng
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">Không tìm thấy thông tin gói.</p>
        )}
      </Modal>
    </>
  );
}
