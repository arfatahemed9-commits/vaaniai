import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

import {
  readDb,
  writeDb,
  checkAndResetUsage,
  getCurrentMonthStr,
  PLAN_LIMITS,
  AUDIO_DIR,
  User,
  VoiceHistoryItem,
  ClonedVoice,
} from "./server/db.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "vaaniai_super_secret_key";

// Ensure data directories exist
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// Instantiate Gemini AI client safely
// The platform automatically injects GEMINI_API_KEY from secrets
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || "MOCK_API_KEY",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

app.use(express.json());

// Serve generated audio files statically
app.use("/audio", express.static(AUDIO_DIR));

// Authentication Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication token required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: "Session expired or invalid token" });
    }
    req.user = decoded;
    next();
  });
}

// --- API ROUTES ---

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV });
});

// Auth: Register
app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const db = readDb();
  const existingUser = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    return res.status(400).json({ error: "Email already registered" });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: User = {
      id: Math.random().toString(36).substring(2, 11),
      email: email.toLowerCase(),
      passwordHash,
      plan: "free",
      characterUsage: 0,
      lastResetMonth: getCurrentMonthStr(),
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    writeDb(db);

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Remove password hash before sending
    const { passwordHash: _, ...userResponse } = newUser;
    res.status(201).json({ user: userResponse, token });
  } catch (error: any) {
    res.status(500).json({ error: "Registration failed: " + error.message });
  }
});

// Auth: Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const db = readDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  try {
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Reset usage if month changed
    const dbCopy = readDb();
    const freshUser = dbCopy.users.find((u) => u.id === user.id);
    if (freshUser) {
      const reset = checkAndResetUsage(freshUser);
      if (reset) {
        writeDb(dbCopy);
      }
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    const { passwordHash: _, ...userResponse } = freshUser || user;
    res.json({ user: userResponse, token });
  } catch (error: any) {
    res.status(500).json({ error: "Login failed: " + error.message });
  }
});

// Auth: Me
app.get("/api/auth/me", authenticateToken, (req: any, res: any) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Sync / Reset usage if new month
  const updated = checkAndResetUsage(user);
  if (updated) {
    writeDb(db);
  }

  const { passwordHash: _, ...userResponse } = user;
  res.json({ user: userResponse });
});

// Upgrade plan
app.post("/api/auth/upgrade", authenticateToken, (req: any, res: any) => {
  const { plan } = req.body;
  if (!plan || !["free", "starter", "pro", "business"].includes(plan)) {
    return res.status(400).json({ error: "Invalid plan selection" });
  }

  const db = readDb();
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);

  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  db.users[userIndex].plan = plan;
  // Increase/adjust usage or leave as is (resetting is premium behavior or keeping current usage)
  writeDb(db);

  const { passwordHash: _, ...userResponse } = db.users[userIndex];
  res.json({ user: userResponse });
});

// Update user profile
app.put("/api/auth/profile", authenticateToken, (req: any, res: any) => {
  const { fullName, useCase, preferredVoice, preferredLanguage } = req.body;

  const db = readDb();
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);

  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  const user = db.users[userIndex];
  if (fullName !== undefined) user.fullName = fullName;
  if (useCase !== undefined) user.useCase = useCase;
  if (preferredVoice !== undefined) user.preferredVoice = preferredVoice;
  if (preferredLanguage !== undefined) user.preferredLanguage = preferredLanguage;

  writeDb(db);

  const { passwordHash: _, ...userResponse } = user;
  res.json({ user: userResponse });
});

// Change password
app.post("/api/auth/change-password", authenticateToken, async (req: any, res: any) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new password are required" });
  }

  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    writeDb(db);

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Password update failed: " + error.message });
  }
});

// Get User History
app.get("/api/history", authenticateToken, (req: any, res: any) => {
  const db = readDb();
  const userHistory = db.history
    .filter((h) => h.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ history: userHistory });
});

// Get User Dashboard Stats
app.get("/api/dashboard", authenticateToken, (req: any, res: any) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  checkAndResetUsage(user);

  const limit = PLAN_LIMITS[user.plan] || 5000;
  const history = db.history.filter((h) => h.userId === req.user.id);

  res.json({
    plan: user.plan,
    usage: user.characterUsage,
    limit,
    historyCount: history.length,
    remaining: Math.max(0, limit - user.characterUsage),
  });
});

