'use client';

import { Save, Smartphone, Loader2, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

export default function GeneralSettingsPage() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Mobile App Settings State
    const [mobileSettings, setMobileSettings] = useState({
        android_app_url: '',
        ios_app_url: '',
        enable_android: true,
        enable_ios: true
    });

    // Course Settings State
    const [strictMapping, setStrictMapping] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/settings?timestamp=${new Date().getTime()}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store'
            });
            const json = await res.json();
            if (json.status) {
                if (json.data?.mobile_app_links) {
                    const mobileData = typeof json.data.mobile_app_links === 'string' ? JSON.parse(json.data.mobile_app_links) : json.data.mobile_app_links;
                    setMobileSettings({
                        ...mobileSettings,
                        ...mobileData
                    });
                }
                if (json.data?.['course.strict_job_mapping'] !== undefined) {
                    const strictRaw = json.data['course.strict_job_mapping'];
                    const strictVal = typeof strictRaw === 'string' ? strictRaw === 'true' : strictRaw === true;
                    setStrictMapping(strictVal);
                }
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            toast.error('Failed', 'Could not load platform settings.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveMobileSettings = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/settings', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    key: 'mobile_app_links',
                    value: mobileSettings,
                    description: 'Configuration for the mobile application download links used across the platform.'
                })
            });
            const json = await res.json();

            if (json.status) {
                toast.success('Settings Saved', 'Mobile application settings have been updated.');
            } else {
                toast.error('Save Failed', json.message);
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Error', 'An unexpected error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveCourseSettings = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/settings', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    key: 'course.strict_job_mapping',
                    value: strictMapping,
                    description: 'Enforce strict 1-to-1 mapping between Jobs and Courses.'
                })
            });
            const json = await res.json();

            if (json.status) {
                toast.success('Settings Saved', 'Course mapping constraints have been updated.');
            } else {
                toast.error('Save Failed', json.message);
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Error', 'An unexpected error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Platform Settings</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure global application parameters and URLs.</p>
            </div>

            {/* Mobile App Configuration */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                        <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Mobile Application Setup</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Control the "Available on Mobile" download links shown to supervisors and workers.</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Android Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                        <div className="md:col-span-1 border-r border-slate-100 dark:border-slate-800 md:pr-4 h-full">
                            <h4 className="font-medium text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                Android (Play Store)
                            </h4>
                            <label className="flex items-center gap-2 mt-3 cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={mobileSettings.enable_android}
                                        onChange={(e) => setMobileSettings({ ...mobileSettings, enable_android: e.target.checked })}
                                    />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${mobileSettings.enable_android ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${mobileSettings.enable_android ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                                <span className={`text-sm font-medium ${mobileSettings.enable_android ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                                    {mobileSettings.enable_android ? 'Enabled' : 'Disabled'}
                                </span>
                            </label>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Play Store URL</label>
                            <input
                                type="url"
                                value={mobileSettings.android_app_url}
                                onChange={(e) => setMobileSettings({ ...mobileSettings, android_app_url: e.target.value })}
                                disabled={!mobileSettings.enable_android}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900/50 transition-colors"
                                placeholder="https://play.google.com/store/apps/details?id=..."
                            />
                        </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* iOS Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                        <div className="md:col-span-1 border-r border-slate-100 dark:border-slate-800 md:pr-4 h-full">
                            <h4 className="font-medium text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                iOS (App Store)
                            </h4>
                            <label className="flex items-center gap-2 mt-3 cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={mobileSettings.enable_ios}
                                        onChange={(e) => setMobileSettings({ ...mobileSettings, enable_ios: e.target.checked })}
                                    />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${mobileSettings.enable_ios ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${mobileSettings.enable_ios ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                                <span className={`text-sm font-medium ${mobileSettings.enable_ios ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                                    {mobileSettings.enable_ios ? 'Enabled' : 'Disabled'}
                                </span>
                            </label>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">App Store URL</label>
                            <input
                                type="url"
                                value={mobileSettings.ios_app_url}
                                onChange={(e) => setMobileSettings({ ...mobileSettings, ios_app_url: e.target.value })}
                                disabled={!mobileSettings.enable_ios}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900/50 transition-colors"
                                placeholder="https://apps.apple.com/us/app/..."
                            />
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                        onClick={handleSaveMobileSettings}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>

            {/* Course Configuration Configuration */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Job & Course Mapping</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Configure fundamental architecture rules regarding how courses operate.</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                        <div className="md:col-span-1 border-slate-100 dark:border-slate-800 md:pr-4 h-full">
                            <h4 className="font-medium text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                Single Course per Job
                            </h4>
                            <label className="flex items-center gap-2 mt-3 cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={strictMapping}
                                        onChange={(e) => setStrictMapping(e.target.checked)}
                                    />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${strictMapping ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${strictMapping ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                                <span className={`text-sm font-medium ${strictMapping ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                                    {strictMapping ? 'Enabled' : 'Disabled'}
                                </span>
                            </label>
                        </div>
                        <div className="md:col-span-3 pt-1">
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                When enabled, the system strictly enforces that a single Job can only possess exactly 1 corresponding Certification Course. Attempting to attach multiple courses will be rejected.
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Disabling this removes the constraint entirely, allowing you to build modular curriculums mapped to a single Job.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                        onClick={handleSaveCourseSettings}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>

        </div>
    );
}
