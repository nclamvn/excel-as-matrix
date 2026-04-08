// ═══════════════════════════════════════════════════════════════════════════
// PRICING PAGE — 3-tier pricing with Stripe checkout
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback } from 'react';
import { Check, X, Sparkles, Zap, Building2 } from 'lucide-react';
import {
  useSubscriptionStore,
  PLANS,
  type PlanTier,
} from '../../stores/subscriptionStore';
import { useUIStore } from '../../stores/uiStore';

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const PricingPage: React.FC = () => {
  const resolvedTheme = useUIStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';

  const billingCycle = useSubscriptionStore((s) => s.billingCycle);
  const setBillingCycle = useSubscriptionStore((s) => s.setBillingCycle);
  const subscription = useSubscriptionStore((s) => s.subscription);
  const createCheckoutSession = useSubscriptionStore((s) => s.createCheckoutSession);

  const handleUpgrade = useCallback(async (planId: PlanTier) => {
    if (planId === 'free') return;
    const url = await createCheckoutSession(planId);
    if (url) {
      window.location.href = url;
    }
  }, [createCheckoutSession]);

  const planOrder: PlanTier[] = ['free', 'pro', 'team'];
  const planIcons: Record<PlanTier, React.ReactNode> = {
    free: <Sparkles size={24} className="text-neutral-400" />,
    pro: <Zap size={24} className="text-amber-500" />,
    team: <Building2 size={24} className="text-emerald-500" />,
  };

  return (
    <div className={`min-h-screen py-16 px-4 ${isDark ? 'bg-neutral-950 text-neutral-100' : 'bg-white text-neutral-900'}`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3">Simple, transparent pricing</h1>
          <p className={`text-lg ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
            Start free, upgrade when you need more AI power
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`text-sm ${billingCycle === 'monthly' ? 'font-semibold' : isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
              Monthly
            </span>
            <button type="button"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`
                relative w-12 h-6 rounded-full transition-colors
                ${billingCycle === 'yearly' ? 'bg-emerald-600' : isDark ? 'bg-neutral-700' : 'bg-neutral-300'}
              `}
              aria-label={`Switch to ${billingCycle === 'monthly' ? 'yearly' : 'monthly'} billing`}
            >
              <div
                className={`
                  absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform
                  ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0.5'}
                `}
              />
            </button>
            <span className={`text-sm ${billingCycle === 'yearly' ? 'font-semibold' : isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
              Yearly
              <span className="ml-1 text-xs text-emerald-500 font-medium">Save 17%</span>
            </span>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {planOrder.map((planId) => {
            const plan = PLANS[planId];
            const isCurrent = subscription.planId === planId;
            const isPopular = planId === 'pro';
            const price = billingCycle === 'yearly'
              ? Math.round(plan.yearlyPrice / 12)
              : plan.monthlyPrice;

            return (
              <div
                key={planId}
                className={`
                  relative rounded-2xl p-6 border-2 transition-shadow
                  ${isPopular
                    ? 'border-emerald-500 shadow-lg shadow-emerald-500/10'
                    : isDark ? 'border-neutral-800' : 'border-neutral-200'
                  }
                  ${isDark ? 'bg-neutral-900' : 'bg-white'}
                `}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-medium">
                    Most Popular
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  {planIcons[planId]}
                  <h3 className="text-xl font-bold mt-3">{plan.name}</h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      {price === 0 ? 'Free' : `$${(price / 100).toFixed(0)}`}
                    </span>
                    {price > 0 && (
                      <span className={isDark ? 'text-neutral-500' : 'text-neutral-400'}>
                        /mo{planId === 'team' ? ' per seat' : ''}
                      </span>
                    )}
                  </div>
                  {billingCycle === 'yearly' && price > 0 && (
                    <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                      Billed ${(plan.yearlyPrice / 100).toFixed(0)}/year{planId === 'team' ? ' per seat' : ''}
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <button type="button"
                  onClick={() => handleUpgrade(planId)}
                  disabled={isCurrent || planId === 'free'}
                  className={`
                    w-full py-2.5 rounded-lg text-sm font-semibold transition-colors mb-6
                    ${isCurrent
                      ? isDark ? 'bg-neutral-800 text-neutral-500 cursor-default' : 'bg-neutral-100 text-neutral-400 cursor-default'
                      : isPopular
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : planId === 'free'
                          ? isDark ? 'bg-neutral-800 text-neutral-400 cursor-default' : 'bg-neutral-100 text-neutral-500 cursor-default'
                          : isDark ? 'bg-neutral-700 text-neutral-200 hover:bg-neutral-600' : 'bg-neutral-900 text-white hover:bg-neutral-800'
                    }
                  `}
                >
                  {isCurrent ? 'Current Plan' : planId === 'free' ? 'Free Forever' : 'Upgrade'}
                </button>

                {/* Features */}
                <div className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <div key={feature.key} className="flex items-start gap-2.5">
                      {feature.included ? (
                        <Check size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X size={16} className={`flex-shrink-0 mt-0.5 ${isDark ? 'text-neutral-700' : 'text-neutral-300'}`} />
                      )}
                      <span className={`text-sm ${feature.included ? '' : isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        {feature.label}
                        {feature.limit && feature.included && (
                          <span className={`ml-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            ({feature.limit})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ / Trust */}
        <div className="text-center mt-12">
          <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
            All plans include 162 formula functions, offline mode, and Excel import/export.
            <br />
            Cancel anytime. No long-term contracts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