// Delete history item
app.delete("/api/history/:id", authenticateToken, (req: any, res: any) => {
  const { id } = req.params;
  const db = readDb();

  const itemIndex = db.history.findIndex((h) => h.id === id && h.userId === req.user.id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: "History item not found or unauthorized" });
  }

  // Delete the physical audio file if it exists
  const item = db.history[itemIndex];
  const filePath = path.join(AUDIO_DIR, item.audioFilename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error("Failed to delete local audio file:", e);
    }
  }

  db.history.splice(itemIndex, 1);
  writeDb(db);

  res.json({ success: true });
});

// Rate history item
app.post("/api/history/:id/rating", authenticateToken, (req: any, res: any) => {
  const { id } = req.params;
  const { rating } = req.body;

  if (rating !== undefined && rating !== null && rating !== "up" && rating !== "down") {
    return res.status(400).json({ error: "Invalid rating value" });
  }

  const db = readDb();
  const item = db.history.find((h) => h.id === id && h.userId === req.user.id);
  if (!item) {
    return res.status(404).json({ error: "History item not found or unauthorized" });
  }

  if (rating === null || rating === undefined) {
    delete item.rating;
  } else {
    item.rating = rating;
  }

  writeDb(db);
  res.json({ success: true, item });
});

// Voice previews mapping
const PREVIEW_TEXTS: { [key: string]: string } = {
  Puck: "Hi there! I am Puck. I provide a deep, professional, and authoritative voice for your presentations.",
  Charon: "Welcome. I am Charon, a deep narrator built for audio dramas and dramatic storytelling.",
  Kore: "Hello! I am Kore. My voice is smooth and professional, perfect for educational content and audiobooks.",
  Fenrir: "Hey! I am Fenrir. I offer an expressive and energetic voice perfect for games and narrations.",
  Zephyr: "Hi! I am Zephyr, a warm and conversational voice designed for podcasts and narrations."
};

// --- VOICE CLONING ENDPOINTS ---

