// ═══════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION STORE — Plan tiers, billing status, feature gates
// ═══════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PlanTier = 'free' | 'pro' | 'team';
export type BillingCycle = 'monthly' | 'yearly';

export interface PlanConfig {
  id: PlanTier;
  name: string;
  description: string;
  monthlyPrice: number; // USD cents
  yearlyPrice: number; // USD cents (total per year)
  features: PlanFeature[];
  limits: PlanLimits;
  stripePriceId: {
    monthly: string;
    yearly: string;
  };
}

export interface PlanFeature {
  key: string;
  label: string;
  included: boolean;
  limit?: string; // e.g., "100 AI requests/mo"
}

export interface PlanLimits {
  aiRequestsPerMonth: number;
  maxWorkbooks: number;
  maxSheetsPerWorkbook: number;
  maxCollaborators: number;
  maxStorageMB: number;
  webhooksEnabled: boolean;
  macrosEnabled: boolean;
  pluginsEnabled: boolean;
  encryptionEnabled: boolean;
  auditLogDays: number;
  prioritySupport: boolean;
}

export interface Subscription {
  planId: PlanTier;
  billingCycle: BillingCycle;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan Definitions
// ─────────────────────────────────────────────────────────────────────────────

export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'For personal use and exploring ExcelAI',
    monthlyPrice: 0,
    yearlyPrice: 0,
    stripePriceId: { monthly: '', yearly: '' },
    features: [
      { key: 'ai', label: 'AI Copilot', included: true, limit: '50 requests/mo' },
      { key: 'workbooks', label: 'Workbooks', included: true, limit: '3 workbooks' },
      { key: 'formulas', label: '162 Formula Functions', included: true },
      { key: 'offline', label: 'Offline Mode', included: true },
      { key: 'import', label: 'Excel Import/Export', included: true },
      { key: 'collab', label: 'Real-time Collaboration', included: false },
      { key: 'macros', label: 'Macros & Automation', included: false },
      { key: 'plugins', label: 'Plugin Marketplace', included: false },
      { key: 'encryption', label: 'Field Encryption', included: false },
      { key: 'audit', label: 'Audit Log', included: true, limit: '7 days' },
      { key: 'support', label: 'Priority Support', included: false },
    ],
    limits: {
      aiRequestsPerMonth: 50,
      maxWorkbooks: 3,
      maxSheetsPerWorkbook: 5,
      maxCollaborators: 0,
      maxStorageMB: 100,
      webhooksEnabled: false,
      macrosEnabled: false,
      pluginsEnabled: false,
      encryptionEnabled: false,
      auditLogDays: 7,
      prioritySupport: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For professionals who need AI power',
    monthlyPrice: 1900, // $19/mo
    yearlyPrice: 19000, // $190/yr ($15.83/mo)
    stripePriceId: { monthly: 'price_pro_monthly', yearly: 'price_pro_yearly' },
    features: [
      { key: 'ai', label: 'AI Copilot', included: true, limit: '1,000 requests/mo' },
      { key: 'workbooks', label: 'Workbooks', included: true, limit: 'Unlimited' },
      { key: 'formulas', label: '162 Formula Functions', included: true },
      { key: 'offline', label: 'Offline Mode', included: true },
      { key: 'import', label: 'Excel Import/Export', included: true },
      { key: 'collab', label: 'Real-time Collaboration', included: true, limit: '5 users' },
      { key: 'macros', label: 'Macros & Automation', included: true },
      { key: 'plugins', label: 'Plugin Marketplace', included: true },
      { key: 'encryption', label: 'Field Encryption', included: true },
      { key: 'audit', label: 'Audit Log', included: true, limit: '90 days' },
      { key: 'support', label: 'Priority Support', included: false },
    ],
    limits: {
      aiRequestsPerMonth: 1000,
      maxWorkbooks: -1, // unlimited
      maxSheetsPerWorkbook: 50,
      maxCollaborators: 5,
      maxStorageMB: 5000,
      webhooksEnabled: true,
      macrosEnabled: true,
      pluginsEnabled: true,
      encryptionEnabled: true,
      auditLogDays: 90,
      prioritySupport: false,
    },
  },
  team: {
    id: 'team',
    name: 'Team',
    description: 'For teams and organizations',
    monthlyPrice: 4900, // $49/mo per seat
    yearlyPrice: 49000, // $490/yr per seat
    stripePriceId: { monthly: 'price_team_monthly', yearly: 'price_team_yearly' },
    features: [
      { key: 'ai', label: 'AI Copilot', included: true, limit: 'Unlimited' },
      { key: 'workbooks', label: 'Workbooks', included: true, limit: 'Unlimited' },
      { key: 'formulas', label: '162 Formula Functions', included: true },
      { key: 'offline', label: 'Offline Mode', included: true },
      { key: 'import', label: 'Excel Import/Export', included: true },
      { key: 'collab', label: 'Real-time Collaboration', included: true, limit: 'Unlimited' },
      { key: 'macros', label: 'Macros & Automation', included: true },
      { key: 'plugins', label: 'Plugin Marketplace', included: true },
      { key: 'encryption', label: 'Field Encryption', included: true },
      { key: 'audit', label: 'Audit Log', included: true, limit: '1 year' },
      { key: 'support', label: 'Priority Support', included: true },
      { key: 'sso', label: 'SSO / SAML', included: true },
      { key: 'scim', label: 'SCIM Provisioning', included: true },
      { key: 'region', label: 'Data Residency', included: true },
    ],
    limits: {
      aiRequestsPerMonth: -1,
      maxWorkbooks: -1,
      maxSheetsPerWorkbook: -1,
      maxCollaborators: -1,
      maxStorageMB: 50000,
      webhooksEnabled: true,
      macrosEnabled: true,
      pluginsEnabled: true,
      encryptionEnabled: true,
      auditLogDays: 365,
      prioritySupport: true,
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

interface SubscriptionState {
  subscription: Subscription;
  billingCycle: BillingCycle;

  // Actions
  setSubscription: (sub: Partial<Subscription>) => void;
  setBillingCycle: (cycle: BillingCycle) => void;
  getPlan: () => PlanConfig;
  getLimits: () => PlanLimits;
  canUseFeature: (feature: string) => boolean;
  isWithinLimit: (resource: string, currentUsage: number) => boolean;
  createCheckoutSession: (planId: PlanTier) => Promise<string | null>;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: {
        planId: 'free',
        billingCycle: 'monthly',
        status: 'none',
        currentPeriodEnd: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      },
      billingCycle: 'yearly',

      setSubscription: (sub) => {
        set((state) => ({
          subscription: { ...state.subscription, ...sub },
        }));
      },

      setBillingCycle: (cycle) => set({ billingCycle: cycle }),

      getPlan: () => {
        const { subscription } = get();
        return PLANS[subscription.planId];
      },

      getLimits: () => {
        return get().getPlan().limits;
      },

      canUseFeature: (feature: string) => {
        const plan = get().getPlan();
        const feat = plan.features.find((f) => f.key === feature);
        return feat?.included ?? false;
      },

      isWithinLimit: (resource: string, currentUsage: number) => {
        const limits = get().getLimits();
        const limit = (limits as unknown as Record<string, unknown>)[resource];
        if (typeof limit !== 'number') return true;
        if (limit === -1) return true; // unlimited
        return currentUsage < limit;
      },

      createCheckoutSession: async (planId: PlanTier) => {
        const { billingCycle } = get();
        const plan = PLANS[planId];
        const priceId =
          billingCycle === 'yearly' ? plan.stripePriceId.yearly : plan.stripePriceId.monthly;

        if (!priceId) return null;

        try {
          const response = await fetch('/api/billing/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              priceId,
              planId,
              billingCycle,
              successUrl: `${window.location.origin}/billing/success`,
              cancelUrl: `${window.location.origin}/pricing`,
            }),
          });

          if (!response.ok) throw new Error('Failed to create checkout session');
          const { url } = await response.json();
          return url as string;
        } catch {
          return null;
        }
      },
    }),
    {
      name: 'subscription-storage',
      partialize: (state) => ({
        subscription: state.subscription,
        billingCycle: state.billingCycle,
      }),
    }
  )
);
