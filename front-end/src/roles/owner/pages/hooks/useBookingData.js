import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  fetchBookingsByOwner,
  fetchBookingPackageSessionsByOwnerToken,
  fetchBookingPackagesByOwnerToken,
} from "../../../../shared/services/bookings";
import { normalizeDateString } from "../utils/scheduleUtils";

// Helper: fetch player profile via PlayerProfile API
const fetchPlayerProfile = async (playerId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(
      `https://sep490-g19-zxph.onrender.com/api/PlayerProfile/${playerId}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );
    const profileData = response.data || {};
    return {
      ok: true,
      data: profileData,
      profile: profileData,
    };
  } catch (error) {
    console.error(`Failed to fetch player profile ${playerId}:`, error);
    return {
      ok: false,
      reason: error.message || "Lấy thông tin khách hàng thất bại",
    };
  }
};

export const useBookingData = (currentUserId) => {
  const [bookings, setBookings] = useState([]);
  const [packageSessions, setPackageSessions] = useState([]);
  const [bookingPackages, setBookingPackages] = useState([]);
  const packageSessionsRef = useRef([]);

  const hydratePackageSessionsWithSchedules = useCallback(
    (packageSessionsList = [], schedules = []) => {
      if (!packageSessionsList.length) return packageSessionsList;
      const scheduleMap = new Map();
      schedules.forEach((s) => {
        const sid = s.scheduleId ?? s.ScheduleID ?? s.id;
        if (sid) {
          scheduleMap.set(Number(sid), s);
        }
      });

      return packageSessionsList.map((ps) => {
        const hasField = ps.fieldId || ps.fieldID || ps.FieldID;
        const hasSlot = ps.slotId || ps.slotID || ps.SlotID;
        const psScheduleId = ps.scheduleId || ps.scheduleID || ps.ScheduleID;
        if (hasField && hasSlot) return ps;

        const matchedSchedule = psScheduleId
          ? scheduleMap.get(Number(psScheduleId))
          : null;
        if (!matchedSchedule) return ps;

        return {
          ...ps,
          fieldId:
            hasField || matchedSchedule.fieldId || matchedSchedule.FieldId,
          slotId:
            hasSlot ||
            matchedSchedule.slotId ||
            matchedSchedule.SlotId ||
            matchedSchedule.SlotID,
          date: ps.date || ps.sessionDate || matchedSchedule.date,
        };
      });
    },
    []
  );

  const markSchedulesWithPackageSessions = useCallback(
    (schedules = [], packageSessionsList = []) => {
      if (!schedules.length || !packageSessionsList.length) return schedules;
      const hydratedSessions = hydratePackageSessionsWithSchedules(
        packageSessionsList,
        schedules
      );
      return schedules.map((schedule) => {
        const scheduleId =
          schedule.scheduleId ?? schedule.ScheduleID ?? schedule.id;
        const scheduleFieldId =
          schedule.fieldId ??
          schedule.FieldId ??
          schedule.fieldID ??
          schedule.FieldID;
        const scheduleSlotId =
          schedule.slotId ??
          schedule.SlotId ??
          schedule.SlotID ??
          schedule.slotID;
        const scheduleDateStr = normalizeDateString(schedule.date);

        const matched = hydratedSessions.some((ps) => {
          const statusLower = (
            ps.sessionStatus ||
            ps.status ||
            ""
          ).toLowerCase();
          if (statusLower.includes("cancel")) return false;

          const psScheduleId = ps.scheduleId || ps.scheduleID || ps.ScheduleID;
          if (
            psScheduleId &&
            scheduleId &&
            Number(psScheduleId) === Number(scheduleId)
          )
            return true;

          const psFieldId = ps.fieldId || ps.fieldID || ps.FieldID;
          const psSlotId = ps.slotId || ps.slotID || ps.SlotID;
          const psDateStr = normalizeDateString(ps.date || ps.sessionDate);

          return (
            Number(psFieldId) === Number(scheduleFieldId) &&
            Number(psSlotId) === Number(scheduleSlotId) &&
            psDateStr === scheduleDateStr
          );
        });

        return matched
          ? { ...schedule, status: "Booked", bookingType: "package" }
          : schedule;
      });
    },
    [hydratePackageSessionsWithSchedules]
  );

  const loadBookingPackages = useCallback(async () => {
    try {
      const result = await fetchBookingPackagesByOwnerToken();
      if (result.success && result.data) {
        setBookingPackages(result.data || []);
      } else {
        console.warn("Failed to load booking packages:", result.error);
        setBookingPackages([]);
      }
    } catch (error) {
      console.error("Error loading booking packages:", error);
      setBookingPackages([]);
    }
  }, []);

  const loadPackageSessions = useCallback(async () => {
    try {
      const result = await fetchBookingPackageSessionsByOwnerToken();
      if (result.success && result.data) {
        const normalizedSessions = (result.data || []).map((session) => ({
          ...session,
          scheduleId:
            session.scheduleId || session.scheduleID || session.ScheduleID,
          sessionId:
            session.packageSessionId ||
            session.bookingPackageSessionId ||
            session.id,
          bookingPackageId:
            session.bookingPackageId || session.bookingPackageID,
          date: session.sessionDate || session.date || session.Date,
          slotId: session.slotId || session.slotID || session.SlotID,
          fieldId: session.fieldId || session.fieldID || session.FieldID,
          userId: session.userId || session.userID,
          isPackageSession: true,
          bookingType: "package",
        }));

        const sessionsWithUserInfo = await Promise.all(
          normalizedSessions.map(async (session) => {
            const userId = session.userId || session.userID;
            if (userId) {
              try {
                const userResult = await fetchPlayerProfile(userId);
                if (userResult.ok && userResult.data) {
                  const userData =
                    userResult.profile ||
                    userResult.data ||
                    userResult.data.profile ||
                    userResult.data.data;
                  return {
                    ...session,
                    customerName:
                      userData?.fullName ||
                      userData?.name ||
                      userData?.userName ||
                      userData?.FullName ||
                      userData?.Name ||
                      "Khách hàng",
                    customerPhone:
                      userData?.phone ||
                      userData?.Phone ||
                      userData?.phoneNumber ||
                      userData?.PhoneNumber ||
                      "",
                    customerEmail: userData?.email || userData?.Email || "",
                  };
                }
              } catch (error) {
                console.error(
                  `Failed to fetch customer profile ${userId} for package session:`,
                  error
                );
              }
            }
            return session;
          })
        );

        setPackageSessions(sessionsWithUserInfo || []);
        packageSessionsRef.current = sessionsWithUserInfo || [];
      } else {
        console.warn("Failed to load package sessions:", result.error);
        setPackageSessions([]);
        packageSessionsRef.current = [];
      }
    } catch (error) {
      console.error("Error loading package sessions:", error);
      setPackageSessions([]);
      packageSessionsRef.current = [];
    }
  }, []);

  const loadBookings = useCallback(async () => {
    try {
      if (!currentUserId) {
        setBookings([]);
        return;
      }

      const result = await fetchBookingsByOwner(currentUserId);
      if (result.success && result.data) {
        const bookingsWithUserInfo = await Promise.all(
          result.data.map(async (booking) => {
            const userId = booking.userId || booking.userID;
            if (userId) {
              try {
                const userResult = await fetchPlayerProfile(userId);
                if (userResult.ok && userResult.data) {
                  const userData =
                    userResult.profile ||
                    userResult.data ||
                    userResult.data.profile ||
                    userResult.data.data;
                  return {
                    ...booking,
                    customerName:
                      userData?.fullName ||
                      userData?.name ||
                      userData?.userName ||
                      userData?.FullName ||
                      userData?.Name ||
                      "Khách hàng",
                    customerPhone:
                      userData?.phone ||
                      userData?.Phone ||
                      userData?.phoneNumber ||
                      userData?.PhoneNumber ||
                      "",
                    customerEmail: userData?.email || userData?.Email || "",
                  };
                }
              } catch (error) {
                console.error(
                  `Failed to fetch customer profile ${userId}:`,
                  error
                );
              }
            }
            return booking;
          })
        );

        setBookings(bookingsWithUserInfo || []);
      } else {
        console.warn("Failed to load bookings:", result.error);
        setBookings([]);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      setBookings([]);
    }
  }, [currentUserId]);

  useEffect(() => {
    packageSessionsRef.current = packageSessions;
  }, [packageSessions]);

  useEffect(() => {
    if (currentUserId) {
      loadBookings();
      loadPackageSessions();
      loadBookingPackages();
    }
  }, [currentUserId, loadBookings, loadPackageSessions, loadBookingPackages]);

  return {
    bookings,
    packageSessions,
    bookingPackages,
    packageSessionsRef,
    hydratePackageSessionsWithSchedules,
    markSchedulesWithPackageSessions,
    loadBookings,
    loadPackageSessions,
    loadBookingPackages,
  };
};
