// Phase 11: MFA Setup and Verification Components
// TOTP setup with QR code, verification flow

import React, { useState, useEffect, useRef } from 'react';
import { Shield, Smartphone, Mail, Key, ArrowLeft, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';

// MFA Setup Component
interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export const MFASetup: React.FC<MFASetupProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'choose' | 'setup' | 'verify' | 'backup'>('choose');
  const [method, setMethod] = useState<'totp' | 'sms' | 'email'>('totp');
  const [setupData, setSetupData] = useState<{
    secret?: string;
    qrCodeUrl?: string;
    backupCodes?: string[];
  }>({});
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const startSetup = async (selectedMethod: 'totp' | 'sms' | 'email') => {
    setMethod(selectedMethod);
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/auth/mfa/setup/${selectedMethod}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to start MFA setup');

      const data = await response.json();
      setSetupData(data);
      setStep('setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    if (verifyCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/mfa/verify-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ code: verifyCode, method }),
      });

      if (!response.ok) throw new Error('Invalid verification code');

      const data = await response.json();
      if (data.backupCodes) {
        setSetupData(prev => ({ ...prev, backupCodes: data.backupCodes }));
      }
      setStep('backup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    if (setupData.backupCodes) {
      navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
    }
  };

  // Choose Method Step
  if (step === 'choose') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900">Enable Two-Factor Authentication</h2>
          <p className="text-gray-500 mt-1">Choose a method to secure your account</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => startSetup('totp')}
            disabled={loading}
            className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <Smartphone className="w-8 h-8 text-blue-600" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Authenticator App</div>
              <div className="text-sm text-gray-500">Use Google Authenticator or similar</div>
            </div>
          </button>

          <button
            onClick={() => startSetup('sms')}
            disabled={loading}
            className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <Mail className="w-8 h-8 text-green-600" />
            <div className="text-left">
              <div className="font-medium text-gray-900">SMS Verification</div>
              <div className="text-sm text-gray-500">Receive codes via text message</div>
            </div>
          </button>

          <button
            onClick={() => startSetup('email')}
            disabled={loading}
            className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <Mail className="w-8 h-8 text-purple-600" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Email Verification</div>
              <div className="text-sm text-gray-500">Receive codes via email</div>
            </div>
          </button>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  // Setup Step (TOTP)
  if (step === 'setup' && method === 'totp') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
        <button
          onClick={() => setStep('choose')}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Scan QR Code</h2>
          <p className="text-gray-500 mt-1">Use your authenticator app to scan</p>
        </div>

        {/* QR Code Placeholder */}
        <div className="flex justify-center mb-4">
          <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            {setupData.qrCodeUrl ? (
              <img src={setupData.qrCodeUrl} alt="QR Code" className="w-full h-full" />
            ) : (
              <div className="text-center text-gray-400">
                <Key className="w-12 h-12 mx-auto mb-2" />
                <span className="text-sm">QR Code</span>
              </div>
            )}
          </div>
        </div>

        {/* Manual Entry */}
        {setupData.secret && (
          <div className="mb-6">
            <p className="text-sm text-gray-500 text-center mb-2">Or enter this code manually:</p>
            <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
              <code className="text-sm font-mono text-gray-800">{setupData.secret}</code>
              <button
                onClick={() => navigator.clipboard.writeText(setupData.secret!)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Copy className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        )}

        {/* Verification Code Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter verification code
          </label>
          <input
            type="text"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full px-4 py-3 text-center text-2xl tracking-widest border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="000000"
            maxLength={6}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <button
          onClick={verifySetup}
          disabled={loading || verifyCode.length !== 6}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify and Enable'}
        </button>
      </div>
    );
  }

  // Backup Codes Step
  if (step === 'backup') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900">MFA Enabled!</h2>
          <p className="text-gray-500 mt-1">Save your backup codes</p>
        </div>

        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Save these codes in a safe place. You can use them to access your account if you lose your device.
          </p>
        </div>

        {setupData.backupCodes && (
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg font-mono text-sm">
              {setupData.backupCodes.map((code, index) => (
                <div key={index} className="text-center py-1">
                  {code}
                </div>
              ))}
            </div>
            <button
              onClick={copyBackupCodes}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2 text-blue-600 hover:text-blue-700"
            >
              <Copy className="w-4 h-4" />
              Copy all codes
            </button>
          </div>
        )}

        <button
          onClick={onComplete}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
        >
          Done
        </button>
      </div>
    );
  }

  return null;
};

// MFA Verification Component (for login)
interface MFAVerifyProps {
  onBack?: () => void;
}

export const MFAVerify: React.FC<MFAVerifyProps> = ({ onBack }) => {
  const { verifyMfa } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useBackup, setUseBackup] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleVerify = async () => {
    if (code.length < 6) {
      setError('Please enter a valid code');
      return;
    }

    setLoading(true);
    setError('');

    const success = await verifyMfa(code);
    if (!success) {
      setError('Invalid verification code');
      setCode('');
      inputRef.current?.focus();
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length >= 6) {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-800 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>
          )}

          <div className="text-center mb-6">
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900">
              {useBackup ? 'Enter Backup Code' : 'Two-Factor Authentication'}
            </h2>
            <p className="text-gray-500 mt-1">
              {useBackup
                ? 'Enter one of your backup codes'
                : 'Enter the code from your authenticator app'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="mb-6">
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={(e) => {
                const value = useBackup
                  ? e.target.value.replace(/[^0-9-]/g, '')
                  : e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
              }}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-4 text-center text-2xl tracking-widest border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={useBackup ? 'XXXXX-XXXXX' : '000000'}
              maxLength={useBackup ? 11 : 6}
              autoComplete="one-time-code"
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || code.length < 6}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>

          <button
            onClick={() => {
              setUseBackup(!useBackup);
              setCode('');
              setError('');
            }}
            className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
          >
            {useBackup ? 'Use authenticator app instead' : 'Use a backup code'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MFASetup;