// Optimize Script for Social Platforms
app.post("/api/optimize-script", authenticateToken, async (req: any, res: any) => {
  const { text, platform } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Script text is required" });
  }

  const selectedPlatform = platform || "General"; // default to General

  try {
    let systemPrompt = "";
    if (selectedPlatform === "YouTube") {
      systemPrompt = "You are a world-class viral video content strategist and script writer for YouTube. " +
        "Your goal is to optimize the user's voiceover script for maximum audience retention and click-through value.\n" +
        "Guidelines:\n" +
        "1. Capture attention instantly in the first 3 seconds with a strong hook (use dynamic pacing guidelines in brackets like [FAST HOOK]).\n" +
        "2. Break down into logical segments with flow directives in brackets (e.g., [DYNAMIC PACING], [BUILDING CURIOSITY], [EMPHASIZED Close]).\n" +
        "3. Emphasize key power words for the voice synthesizer by writing them in ALL CAPS.\n" +
        "4. Avoid dry explanations. Keep the tone conversational, highly natural, energetic, and audience-focused.\n" +
        "5. Keep the final output short and strictly under 1500 characters, structured for reading aloud.";
    } else if (selectedPlatform === "Ads") {
      systemPrompt = "You are a world-class copywriter and conversion rate optimization specialist. " +
        "Your goal is to rewrite and optimize this promotional or ad script for high conversions and instant focus.\n" +
        "Guidelines:\n" +
        "1. Hook the viewer in the first 2 seconds with a clear problem statement or mind-blowing claim.\n" +
        "2. Present the solution clearly with annotations on pacing like [CLEAR EMBEDDED BENEFIT].\n" +
        "3. Emphasize key value propositions and promotional discounts in ALL CAPS.\n" +
        "4. Include a high-converting, crystal clear Call to Action (CTA) at the end, marked [URGENT CTA].\n" +
        "5. Keep it natural, clear, punchy, persuasive, and under 1000 characters.";
    } else if (selectedPlatform === "Reels") {
      systemPrompt = "You are a viral vertical short-form specialist for Instagram Reels and TikTok. " +
        "Your goal is to optimize this script to trigger loop views, high retention, and maximum engagement.\n" +
        "Guidelines:\n" +
        "1. Create a massive pattern interrupt or shocking question in the first 3 seconds, annotated as [SHOCKING HOOK].\n" +
        "2. Keep sentences extremely punchy and fast-paced (annotated as [RAPID PACING]).\n" +
        "3. Capitalize key words for emphasis (e.g. NEVER, MUST, CRITICAL).\n" +
        "4. Structure a perfect loop potential or seamless loop transition close if possible.\n" +
        "5. Keep the tone authentic, direct, incredibly engaging, and strictly under 600 characters.";
    } else { // General high-retention script optimization engine
      systemPrompt = "You are a world-class Voiceover Script Optimization Engine. " +
        "Your goal is to rewrite the input script to achieve maximum audience retention, flawless flow, and clear emotional impact.\n" +
        "Guidelines:\n" +
        "1. ADD A STRONG HOOK: Ensure the first 3 seconds contains a gripping, attention-grabbing statement or intriguing question.\n" +
        "2. IMPROVE CLARITY & SIMPLIFY: Remove dry, academic, passive, or boring language. Replace weak phrasing with short, energetic, active voice phrasing.\n" +
        "3. ENHANCE FLOW: Ensure logical, smooth transitions between ideas.\n" +
        "4. NATURAL PAUSES: Insert [PAUSE] or [BREATH] markers at appropriate breathing/pacing points to enhance the natural rhythm of speech.\n" +
        "5. EMPHASIS POINTS: Write critical power words or key concepts in ALL CAPS (e.g., REMEMBER, EXTREMELY, SECRET) to highlight vocal emphasis.\n" +
        "6. Return a natural, highly engaging script keeping the original message but dramatically raising retention and professional readability.";
    }

    if (apiKey && apiKey !== "MOCK_API_KEY") {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemPrompt}\n\nHere is the user's raw script text to optimize:\n"${text}"\n\nReturn ONLY the optimized script. Do not include introductory remarks like "Here is your script" or markdown blocks.`
              }
            ]
          }
        ]
      });

      const optimizedText = response?.text?.trim() || text;
      res.json({ optimizedText });
    } else {
      // Mock / fallback optimization
      const lines = text.split("\n").filter((l: string) => l.trim());
      const firstLine = lines[0] || "Discover this secret!";
      const remainingLines = lines.slice(1).join("\n");
      const fallbackOptimized = `[FAST HOOK - 0:00-0:03] Stop scrolling! HERE is why you are missing out: ${firstLine}\n\n[DYNAMIC PACING] ${remainingLines || "You need to try this right now. It will literally change the way you think about content."}\n\n[URGENT CTA] Follow for more daily hacks!`;
      res.json({ optimizedText: fallbackOptimized });
    }
  } catch (err: any) {
    console.error("Script optimization failed:", err);
    res.status(500).json({ error: "Failed to optimize script: " + err.message });
  }
});

// List Cloned Voices
app.get("/api/clone/list", authenticateToken, (req: any, res: any) => {
  const db = readDb();
  const userClonedVoices = (db.clonedVoices || [])
    .filter((v) => v.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ clonedVoices: userClonedVoices });
});

