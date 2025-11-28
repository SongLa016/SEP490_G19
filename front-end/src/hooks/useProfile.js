import { useState, useEffect } from "react";
import {
  profileService,
  validateProfileData,
  formatProfileForAPI,
} from "../services/profileService";

export const useProfile = (userId) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);


  const loadProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const profileData = await profileService.getProfile(userId);
      setProfile(profileData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

 
  const saveProfile = async (profileData) => {
    if (!userId) return;

    try {
      setSaving(true);
      setError(null);

     
      const validation = validateProfileData(profileData);
      if (!validation.isValid) {
        throw new Error(JSON.stringify(validation.errors));
      }

      const formattedData = formatProfileForAPI(profileData);

  
      const savedProfile = await profileService.updateProfile(
        userId,
        formattedData
      );
      setProfile(savedProfile);

      return savedProfile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };


  const uploadAvatar = async (file) => {
    if (!userId || !file) return;

    try {
      setSaving(true);
      setError(null);

      const result = await profileService.uploadAvatar(userId, file);

   
      setProfile((prev) => ({
        ...prev,
        avatar: result.avatarUrl,
      }));

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
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

export const useProfileStats = (userId) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const statsData = await profileService.getStats(userId);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
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

    try {
      setLoading(true);
      setError(null);
   
      const settingsData = await profileService.getSettings(userId);
      setSettings(settingsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings) => {
    if (!userId) return;

    try {
      setSaving(true);
      setError(null);

      const savedSettings = await profileService.updateSettings(
        userId,
        newSettings
      );
      setSettings(savedSettings);

      return savedSettings;
    } catch (err) {
      setError(err.message);
      throw err;
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
