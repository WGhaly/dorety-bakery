'use client';

import React from 'react';
import {
  SiteName,
  SiteTagline,
  ContactInfo,
  BusinessHours,
  PickupAddress,
  DeliveryInfo,
  FeatureGate,
  MaintenanceMode,
  SettingDisplay,
  SettingsProvider
} from '@/components/SettingsDisplay';
import { useFeatureFlags, useBusinessSettings, usePublicSettings } from '@/hooks/useSettings';

export default function SettingsDemoPage() {
  const { isEnabled, loading: flagsLoading } = useFeatureFlags();
  const { getBusinessHours, getPickupAddress, loading: businessLoading } = useBusinessSettings();
  const { getSetting, settings, loading: publicLoading } = usePublicSettings();

  if (flagsLoading || businessLoading || publicLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <SettingsProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Maintenance Mode Banner */}
          <MaintenanceMode />

          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="text-center">
              <SiteName as="h1" className="text-4xl font-bold text-gray-900 mb-2" />
              <SiteTagline as="p" className="text-xl text-gray-600" />
            </div>
          </div>

          {/* Settings Display Components Demo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <ContactInfo type="email" />
                </div>
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <ContactInfo type="phone" />
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Business Hours</h2>
              <BusinessHours />
            </div>

            {/* Pickup Location */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Pickup Location</h2>
              <PickupAddress />
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Delivery Information</h2>
              <DeliveryInfo />
            </div>
          </div>

          {/* Feature Gates Demo */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Feature Gates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Online Ordering</h3>
                <FeatureGate 
                  feature="online_ordering"
                  fallback={<span className="text-red-600">❌ Disabled</span>}
                >
                  <span className="text-green-600">✅ Enabled</span>
                </FeatureGate>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Delivery Service</h3>
                <FeatureGate 
                  feature="delivery"
                  fallback={<span className="text-red-600">❌ Disabled</span>}
                >
                  <span className="text-green-600">✅ Enabled</span>
                </FeatureGate>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Loyalty Program</h3>
                <FeatureGate 
                  feature="loyalty_program"
                  fallback={<span className="text-red-600">❌ Disabled</span>}
                >
                  <span className="text-green-600">✅ Enabled</span>
                </FeatureGate>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Pre-orders</h3>
                <FeatureGate 
                  feature="pre_orders"
                  fallback={<span className="text-red-600">❌ Disabled</span>}
                >
                  <span className="text-green-600">✅ Enabled</span>
                </FeatureGate>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Gift Cards</h3>
                <FeatureGate 
                  feature="gift_cards"
                  fallback={<span className="text-red-600">❌ Disabled</span>}
                >
                  <span className="text-green-600">✅ Enabled</span>
                </FeatureGate>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Maintenance Mode</h3>
                <FeatureGate 
                  feature="maintenance_mode"
                  fallback={<span className="text-green-600">❌ Normal Operation</span>}
                >
                  <span className="text-red-600">⚠️ Under Maintenance</span>
                </FeatureGate>
              </div>
            </div>
          </div>

          {/* Individual Settings Demo */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Individual Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Currency</h3>
                <SettingDisplay settingKey="currency" defaultValue="EGP" className="text-lg" />
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Language</h3>
                <SettingDisplay settingKey="default_language" defaultValue="en" className="text-lg" />
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Timezone</h3>
                <SettingDisplay settingKey="timezone" defaultValue="Africa/Cairo" className="text-lg" />
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Theme</h3>
                <SettingDisplay settingKey="theme" defaultValue="light" className="text-lg" />
              </div>
            </div>
          </div>

          {/* Raw Settings Data */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Raw Settings Data</h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(settings, null, 2)}
            </pre>
          </div>

          {/* Hook Values Demo */}
          <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Hook Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Business Hours</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm">
                  {JSON.stringify(getBusinessHours(), null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Pickup Address</h3>
                <p className="bg-gray-100 p-3 rounded text-sm">
                  {getPickupAddress()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingsProvider>
  );
}