import React, { useState, useEffect } from "react";
import { Mic, BarChart2, Award, LogIn, LogOut, Sparkles, User, Menu, X } from "lucide-react";

import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import VoiceGenerator from "./components/VoiceGenerator";
import VoiceIsolator from "./components/VoiceIsolator";
import Dashboard from "./components/Dashboard";
import PricingPage from "./components/PricingPage";
import ProfilePage from "./components/ProfilePage";

import { User as UserType, VoiceHistoryItem, DashboardStats } from "./types";

export default function App() {
  const [view, setView] = useState<"landing" | "app" | "isolator" | "dashboard" | "pricing" | "auth" | "profile">("landing");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<VoiceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Attempt auto-login on startup
  useEffect(() => {
    const storedToken = localStorage.getItem("vaaniai_token");
    if (storedToken) {
      fetchCurrentUser(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setToken(authToken);
        // Sync stats and history
        await Promise.all([fetchStats(authToken), fetchHistory(authToken)]);
        // Redirect to workspace
        setView("app");
      } else {
        localStorage.removeItem("vaaniai_token");
      }
    } catch (e) {
      console.error("Auto-login validation failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (authToken: string) => {
    try {
      const response = await fetch("/api/dashboard", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (e) {
      console.error("Failed to fetch dashboard stats:", e);
    }
  };

  const fetchHistory = async (authToken: string) => {
    try {
      const response = await fetch("/api/history", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setHistory(data.history);
      }
    } catch (e) {
      console.error("Failed to fetch history list:", e);
    }
  };

  const handleAuthSuccess = (authUser: UserType, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem("vaaniai_token", authToken);
    fetchStats(authToken);
    fetchHistory(authToken);
    setView("app");
  };

  const handleProfileUpdate = (updatedUser: UserType) => {
    setUser(updatedUser);
  };

  const handleSignOut = () => {
    setUser(null);
    setToken(null);
    setStats(null);
    setHistory([]);
    localStorage.removeItem("vaaniai_token");
    setView("landing");
  };

  const refreshStats = () => {
    if (token) fetchStats(token);
  };

  const refreshHistory = () => {
    if (token) fetchHistory(token);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050616] flex flex-col justify-center items-center relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/15 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/15 blur-[120px] rounded-full"></div>
        <div className="relative flex flex-col items-center z-10 p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 animate-spin flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Mic className="w-8 h-8 text-white -rotate-45" />
          </div>
          <h2 className="text-2xl font-display font-extrabold text-white mt-6 tracking-wide animate-pulse">
            VaaniAI
          </h2>
          <p className="text-xs text-indigo-300 mt-2 font-mono">Loading Speech Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050616] text-slate-100 font-sans flex flex-col justify-between relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full"></div>
      </div>

      {/* App Navigation Header */}
      <header className="relative z-50 border-b border-white/10 bg-white/5 backdrop-blur-lg sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8 h-full">
            {/* Logo */}
            <div
              onClick={() => setView("landing")}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-95 transition-all"
            >
              <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                <span className="font-display font-black text-sm">V</span>
              </div>
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                VaaniAI
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-2 h-full">
              <button
                onClick={() => setView("landing")}
                className={`px-4 h-full text-sm font-medium transition-colors cursor-pointer flex items-center ${
                  view === "landing"
                    ? "text-white border-b-2 border-indigo-500"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Home
              </button>

              {user && (
                <>
                  <button
                    onClick={() => setView("app")}
                    className={`px-4 h-full text-sm font-medium transition-colors cursor-pointer flex items-center ${
                      view === "app"
                        ? "text-white border-b-2 border-indigo-500"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Voice Generator
                  </button>
                  <button
                    onClick={() => setView("isolator")}
                    className={`px-4 h-full text-sm font-medium transition-colors cursor-pointer flex items-center ${
                      view === "isolator"
                        ? "text-white border-b-2 border-indigo-500"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Voice Isolator
                  </button>
                  <button
                    onClick={() => setView("dashboard")}
                    className={`px-4 h-full text-sm font-medium transition-colors cursor-pointer flex items-center ${
                      view === "dashboard"
                        ? "text-white border-b-2 border-indigo-500"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setView("profile")}
                    className={`px-4 h-full text-sm font-medium transition-colors cursor-pointer flex items-center ${
                      view === "profile"
                        ? "text-white border-b-2 border-indigo-500"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Profile
                  </button>
                </>
              )}

              <button
                onClick={() => setView("pricing")}
                className={`px-4 h-full text-sm font-medium transition-colors cursor-pointer flex items-center ${
                  view === "pricing"
                    ? "text-white border-b-2 border-indigo-500"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Pricing
              </button>
            </nav>
          </div>

          {/* User actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setView("profile")}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-full text-xs flex items-center gap-2 text-indigo-200 transition-all cursor-pointer"
                  title="View Profile"
                >
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                  <span className="font-mono">{user.fullName || user.email}</span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] uppercase font-bold tracking-widest font-mono border border-indigo-500/20">
                    {user.plan}
                  </span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setView("auth");
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode("register");
                    setView("auth");
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Get Started Free</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/10 bg-[#050616]/95 backdrop-blur-xl px-4 py-4 space-y-2">
            <button
              onClick={() => {
                setView("landing");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-all"
            >
              Home
            </button>
            {user && (
              <>
                <button
                  onClick={() => {
                    setView("app");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-all"
                >
                  Voice Generator
                </button>
                <button
                  onClick={() => {
                    setView("isolator");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-all"
                >
                  Voice Isolator
                </button>
                <button
                  onClick={() => {
                    setView("dashboard");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-all"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setView("profile");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-all"
                >
                  Profile
                </button>
              </>
            )}
            <button
              onClick={() => {
                setView("pricing");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-all"
            >
              Pricing
            </button>

            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              {user ? (
                <>
                  <button
                    onClick={() => {
                      setView("profile");
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-left cursor-pointer hover:bg-white/10 transition-all"
                  >
                    <span className="text-xs font-mono text-indigo-200 truncate max-w-[180px]">
                      {user.fullName || user.email}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] uppercase font-bold font-mono">
                      {user.plan}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 border border-white/10 bg-white/5 text-center"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setAuthMode("login");
                      setView("auth");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 text-center"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode("register");
                      setView("auth");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 text-center shadow-lg"
                  >
                    Get Started Free
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Stage */}
      <main className="flex-1 pb-16">
        {view === "landing" && (
          <LandingPage
            onGetStarted={() => {
              if (user) setView("app");
              else {
                setAuthMode("register");
                setView("auth");
              }
            }}
            onNavigateToPricing={() => setView("pricing")}
          />
        )}

        {view === "auth" && (
          <AuthPage onAuthSuccess={handleAuthSuccess} initialMode={authMode} />
        )}

        {view === "app" && token && (
          <VoiceGenerator
            token={token}
            stats={stats}
            history={history}
            user={user}
            onRefreshStats={refreshStats}
            onRefreshHistory={refreshHistory}
          />
        )}

        {view === "isolator" && token && (
          <VoiceIsolator
            token={token}
            stats={stats}
            user={user}
            onRefreshStats={refreshStats}
          />
        )}

        {view === "dashboard" && (
          <Dashboard
            stats={stats}
            user={user}
            onNavigateToPricing={() => setView("pricing")}
          />
        )}

        {view === "pricing" && (
          <PricingPage
            token={token}
            user={user}
            stats={stats}
            onRefreshStats={refreshStats}
            onNavigateToAuth={() => {
              setAuthMode("login");
              setView("auth");
            }}
          />
        )}

        {view === "profile" && token && (
          <ProfilePage
            token={token}
            user={user}
            onProfileUpdate={handleProfileUpdate}
            onNavigateToPricing={() => setView("pricing")}
          />
        )}
      </main>
    </div>
  );
}
