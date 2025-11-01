import { prisma } from '@/lib/db';
import { ConfigCategory, Prisma } from '@prisma/client';

interface CachedSetting {
  value: string;
  category: string;
  description: string | null;
}

// Cache for settings to avoid repeated database queries
let settingsCache: Record<string, CachedSetting> = {};
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get a specific setting value by key
 */
export async function getSetting(key: string, defaultValue?: string): Promise<string | null> {
  try {
    const setting = await prisma.siteConfiguration.findFirst({
      where: { key },
      select: { value: true },
    });

    return setting?.value || defaultValue || null;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return defaultValue || null;
  }
}

/**
 * Get multiple settings by keys
 */
export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  try {
    const settings = await prisma.siteConfiguration.findMany({
      where: { key: { in: keys } },
      select: { key: true, value: true },
    });

    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {};
  }
}

/**
 * Get all public settings (cached)
 */
export async function getPublicSettings(): Promise<Record<string, CachedSetting>> {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (cacheExpiry > now && Object.keys(settingsCache).length > 0) {
    return settingsCache;
  }

  try {
    const settings = await prisma.siteConfiguration.findMany({
      where: { isPublic: true },
      select: {
        key: true,
        value: true,
        category: true,
        description: true,
      },
    });

    // Update cache
    settingsCache = settings.reduce((acc, setting) => {
      acc[setting.key] = {
        value: setting.value,
        category: setting.category,
        description: setting.description,
      };
      return acc;
    }, {} as Record<string, CachedSetting>);

    cacheExpiry = now + CACHE_DURATION;
    return settingsCache;
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return {};
  }
}

/**
 * Get settings by category
 */
export async function getSettingsByCategory(category: string): Promise<Record<string, string>> {
  try {
    const settings = await prisma.siteConfiguration.findMany({
      where: { category: category as ConfigCategory },
      select: { key: true, value: true },
    });

    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error(`Error fetching settings for category ${category}:`, error);
    return {};
  }
}

/**
 * Set a setting value (upsert)
 */
export async function setSetting(
  key: string, 
  value: string, 
  options?: {
    category?: string;
    description?: string;
    isPublic?: boolean;
  }
): Promise<boolean> {
  try {
    await prisma.siteConfiguration.upsert({
      where: { key },
      update: { 
        value,
        ...(options?.description && { description: options.description }),
        ...(options?.isPublic !== undefined && { isPublic: options.isPublic }),
      },
      create: {
        key,
        value,
        category: (options?.category as ConfigCategory) || ConfigCategory.GENERAL,
        description: options?.description,
        isPublic: options?.isPublic || false,
      },
    });

    // Clear cache to force refresh
    cacheExpiry = 0;
    settingsCache = {};

    return true;
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    return false;
  }
}

/**
 * Delete a setting
 */
export async function deleteSetting(key: string): Promise<boolean> {
  try {
    await prisma.siteConfiguration.delete({
      where: { key },
    });

    // Clear cache
    cacheExpiry = 0;
    settingsCache = {};

    return true;
  } catch (error) {
    console.error(`Error deleting setting ${key}:`, error);
    return false;
  }
}

/**
 * Get business settings (common utility)
 */
export async function getBusinessSettings() {
  return await getSettingsByCategory('BUSINESS');
}

/**
 * Get general settings (common utility)
 */
export async function getGeneralSettings() {
  return await getSettingsByCategory('GENERAL');
}

/**
 * Get feature flags
 */
export async function getFeatureFlags(): Promise<Record<string, boolean>> {
  try {
    const settings = await getSettingsByCategory('FEATURES');
    
    // Convert string values to boolean
    return Object.entries(settings).reduce((acc, [key, value]) => {
      acc[key] = value.toLowerCase() === 'true';
      return acc;
    }, {} as Record<string, boolean>);
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return {};
  }
}

/**
 * Check if a feature is enabled
 */
export async function isFeatureEnabled(feature: string): Promise<boolean> {
  try {
    const value = await getSetting(`enable_${feature}`, 'false');
    return value?.toLowerCase() === 'true';
  } catch (error) {
    console.error(`Error checking feature ${feature}:`, error);
    return false;
  }
}

/**
 * Initialize default settings
 */
export async function initializeDefaultSettings(): Promise<void> {
  const defaultSettings: Prisma.SiteConfigurationCreateInput[] = [
    // General Settings
    { key: 'site_name', value: "Fadi's Bakery", category: ConfigCategory.GENERAL, isPublic: true, description: 'Name of the bakery' },
    { key: 'site_tagline', value: 'Fresh baked goods daily', category: ConfigCategory.GENERAL, isPublic: true, description: 'Bakery tagline' },
    { key: 'contact_email', value: 'info@fadisbakery.com', category: ConfigCategory.GENERAL, isPublic: true, description: 'Contact email' },
    { key: 'contact_phone', value: '+20123456789', category: ConfigCategory.GENERAL, isPublic: true, description: 'Contact phone' },
    { key: 'delivery_fee', value: '25', category: ConfigCategory.GENERAL, isPublic: true, description: 'Delivery fee in EGP' },
    { key: 'free_delivery_threshold', value: '200', category: ConfigCategory.GENERAL, isPublic: true, description: 'Free delivery threshold' },
    
    // Business Settings
    { key: 'business_hours_weekday', value: '8:00 AM - 8:00 PM', category: ConfigCategory.BUSINESS, isPublic: true, description: 'Weekday hours' },
    { key: 'business_hours_weekend', value: '9:00 AM - 6:00 PM', category: ConfigCategory.BUSINESS, isPublic: true, description: 'Weekend hours' },
    { key: 'pickup_address', value: '123 Main St, Cairo, Egypt', category: ConfigCategory.BUSINESS, isPublic: true, description: 'Pickup address' },
    { key: 'preparation_time', value: '45', category: ConfigCategory.BUSINESS, isPublic: true, description: 'Preparation time in minutes' },
    
    // Features
    { key: 'enable_reviews', value: 'true', category: ConfigCategory.FEATURES, isPublic: false, description: 'Enable product reviews' },
    { key: 'enable_notifications', value: 'true', category: ConfigCategory.FEATURES, isPublic: false, description: 'Enable email notifications' },
    { key: 'maintenance_mode', value: 'false', category: ConfigCategory.FEATURES, isPublic: true, description: 'Maintenance mode status' },
  ];

  try {
    for (const setting of defaultSettings) {
      await prisma.siteConfiguration.upsert({
        where: { key: setting.key },
        update: {},
        create: setting,
      });
    }
    
    console.log('Default settings initialized');
  } catch (error) {
    console.error('Error initializing default settings:', error);
  }
}