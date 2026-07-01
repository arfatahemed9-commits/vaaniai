import React from "react";
import { DashboardStats, User } from "../types";
import { BarChart3, TrendingUp, Cpu, Award, Zap, HelpCircle } from "lucide-react";

interface DashboardProps {
  stats: DashboardStats | null;
  user: User | null;
  onNavigateToPricing: () => void;
}

export default function Dashboard({ stats, user, onNavigateToPricing }: DashboardProps) {
  const plan = stats ? stats.plan : "free";
  const usage = stats ? stats.usage : 0;
  const limit = stats ? stats.limit : 5000;
  const remaining = stats ? stats.remaining : 5000;
  const historyCount = stats ? stats.historyCount : 0;

  const usagePercent = Math.min(100, Math.round((usage / limit) * 100));

  const planNameMap = {
    free: "Free Creator Tier",
    starter: "Starter Plan",
    pro: "Pro Creator Plan",
    business: "Business Enterprise Plan",
  };

  const planLimitMap = {
    free: "5,000 Chars",
    starter: "50,000 Chars",
    pro: "200,000 Chars",
    business: "1,000,000 Chars",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-white tracking-tight">Your Creator Dashboard</h2>
        <p className="text-sm text-slate-400 mt-2">
          Track and manage your Text-to-Speech characters, plan levels, and audio generation stats.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Stat Card 1: Usage Card */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex items-center gap-4">
          <div className="p-4 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-slate-500">Characters Used</div>
            <div className="text-2xl font-bold font-display text-white mt-1">{usage.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-1">out of {limit.toLocaleString()} limit</div>
          </div>
        </div>

        {/* Stat Card 2: Remaining Chars */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex items-center gap-4">
          <div className="p-4 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-slate-500">Characters Remaining</div>
            <div className="text-2xl font-bold font-display text-white mt-1">{remaining.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-1">Available to generate speech</div>
          </div>
        </div>

        {/* Stat Card 3: Active Plan */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex items-center gap-4">
          <div className="p-4 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-mono uppercase tracking-widest text-slate-500">Current Plan Level</div>
            <div className="text-2xl font-bold font-display text-white mt-1 capitalize">{plan}</div>
            <div className="text-xs text-slate-400 mt-1">{planLimitMap[plan]} per month</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detailed Usage Visualizer (2 Columns) */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md space-y-6">
          <h3 className="text-lg font-display font-bold text-white">Monthly Character Quota Usage</h3>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-sm text-slate-400">Monthly Usage percentage</span>
                <p className="text-3xl font-extrabold text-white mt-1">{usagePercent}%</p>
              </div>
              <span className="text-xs font-mono text-slate-500">{getCurrentMonthStr()} period</span>
            </div>

            {/* Custom high-fidelity progress bar */}
            <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 flex">
              <div
                style={{ width: `${usagePercent}%` }}
                className={`h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ${
                  usagePercent === 0 ? "w-0" : ""
                }`}
              ></div>
            </div>

            <div className="flex justify-between text-xs text-slate-500 font-mono">
              <span>0 Chars Used</span>
              <span>{(limit / 2).toLocaleString()} Chars</span>
              <span>{limit.toLocaleString()} Chars Limit</span>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">
              Note: Usage limits reset on the 1st of every calendar month automatically.
            </p>
            {plan === "free" && (
              <button
                onClick={onNavigateToPricing}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white text-indigo-200" />
                <span>Upgrade Limit Instantly</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Tips or Plan visual detail card */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-mono uppercase tracking-widest text-indigo-400 mb-4">
              Vocal Quota Limits
            </h3>
            <p className="text-sm text-slate-300 font-semibold leading-snug">
              Running out of character credits?
            </p>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Each generated character translates directly to high-fidelity TTS audio processed.
              If you have long-form podcasts or heavy voice scripts, our Pro and Business tiers offer up to
              1,000,000 characters monthly.
            </p>

            {/* Visual list of benefits */}
            <div className="space-y-3 mt-6">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                <span>Unlimited audio log saves</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                <span>WAV files high speed downloads</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                <span>Premium Gemini TTS speech engines</span>
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToPricing}
            className="w-full mt-8 py-3 rounded-xl font-semibold text-xs text-slate-400 hover:text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Learn About Creator Plans</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper for monthly string
function getCurrentMonthStr(): string {
  const now = new Date();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}
