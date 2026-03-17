// Phase 11: Security Settings Component
// Configure security policies, MFA requirements, and session settings

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Clock,
  Key,
  Globe,
  Save,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { loggers } from '@/utils/logger';

interface SecuritySettings {
  // Password Policy
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventReuse: number;
    expiryDays: number;
  };
  // MFA Settings
  mfa: {
    required: boolean;
    allowedMethods: ('totp' | 'sms' | 'email')[];
    gracePeriodDays: number;
    rememberDeviceDays: number;
  };
  // Session Settings
  session: {
    maxConcurrent: number;
    idleTimeoutMinutes: number;
    absoluteTimeoutHours: number;
    extendOnActivity: boolean;
  };
  // Login Settings
  login: {
    maxAttempts: number;
    lockoutMinutes: number;
    requireCaptcha: boolean;
    allowRememberMe: boolean;
  };
  // IP Settings
  ipRestrictions: {
    enabled: boolean;
    whitelist: string[];
    blockTorExits: boolean;
    blockVpn: boolean;
  };
  // SSO Settings
  sso: {
    enabled: boolean;
    providers: {
      google: boolean;
      microsoft: boolean;
      saml: boolean;
    };
    enforceForDomains: string[];
  };
}

const DEFAULT_SETTINGS: SecuritySettings = {
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventReuse: 5,
    expiryDays: 90,
  },
  mfa: {
    required: false,
    allowedMethods: ['totp', 'email'],
    gracePeriodDays: 7,
    rememberDeviceDays: 30,
  },
  session: {
    maxConcurrent: 5,
    idleTimeoutMinutes: 30,
    absoluteTimeoutHours: 24,
    extendOnActivity: true,
  },
  login: {
    maxAttempts: 5,
    lockoutMinutes: 15,
    requireCaptcha: false,
    allowRememberMe: true,
  },
  ipRestrictions: {
    enabled: false,
    whitelist: [],
    blockTorExits: false,
    blockVpn: false,
  },
  sso: {
    enabled: true,
    providers: {
      google: true,
      microsoft: true,
      saml: false,
    },
    enforceForDomains: [],
  },
};

