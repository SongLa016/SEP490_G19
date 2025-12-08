import { useState, useEffect } from "react";
import {
  profileService,
  validateProfileData,
  formatProfileForAPI,
} from "../services/profileService";

/* ============================================================================
   PROFILE INFO HOOK
============================================================================ */
export const useProfile = (userId) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load profile
  const loadProfile = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await profileService.getProfile(userId);
      setProfile(result);
    } catch (ex) {
      setError(ex?.message);
    } finally {
      setLoading(false);
    }
  };

  // Save profile
  const saveProfile = async (incoming) => {
    if (!userId) return;

    setSaving(true);
    setError(null);

    try {
      const validation = validateProfileData(incoming);

      if (!validation.isValid) {
        throw new Error(JSON.stringify(validation.errors));
      }

      const dataToSend = formatProfileForAPI(incoming);
      const updated = await profileService.updateProfile(userId, dataToSend);

      setProfile(updated);
      return updated;
    } catch (ex) {
      setError(ex?.message);
      throw ex;
    } finally {
      setSaving(false);
    }
  };

  // Upload avatar
  const uploadAvatar = async (file) => {
    if (!userId || !file) return;

    setSaving(true);
    setError(null);

    try {
      const res = await profileService.uploadAvatar(userId, file);

      setProfile((prev) =>
        prev
          ? { ...prev, avatar: res.avatarUrl }
          : { avatar: res.avatarUrl }
      );

      return res;
    } catch (ex) {
      setError(ex?.message);
      throw ex;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  return {
    profile,
    loading,
    error,
    saving,
    loadProfile,
    saveProfile,
    uploadAvatar,
  };
};

/* ============================================================================
   PROFILE STATS HOOK
============================================================================ */
export const useProfileStats = (userId) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await profileService.getStats(userId);
      setStats(res);
    } catch (ex) {
      setError(ex?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [userId]);

  return {
    stats,
    loading,
    error,
    loadStats,
  };
};

/* ============================================================================
   PROFILE SETTINGS HOOK
============================================================================ */
export const useProfileSettings = (userId) => {
  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      bookingReminders: true,
      promotionalEmails: false,
    },
    privacy: {
      publicProfile: true,
      showPhone: false,
      showAddress: false,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadSettings = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await profileService.getSettings(userId);
      setSettings(result);
    } catch (ex) {
      setError(ex?.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (incoming) => {
    if (!userId) return;

    setSaving(true);
    setError(null);

    try {
      const result = await profileService.updateSettings(userId, incoming);
      setSettings(result);
      return result;
    } catch (ex) {
      setError(ex?.message);
      throw ex;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [userId]);

  return {
    settings,
    loading,
    saving,
    error,
    loadSettings,
    saveSettings,
  };
};
