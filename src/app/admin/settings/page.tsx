'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

// Simple toast implementation
const toast = {
  success: (message: string) => alert(`Success: ${message}`),
  error: (message: string) => alert(`Error: ${message}`),
};

interface Setting {
  id: string;
  key: string;
  value: string;
  category: 'GENERAL' | 'SEO' | 'SOCIAL' | 'BUSINESS' | 'FEATURES' | 'APPEARANCE' | 'ANALYTICS';
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SettingFormData {
  key: string;
  value: string;
  category: 'GENERAL' | 'SEO' | 'SOCIAL' | 'BUSINESS' | 'FEATURES' | 'APPEARANCE' | 'ANALYTICS';
  description: string;
  isPublic: boolean;
}

const SETTING_CATEGORIES = [
  { value: 'GENERAL', label: 'General Settings' },
  { value: 'SEO', label: 'SEO Settings' },
  { value: 'SOCIAL', label: 'Social Media' },
  { value: 'BUSINESS', label: 'Business Information' },
  { value: 'FEATURES', label: 'Feature Toggles' },
  { value: 'APPEARANCE', label: 'Appearance & Theme' },
  { value: 'ANALYTICS', label: 'Analytics & Tracking' },
];

// Common settings templates
const SETTING_TEMPLATES = {
  GENERAL: [
    { key: 'site_name', value: "Fadi&apos;s Bakery", description: 'Name of the bakery displayed throughout the site' },
    { key: 'site_tagline', value: 'Fresh baked goods daily', description: 'Short description/tagline for the bakery' },
    { key: 'contact_email', value: 'info@fadisbakery.com', description: 'Main contact email address' },
    { key: 'contact_phone', value: '+20123456789', description: 'Main contact phone number' },
    { key: 'delivery_fee', value: '25', description: 'Standard delivery fee in EGP' },
    { key: 'free_delivery_threshold', value: '200', description: 'Minimum order amount for free delivery' },
  ],
  BUSINESS: [
    { key: 'business_hours_weekday', value: '8:00 AM - 8:00 PM', description: 'Business hours for weekdays' },
    { key: 'business_hours_weekend', value: '9:00 AM - 6:00 PM', description: 'Business hours for weekends' },
    { key: 'pickup_address', value: '123 Main St, Cairo, Egypt', description: 'Address for customer pickup' },
    { key: 'delivery_areas', value: 'Heliopolis, Nasr City, Maadi', description: 'Delivery coverage areas' },
    { key: 'preparation_time', value: '45', description: 'Standard preparation time in minutes' },
  ],
  SEO: [
    { key: 'meta_description', value: 'Fresh baked goods and pastries in Cairo. Order online for delivery or pickup.', description: 'Default meta description for SEO' },
    { key: 'meta_keywords', value: 'bakery, fresh bread, pastries, Cairo, delivery', description: 'Default meta keywords' },
    { key: 'google_analytics_id', value: '', description: 'Google Analytics tracking ID' },
    { key: 'facebook_pixel_id', value: '', description: 'Facebook Pixel ID for tracking' },
  ],
  SOCIAL: [
    { key: 'facebook_url', value: '', description: 'Facebook page URL' },
    { key: 'instagram_url', value: '', description: 'Instagram profile URL' },
    { key: 'whatsapp_number', value: '', description: 'WhatsApp business number' },
  ],
  FEATURES: [
    { key: 'enable_reviews', value: 'true', description: 'Allow customers to leave product reviews' },
    { key: 'enable_wishlist', value: 'false', description: 'Enable customer wishlist functionality' },
    { key: 'enable_notifications', value: 'true', description: 'Send email notifications to customers' },
    { key: 'maintenance_mode', value: 'false', description: 'Enable maintenance mode (disables ordering)' },
  ],
};

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [filteredSettings, setFilteredSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [formData, setFormData] = useState<SettingFormData>({
    key: '',
    value: '',
    category: 'GENERAL',
    description: '',
    isPublic: false,
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user || session.user.role !== 'ADMIN') {
      redirect('/admin/login');
    }
  }, [session, status]);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    filterSettings();
  }, [settings, selectedCategory, searchTerm]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      } else {
        toast.error('Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Error fetching settings');
    } finally {
      setLoading(false);
    }
  };

  const filterSettings = () => {
    let filtered = settings;

    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(setting => setting.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(setting =>
        setting.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setting.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (setting.description && setting.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredSettings(filtered);
  };

  const handleSaveSetting = async () => {
    try {
      setSaving(true);

      const url = editingSetting 
        ? `/api/admin/settings/${encodeURIComponent(editingSetting.key)}`
        : '/api/admin/settings';
      
      const method = editingSetting ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingSetting ? 'Setting updated successfully' : 'Setting created successfully');
        await fetchSettings();
        resetForm();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save setting');
      }
    } catch (error) {
      console.error('Error saving setting:', error);
      toast.error('Error saving setting');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSetting = async (key: string) => {
    if (!confirm('Are you sure you want to delete this setting?')) return;

    try {
      const response = await fetch(`/api/admin/settings/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Setting deleted successfully');
        await fetchSettings();
      } else {
        toast.error('Failed to delete setting');
      }
    } catch (error) {
      console.error('Error deleting setting:', error);
      toast.error('Error deleting setting');
    }
  };

  const resetForm = () => {
    setFormData({
      key: '',
      value: '',
      category: 'GENERAL',
      description: '',
      isPublic: false,
    });
    setEditingSetting(null);
    setShowCreateForm(false);
  };

  const startEdit = (setting: Setting) => {
    setEditingSetting(setting);
    setFormData({
      key: setting.key,
      value: setting.value,
      category: setting.category,
      description: setting.description || '',
      isPublic: setting.isPublic,
    });
    setShowCreateForm(true);
  };

  const loadTemplate = (category: keyof typeof SETTING_TEMPLATES) => {
    const templates = SETTING_TEMPLATES[category];
    if (!templates) return;

    const confirmLoad = confirm(
      `This will create ${templates.length} default settings for ${category}. Continue?`
    );

    if (!confirmLoad) return;

    Promise.all(
      templates.map(template =>
        fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...template,
            category,
            isPublic: category === 'GENERAL' || category === 'BUSINESS',
          }),
        })
      )
    ).then(() => {
      toast.success(`${category} settings template loaded successfully`);
      fetchSettings();
    }).catch(() => {
      toast.error('Failed to load template');
    });
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      GENERAL: 'bg-blue-100 text-blue-800',
      SEO: 'bg-green-100 text-green-800',
      SOCIAL: 'bg-purple-100 text-purple-800',
      BUSINESS: 'bg-orange-100 text-orange-800',
      FEATURES: 'bg-indigo-100 text-indigo-800',
      APPEARANCE: 'bg-pink-100 text-pink-800',
      ANALYTICS: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {SETTING_CATEGORIES.find(cat => cat.value === category)?.label || category}
      </span>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-2 text-gray-600">
            Configure your bakery's settings and preferences
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Categories</option>
                {SETTING_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              {/* Search */}
              <input
                type="text"
                placeholder="Search settings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Add Setting
              </button>

              {/* Template Loader */}
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      loadTemplate(e.target.value as keyof typeof SETTING_TEMPLATES);
                      e.target.value = '';
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Load Template...</option>
                  {Object.keys(SETTING_TEMPLATES).map((category) => (
                    <option key={category} value={category}>
                      {SETTING_CATEGORIES.find(cat => cat.value === category)?.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">
                    {editingSetting ? 'Edit Setting' : 'Create New Setting'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.key}
                      onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                      disabled={!!editingSetting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
                      placeholder="e.g., site_name, contact_email"
                      required
                    />
                    {editingSetting && (
                      <p className="text-sm text-gray-500 mt-1">Setting key cannot be changed</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as SettingFormData['category'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    >
                      {SETTING_CATEGORIES.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      rows={2}
                      placeholder="Describe what this setting controls"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="isPublic" className="text-sm text-gray-700">
                      Public setting (accessible via public API)
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSetting}
                    disabled={saving || !formData.key || !formData.value}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : editingSetting ? 'Update Setting' : 'Create Setting'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Settings ({filteredSettings.length})
              </h2>
            </div>
          </div>

          {filteredSettings.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">
                {searchTerm || selectedCategory !== 'ALL' 
                  ? 'No settings match your filters' 
                  : 'No settings configured yet'
                }
              </div>
              {!searchTerm && selectedCategory === 'ALL' && (
                <p className="mt-2 text-sm text-gray-400">
                  Use the "Load Template" dropdown to add default settings
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Setting
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSettings.map((setting) => (
                    <tr key={setting.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{setting.key}</div>
                          {setting.description && (
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {setting.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={setting.value}>
                          {setting.value}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getCategoryBadge(setting.category)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {setting.isPublic ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Public
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                              Private
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(setting)}
                            className="text-amber-600 hover:text-amber-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSetting(setting.key)}
                            className="text-red-600 hover:text-red-700 ml-3"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}