export const SecuritySettings: React.FC = () => {
  const [settings, setSettings] = useState<SecuritySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['password', 'mfa', 'session'])
  );
  const [newIp, setNewIp] = useState('');
  const [newDomain, setNewDomain] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/security/settings', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      loggers.admin.error('Failed to fetch security settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const response = await fetch('/api/admin/security/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      loggers.admin.error('Failed to save security settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const addIpToWhitelist = () => {
    if (newIp && !settings.ipRestrictions.whitelist.includes(newIp)) {
      setSettings({
        ...settings,
        ipRestrictions: {
          ...settings.ipRestrictions,
          whitelist: [...settings.ipRestrictions.whitelist, newIp],
        },
      });
      setNewIp('');
    }
  };

  const removeIpFromWhitelist = (ip: string) => {
    setSettings({
      ...settings,
      ipRestrictions: {
        ...settings.ipRestrictions,
        whitelist: settings.ipRestrictions.whitelist.filter((i) => i !== ip),
      },
    });
  };

  const addDomainToEnforce = () => {
    if (newDomain && !settings.sso.enforceForDomains.includes(newDomain)) {
      setSettings({
        ...settings,
        sso: {
          ...settings.sso,
          enforceForDomains: [...settings.sso.enforceForDomains, newDomain],
        },
      });
      setNewDomain('');
    }
  };

  const removeDomainFromEnforce = (domain: string) => {
    setSettings({
      ...settings,
      sso: {
        ...settings.sso,
        enforceForDomains: settings.sso.enforceForDomains.filter((d) => d !== domain),
      },
    });
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12 text-gray-500">Loading security settings...</div>
      </div>
    );
  }

  const SectionHeader: React.FC<{
    title: string;
    icon: React.ReactNode;
    section: string;
    description?: string;
  }> = ({ title, icon, section, description }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div className="text-left">
          <h3 className="font-medium text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </div>
      {expandedSections.has(section) ? (
        <ChevronDown className="w-5 h-5 text-gray-400" />
      ) : (
        <ChevronRight className="w-5 h-5 text-gray-400" />
      )}
    </button>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
          <p className="text-gray-500 mt-1">Configure organization security policies</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Saved
            </span>
          )}
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Password Policy */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <SectionHeader
            title="Password Policy"
            icon={<Key className="w-5 h-5 text-blue-600" />}
            section="password"
            description="Configure password requirements"
          />

          {expandedSections.has('password') && (
            <div className="p-4 border-t border-gray-200 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Length
                  </label>
                  <input
                    type="number"
                    min={8}
                    max={128}
                    value={settings.passwordPolicy.minLength}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        passwordPolicy: {
                          ...settings.passwordPolicy,
                          minLength: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password Expiry (days)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={settings.passwordPolicy.expiryDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        passwordPolicy: {
                          ...settings.passwordPolicy,
                          expiryDays: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = never expires</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prevent Reuse (last N passwords)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={24}
                    value={settings.passwordPolicy.preventReuse}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        passwordPolicy: {
                          ...settings.passwordPolicy,
                          preventReuse: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.passwordPolicy.requireUppercase}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        passwordPolicy: {
                          ...settings.passwordPolicy,
                          requireUppercase: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-700">Require uppercase letters</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.passwordPolicy.requireLowercase}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        passwordPolicy: {
                          ...settings.passwordPolicy,
                          requireLowercase: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-700">Require lowercase letters</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.passwordPolicy.requireNumbers}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        passwordPolicy: {
                          ...settings.passwordPolicy,
                          requireNumbers: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-700">Require numbers</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.passwordPolicy.requireSpecialChars}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        passwordPolicy: {
                          ...settings.passwordPolicy,
                          requireSpecialChars: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-700">Require special characters</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* MFA Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <SectionHeader
            title="Multi-Factor Authentication"
            icon={<Shield className="w-5 h-5 text-blue-600" />}
            section="mfa"
            description="Configure MFA requirements"
          />

          {expandedSections.has('mfa') && (
            <div className="p-4 border-t border-gray-200 space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.mfa.required}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      mfa: { ...settings.mfa, required: e.target.checked },
                    })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-gray-700 font-medium">Require MFA for all users</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allowed Methods
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.mfa.allowedMethods.includes('totp')}
                      onChange={(e) => {
                        const methods = e.target.checked
                          ? [...settings.mfa.allowedMethods, 'totp']
                          : settings.mfa.allowedMethods.filter((m) => m !== 'totp');
                        setSettings({
                          ...settings,
                          mfa: { ...settings.mfa, allowedMethods: methods as ('totp' | 'sms' | 'email')[] },
                        });
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-gray-700">Authenticator App (TOTP)</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.mfa.allowedMethods.includes('sms')}
                      onChange={(e) => {
                        const methods = e.target.checked
                          ? [...settings.mfa.allowedMethods, 'sms']
                          : settings.mfa.allowedMethods.filter((m) => m !== 'sms');
                        setSettings({
                          ...settings,
                          mfa: { ...settings.mfa, allowedMethods: methods as ('totp' | 'sms' | 'email')[] },
                        });
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-gray-700">SMS</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.mfa.allowedMethods.includes('email')}
                      onChange={(e) => {
                        const methods = e.target.checked
                          ? [...settings.mfa.allowedMethods, 'email']
                          : settings.mfa.allowedMethods.filter((m) => m !== 'email');
                        setSettings({
                          ...settings,
                          mfa: { ...settings.mfa, allowedMethods: methods as ('totp' | 'sms' | 'email')[] },
                        });
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-gray-700">Email</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grace Period (days)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={settings.mfa.gracePeriodDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        mfa: { ...settings.mfa, gracePeriodDays: parseInt(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Days before MFA is enforced</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remember Device (days)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={settings.mfa.rememberDeviceDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        mfa: { ...settings.mfa, rememberDeviceDays: parseInt(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = always require MFA</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Session Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <SectionHeader
            title="Session Management"
            icon={<Clock className="w-5 h-5 text-blue-600" />}
            section="session"
            description="Configure session timeouts"
          />

          {expandedSections.has('session') && (
            <div className="p-4 border-t border-gray-200 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Concurrent Sessions
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={settings.session.maxConcurrent}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        session: {
                          ...settings.session,
                          maxConcurrent: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Idle Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={settings.session.idleTimeoutMinutes}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        session: {
                          ...settings.session,
                          idleTimeoutMinutes: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Absolute Timeout (hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={settings.session.absoluteTimeoutHours}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        session: {
                          ...settings.session,
                          absoluteTimeoutHours: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.session.extendOnActivity}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      session: { ...settings.session, extendOnActivity: e.target.checked },
                    })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-gray-700">Extend session on user activity</span>
              </label>
            </div>
          )}
        </div>

        {/* Login Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <SectionHeader
            title="Login Security"
            icon={<Lock className="w-5 h-5 text-blue-600" />}
            section="login"
            description="Configure login protection"
          />

          {expandedSections.has('login') && (
            <div className="p-4 border-t border-gray-200 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Failed Attempts
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={20}
                    value={settings.login.maxAttempts}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        login: { ...settings.login, maxAttempts: parseInt(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lockout Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    value={settings.login.lockoutMinutes}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        login: { ...settings.login, lockoutMinutes: parseInt(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.login.requireCaptcha}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        login: { ...settings.login, requireCaptcha: e.target.checked },
                      })
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-700">Require CAPTCHA on login</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.login.allowRememberMe}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        login: { ...settings.login, allowRememberMe: e.target.checked },
                      })
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-700">Allow "Remember Me" option</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* IP Restrictions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <SectionHeader
            title="IP Restrictions"
            icon={<Globe className="w-5 h-5 text-blue-600" />}
            section="ip"
            description="Configure IP-based access control"
          />

          {expandedSections.has('ip') && (
            <div className="p-4 border-t border-gray-200 space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.ipRestrictions.enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ipRestrictions: { ...settings.ipRestrictions, enabled: e.target.checked },
                    })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-gray-700 font-medium">Enable IP restrictions</span>
              </label>

              {settings.ipRestrictions.enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IP Whitelist
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newIp}
                        onChange={(e) => setNewIp(e.target.value)}
                        placeholder="192.168.1.0/24"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={addIpToWhitelist}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {settings.ipRestrictions.whitelist.map((ip) => (
                        <span
                          key={ip}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                        >
                          {ip}
                          <button
                            onClick={() => removeIpFromWhitelist(ip)}
                            className="hover:text-red-600"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.ipRestrictions.blockTorExits}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            ipRestrictions: {
                              ...settings.ipRestrictions,
                              blockTorExits: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-700">Block Tor exit nodes</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.ipRestrictions.blockVpn}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            ipRestrictions: {
                              ...settings.ipRestrictions,
                              blockVpn: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-700">Block known VPN providers</span>
                    </label>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* SSO Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <SectionHeader
            title="Single Sign-On"
            icon={<Key className="w-5 h-5 text-blue-600" />}
            section="sso"
            description="Configure SSO providers"
          />

          {expandedSections.has('sso') && (
            <div className="p-4 border-t border-gray-200 space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.sso.enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      sso: { ...settings.sso, enabled: e.target.checked },
                    })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-gray-700 font-medium">Enable SSO</span>
              </label>

              {settings.sso.enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enabled Providers
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={settings.sso.providers.google}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              sso: {
                                ...settings.sso,
                                providers: { ...settings.sso.providers, google: e.target.checked },
                              },
                            })
                          }
                          className="rounded border-gray-300"
                        />
                        <span className="text-gray-700">Google</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={settings.sso.providers.microsoft}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              sso: {
                                ...settings.sso,
                                providers: {
                                  ...settings.sso.providers,
                                  microsoft: e.target.checked,
                                },
                              },
                            })
                          }
                          className="rounded border-gray-300"
                        />
                        <span className="text-gray-700">Microsoft</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={settings.sso.providers.saml}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              sso: {
                                ...settings.sso,
                                providers: { ...settings.sso.providers, saml: e.target.checked },
                              },
                            })
                          }
                          className="rounded border-gray-300"
                        />
                        <span className="text-gray-700">SAML 2.0</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enforce SSO for Domains
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="example.com"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={addDomainToEnforce}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      Users from these domains must use SSO to log in
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {settings.sso.enforceForDomains.map((domain) => (
                        <span
                          key={domain}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                        >
                          {domain}
                          <button
                            onClick={() => removeDomainFromEnforce(domain)}
                            className="hover:text-red-600"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
