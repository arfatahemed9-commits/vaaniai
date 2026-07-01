export interface ClonedVoice {
  id: string;
  userId: string;
  name: string;
  sampleFilename: string;
  createdAt: string;
  status: "ready";
  characteristics: string;
  accent: string;
  gender: "Male" | "Female";
  closestVoice: "Puck" | "Charon" | "Kore" | "Fenrir" | "Zephyr";
  pitch: "high" | "medium" | "low";
  speed: "slow" | "medium" | "fast";
}

export interface User {
  id: string;
  email: string;
  plan: "free" | "starter" | "pro" | "business";
  characterUsage: number;
  lastResetMonth: string;
  createdAt: string;
  fullName?: string;
  useCase?: string;
  preferredVoice?: string;
  preferredLanguage?: string;
}

export interface VoiceHistoryItem {
  id: string;
  userId: string;
  text: string;
  voiceId: string;
  voiceName: string;
  characterCount: number;
  audioFilename: string;
  createdAt: string;
  rating?: "up" | "down";
}

export interface DashboardStats {
  plan: "free" | "starter" | "pro" | "business";
  usage: number;
  limit: number;
  historyCount: number;
  remaining: number;
}

export interface Voice {
  id: string;
  name: string;
  lang: "English" | "Hindi" | "Multilingual";
  gender: "Male" | "Female";
  desc: string;
  sampleUrl?: string; // Standard or high-quality preview samples
  avatarUrl?: string;
  styles?: string[];
  characteristics?: string;
  bestSuitedFor?: string;
  accent?: string;
}

export const PREBUILT_VOICES: Voice[] = [
  {
    id: "Kore",
    name: "Kore",
    lang: "Multilingual",
    gender: "Female",
    desc: "Smooth, professional, and crisp. Perfect for educational videos and audiobooks.",
    avatarUrl: "/src/assets/images/avatar_kore_1782912554240.jpg",
    styles: ["Professional", "Educational", "Crisp"],
    characteristics: "Smooth tone, clear enunciation, and standard articulation.",
    bestSuitedFor: "E-learning, audiobooks, instructional videos, and system prompts.",
    accent: "Neutral Global English & Hindi Clear Dialect"
  },
  {
    id: "Zephyr",
    name: "Zephyr",
    lang: "Multilingual",
    gender: "Female",
    desc: "Warm, warm-hearted, and conversational. Excellent for podcasts and narrations.",
    avatarUrl: "/src/assets/images/avatar_zephyr_1782912567088.jpg",
    styles: ["Conversational", "Warm", "Intimate"],
    characteristics: "Calming aura, compassionate rhythm, and gentle breathiness.",
    bestSuitedFor: "Podcasts, guided meditations, personal blogs, and casual narratives.",
    accent: "Friendly Conversational & Expressive Accent"
  },
  {
    id: "Puck",
    name: "Puck",
    lang: "Multilingual",
    gender: "Male",
    desc: "Deep, professional, authoritative, and clear. Ideal for business presentations and corporate videos.",
    avatarUrl: "/src/assets/images/avatar_puck_1782912578208.jpg",
    styles: ["Authoritative", "Corporate", "Trustworthy"],
    characteristics: "Deep baritone resonance, stable cadence, and highly convincing tone.",
    bestSuitedFor: "Corporate sales pitches, executive briefings, news, and business tutorials.",
    accent: "Deep Executive & Trustworthy Voice Accent"
  },
  {
    id: "Fenrir",
    name: "Fenrir",
    lang: "Multilingual",
    gender: "Male",
    desc: "Expressive, rich, energetic, and engaging. Great for gaming narrations and YouTube videos.",
    avatarUrl: "/src/assets/images/avatar_fenrir_1782912590473.jpg",
    styles: ["Expressive", "Energetic", "Excited"],
    characteristics: "Wide dynamic range, lively inflections, and high-energy presence.",
    bestSuitedFor: "Game commentary, sports highlights, social media advertisements, and casual entertainment.",
    accent: "High-Energy Modern & Vibrant Native Accent"
  },
  {
    id: "Charon",
    name: "Charon",
    lang: "Multilingual",
    gender: "Male",
    desc: "Classic narrator, deep, dramatic, and story-focused. Built for audio drama and dramatic stories.",
    avatarUrl: "/src/assets/images/avatar_charon_1782912600824.jpg",
    styles: ["Dramatic", "Mysterious", "Cinematic"],
    characteristics: "Theatrical baritone tone, rich dramatic undertones, and slower story-paced tempo.",
    bestSuitedFor: "Audio dramas, thriller novels, movie trailers, and story recordings.",
    accent: "Deep Cinematic Storyteller Accent"
  },
];
