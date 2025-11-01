'use client';

import { useState, useEffect, useCallback } from 'react';
import { SiteConfiguration } from '@prisma/client';

export interface SettingValue {
  value: string;
  category: string;
  description?: string;
}

// Hook for fetching and managing public settings
export function usePublicSettings() {
  const [settings, setSettings] = useState<Record<string, SettingValue>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      setSettings(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getSetting = useCallback((key: string, defaultValue?: string): string => {
    return settings[key]?.value || defaultValue || '';
  }, [settings]);

  const getSettingsByCategory = useCallback((category: string): Record<string, string> => {
    return Object.entries(settings)
      .filter(([_, setting]) => setting.category === category)
      .reduce((acc, [key, setting]) => {
        acc[key] = setting.value;
        return acc;
      }, {} as Record<string, string>);
  }, [settings]);

  return {
    settings,
    loading,
    error,
    getSetting,
    getSettingsByCategory,
    refetch: fetchSettings,
  };
}

// Hook for fetching specific settings
export function useSetting(key: string, defaultValue?: string) {
  const [value, setValue] = useState<string>(defaultValue || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/settings?keys=${encodeURIComponent(key)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch setting');
        }
        
        const data = await response.json();
        setValue(data.settings[key]?.value || defaultValue || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch setting');
        setValue(defaultValue || '');
      } finally {
        setLoading(false);
      }
    };

    fetchSetting();
  }, [key, defaultValue]);

  return { value, loading, error };
}

// Hook for admin settings management
export function useAdminSettings() {
  const [settings, setSettings] = useState<SiteConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async (category?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = category ? `/api/admin/settings?category=${category}` : '/api/admin/settings';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      setSettings(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSetting = useCallback(async (settingData: {
    key: string;
    value: string;
    category: string;
    description?: string;
    isPublic?: boolean;
  }) => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create setting');
      }

      const data = await response.json();
      setSettings(prev => [...prev, data.setting]);
      return data.setting;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateSetting = useCallback(async (key: string, updates: {
    value?: string;
    category?: string;
    description?: string;
    isPublic?: boolean;
  }) => {
    try {
      const response = await fetch(`/api/admin/settings/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update setting');
      }

      const data = await response.json();
      setSettings(prev => prev.map(setting => 
        setting.key === key ? data.setting : setting
      ));
      return data.setting;
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteSetting = useCallback(async (key: string) => {
    try {
      const response = await fetch(`/api/admin/settings/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete setting');
      }

      setSettings(prev => prev.filter(setting => setting.key !== key));
    } catch (err) {
      throw err;
    }
  }, []);

  const bulkUpdateSettings = useCallback(async (settingsData: Array<{
    key: string;
    value: string;
    category: string;
    description?: string;
    isPublic?: boolean;
  }>) => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update settings');
      }

      const data = await response.json();
      setSettings(data.settings);
      return data.settings;
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    createSetting,
    updateSetting,
    deleteSetting,
    bulkUpdateSettings,
  };
}

// Hook for feature flags
export function useFeatureFlags() {
  const { getSettingsByCategory, loading, error } = usePublicSettings();
  
  const features = getSettingsByCategory('FEATURES');
  
  const isEnabled = useCallback((feature: string): boolean => {
    const key = feature.startsWith('enable_') ? feature : `enable_${feature}`;
    return features[key]?.toLowerCase() === 'true';
  }, [features]);

  return {
    features,
    isEnabled,
    loading,
    error,
  };
}

// Hook for business settings
export function useBusinessSettings() {
  const { getSettingsByCategory, loading, error } = usePublicSettings();
  
  const businessSettings = getSettingsByCategory('BUSINESS');
  
  return {
    businessSettings,
    loading,
    error,
    getBusinessHours: () => ({
      weekday: businessSettings.business_hours_weekday || '8:00 AM - 8:00 PM',
      weekend: businessSettings.business_hours_weekend || '9:00 AM - 6:00 PM',
    }),
    getPickupAddress: () => businessSettings.pickup_address || '',
    getPreparationTime: () => parseInt(businessSettings.preparation_time || '45'),
  };
}