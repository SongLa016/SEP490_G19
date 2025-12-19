import { useState, useMemo, useCallback, useEffect } from "react";
import { getRecurringStatus } from "../utils";

/**
 * Hook quản lý filter và pagination cho booking
 */
export function useBookingFilters(bookings, groupedBookings, playerHistories) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showRecurringDetails, setShowRecurringDetails] = useState({});
  const [expandedParticipants, setExpandedParticipants] = useState({});
  const [activeTab, setActiveTab] = useState("bookings");

  const pageSize = 5;

  // Scroll to top khi filter thay đổi
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [statusFilter, sortBy, dateFrom, dateTo, currentPage]);

  // Lấy giá trị ngày để filter
  const getFilterDateValue = useCallback(
    (booking) => booking?.createdAt || booking?.date,
    []
  );

  // Lấy bookingId để sắp xếp
  const getBookingIdValue = useCallback((booking) => {
    const raw = booking?.bookingId ?? booking?.id ?? 0;
    const numeric = Number(String(raw).replace(/[^\d]/g, ""));
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
  }, []);

  // Lấy requestId để sắp xếp
  const getRequestIdValue = useCallback((history) => {
    const raw =
      history?.matchRequestId ??
      history?.matchRequestID ??
      history?.requestId ??
      history?.requestID ??
      history?.id ??
      history?.historyId ??
      0;
    const numeric = Number(String(raw).replace(/[^\d]/g, ""));
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
  }, []);

  // Kiểm tra ngày trong khoảng
  const withinDateRange = useCallback(
    (dateStr) => {
      if (!dateStr) return true;
      const parseDateSafe = (value) => {
        if (!value) return null;
        if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
            const [y, m, d] = trimmed.split("T")[0].split("-").map(Number);
            const dt = new Date(y, m - 1, d);
            return isNaN(dt.getTime()) ? null : dt;
          }
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
            const [d, m, y] = trimmed.split("/").map(Number);
            const dt = new Date(y, m - 1, d);
            return isNaN(dt.getTime()) ? null : dt;
          }
          const dt = new Date(trimmed);
          return isNaN(dt.getTime()) ? null : dt;
        }
        return null;
      };

      const d = parseDateSafe(dateStr);
      if (!d) return true;
      const from = parseDateSafe(dateFrom);
      const to = parseDateSafe(dateTo);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    },
    [dateFrom, dateTo]
  );

  // Kiểm tra match history có khớp status filter
  const matchHistoryMatchesStatus = useCallback(
    (history) => {
      if (statusFilter === "all") return true;
      const status = (
        history?.finalStatus ||
        history?.status ||
        ""
      ).toLowerCase();
      if (statusFilter === "completed")
        return status === "completed" || status === "matched";
      if (statusFilter === "confirmed")
        return status === "confirmed" || status === "matched";
      if (statusFilter === "cancelled")
        return status === "cancelled" || status === "expired";
      return status === statusFilter;
    },
    [statusFilter]
  );

  // Danh sách booking đơn đã filter
  const visibleSingles = useMemo(() => {
    const base = bookings.filter((b) => !b.isRecurring);
    const filtered = base.filter((b) => {
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        b.id.toLowerCase().includes(q) ||
        (b.fieldName || "").toLowerCase().includes(q) ||
        (b.address || "").toLowerCase().includes(q);
      const normalizedStatus = String(
        b.status || b.bookingStatus || ""
      ).toLowerCase();
      const matchStatus =
        statusFilter === "all" || normalizedStatus === statusFilter;
      const matchDate = withinDateRange(getFilterDateValue(b));
      return matchQuery && matchStatus && matchDate;
    });

    return filtered.sort((a, b) => {
      const idA = getBookingIdValue(a);
      const idB = getBookingIdValue(b);
      if (sortBy === "newest") return idB - idA;
      if (sortBy === "oldest") return idA - idB;
      if (sortBy === "price-asc") return (a.price || 0) - (b.price || 0);
      if (sortBy === "price-desc") return (b.price || 0) - (a.price || 0);
      return 0;
    });
  }, [
    bookings,
    query,
    statusFilter,
    sortBy,
    withinDateRange,
    getFilterDateValue,
    getBookingIdValue,
  ]);

  // Phân trang booking đơn
  const totalSingleBookings = visibleSingles.length;
  const totalPages = Math.max(1, Math.ceil(totalSingleBookings / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedSingles = visibleSingles.slice(startIndex, endIndex);

  // Danh sách nhóm booking định kỳ đã filter
  const visibleGroups = useMemo(() => {
    const groups = Object.values(groupedBookings || {});
    const filtered = groups.filter((group) => {
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        (group.fieldName || "").toLowerCase().includes(q) ||
        (group.address || "").toLowerCase().includes(q);
      const groupStatus = getRecurringStatus(group);
      const matchStatus =
        statusFilter === "all" || groupStatus === statusFilter;
      const anyInRange = (group.bookings || []).some((b) =>
        withinDateRange(getFilterDateValue(b))
      );
      return matchQuery && matchStatus && anyInRange;
    });

    return filtered.sort((a, b) => {
      const aId = (a.bookings || []).reduce(
        (acc, cur) => Math.max(acc, getBookingIdValue(cur)),
        0
      );
      const bId = (b.bookings || []).reduce(
        (acc, cur) => Math.max(acc, getBookingIdValue(cur)),
        0
      );
      if (sortBy === "newest") return bId - aId;
      if (sortBy === "oldest") return aId - bId;
      if (sortBy === "price-asc")
        return (
          (a.price || 0) * (a.totalWeeks || 1) -
          (b.price || 0) * (b.totalWeeks || 1)
        );
      if (sortBy === "price-desc")
        return (
          (b.price || 0) * (b.totalWeeks || 1) -
          (a.price || 0) * (a.totalWeeks || 1)
        );
      return 0;
    });
  }, [
    groupedBookings,
    query,
    statusFilter,
    sortBy,
    withinDateRange,
    getFilterDateValue,
    getBookingIdValue,
  ]);

  // Danh sách lịch sử match đã filter và sắp xếp
  const sortedPlayerHistories = useMemo(() => {
    const list = (playerHistories || []).filter(matchHistoryMatchesStatus);
    return list.sort((a, b) => {
      const aId = getRequestIdValue(a);
      const bId = getRequestIdValue(b);
      if (sortBy === "oldest") return aId - bId;
      return bId - aId;
    });
  }, [playerHistories, sortBy, matchHistoryMatchesStatus, getRequestIdValue]);

  // Thống kê booking
  const stats = useMemo(() => {
    const total = bookings.length;
    const completed = bookings.filter((b) => b.status === "completed").length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;
    const upcoming = bookings.filter((b) => b.status === "confirmed").length;
    const pending = bookings.filter((b) => b.status === "pending").length;
    return { total, completed, cancelled, upcoming, pending };
  }, [bookings]);

  // Toggle hiển thị chi tiết recurring
  const toggleRecurringDetails = useCallback((groupId) => {
    setShowRecurringDetails((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }, []);

  // Toggle hiển thị participants
  const toggleExpandedParticipants = useCallback((bookingId) => {
    setExpandedParticipants((prev) => ({
      ...prev,
      [bookingId]: !prev[bookingId],
    }));
  }, []);

  // Reset tất cả filter
  const resetFilters = useCallback(() => {
    setQuery("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("newest");
    setCurrentPage(1);
  }, []);

  return {
    // Filter states
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    activeTab,
    setActiveTab,
    // UI states
    showRecurringDetails,
    expandedParticipants,
    toggleRecurringDetails,
    toggleExpandedParticipants,
    // giá trị tính toán
    visibleSingles,
    visibleGroups,
    paginatedSingles,
    sortedPlayerHistories,
    stats,
    totalSingleBookings,
    totalPages,
    startIndex,
    endIndex,
    pageSize,

    // hàm xử lý
    resetFilters,
  };
}

export default useBookingFilters;
