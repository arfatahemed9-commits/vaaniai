import React, { useState } from "react";
import { Mic, Zap, Sparkles, Shield, Play, Pause, ChevronRight, HelpCircle } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onNavigateToPricing: () => void;
}

interface VoiceSample {
  name: string;
  lang: string;
  gender: string;
  text: string;
  accent: string;
}

const SAMPLE_VOICES: VoiceSample[] = [
  {
    name: "Kore (Female)",
    lang: "Hindi & English",
    gender: "Female",
    text: "वाणी एआई में आपका स्वागत है। मैं एक अत्यंत प्राकृतिक और स्पष्ट आवाज हूँ।",
    accent: "Neutral Indian",
  },
  {
    name: "Zephyr (Conversational)",
    lang: "English (US)",
    gender: "Female",
    text: "Hey there! I can help you create engaging podcasts and stories with high warmth.",
    accent: "Warm Friendly",
  },
  {
    name: "Puck (Narrator)",
    lang: "English (UK)",
    gender: "Male",
    text: "Welcome back, listeners. Today, we delve deep into the mysteries of voice synthesis.",
    accent: "Deep Authoritative",
  },
  {
    name: "Fenrir (Expressive)",
    lang: "Hindi",
    gender: "Male",
    text: "चैनल पर आने के लिए धन्यवाद! आज का वीडियो बहुत ही शानदार होने वाला है, अंत तक बने रहें।",
    accent: "High Energy",
  },
];

export default function LandingPage({ onGetStarted, onNavigateToPricing }: LandingPageProps) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(
    typeof window !== "undefined" ? window.speechSynthesis : null
  );

  const handlePlaySample = (index: number, sample: VoiceSample) => {
    if (!synth) return;

    if (playingIndex === index) {
      synth.cancel();
      setPlayingIndex(null);
      return;
    }

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(sample.text);
    
    // Choose voice based on Hindi or English
    if (sample.text.includes("वाणी") || sample.text.includes("चैनल")) {
      utterance.lang = "hi-IN";
    } else if (sample.name.includes("Puck")) {
      utterance.lang = "en-GB";
    } else {
      utterance.lang = "en-US";
    }

    // Set rate and pitch slightly to match characteristics
    if (sample.name.includes("Puck")) {
      utterance.pitch = 0.8;
      utterance.rate = 0.9;
    } else if (sample.name.includes("Zephyr")) {
      utterance.pitch = 1.1;
      utterance.rate = 1.0;
    } else if (sample.name.includes("Kore")) {
      utterance.pitch = 1.0;
      utterance.rate = 0.95;
    }

    utterance.onend = () => {
      setPlayingIndex(null);
    };

    setPlayingIndex(index);
    synth.speak(utterance);
  };

  return (
    <div className="relative overflow-hidden pt-12">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16 pb-24 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-indigo-300 text-xs sm:text-sm font-medium mb-6">
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
          <span>Multilingual Natural Voice Generation</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-tight">
          Create Natural Speech in <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
            Hindi & English
          </span>{" "}
          Instantly
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
          The ultimate Text-to-Speech platform tailored for creators, developers, and educators.
          Convert text to lifelike audio using Gemini-powered vocal models.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Start Generating Free</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={onNavigateToPricing}
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-slate-300 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all cursor-pointer backdrop-blur-md"
          >
            View Pricing Plans
          </button>
        </div>

        {/* Floating statistics dashboard */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md max-w-5xl mx-auto text-left">
          <div>
            <div className="text-xs sm:text-sm text-slate-500 uppercase tracking-widest font-mono">Multilingual</div>
            <div className="text-2xl sm:text-3xl font-bold font-display text-white mt-1">Hindi & English</div>
          </div>
          <div className="border-l border-white/10 pl-4 sm:pl-6">
            <div className="text-xs sm:text-sm text-slate-500 uppercase tracking-widest font-mono">Prebuilt Voices</div>
            <div className="text-2xl sm:text-3xl font-bold font-display text-white mt-1">5 Models</div>
          </div>
          <div className="border-l border-white/10 pl-4 sm:pl-6">
            <div className="text-xs sm:text-sm text-slate-500 uppercase tracking-widest font-mono">Conversion Speed</div>
            <div className="text-2xl sm:text-3xl font-bold font-display text-white mt-1">&lt; 1.5s</div>
          </div>
          <div className="border-l border-white/10 pl-4 sm:pl-6">
            <div className="text-xs sm:text-sm text-slate-500 uppercase tracking-widest font-mono">SaaS Free Limit</div>
            <div className="text-2xl sm:text-3xl font-bold font-display text-white mt-1">5K Chars/mo</div>
          </div>
        </div>
      </section>

      {/* Sample Voice Players */}
      <section className="py-20 border-t border-white/10 bg-white/5 relative z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
              Listen to the Natural Sound of VaaniAI
            </h2>
            <p className="mt-4 text-slate-400">
              Hear our natural prebuilt voice models in action. Tap to play samples in both English and Hindi.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {SAMPLE_VOICES.map((sample, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                      {sample.lang}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {sample.accent} • {sample.gender}
                    </span>
                  </div>
                  <h3 className="text-lg font-display font-semibold text-white">{sample.name}</h3>
                  <p className="mt-3 text-sm text-slate-400 italic">"{sample.text}"</p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {playingIndex === idx && (
                      <div className="flex items-end gap-1 h-4">
                        <span className="w-1 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_100ms] h-2"></span>
                        <span className="w-1 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_300ms] h-4"></span>
                        <span className="w-1 bg-purple-500 rounded-full animate-[bounce_1s_infinite_500ms] h-3"></span>
                        <span className="w-1 bg-purple-400 rounded-full animate-[bounce_1s_infinite_200ms] h-1"></span>
                      </div>
                    )}
                    <span className="text-xs text-slate-500">
                      {playingIndex === idx ? "Playing voice demo..." : "Click to play demo"}
                    </span>
                  </div>

                  <button
                    onClick={() => handlePlaySample(idx, sample)}
                    className="p-3 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white transition-all shadow-md cursor-pointer flex items-center justify-center"
                  >
                    {playingIndex === idx ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-20 border-t border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
              Designed For Content Creators
            </h2>
            <p className="mt-4 text-slate-400">
              Save hundreds of hours of manual voice recording and professional studio costs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col gap-4">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-white">Engaging Narrations</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Generate naturally flowing voiceovers for your videos, presentations, and tutorials. The model speaks with human pacing, breathing patterns, and emotional accents.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col gap-4">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-white">Instant Conversions</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Type or paste your scripts, choose a prebuilt voice, and generate high-fidelity audio streams in seconds. Access offline historical audio logs anytime.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col gap-4">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-white">Bilingual Optimization</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Engineered from the ground up to recognize and speak natural Indian English and standard Hindi, resolving pronunciation nuances common in native accents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple CTA Footer */}
      <footer className="py-12 border-t border-white/10 bg-white/5 relative z-10 text-center backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-left">
            <div className="text-lg font-display font-extrabold tracking-tight text-white flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
                <span className="font-display font-black text-xs text-white">V</span>
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">VaaniAI</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">© 2026 VaaniAI. Built for creators globally.</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onGetStarted}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              Get Started Free
            </button>
            <button
              onClick={onNavigateToPricing}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            >
              Plans & Pricing
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
