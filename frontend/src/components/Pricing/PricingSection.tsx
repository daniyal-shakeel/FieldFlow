"use client";

import React, { useEffect, useState } from 'react';
import { Check, Zap, Coins } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/constants';

interface Plan {
  id: string;
  name: string;
  price_pkr: number;
  tokens: number;
  tagline: string;
  features: string[];
  popular: boolean;
  price: string; // mapped string price for display
}

export const PricingSection: React.FC = () => {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/payments/plans`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        const mapped = data.map((p: any) => ({
          ...p,
          price: p.price_pkr.toLocaleString(),
        }));
        setPlans(mapped);
      })
      .catch((err) => {
        console.error('Failed to load plans:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    const rawPrice = String(plan.price_pkr);
    router.push(`/pricing/pay?plan=${plan.name}&price=${rawPrice}&tokens=${plan.tokens}`);
  };

  return (
    <section className="w-full py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border bg-surface-1 border-hairline text-primary mb-4 text-[10px] font-semibold tracking-eyebrow uppercase">
            <Coins className="w-3.5 h-3.5" />
            <span>Token-Based Pricing</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-display-md text-ink uppercase mb-4">
            Simple, pay-as-you-go tiers
          </h2>
          <p className="text-xs md:text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
            Purchase export tokens to process multi-page documents at 0.5 tokens per page. Single-page documents are 100% free to edit & export.
          </p>
        </div>

        {/* Free Single-Page PDF Editing Info Banner */}
        <div className="max-w-2xl mx-auto mb-12 p-5 rounded-lg border border-primary/25 bg-primary/5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-ink">
              🎉 Free Tier Benefit
            </h4>
            <p className="text-xs text-ink-muted leading-relaxed">
              Any user (including guests) can edit a <strong className="text-primary font-semibold">single-page PDF unlimited times for free</strong>. Zero tokens required!
            </p>
          </div>
          <a
            href="/upload"
            className="px-5 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap shadow-sm"
          >
            Edit Single-Page PDF Free
          </a>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center text-xs text-ink-subtle py-20">
            No pricing plans are currently available.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`p-6 rounded-lg border flex flex-col justify-between hover:border-hairline-strong transition-all ${
                  plan.popular
                    ? 'bg-surface-2 border-primary/45 relative shadow-xl shadow-primary/5'
                    : 'bg-surface-1 border-hairline'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-primary text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                    Popular
                  </div>
                )}

                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider">
                      {plan.tagline}
                    </span>
                    <h3 className="text-lg font-semibold tracking-card-title text-ink uppercase flex items-center space-x-2">
                      <span>{plan.name}</span>
                      {plan.popular && <Zap className="w-4 h-4 text-primary" />}
                    </h3>
                    <div className="flex items-baseline space-x-1 pt-2">
                      <span className="text-3xl font-semibold text-ink tracking-tight font-mono">
                        {plan.price}
                      </span>
                      <span className="text-xs font-semibold text-ink-muted font-mono">PKR</span>
                      <span className="text-[10px] text-ink-tertiary uppercase font-mono ml-2">
                        / {plan.tokens} tokens
                      </span>
                    </div>
                  </div>

                  <hr className="border-hairline" />

                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-2.5 text-xs text-ink-muted">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`block w-full text-center py-2.5 rounded-md transition-all font-semibold text-xs uppercase tracking-wide cursor-pointer ${
                      plan.popular
                        ? 'bg-primary hover:bg-primary-hover active:bg-primary-focus text-white shadow-lg shadow-primary/25'
                        : 'bg-surface-2 border border-hairline hover:bg-surface-3 text-ink'
                    }`}
                  >
                    Purchase {plan.name}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

