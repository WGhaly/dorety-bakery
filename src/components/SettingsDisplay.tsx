'use client';

import React from 'react';
import { usePublicSettings, useSetting, useBusinessSettings, useFeatureFlags, type SettingValue } from '@/hooks/useSettings';

interface SettingDisplayProps {
  settingKey: string;
  defaultValue?: string;
  className?: string;
  as?: React.ElementType;
  children?: (value: string) => React.ReactNode;
}

// Component to display a single setting value
export function SettingDisplay({ 
  settingKey, 
  defaultValue = '', 
  className = '', 
  as = 'span',
  children 
}: SettingDisplayProps) {
  const { value, loading } = useSetting(settingKey, defaultValue);

  if (loading) {
    const ComponentTag = as as React.ElementType;
    return <ComponentTag className={className}>Loading...</ComponentTag>;
  }

  const displayValue = value || defaultValue;

  if (children) {
    return <>{children(displayValue)}</>;
  }

  const ComponentTag = as as React.ElementType;
  return <ComponentTag className={className}>{displayValue}</ComponentTag>;
}

// Component to display site name
export function SiteName({ className = '', as = 'span' }: {
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <SettingDisplay 
      settingKey="site_name" 
      defaultValue="Fadi's Bakery" 
      className={className} 
      as={as} 
    />
  );
}

// Component to display site tagline
export function SiteTagline({ className = '', as = 'span' }: {
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <SettingDisplay 
      settingKey="site_tagline" 
      defaultValue="Fresh baked goods daily" 
      className={className} 
      as={as} 
    />
  );
}

// Component to display contact information
export function ContactInfo({ 
  type, 
  className = '', 
  as = 'span' 
}: {
  type: 'email' | 'phone';
  className?: string;
  as?: React.ElementType;
}) {
  const settingKey = type === 'email' ? 'contact_email' : 'contact_phone';
  const defaultValue = type === 'email' ? 'info@fadisbakery.com' : '+20123456789';

  return (
    <SettingDisplay 
      settingKey={settingKey} 
      defaultValue={defaultValue} 
      className={className} 
      as={as} 
    />
  );
}

// Component to display business hours
export function BusinessHours({ className = '' }: { className?: string }) {
  const { getBusinessHours, loading } = useBusinessSettings();

  if (loading) {
    return <div className={className}>Loading...</div>;
  }

  const hours = getBusinessHours();

  return (
    <div className={className}>
      <div>
        <strong>Weekdays:</strong> {hours.weekday}
      </div>
      <div>
        <strong>Weekends:</strong> {hours.weekend}
      </div>
    </div>
  );
}

// Component to display pickup address
export function PickupAddress({ className = '', as = 'div' }: {
  className?: string;
  as?: React.ElementType;
}) {
  const { getPickupAddress, loading } = useBusinessSettings();

  if (loading) {
    const ComponentTag = as as React.ElementType;
    return <ComponentTag className={className}>Loading...</ComponentTag>;
  }

  const ComponentTag = as as React.ElementType;
  return <ComponentTag className={className}>{getPickupAddress()}</ComponentTag>;
}

// Component to conditionally render content based on feature flags
export function FeatureGate({ 
  feature, 
  children, 
  fallback = null 
}: {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isEnabled, loading } = useFeatureFlags();

  if (loading) {
    return <>{fallback}</>;
  }

  return isEnabled(feature) ? <>{children}</> : <>{fallback}</>;
}

// Component to display delivery information
export function DeliveryInfo({ className = '' }: { className?: string }) {
  const { getSetting } = usePublicSettings();

  const deliveryFee = getSetting('delivery_fee', '25');
  const freeThreshold = getSetting('free_delivery_threshold', '200');

  return (
    <div className={className}>
      <div>
        <strong>Delivery Fee:</strong> {deliveryFee} EGP
      </div>
      <div>
        <strong>Free Delivery:</strong> Orders over {freeThreshold} EGP
      </div>
    </div>
  );
}

// Component to display maintenance mode message
export function MaintenanceMode() {
  const { isEnabled } = useFeatureFlags();

  if (!isEnabled('maintenance_mode')) {
    return null;
  }

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            We are currently under maintenance. Orders are temporarily disabled.
          </p>
        </div>
      </div>
    </div>
  );
}

// Context provider for settings (for performance optimization)
export const SettingsContext = React.createContext<{
  settings: Record<string, SettingValue>;
  loading: boolean;
  error: string | null;
}>({
  settings: {},
  loading: true,
  error: null,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { settings, loading, error } = usePublicSettings();

  return (
    <SettingsContext.Provider value={{ settings, loading, error }}>
      {children}
    </SettingsContext.Provider>
  );
}

// Hook to use settings from context
export function useSettingsContext() {
  const context = React.useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
}