// Create/Process Cloned Voice
app.post("/api/clone/create", authenticateToken, async (req: any, res: any) => {
  const { name, audioBase64, mimeType } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Voice profile name is required" });
  }
  if (!audioBase64) {
    return res.status(400).json({ error: "Audio data is required for voice cloning" });
  }

  try {
    const db = readDb();
    const user = db.users.find((u) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Limit each user to max 10 custom cloned voice profiles
    const existingClones = (db.clonedVoices || []).filter((v) => v.userId === req.user.id);
    if (existingClones.length >= 10) {
      return res.status(400).json({ error: "You have reached the maximum of 10 cloned voice profiles. Please delete an existing profile to clone a new one." });
    }

    // Convert audio base64 back to buffer
    const audioBuffer = Buffer.from(audioBase64, "base64");
    const sampleFilename = `clone_sample_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.wav`;
    const sampleFilePath = path.join(AUDIO_DIR, sampleFilename);

    // Write file to audio dir
    fs.writeFileSync(sampleFilePath, audioBuffer);

    // Default characteristics
    let closestVoice: "Puck" | "Charon" | "Kore" | "Fenrir" | "Zephyr" = "Kore";
    let gender: "Male" | "Female" = "Female";
    let pitch: "high" | "medium" | "low" = "medium";
    let speed: "slow" | "medium" | "fast" = "medium";
    let characteristics = "clear, professional, natural";
    let accent = "Neutral English";

    try {
      if (apiKey && apiKey !== "MOCK_API_KEY") {
        console.log("Analyzing audio sample with gemini-3.5-flash...");
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            {
              inlineData: {
                mimeType: mimeType || "audio/wav",
                data: audioBase64
              }
            },
            "Analyze this audio clip of a user speaking. Determine their vocal characteristics for speech synthesis. Return a raw JSON object containing these exact keys:\n" +
            "{\n" +
            '  "closestVoice": "Puck" | "Charon" | "Kore" | "Fenrir" | "Zephyr",\n' +
            '  "gender": "Male" | "Female",\n' +
            '  "pitch": "high" | "medium" | "low",\n' +
            '  "speed": "slow" | "medium" | "fast",\n' +
            '  "characteristics": "comma-separated list of adjectives describing style (e.g., warm, raspy, energetic)",\n' +
            '  "accent": "short description of accent (e.g., British, American, Indian English)"\n' +
            "}\n" +
            "Do not output markdown code blocks. Return ONLY the raw JSON."
          ],
          config: {
            responseMimeType: "application/json"
          }
        });

        const textResponse = response?.text;
        if (textResponse) {
          try {
            const jsonStr = textResponse.replace(/```json|```/gi, "").trim();
            const result = JSON.parse(jsonStr);
            if (result.closestVoice && ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"].includes(result.closestVoice)) {
              closestVoice = result.closestVoice;
            }
            if (result.gender && ["Male", "Female"].includes(result.gender)) {
              gender = result.gender;
            }
            if (result.pitch && ["high", "medium", "low"].includes(result.pitch)) {
              pitch = result.pitch;
            }
            if (result.speed && ["slow", "medium", "fast"].includes(result.speed)) {
              speed = result.speed;
            }
            if (result.characteristics) characteristics = result.characteristics;
            if (result.accent) accent = result.accent;
          } catch (e) {
            console.error("Failed to parse Gemini json output, using default profiles:", e);
          }
        }
      }
    } catch (err) {
      console.error("Gemini audio analysis failed, using fallback:", err);
    }

    const newClonedVoice: ClonedVoice = {
      id: "clone_" + Math.random().toString(36).substring(2, 11),
      userId: user.id,
      name: name.trim(),
      sampleFilename,
      createdAt: new Date().toISOString(),
      status: "ready",
      characteristics,
      accent,
      gender,
      closestVoice,
      pitch,
      speed
    };

    if (!db.clonedVoices) {
      db.clonedVoices = [];
    }
    db.clonedVoices.push(newClonedVoice);
    writeDb(db);

    res.status(201).json({ success: true, clonedVoice: newClonedVoice });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create cloned voice: " + error.message });
  }
});

// Delete Cloned Voice
app.delete("/api/clone/:id", authenticateToken, (req: any, res: any) => {
  const { id } = req.params;
  const db = readDb();

  const itemIndex = (db.clonedVoices || []).findIndex((v) => v.id === id && v.userId === req.user.id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: "Cloned voice profile not found or unauthorized" });
  }

  const item = db.clonedVoices![itemIndex];
  const filePath = path.join(AUDIO_DIR, item.sampleFilename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error("Failed to delete local audio sample file:", e);
    }
  }

  db.clonedVoices!.splice(itemIndex, 1);
  writeDb(db);

  res.json({ success: true });
});

