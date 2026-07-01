import React, { useState } from "react";
import { User, DashboardStats } from "../types";
import { Check, Sparkles, HelpCircle, Loader2 } from "lucide-react";

interface PricingPageProps {
  token: string | null;
  user: User | null;
  stats: DashboardStats | null;
  onRefreshStats: () => void;
  onNavigateToAuth: () => void;
}

interface PlanItem {
  id: "free" | "starter" | "pro" | "business";
  name: string;
  price: string;
  limit: string;
  desc: string;
  popular: boolean;
  features: string[];
}

const PLANS: PlanItem[] = [
  {
    id: "free",
    name: "Free Tier",
    price: "₹0",
    limit: "5,000 characters/month",
    desc: "Perfect for testing and personal creator scripts",
    popular: false,
    features: [
      "Access to all 5 prebuilt voice models",
      "Multilingual Hindi & English engines",
      "Standard Conversational speech styling",
      "Dynamic file download & offline saving",
      "Standard speed audio rendering",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: "₹499",
    limit: "50,000 characters/month",
    desc: "Best for YouTubers and social media reels",
    popular: false,
    features: [
      "Everything in Free Tier",
      "10x higher generation limits",
      "Prioritized server speed rendering",
      "Bilingual pronunciation optimization",
      "Dedicated email creator support",
    ],
  },
  {
    id: "pro",
    name: "Pro Creator",
    price: "₹1,499",
    limit: "200,000 characters/month",
    desc: "Built for active podcasters and video agencies",
    popular: true,
    features: [
      "Everything in Starter Plan",
      "4x higher generation limits",
      "Full emotional & style customization",
      "Advanced narrative audio engines",
      "Commercial rights usage permission",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "₹4,999",
    limit: "1,000,000 characters/month",
    desc: "Ideal for publishing houses and team workflows",
    popular: false,
    features: [
      "Everything in Pro Plan",
      "5x higher generation limits",
      "Enterprise API capabilities",
      "Custom pronunciation dictionaries",
      "24/7 dedicated account manager",
    ],
  },
];

export default function PricingPage({
  token,
  user,
  stats,
  onRefreshStats,
  onNavigateToAuth,
}: PricingPageProps) {
  const currentPlan = stats ? stats.plan : "free";
  const [upgradingId, setUpgradingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSelectPlan = async (planId: "free" | "starter" | "pro" | "business") => {
    if (!token) {
      // Prompt sign in
      onNavigateToAuth();
      return;
    }

    if (planId === currentPlan) {
      return;
    }

    setUpgradingId(planId);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/auth/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upgrade plan");
      }

      onRefreshStats();
      setSuccessMsg(`Plan upgraded successfully! Your monthly character limit is now updated.`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      alert("Error upgrading: " + err.message);
    } finally {
      setUpgradingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-indigo-300 text-xs sm:text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Flexible Monthly Plans</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          Pricing for Creators of All Scales
        </h2>
        <p className="mt-4 text-slate-400 leading-relaxed text-sm sm:text-base">
          Unlock higher character limits, commercial rights, and premium narrative styles. Cancel or adjust tiers anytime.
        </p>
      </div>

      {successMsg && (
        <div className="max-w-3xl mx-auto mb-8 p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-green-200 text-sm text-center flex items-center justify-center gap-2">
          <Check className="w-5 h-5 text-green-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid containing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isUpgrading = upgradingId === plan.id;

          return (
            <div
              key={plan.id}
              className={`p-6 rounded-2xl border flex flex-col justify-between transition-all duration-300 relative ${
                plan.popular
                  ? "border-indigo-500/40 bg-indigo-950/20 backdrop-blur-md shadow-lg shadow-indigo-500/10"
                  : "border-white/10 bg-white/5 backdrop-blur-md hover:border-indigo-500/30 hover:bg-white/10"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-[10px] font-bold text-white uppercase tracking-widest rounded-full shadow">
                  Most Popular
                </span>
              )}

              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-display font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 h-8">{plan.desc}</p>
                </div>

                <div className="my-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold font-display text-white">{plan.price}</span>
                    <span className="text-xs text-slate-500 font-mono">/month</span>
                  </div>
                  <div className="text-xs text-indigo-300 font-semibold mt-2 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded w-fit">
                    {plan.limit}
                  </div>
                </div>

                <ul className="space-y-3 pt-6 border-t border-white/5 text-xs">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-400">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5">
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrent || isUpgrading}
                  className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-white/10 text-slate-500 cursor-not-allowed border border-white/5"
                      : plan.popular
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow shadow-indigo-600/15"
                      : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-indigo-500/30"
                  }`}
                >
                  {isUpgrading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />
                      <span>Updating...</span>
                    </>
                  ) : isCurrent ? (
                    "Active Tier"
                  ) : token ? (
                    "Select and Upgrade"
                  ) : (
                    "Sign Up and Select"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pricing FAQs or simple checklist */}
      <div className="mt-20 p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md max-w-4xl mx-auto">
        <h4 className="text-base font-semibold text-white mb-6">Subscription & Payments FAQ</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
          <div>
            <h5 className="font-semibold text-slate-200">Are payments safe?</h5>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Yes, all payments are processed securely. In this beta environment, payment portals are placeholders so you can upgrade and test our limits completely for free!
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-slate-200">How do I reset my usage?</h5>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Character usage tracking automatically resets on the 1st day of every month. For immediate additions, you can upgrade your plan or select higher tiers dynamically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
