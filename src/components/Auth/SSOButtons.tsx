// Phase 11: SSO Login Buttons
// Google, Microsoft, and SAML SSO options

import React from 'react';
import { Building2, KeyRound } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { loggers } from '@/utils/logger';

// Google Icon Component
const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// Microsoft Icon Component
const MicrosoftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24">
    <rect x="1" y="1" width="10" height="10" fill="#F25022" />
    <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
    <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
    <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
  </svg>
);

interface SSOButtonsProps {
  showSaml?: boolean;
  samlLabel?: string;
}

export const SSOButtons: React.FC<SSOButtonsProps> = ({
  showSaml = true,
  samlLabel = 'Enterprise SSO',
}) => {
  const { loginWithSSO, isLoading } = useAuth();

  const handleSSOLogin = async (provider: 'google' | 'microsoft' | 'saml') => {
    try {
      await loginWithSSO(provider);
    } catch (error) {
      loggers.auth.error('SSO login failed:', error);
    }
  };

  return (
    <div className="space-y-3">
      {/* Google */}
      <button
        onClick={() => handleSSOLogin('google')}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <GoogleIcon className="w-5 h-5" />
        <span className="text-gray-700 font-medium">Continue with Google</span>
      </button>

      {/* Microsoft */}
      <button
        onClick={() => handleSSOLogin('microsoft')}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <MicrosoftIcon className="w-5 h-5" />
        <span className="text-gray-700 font-medium">Continue with Microsoft</span>
      </button>

      {/* SAML SSO */}
      {showSaml && (
        <button
          onClick={() => handleSSOLogin('saml')}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Building2 className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700 font-medium">{samlLabel}</span>
        </button>
      )}
    </div>
  );
};

// Compact version for modals
export const SSOButtonsCompact: React.FC = () => {
  const { loginWithSSO, isLoading } = useAuth();

  return (
    <div className="flex gap-3">
      <button
        onClick={() => loginWithSSO('google')}
        disabled={isLoading}
        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
        title="Continue with Google"
      >
        <GoogleIcon className="w-5 h-5" />
        <span className="text-sm text-gray-600">Google</span>
      </button>

      <button
        onClick={() => loginWithSSO('microsoft')}
        disabled={isLoading}
        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
        title="Continue with Microsoft"
      >
        <MicrosoftIcon className="w-5 h-5" />
        <span className="text-sm text-gray-600">Microsoft</span>
      </button>

      <button
        onClick={() => loginWithSSO('saml')}
        disabled={isLoading}
        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
        title="Enterprise SSO"
      >
        <KeyRound className="w-5 h-5 text-gray-600" />
        <span className="text-sm text-gray-600">SSO</span>
      </button>
    </div>
  );
};

export default SSOButtons;