// Generate Preview Audio (Free preview)
app.post("/api/preview", authenticateToken, async (req: any, res: any) => {
  const { voiceId } = req.body;
  if (!voiceId) {
    return res.status(400).json({ error: "voiceId is required" });
  }

  const previewText = PREVIEW_TEXTS[voiceId] || "Hello, this is a quick voice style preview.";

  try {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in the Secrets panel. Please ensure it is present.");
    }

    let base64Audio = "";
    try {
      console.log(`Attempting TTS preview with model gemini-2.5-flash-preview-tts for voice ${voiceId}`);
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: previewText }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceId },
            },
          },
        },
      });
      base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    } catch (primaryError: any) {
      console.warn("Primary model gemini-2.5-flash-preview-tts failed, trying fallback for preview:", primaryError.message);
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: previewText }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceId },
            },
          },
        },
      });
      base64Audio = fallbackResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    }

    if (!base64Audio) {
      throw new Error("Failed to receive voice preview data from Gemini");
    }

    const audioBuffer = Buffer.from(base64Audio, "base64");
    const audioFilename = `preview_${voiceId}_${Date.now()}.wav`;
    const audioFilePath = path.join(AUDIO_DIR, audioFilename);

    fs.writeFileSync(audioFilePath, audioBuffer);

    res.status(200).json({
      success: true,
      audioUrl: `/audio/${audioFilename}`,
    });
  } catch (error: any) {
    console.error("Preview generation failed:", error);
    res.status(500).json({ error: "Preview generation failed: " + error.message });
  }
});

