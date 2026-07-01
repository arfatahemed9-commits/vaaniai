import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

// Database file path
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");
export const AUDIO_DIR = path.join(DB_DIR, "audio");

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  plan: "free" | "starter" | "pro" | "business";
  characterUsage: number; // characters used in current month
  lastResetMonth: string; // e.g., "2026-07"
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

interface DatabaseSchema {
  users: User[];
  history: VoiceHistoryItem[];
  clonedVoices?: ClonedVoice[];
}

// Ensure database directory and file exist
function initializeDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      users: [],
      history: [],
      clonedVoices: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  }
}

// Read database
export function readDb(): DatabaseSchema {
  initializeDb();
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (!parsed.clonedVoices) {
      parsed.clonedVoices = [];
    }
    return parsed;
  } catch (error) {
    console.error("Error reading database file, resetting:", error);
    return { users: [], history: [], clonedVoices: [] };
  }
}

// Write database
export function writeDb(data: DatabaseSchema): void {
  initializeDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Helper to get current month string
export function getCurrentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Plan limits definition
export const PLAN_LIMITS = {
  free: 5000,
  starter: 50000,
  pro: 200000,
  business: 1000000,
};

export const PLAN_NAMES = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  business: "Business",
};

// Ensure user usage reset if month changed
export function checkAndResetUsage(user: User): boolean {
  const currentMonth = getCurrentMonthStr();
  if (user.lastResetMonth !== currentMonth) {
    user.characterUsage = 0;
    user.lastResetMonth = currentMonth;
    return true;
  }
  return false;
}