// Generate Voice (Text to Speech)
app.post("/api/generate", authenticateToken, async (req: any, res: any) => {
  const { text, voiceId, emotion, language } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Text is required for speech generation" });
  }

  const trimmedText = text.trim();
  const charCount = trimmedText.length;

  // Validate characters limits
  const db = readDb();
  const userIndex = db.users.findIndex((u) => u.id === req.user.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  const user = db.users[userIndex];
  checkAndResetUsage(user);

  const limit = PLAN_LIMITS[user.plan] || 5000;
  if (user.characterUsage + charCount > limit) {
    return res.status(400).json({
      error: `Character limit reached. Your ${user.plan} plan has ${limit.toLocaleString()} characters/month, and you have already used ${user.characterUsage.toLocaleString()}. Generating this would exceed your limit. Please upgrade your plan in the pricing section.`,
    });
  }

  // Voice lookup and name
  const voiceMap: { [key: string]: string } = {
    Puck: "Puck (Deep Professional)",
    Charon: "Charon (Narrator Male)",
    Kore: "Kore (Smooth Female)",
    Fenrir: "Fenrir (Expressive Male)",
    Zephyr: "Zephyr (Warm Conversational)",
  };

  const clonedVoice = (db.clonedVoices || []).find((v) => v.id === voiceId && v.userId === user.id);
  const voiceName = clonedVoice ? `${clonedVoice.name} (Cloned)` : (voiceMap[voiceId] || voiceId || "Kore");
  const baseVoiceId = clonedVoice ? clonedVoice.closestVoice : (voiceId || "Kore");

  try {
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not configured in the Secrets panel. Please ensure it is present."
      );
    }

    // Format text with optionally selected emotion/style and language instruction
    let voicePromptText = trimmedText;
    const langSuffix = language === "hi" ? " in Hindi" : " in English";

    if (clonedVoice) {
      const cloneInstruct = `Speak with a ${clonedVoice.pitch} pitch and ${clonedVoice.speed} pacing. Vocal style: ${clonedVoice.characteristics}. Accent: ${clonedVoice.accent}.`;
      if (emotion) {
        voicePromptText = `Say ${emotion === "cheerful" ? "cheerfully" : emotion === "calm" ? "calmly and gently" : emotion === "professional" ? "professionally and clearly" : "energetically"}${langSuffix}, matching these vocal guidelines [${cloneInstruct}]: ${trimmedText}`;
      } else {
        voicePromptText = `Say${langSuffix}, matching these vocal guidelines [${cloneInstruct}]: ${trimmedText}`;
      }
    } else {
      if (emotion) {
        if (emotion === "cheerful") {
          voicePromptText = `Say cheerfully${langSuffix}: ${trimmedText}`;
        } else if (emotion === "calm") {
          voicePromptText = `Say calmly and gently${langSuffix}: ${trimmedText}`;
        } else if (emotion === "professional") {
          voicePromptText = `Say professionally and clearly${langSuffix}: ${trimmedText}`;
        } else if (emotion === "energetic") {
          voicePromptText = `Say energetically and with excitement${langSuffix}: ${trimmedText}`;
        }
      } else {
        voicePromptText = `Say${langSuffix}: ${trimmedText}`;
      }
    }

    let base64Audio = "";
    
    // We will attempt with gemini-2.5-flash-preview-tts as requested
    // And fallback to gemini-3.1-flash-tts-preview if that is unavailable or deprecated
    try {
      console.log(`Attempting TTS with model gemini-2.5-flash-preview-tts for voice ${baseVoiceId}`);
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: voicePromptText }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: baseVoiceId },
            },
          },
        },
      });

      base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    } catch (primaryError: any) {
      console.warn("Primary model gemini-2.5-flash-preview-tts failed, falling back to gemini-3.1-flash-tts-preview:", primaryError.message);
      
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: voicePromptText }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: baseVoiceId },
            },
          },
        },
      });

      base64Audio = fallbackResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    }

    if (!base64Audio) {
      throw new Error("Failed to receive voice data from the Gemini API");
    }

    // Convert base64 to binary buffer
    const audioBuffer = Buffer.from(base64Audio, "base64");
    const audioFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.wav`;
    const audioFilePath = path.join(AUDIO_DIR, audioFilename);

    // Write file to local server path
    fs.writeFileSync(audioFilePath, audioBuffer);

    // Create history item
    const historyItem: VoiceHistoryItem = {
      id: Math.random().toString(36).substring(2, 11),
      userId: user.id,
      text: trimmedText,
      voiceId: voiceId || "Kore",
      voiceName,
      characterCount: charCount,
      audioFilename,
      createdAt: new Date().toISOString(),
    };

    // Update user characters used
    user.characterUsage += charCount;

    db.history.push(historyItem);
    writeDb(db);

    res.status(200).json({
      success: true,
      audioUrl: `/audio/${audioFilename}`,
      historyItem,
      characterUsage: user.characterUsage,
    });
  } catch (error: any) {
    console.error("Voice generation failed:", error);
    res.status(500).json({ error: "Speech generation failed: " + error.message });
  }
});

// Analyze Audio Voice using Multimodal Gemini 3.5 Flash
app.post("/api/enhance/analyze", authenticateToken, async (req: any, res: any) => {
  const { audioData, mimeType } = req.body;

  if (!audioData) {
    return res.status(400).json({ error: "Audio data (base64) is required for analysis." });
  }

  try {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in the Secrets panel. Please ensure it is present.");
    }

    console.log("Analyzing audio payload using gemini-3.5-flash...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            data: audioData,
            mimeType: mimeType || "audio/wav"
          }
        },
        "Analyze this voice recording for vocal quality, room noise, clarity, speaking pace, echo, distortion, and warmth. Provide a comprehensive, structured report in JSON format with exact recommendations. Do not include markdown block ticks in your response, output ONLY raw JSON that strictly conforms to this TypeScript structure:\n" +
        "{\n" +
        "  \"transcript\": string (precise speech-to-text transcript),\n" +
        "  \"noiseLevel\": \"low\" | \"medium\" | \"high\",\n" +
        "  \"noiseDescription\": string (precise description of any noise, e.g., low-frequency HVAC rumble, background hiss, outdoor wind, or dead silence),\n" +
        "  \"clarityScore\": number (0-100 indicating vocal clarity),\n" +
        "  \"speakingPace\": \"Too fast\" | \"Perfect\" | \"Slow\",\n" +
        "  \"echoLevel\": \"none\" | \"slight\" | \"heavy\",\n" +
        "  \"distortionDetected\": boolean,\n" +
        "  \"vocalWarmth\": \"warm\" | \"neutral\" | \"thin\",\n" +
        "  \"recommendations\": string[] (3 specific practical recommendations for getting the absolute cleanest audio based on this recording)\n" +
        "}"
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const reportText = response.text || "{}";
    const reportData = JSON.parse(reportText.trim());

    res.status(200).json({
      success: true,
      report: reportData
    });

  } catch (error: any) {
    console.error("Audio analysis failed:", error);
    res.status(500).json({ error: "Failed to analyze audio voice: " + error.message });
  }
});

// --- CLIENT SERVER CONFIGURATION (Vite + Static Serving) ---

async function startServer() {
  // Vite dev server middleware in non-production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
