import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Music,
  Download,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Clock,
  Volume2,
  Smile,
  ChevronRight,
  Gauge,
  ThumbsUp,
  ThumbsDown,
  Info,
  X,
  Upload,
  Plus,
  FileText,
  CheckCircle2,
  Copy,
  Share2,
  Twitter,
  Linkedin,
  Loader2,
  Zap,
  Square,
} from "lucide-react";
import { PREBUILT_VOICES, Voice, VoiceHistoryItem, DashboardStats, User as UserType, ClonedVoice } from "../types";

interface BatchBlock {
  id: string;
  text: string;
  status: "pending" | "generating" | "success" | "failed";
  audioUrl?: string;
  error?: string;
}

const LABELS = {
  en: {
    workspaceTitle: "Vocal Workspace",
    demoBtn: "Demo Script",
    placeholder: "Type or paste your content script here in English or Hindi...",
    charRemaining: "characters remaining",
    selectVoice: "Select AI Voice Narrator",
    styleEmotion: "Style / Emotion Accent",
    generateBtn: "Generate Audio Output",
    generating: "Generating...",
    voiceProfile: "Vocal Profile Details",
    activeCore: "Active Core",
    supports: "Supports",
    encoding: "Encoding",
    pronunciationTipTitle: "Perfect Pronunciation Tip",
    pronunciationTipDesc: "When generating Hindi text, you can type in standard Devanagari script or Latin Romanized transliteration. The vocal synthesizer recognizes both dialects beautifully. Use commas (,) or periods (.) for organic breathing breaks.",
    historyTitle: "Vocal Outputs History",
    historyEmpty: "No generated voices yet",
    historyEmptySub: "Write some text above and convert it to speech to see your history logs.",
    chars: "chars",
    downloadWav: "Download WAV",
    deleteLog: "Delete log",
    activeVoiceSupports: "English, Hindi & Hinglish",
    highFidelity: "WAV High Fidelity",
    voiceoverReady: "VaaniAI Voiceover Ready",
    newAudioGenerated: "New Audio Generated",
    generatedUsingVoice: "Generated using voice:",
    playbackSpeed: "Playback Speed",
    quotaTitle: "Character Quota Status",
    quotaRemaining: "Remaining Quota",
    quotaUsed: "Used",
    quotaDraftImpact: "Draft Impact",
    quotaAvailable: "Available for Generation",
    quotaWarningLimit: "Not enough quota remaining. Please shorten your script or upgrade your plan.",
    quotaPlanLabel: "Active Plan",
    voiceDetailsTitle: "Voice Profile Details",
    voiceAccent: "Vocal Accent",
    voiceStyles: "Vocal Styles",
    voiceCharacteristics: "Key Characteristics",
    bestSuited: "Best Suited For",
    quickPreview: "Quick Audio Preview",
    previewGenerating: "Generating Preview...",
    closeBtn: "Close",
    genderMale: "Male",
    genderFemale: "Female",
    batchModeTab: "Batch Processing",
    singleModeTab: "Single Script",
    batchModeTitle: "Batch Mode Workspace",
    batchPlaceholder: "Paste multiple lines or paragraphs here. Each non-empty line will become an individual audio block. Or, upload a .txt file below...",
    uploadFileBtn: "Upload Text File (.txt)",
    dragDropText: "Drag & drop a .txt file here, or click to browse",
    parseBlocksBtn: "Parse Into Audio Blocks",
    parsedBlocksLabel: "Extracted Audio Blocks",
    generateAllBtn: "Generate All Blocks",
    clearAllBtn: "Clear All Blocks",
    blockLabel: "Block",
    statusPending: "Pending Synthesis",
    statusGenerating: "Synthesizing Audio...",
    statusSuccess: "Ready",
    statusFailed: "Failed",
    addBlockBtn: "Add Custom Block",
  },
  hi: {
    workspaceTitle: "वाणी कार्यक्षेत्र (Vocal Workspace)",
    demoBtn: "डेमो स्क्रिप्ट",
    placeholder: "अपनी स्क्रिप्ट यहाँ हिंदी या अंग्रेजी में लिखें या पेस्ट करें...",
    charRemaining: "वर्ण शेष (characters remaining)",
    selectVoice: "एआई आवाज कथावाचक चुनें (Select AI Voice)",
    styleEmotion: "शैली / भावना लहजा (Style / Emotion)",
    generateBtn: "ऑडियो उत्पन्न करें (Generate Audio)",
    workspaceSubtitle: "एक साथ कई ऑडियो क्लिप उत्पन्न करें",
    generating: "ऑडियो उत्पन्न हो रहा है...",
    voiceProfile: "आवाज प्रोफाइल विवरण",
    activeCore: "सक्रिय कोर (Active Core)",
    supports: "समर्थन करता है",
    encoding: "एन्कोडिंग (Encoding)",
    pronunciationTipTitle: "सही उच्चारण संकेत",
    pronunciationTipDesc: "हिंदी पाठ उत्पन्न करते समय, आप मानक देवनागरी लिपि या लैटिन रोमनकृत लिप्यंतरण का उपयोग कर सकते हैं। स्वर सिंथेसाइज़र दोनों रूपों को खूबसूरती से पहचानता है। प्राकृतिक सांस लेने के विराम के लिए अल्पविराम (,) या पूर्ण विराम (.) का उपयोग करें।",
    historyTitle: "उत्पन्न आवाज का इतिहास (Voice History)",
    historyEmpty: "अभी तक कोई आवाज उत्पन्न नहीं हुई है",
    historyEmptySub: "इतिहास लॉग देखने के लिए ऊपर कुछ पाठ लिखें और उसे आवाज में बदलें।",
    chars: "वर्ण",
    downloadWav: "डाउनलोड WAV",
    deleteLog: "लॉग हटाएं",
    activeVoiceSupports: "अंग्रेजी, हिंदी और हिंग्लिश",
    highFidelity: "वेव हाई फिडेलिटी (WAV)",
    voiceoverReady: "वाणीएआई वॉयसओवर तैयार है",
    newAudioGenerated: "नया ऑडियो उत्पन्न हुआ",
    generatedUsingVoice: "उत्पन्न आवाज:",
    playbackSpeed: "प्लेबैक गति (Playback Speed)",
    quotaTitle: "वर्ण कोटा स्थिति (Quota Status)",
    quotaRemaining: "शेष कोटा (Remaining Quota)",
    quotaUsed: "उपयोग किया गया (Used)",
    quotaDraftImpact: "ड्राफ्ट प्रभाव (Draft Impact)",
    quotaAvailable: "उत्पादन के लिए उपलब्ध (Available)",
    quotaWarningLimit: "पर्याप्त कोटा शेष नहीं है। कृपया स्क्रिप्ट छोटी करें या अपग्रेड करें।",
    quotaPlanLabel: "सक्रिय प्लान (Active Plan)",
    voiceDetailsTitle: "आवाज प्रोफाइल विवरण",
    voiceAccent: "स्वर लहजा (Vocal Accent)",
    voiceStyles: "स्वर शैलियाँ (Vocal Styles)",
    voiceCharacteristics: "मुख्य विशेषताएं (Characteristics)",
    bestSuited: "इसके लिए सर्वोत्तम (Best Suited)",
    quickPreview: "त्वरित ऑडियो पूर्वावलोकन (Preview)",
    previewGenerating: "पूर्वावलोकन तैयार हो रहा है...",
    closeBtn: "बंद करें (Close)",
    genderMale: "पुरुष (Male)",
    genderFemale: "महिला (Female)",
    batchModeTab: "बैच प्रोसेसिंग (Batch Mode)",
    singleModeTab: "एकल स्क्रिप्ट (Single Text)",
    batchModeTitle: "बैच मोड कार्यक्षेत्र",
    batchPlaceholder: "यहाँ कई लाइनें या पैराग्राफ पेस्ट करें। प्रत्येक गैर-खाली लाइन एक अलग ऑडियो ब्लॉक बनेगी। या फिर नीचे .txt फ़ाइल अपलोड करें...",
    uploadFileBtn: "टेक्स्ट फ़ाइल अपलोड करें (.txt)",
    dragDropText: "यहाँ .txt फ़ाइल खींचें और छोड़ें, या ब्राउज़ करने के लिए क्लिक करें",
    parseBlocksBtn: "ऑडियो ब्लॉक में विभाजित करें",
    parsedBlocksLabel: "निकाले गए ऑडियो ब्लॉक",
    generateAllBtn: "सभी ब्लॉक उत्पन्न करें",
    clearAllBtn: "सभी ब्लॉक साफ़ करें",
    blockLabel: "ब्लॉक",
    statusPending: "उत्पादन की प्रतीक्षा में",
    statusGenerating: "संश्लेषण हो रहा है...",
    statusSuccess: "तैयार",
    statusFailed: "विफल",
    addBlockBtn: "कस्टम ब्लॉक जोड़ें",
  }
};

interface VoiceGeneratorProps {
  token: string;
  stats: DashboardStats | null;
  history: VoiceHistoryItem[];
  user: UserType | null;
  onRefreshStats: () => void;
  onRefreshHistory: () => void;
}

export default function VoiceGenerator({
  token,
  stats,
  history,
  user,
  onRefreshStats,
  onRefreshHistory,
}: VoiceGeneratorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "hi">(
    user?.preferredLanguage === "hi" || user?.preferredLanguage === "hinglish" ? "hi" : "en"
  );
  const [text, setText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState<string>(user?.preferredVoice || "Kore");
  const [selectedEmotion, setSelectedEmotion] = useState<string>("standard");
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successAudioUrl, setSuccessAudioUrl] = useState<string | null>(null);

  // Audio elements ref for history players
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const mainAudioRef = useRef<HTMLAudioElement | null>(null);
  const [mainIsPlaying, setMainIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Voice details modal state
  const [selectedVoiceDetails, setSelectedVoiceDetails] = useState<Voice | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewIsPlaying, setPreviewIsPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sharing states
  const [sharingItem, setSharingItem] = useState<VoiceHistoryItem | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Voice Cloning States
  const [activeTab, setActiveTab] = useState<"single" | "batch" | "cloning">("single");
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [clonedVoiceName, setClonedVoiceName] = useState("");
  const [cloningSubmitLoading, setCloningSubmitLoading] = useState(false);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [cloningAudioUrl, setCloningAudioUrl] = useState<string | null>(null);
  const [isPlayingCloningAudio, setIsPlayingCloningAudio] = useState(false);
  
  // Media Recorder and Stream Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<any>(null);
  const recordAudioElementRef = useRef<HTMLAudioElement | null>(null);
  
  // Audio Visualizer states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const fetchClonedVoices = async () => {
    try {
      const response = await fetch("/api/clone/list", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setClonedVoices(data.clonedVoices || []);
      }
    } catch (e) {
      console.error("Failed to fetch cloned voices:", e);
    }
  };

  // Real-time audio waveform visualization
  const startVisualizer = (stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const canvasCtx = canvas.getContext("2d");
      if (!canvasCtx) return;

      const draw = () => {
        if (!analyserRef.current) return;
        animationFrameRef.current = requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        const width = canvas.width;
        const height = canvas.height;

        canvasCtx.fillStyle = "rgba(11, 13, 38, 0.4)";
        canvasCtx.fillRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] / 1.5;

          const gradient = canvasCtx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, "rgba(99, 102, 241, 0.2)");
          gradient.addColorStop(0.5, "rgba(139, 92, 246, 0.6)");
          gradient.addColorStop(1, "rgba(236, 72, 153, 1)");

          canvasCtx.fillStyle = gradient;
          canvasCtx.fillRect(x, height / 2 - barHeight / 2, barWidth - 1, barHeight);

          x += barWidth + 1;
        }
      };

      draw();
    } catch (e) {
      console.error("Failed to start audio visualizer:", e);
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const options = { mimeType: "audio/webm" };
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        mediaRecorder = new MediaRecorder(stream);
      }

      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setRecordedAudioBlob(audioBlob);
        
        const audioUrl = URL.createObjectURL(audioBlob);
        setCloningAudioUrl(audioUrl);
        setIsPlayingCloningAudio(false);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);
      setRecordedAudioBlob(null);
      setCloningAudioUrl(null);

      setTimeout(() => {
        startVisualizer(stream);
      }, 100);

      recordIntervalRef.current = setInterval(() => {
        setRecordDuration((prev) => {
          if (prev >= 29) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (e: any) {
      console.error("Failed to access microphone:", e);
      setError("Microphone access denied. Please grant permission to record your voice.");
    }
  };

  const stopRecording = () => {
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handlePlayCloningAudio = () => {
    if (!recordAudioElementRef.current && cloningAudioUrl) {
      recordAudioElementRef.current = new Audio(cloningAudioUrl);
      recordAudioElementRef.current.onended = () => {
        setIsPlayingCloningAudio(false);
      };
    }
    
    if (isPlayingCloningAudio) {
      recordAudioElementRef.current?.pause();
      setIsPlayingCloningAudio(false);
    } else {
      recordAudioElementRef.current?.play()
        .then(() => setIsPlayingCloningAudio(true))
        .catch(e => console.log("Failed to play custom sample:", e));
    }
  };

  const handleSubmitClone = async () => {
    if (!clonedVoiceName.trim()) {
      setError("Please provide a name for your cloned voice.");
      return;
    }
    if (!recordedAudioBlob) {
      setError("Please record a voice sample first.");
      return;
    }

    setCloningSubmitLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(recordedAudioBlob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(",")[1];
        
        const response = await fetch("/api/clone/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            name: clonedVoiceName,
            audioBase64: base64Data,
            mimeType: recordedAudioBlob.type,
          }),
        });

        setCloningSubmitLoading(false);

        if (response.ok) {
          setClonedVoiceName("");
          setRecordedAudioBlob(null);
          setCloningAudioUrl(null);
          setIsPlayingCloningAudio(false);
          fetchClonedVoices();
        } else {
          const data = await response.json();
          setError(data.error || "Failed to submit cloned voice profile.");
        }
      };
    } catch (e: any) {
      setCloningSubmitLoading(false);
      setError("Failed to process recorded sample. Error: " + e.message);
    }
  };

  const handleDeleteClonedVoice = async (id: string) => {
    try {
      const response = await fetch(`/api/clone/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        fetchClonedVoices();
        if (selectedVoice === id) {
          setSelectedVoice("Kore");
        }
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete voice profile.");
      }
    } catch (e: any) {
      setError("An error occurred while deleting voice profile.");
    }
  };

  // Script Optimizer states & handler
  const [optimizationPlatform, setOptimizationPlatform] = useState<"General" | "YouTube" | "Reels" | "Ads">("General");
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedResult, setOptimizedResult] = useState<string | null>(null);

  const handleOptimizeScript = async () => {
    if (!text.trim()) return;
    setOptimizing(true);
    setError(null);
    setOptimizedResult(null);

    try {
      const response = await fetch("/api/optimize-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text,
          platform: optimizationPlatform,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setOptimizedResult(data.optimizedText);
      } else {
        setError(data.error || "Failed to optimize script.");
      }
    } catch (e: any) {
      setError("Failed to connect to script optimization service: " + e.message);
    } finally {
      setOptimizing(false);
    }
  };

  const handleFetchPreview = async (voiceId: string) => {
    if (previewLoading) return;
    setPreviewLoading(true);
    setPreviewIsPlaying(false);
    try {
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ voiceId }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate preview");
      }

      const data = await response.json();
      setPreviewAudioUrl(data.audioUrl);
      
      // Auto-play the preview audio once loaded
      setTimeout(() => {
        if (previewAudioRef.current) {
          previewAudioRef.current.play()
            .then(() => setPreviewIsPlaying(true))
            .catch(e => console.log("Auto-play blocked or failed", e));
        }
      }, 100);
    } catch (err: any) {
      alert("Failed to generate voice preview: " + err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (previewIsPlaying) {
      previewAudioRef.current.pause();
      setPreviewIsPlaying(false);
    } else {
      previewAudioRef.current.play()
        .then(() => setPreviewIsPlaying(true))
        .catch(e => console.log("Failed to play preview", e));
    }
  };

  const handleCloseModal = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setSelectedVoiceDetails(null);
    setPreviewAudioUrl(null);
    setPreviewIsPlaying(false);
  };

  // Sync playback speed with audio element
  useEffect(() => {
    if (mainAudioRef.current) {
      mainAudioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, successAudioUrl]);

  // Fetch cloned voices on mount
  useEffect(() => {
    fetchClonedVoices();
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(err => console.log("error closing context", err));
      }
    };
  }, []);

  // Batch Mode State
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchInput, setBatchInput] = useState("");
  const [batchBlocks, setBatchBlocks] = useState<BatchBlock[]>([]);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse text or uploaded file lines into batch blocks
  const handleParseTextToBlocks = (rawText: string) => {
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parsed: BatchBlock[] = lines.map((lineText, index) => ({
      id: `block-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
      text: lineText,
      status: "pending",
    }));
    setBatchBlocks(parsed);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readTextFile(file);
  };

  const readTextFile = (file: File) => {
    if (file.type !== "text/plain" && !file.name.endsWith(".txt")) {
      setError("Please upload a valid .txt plain text file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const contents = event.target?.result as string;
      setBatchInput(contents);
      handleParseTextToBlocks(contents);
    };
    reader.onerror = () => {
      setError("Failed to read the uploaded text file.");
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readTextFile(file);
    }
  };

  const handleUpdateBlockText = (id: string, newText: string) => {
    setBatchBlocks(prev => prev.map(block => block.id === id ? { ...block, text: newText } : block));
  };

  const handleDeleteBlock = (id: string) => {
    setBatchBlocks(prev => prev.filter(block => block.id !== id));
  };

  const handleAddBlock = () => {
    setBatchBlocks(prev => [
      ...prev,
      {
        id: `block-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        text: "",
        status: "pending"
      }
    ]);
  };

  const handleClearAllBlocks = () => {
    setBatchBlocks([]);
    setBatchInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Generate TTS for a single block
  const handleGenerateBlock = async (blockId: string) => {
    const block = batchBlocks.find(b => b.id === blockId);
    if (!block || !block.text.trim()) return;

    // Update status to generating
    setBatchBlocks(prev => prev.map(b => b.id === blockId ? { ...b, status: "generating", error: undefined } : b));

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: block.text,
          voiceId: selectedVoice,
          emotion: selectedEmotion,
          language: selectedLanguage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setBatchBlocks(prev => prev.map(b => b.id === blockId ? { ...b, status: "success", audioUrl: data.audioUrl } : b));
      onRefreshStats();
      onRefreshHistory();
    } catch (err: any) {
      setBatchBlocks(prev => prev.map(b => b.id === blockId ? { ...b, status: "failed", error: err.message || "Failed" } : b));
    }
  };

  // Generate all pending blocks sequentially
  const handleGenerateAllBlocks = async () => {
    setBatchGenerating(true);
    setError(null);

    // Calculate total characters needed for pending blocks
    const pendingBlocks = batchBlocks.filter(b => b.status === "pending" || b.status === "failed");
    if (pendingBlocks.length === 0) {
      setError("No pending or failed blocks to generate.");
      setBatchGenerating(false);
      return;
    }

    const totalNeeded = pendingBlocks.reduce((sum, b) => sum + b.text.length, 0);
    if (totalNeeded > charsRemaining) {
      setError(`Your batch request requires ${totalNeeded.toLocaleString()} characters, which exceeds your remaining quota of ${charsRemaining.toLocaleString()}. Please remove some blocks or upgrade your plan.`);
      setBatchGenerating(false);
      return;
    }

    // Process each block sequentially
    for (const block of pendingBlocks) {
      await handleGenerateBlock(block.id);
    }

    setBatchGenerating(false);
  };

  // Character limits
  const charLimit = stats ? stats.limit : 5000;
  const charsRemaining = stats ? Math.max(0, stats.limit - stats.usage) : 5000;
  const typedCount = text.length;

  // Real-time billing cycle and character quota metrics
  const totalLimit = charLimit;
  const usedCount = stats ? stats.usage : 0;
  const currentDraft = isBatchMode
    ? batchBlocks.reduce((acc, b) => acc + b.text.length, 0)
    : typedCount;
  const netRemaining = Math.max(0, totalLimit - usedCount - currentDraft);
  const isOverLimit = usedCount + currentDraft > totalLimit;

  // Layered progress calculations
  const usedPercent = Math.min(100, (usedCount / totalLimit) * 100);
  const draftPercent = Math.min(100 - usedPercent, (currentDraft / totalLimit) * 100);
  const remainingPercent = Math.max(0, 100 - usedPercent - draftPercent);

  // Auto-fill a Hindi or English prompt to help creators try it out
  const fillSampleText = (lang: "en" | "hi") => {
    setSelectedLanguage(lang);
    if (lang === "en") {
      setText(
        "Welcome to VaaniAI! Experience standard conversational speech synthesis powered by Gemini. You can choose different voice styles to match your contents."
      );
    } else {
      setText(
        "वाणी एआई में आपका स्वागत है। आप अपनी पसंद की आवाज चुन सकते हैं और कुछ ही सेकंड में प्राकृतिक हिंदी भाषण बना सकते हैं।"
      );
    }
    setError(null);
  };

  const handleGenerate = async () => {
    setError(null);
    setSuccessAudioUrl(null);

    if (!text.trim()) {
      setError("Please write some text to generate.");
      return;
    }

    if (text.length > charsRemaining) {
      setError(
        `Your text length (${text.length}) exceeds your remaining character balance (${charsRemaining}). Please shorten your text or upgrade your plan in the pricing section.`
      );
      return;
    }

    setGenerating(true);
    setGenerationStep("Analyzing script parameters...");

    const steps = [
      "Contacting Gemini TTS models...",
      "Synthesizing bilingual vocal outputs...",
      "Generating natural-sounding waveforms...",
      "Buffering audio stream on VaaniAI...",
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setGenerationStep(steps[stepIndex]);
        stepIndex++;
      }
    }, 1000);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text,
          voiceId: selectedVoice,
          emotion: selectedEmotion,
          language: selectedLanguage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      clearInterval(interval);
      setGenerationStep("Voice output ready!");
      setSuccessAudioUrl(data.audioUrl);
      setText(""); // Clear editor on success
      onRefreshStats();
      onRefreshHistory();
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "Something went wrong during speech generation.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this audio history? This is irreversible.")) {
      return;
    }

    try {
      const response = await fetch(`/api/history/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Deletion failed");
      }

      onRefreshHistory();
      onRefreshStats();
    } catch (err: any) {
      alert("Failed to delete history item: " + err.message);
    }
  };

  const handleRateHistory = async (id: string, rating: "up" | "down" | null) => {
    try {
      const response = await fetch(`/api/history/${id}/rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Rating failed");
      }

      onRefreshHistory();
    } catch (err: any) {
      alert("Failed to save rating: " + err.message);
    }
  };

  // Toggle play/pause for main result
  const toggleMainPlay = () => {
    if (!mainAudioRef.current) return;
    if (mainIsPlaying) {
      mainAudioRef.current.pause();
      setMainIsPlaying(false);
    } else {
      mainAudioRef.current.playbackRate = playbackSpeed;
      mainAudioRef.current.play();
      setMainIsPlaying(true);
    }
  };

  // Toggle play/pause for history items
  const toggleHistoryPlay = (id: string) => {
    const audio = audioRefs.current[id];
    if (!audio) return;

    if (activePlayingId === id) {
      audio.pause();
      setActivePlayingId(null);
    } else {
      // Pause any other active playing audio
      if (activePlayingId && audioRefs.current[activePlayingId]) {
        audioRefs.current[activePlayingId]?.pause();
      }
      if (mainAudioRef.current) {
        mainAudioRef.current.pause();
        setMainIsPlaying(false);
      }
      audio.play();
      setActivePlayingId(id);
    }
  };

  const l = LABELS[selectedLanguage];

  const combinedVoices = [
    ...PREBUILT_VOICES,
    ...clonedVoices.map((cv) => ({
      id: cv.id,
      name: cv.name,
      lang: "Multilingual" as const,
      gender: cv.gender,
      desc: `Custom cloned voice profile created by you. Vocal style: ${cv.characteristics}. Accent: ${cv.accent}. Speed: ${cv.speed}, Pitch: ${cv.pitch}.`,
      avatarUrl: cv.gender === "Female"
        ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face"
        : "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
      characteristics: cv.characteristics,
      accent: cv.accent,
      styles: ["Standard", cv.pitch + " pitch", cv.speed + " speed"],
      bestSuitedFor: "Your custom content and narrations",
      isCloned: true,
    })),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Generator Form (2 Columns on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span>{l.workspaceTitle}</span>
              </h2>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillSampleText("en")}
                  className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/20 cursor-pointer animate-fade-in"
                >
                  {LABELS.en.demoBtn} (EN)
                </button>
                <button
                  type="button"
                  onClick={() => fillSampleText("hi")}
                  className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/20 cursor-pointer animate-fade-in"
                >
                  {LABELS.hi.demoBtn} (HI)
                </button>
              </div>
            </div>

            {/* Explicit Language Switcher Component */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-5 border-b border-white/5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-indigo-400">
                  {selectedLanguage === "en" ? "Speech Synthesis Language" : "भाषण संश्लेषण भाषा"}
                </label>
                <p className="text-[11px] text-slate-400 mt-1">
                  {selectedLanguage === "en" 
                    ? "Choose English or Hindi to optimize TTS pronunciation accents" 
                    : "उच्चारण लहजे को अनुकूलित करने के लिए अंग्रेजी या हिंदी चुनें"}
                </p>
              </div>
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedLanguage("en")}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedLanguage === "en"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  🇺🇸 English (EN)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage("hi")}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedLanguage === "hi"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  🇮🇳 Hindi (हिन्दी)
                </button>
              </div>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("single");
                  setIsBatchMode(false);
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === "single"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{l.singleModeTab}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("batch");
                  setIsBatchMode(true);
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === "batch"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{l.batchModeTab}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("cloning");
                  setIsBatchMode(false);
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === "cloning"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-300" />
                <span>{selectedLanguage === "hi" ? "आवाज क्लोनिंग" : "Voice Cloning"}</span>
              </button>
            </div>

            {error && (
              <div className="p-4 mb-6 rounded-xl border border-red-500/20 bg-red-500/5 text-red-200 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {activeTab === "single" && (
              <div className="space-y-4">
                {/* Editor Text Area */}
                <div className="relative">
                  <textarea
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      setError(null);
                    }}
                    disabled={generating}
                    rows={6}
                    placeholder={l.placeholder}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-all text-sm resize-none"
                  />
                  <div className="absolute bottom-4 right-4 text-xs font-mono text-slate-500 flex items-center gap-2">
                    <span className={typedCount > charsRemaining ? "text-red-400" : "text-slate-400"}>
                      {typedCount.toLocaleString()}
                    </span>
                    <span>/</span>
                    <span>{charsRemaining.toLocaleString()} {l.charRemaining}</span>
                  </div>
                </div>

                {/* Viral Script Optimizer Tool */}
                <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="text-xs font-mono font-bold text-indigo-300">VIRAL SCRIPT OPTIMIZER</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Optimize pacing, retention & attention-grabbing hooks</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <select
                      value={optimizationPlatform}
                      onChange={(e: any) => setOptimizationPlatform(e.target.value)}
                      disabled={optimizing}
                      className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none cursor-pointer hover:bg-white/10 transition-all"
                    >
                      <option value="General" className="bg-[#050616]">High-Retention Voiceover</option>
                      <option value="Reels" className="bg-[#050616]">Instagram Reels / TikTok</option>
                      <option value="YouTube" className="bg-[#050616]">YouTube Video</option>
                      <option value="Ads" className="bg-[#050616]">High-Converting Ad</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleOptimizeScript}
                      disabled={optimizing || !text.trim()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                    >
                      {optimizing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Optimizing...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>Optimize Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {optimizedResult && (
                  <div className="p-4 rounded-xl bg-slate-500/5 border border-white/10 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Optimized for {optimizationPlatform}!
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setText(optimizedResult);
                            setOptimizedResult(null);
                          }}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded text-[11px] font-semibold transition-all cursor-pointer"
                        >
                          Apply Script
                        </button>
                        <button
                          type="button"
                          onClick={() => setOptimizedResult(null)}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-400 rounded text-[11px] font-semibold transition-all cursor-pointer"
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed italic bg-white/[0.02] p-3.5 rounded-lg border border-white/5">
                      {optimizedResult}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "batch" && (
              /* Batch Mode Editor & Upload Interface */
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* File Upload & Paste Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Input text area */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono uppercase tracking-widest text-indigo-400">
                      Paste Multi-line Script
                    </label>
                    <textarea
                      value={batchInput}
                      onChange={(e) => {
                        setBatchInput(e.target.value);
                        setError(null);
                      }}
                      disabled={batchGenerating}
                      rows={6}
                      placeholder={l.batchPlaceholder}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-all text-sm resize-none h-[180px]"
                    />
                  </div>

                  {/* Right Column: Text File Drag & Drop Upload */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono uppercase tracking-widest text-indigo-400">
                      Upload Script File
                    </label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`h-[180px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer ${
                        isDragging
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".txt"
                        className="hidden"
                      />
                      <Upload className={`w-8 h-8 mb-3 transition-transform duration-200 ${isDragging ? "text-indigo-400 scale-110" : "text-slate-400"}`} />
                      <p className="text-sm font-semibold text-slate-200">{l.uploadFileBtn}</p>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-[200px]">{l.dragDropText}</p>
                    </div>
                  </div>
                </div>

                {/* Parsing / Actions bar */}
                <div className="flex flex-wrap gap-3 items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
                  <div className="text-xs text-slate-400">
                    {batchBlocks.length > 0 && (
                      <span className="font-mono">
                        {batchBlocks.length} block(s) loaded.
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {batchBlocks.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllBlocks}
                        disabled={batchGenerating}
                        className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 hover:border-white/20 hover:bg-white/5 text-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{l.clearAllBtn}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleParseTextToBlocks(batchInput)}
                      disabled={batchGenerating || !batchInput.trim()}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-600/15 disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{l.parseBlocksBtn}</span>
                    </button>
                  </div>
                </div>

                {/* Extracted Blocks list */}
                {batchBlocks.length > 0 && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                        {l.parsedBlocksLabel}
                      </span>
                      <button
                        type="button"
                        onClick={handleAddBlock}
                        disabled={batchGenerating}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{l.addBlockBtn}</span>
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {batchBlocks.map((block, index) => {
                        return (
                          <div
                            key={block.id}
                            className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative group/block"
                          >
                            <div className="flex-1 min-w-0 w-full">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-mono font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/15">
                                  {l.blockLabel} #{index + 1}
                                </span>
                                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                                  block.status === "success"
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                    : block.status === "generating"
                                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse"
                                    : block.status === "failed"
                                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                                    : "bg-slate-500/10 border-slate-500/20 text-slate-400"
                                }`}>
                                  {block.status === "success" && l.statusSuccess}
                                  {block.status === "generating" && l.statusGenerating}
                                  {block.status === "failed" && l.statusFailed}
                                  {block.status === "pending" && l.statusPending}
                                </span>
                                {block.error && (
                                  <span className="text-[10px] text-red-400 font-mono truncate max-w-[200px]" title={block.error}>
                                    - {block.error}
                                  </span>
                                )}
                              </div>
                              <textarea
                                value={block.text}
                                onChange={(e) => handleUpdateBlockText(block.id, e.target.value)}
                                disabled={batchGenerating || block.status === "generating"}
                                rows={2}
                                className="w-full bg-white/5 border border-white/5 hover:border-white/10 focus:border-indigo-500/40 focus:bg-white/10 rounded-lg p-2.5 text-white text-sm focus:outline-none transition-all resize-none"
                              />
                            </div>

                            <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0 w-full sm:w-auto self-stretch">
                              {block.status === "success" && block.audioUrl ? (
                                <div className="flex gap-1.5 w-full sm:w-auto">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const audio = new Audio(block.audioUrl);
                                      audio.play().catch(err => console.error("Failed play:", err));
                                    }}
                                    className="p-2.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 transition-all flex-1 sm:flex-none flex items-center justify-center cursor-pointer"
                                    title="Play clip"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                  </button>
                                  <a
                                    href={block.audioUrl}
                                    download={`batch_block_${index + 1}.wav`}
                                    className="p-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex-1 sm:flex-none flex items-center justify-center cursor-pointer"
                                    title="Download clip"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleGenerateBlock(block.id)}
                                  disabled={batchGenerating || block.status === "generating" || !block.text.trim()}
                                  className="py-2 px-3.5 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 transition-all w-full sm:w-auto flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  {block.status === "generating" ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Mic className="w-3 h-3" />
                                  )}
                                  <span>Generate</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteBlock(block.id)}
                                disabled={batchGenerating || block.status === "generating"}
                                className="p-2.5 rounded-lg border border-white/5 hover:border-red-500/20 text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30"
                                title="Delete Block"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "cloning" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Information Card */}
                <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-mono font-bold text-indigo-300">INSTANT VOICE CLONING ENGINE</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Clone any voice in under 30 seconds. Record a high-fidelity vocal sample, and VaanAI's advanced neural model will capture the subtle pitch, tone, resonance, and pacing signature to generate custom speech with unmatched emotional fidelity.
                  </p>
                </div>

                {/* Recorder area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="block text-xs font-mono uppercase tracking-widest text-slate-400">
                      Step 1: Read the Verification Script
                    </label>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                      <p className="text-sm text-slate-200 font-medium leading-relaxed italic">
                        "The quick brown fox jumps over the lazy dog. Voice synthesis is transforming content creation. Recording a high-fidelity sample of my voice enables the AI model to analyze my unique pitch, tempo, and vocal fluctuations to craft pristine, life-like clones."
                      </p>
                      <div className="text-[10px] font-mono text-slate-400">
                        *Speak naturally and keep background noise to a minimum.
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                          isRecording
                            ? "bg-red-500 hover:bg-red-600 shadow-red-500/20 animate-pulse"
                            : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
                        }`}
                        title={isRecording ? "Stop Recording" : "Start Recording"}
                      >
                        {isRecording ? <Square className="w-5 h-5 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                      </button>

                      <div>
                        <div className="text-xs font-bold text-white">
                          {isRecording ? "Recording active..." : "Microphone idle"}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">
                          Duration: {recordDuration}s / 30s max
                        </div>
                      </div>
                    </div>

                    {/* Canvas for voice wave visualizer */}
                    <div className="h-16 w-full rounded-xl bg-black/40 border border-white/5 relative overflow-hidden flex items-center justify-center">
                      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                      {!isRecording && !recordedAudioBlob && (
                        <div className="text-xs font-mono text-slate-600 relative z-10 uppercase tracking-widest">
                          Visualizer Idle
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Settings and Creation Form */}
                  <div className="space-y-4">
                    <label className="block text-xs font-mono uppercase tracking-widest text-slate-400">
                      Step 2: Voice Settings & Name
                    </label>

                    <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">
                          Voice Profile Name
                        </label>
                        <input
                          type="text"
                          value={clonedVoiceName}
                          onChange={(e) => setClonedVoiceName(e.target.value)}
                          placeholder="e.g. My Warm Accent"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Recorded Sample Player */}
                      {cloningAudioUrl && (
                        <div className="pt-2">
                          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">
                            Verify Recorded Sample
                          </label>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                            <button
                              type="button"
                              onClick={handlePlayCloningAudio}
                              className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-300 flex items-center justify-center hover:bg-indigo-600/30 transition-all cursor-pointer"
                            >
                              {isPlayingCloningAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            </button>
                            <span className="text-xs text-indigo-200">Audio sample loaded successfully</span>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleSubmitClone}
                        disabled={cloningSubmitLoading || !recordedAudioBlob || !clonedVoiceName.trim()}
                        className="w-full mt-3 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold font-mono tracking-wider uppercase transition-all shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {cloningSubmitLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Analyzing vocal signature...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Analyze & Create Voice Profile</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* My Cloned Voices List */}
                <div className="space-y-3.5 mt-8">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                      My Cloned Voice Profiles ({clonedVoices.length})
                    </span>
                  </div>

                  {clonedVoices.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                      <Mic className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <div className="text-sm font-semibold text-slate-300 mb-1">No custom profiles yet</div>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Record a voice sample above to extract your unique vocal signature and build your first high-fidelity clone.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {clonedVoices.map((voice) => (
                        <div
                          key={voice.id}
                          className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                              {voice.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white leading-tight">{voice.name}</div>
                              <div className="text-[10px] font-mono text-indigo-400 uppercase mt-0.5">
                                Status: Ready • Accent: {voice.accent}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteClonedVoice(voice.id)}
                            className="p-2.5 rounded-lg border border-white/5 hover:border-red-500/20 text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all flex items-center justify-center cursor-pointer"
                            title="Delete Voice Profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Real-time Character Quota & Billing Cycle Status Indicator */}
            <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-slate-300">
                      {l.quotaTitle}
                    </span>
                  </div>
                </div>
                {stats?.plan && (
                  <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
                    <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">{l.quotaPlanLabel}:</span>
                    <span className={`px-2 py-0.5 rounded font-mono font-bold uppercase text-[10px] border ${
                      stats.plan === "pro" 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : stats.plan === "business"
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                        : stats.plan === "starter"
                        ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                        : "bg-slate-500/10 border-slate-500/30 text-slate-400"
                    }`}>
                      {stats.plan}
                    </span>
                  </div>
                )}
              </div>

              {/* Quota breakdown widgets */}
              <div className="grid grid-cols-3 gap-2 text-center bg-[#050616]/40 p-2.5 rounded-lg border border-white/[0.02]">
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">{l.quotaUsed}</div>
                  <div className="text-xs font-semibold text-slate-300 mt-1 font-mono">
                    {usedCount.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">/ {totalLimit.toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-indigo-400 tracking-wider">{l.quotaDraftImpact}</div>
                  <div className="text-xs font-semibold text-indigo-300 mt-1 font-mono">
                    +{currentDraft.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">{l.quotaRemaining}</div>
                  <div className={`text-xs font-bold mt-1 font-mono ${isOverLimit ? "text-red-400" : "text-emerald-400"}`}>
                    {netRemaining.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Layered progress bar */}
              <div className="space-y-1.5">
                <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                  {/* Used slice */}
                  <div 
                    style={{ width: `${usedPercent}%` }} 
                    className="h-full bg-slate-500/40 border-r border-white/10"
                    title={`Used: ${usedPercent.toFixed(1)}%`}
                  />
                  {/* Draft slice */}
                  <div 
                    style={{ width: `${draftPercent}%` }} 
                    className={`h-full ${isOverLimit ? "bg-red-500" : "bg-indigo-500 animate-pulse"} border-r border-white/10`}
                    title={`Current Draft: ${draftPercent.toFixed(1)}%`}
                  />
                  {/* Remaining slice */}
                  <div 
                    style={{ width: `${remainingPercent}%` }} 
                    className="h-full bg-transparent"
                    title={`Remaining: ${remainingPercent.toFixed(1)}%`}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                  <span>{l.quotaAvailable}</span>
                  <span>{((netRemaining / totalLimit) * 100).toFixed(1)}%</span>
                </div>
              </div>

              {isOverLimit && (
                <div className="text-xs text-red-400 flex items-center gap-1.5 p-2 rounded bg-red-500/5 border border-red-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0"></span>
                  <span>{l.quotaWarningLimit}</span>
                </div>
              )}
            </div>

            {/* Visual AI Voice Selection Grid */}
            <div className="space-y-3 mt-6">
              <label className="block text-xs font-mono uppercase tracking-widest text-slate-400">
                {l.selectVoice}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {combinedVoices.map((voice) => {
                  const isSelected = selectedVoice === voice.id;
                  const isCloned = (voice as any).isCloned;
                  return (
                    <button
                      key={voice.id}
                      type="button"
                      disabled={generating}
                      onClick={() => setSelectedVoice(voice.id)}
                      className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer relative group ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {/* Cloned badge */}
                      {isCloned && (
                        <div className="absolute top-2 left-2 px-1 rounded bg-indigo-500/20 border border-indigo-500/30 text-[8px] font-mono font-bold text-indigo-300 uppercase tracking-widest">
                          Cloned
                        </div>
                      )}
                      
                      {/* Avatar container */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVoiceDetails(voice);
                        }}
                        className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 shadow-inner cursor-pointer hover:border-indigo-500 transition-all duration-200 group/avatar"
                        title="Click to view voice details & preview"
                      >
                        {voice.avatarUrl && (
                          <img
                            src={voice.avatarUrl}
                            alt={voice.id}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover/avatar:scale-105 group-hover/avatar:brightness-75"
                          />
                        )}
                        {/* Info icon overlay on hover */}
                        <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                          <Info className="w-4 h-4 text-white drop-shadow-md" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white tracking-tight truncate max-w-[80px]" title={voice.id}>{voice.id.startsWith("clone_") ? voice.name : voice.id}</div>
                        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">
                          {voice.gender === "Female" ? (selectedLanguage === "hi" ? "महिला" : "Female") : (selectedLanguage === "hi" ? "पुरुष" : "Male")}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vocal Customization Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                  {l.styleEmotion}
                </label>
                <div className="relative">
                  <select
                    value={selectedEmotion}
                    onChange={(e) => setSelectedEmotion(e.target.value)}
                    disabled={generating}
                    className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/60 transition-all text-sm cursor-pointer"
                  >
                    <option value="standard" className="bg-[#050616]">
                      {selectedLanguage === "hi" ? "मानक संवादात्मक (Standard)" : "Standard Conversational"}
                    </option>
                    <option value="cheerful" className="bg-[#050616]">
                      {selectedLanguage === "hi" ? "हंसमुख और खुश (Cheerful)" : "Cheerful & Happy"}
                    </option>
                    <option value="calm" className="bg-[#050616]">
                      {selectedLanguage === "hi" ? "शांत और फुसफुसाहट (Calm)" : "Calm & Whispering"}
                    </option>
                    <option value="professional" className="bg-[#050616]">
                      {selectedLanguage === "hi" ? "पेशेवर और कथावाचक (Professional)" : "Professional & Narrator"}
                    </option>
                    <option value="energetic" className="bg-[#050616]">
                      {selectedLanguage === "hi" ? "ऊर्जावान और उत्साहित (Energetic)" : "Energetic & Excited"}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="mt-8 flex justify-end">
              {!isBatchMode ? (
                <button
                  onClick={handleGenerate}
                  disabled={generating || !text.trim() || isOverLimit}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-indigo-200" />
                      <span>{generationStep || l.generating}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 text-indigo-200" />
                      <span>{l.generateBtn}</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleGenerateAllBlocks}
                  disabled={batchGenerating || batchBlocks.length === 0 || isOverLimit}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {batchGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-indigo-200" />
                      <span>{l.statusGenerating}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>{l.generateAllBtn}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Success Player Card */}
          {successAudioUrl && (
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
              <audio
                ref={mainAudioRef}
                src={successAudioUrl}
                onEnded={() => setMainIsPlaying(false)}
                className="hidden"
              />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleMainPlay}
                    className="w-14 h-14 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center shadow-lg cursor-pointer shrink-0 transition-transform hover:scale-105"
                  >
                    {mainIsPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-1" />}
                  </button>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-medium mb-1 border border-indigo-500/20">
                      {l.newAudioGenerated}
                    </span>
                    <h4 className="text-white font-semibold text-base">{l.voiceoverReady}</h4>
                    <p className="text-xs text-slate-400 mt-1">{l.generatedUsingVoice} {selectedVoice}</p>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <a
                    href={successAudioUrl}
                    download={`vaaniai_${Date.now()}.wav`}
                    className="flex-1 sm:flex-none py-3 px-5 rounded-xl font-semibold text-sm text-slate-300 hover:text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{l.downloadWav}</span>
                  </a>
                </div>
              </div>

              {/* Playback Speed Controller Slider */}
              <div className="mt-5 p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Gauge className="w-4.5 h-4.5 text-indigo-400" />
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-300">
                      {l.playbackSpeed}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-72">
                  <span className="text-xs font-mono text-slate-400">0.5x</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={playbackSpeed}
                    onChange={(e) => {
                      const speed = parseFloat(e.target.value);
                      setPlaybackSpeed(speed);
                      if (mainAudioRef.current) {
                        mainAudioRef.current.playbackRate = speed;
                      }
                    }}
                    className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-white/15 transition-all"
                  />
                  <span className="text-xs font-mono text-slate-400">2.0x</span>
                  <span className="px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-bold min-w-[3.5rem] text-center">
                    {playbackSpeed.toFixed(1)}x
                  </span>
                </div>
              </div>

              {/* Animated Waveform Visualizer simulation */}
              <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between h-14 gap-1.5">
                {Array.from({ length: 48 }).map((_, i) => {
                  const heights = [
                    "h-2", "h-4", "h-8", "h-10", "h-6", "h-2", "h-5", "h-8", "h-12", "h-8", "h-4", "h-3", "h-6", "h-9",
                    "h-11", "h-6", "h-3", "h-5", "h-8", "h-12", "h-9", "h-5", "h-3", "h-7", "h-10", "h-6", "h-2", "h-5",
                    "h-9", "h-12", "h-7", "h-4", "h-3", "h-6", "h-11", "h-8", "h-4", "h-2", "h-5", "h-8", "h-10", "h-6",
                    "h-3", "h-5", "h-8", "h-11", "h-5", "h-2",
                  ];
                  const animationClass = mainIsPlaying ? "animate-[pulse_1s_infinite_ease-in-out]" : "";
                  const delay = `${(i % 5) * 100}ms`;

                  return (
                    <span
                      key={i}
                      style={{ animationDelay: delay }}
                      className={`w-0.5 sm:w-1 bg-indigo-500 rounded-full transition-all ${heights[i % heights.length]} ${animationClass}`}
                    ></span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selected Voice Details and Guidelines (1 Column) */}
        <div className="space-y-6">
          {/* Active Voice Info */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            <h3 className="text-xs font-mono uppercase tracking-widest text-indigo-400 mb-4">
              {l.voiceProfile}
            </h3>

            {(() => {
              const activeVoice = combinedVoices.find((v) => v.id === selectedVoice) || combinedVoices[0];
              return (
                <div className="space-y-4">
                  {activeVoice.avatarUrl && (
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
                      <img
                        src={activeVoice.avatarUrl}
                        alt={`${activeVoice.id} AI Voice Avatar`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050616]/80 via-transparent to-transparent"></div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping absolute inline-flex"></span>
                        <span className="w-2 h-2 rounded-full bg-indigo-500 relative inline-flex"></span>
                        <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-widest">{l.activeCore}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-display font-bold text-white truncate max-w-[150px]" title={activeVoice.id}>
                      {activeVoice.id.startsWith("clone_") ? (activeVoice as any).name : activeVoice.id}
                    </h4>
                    <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 text-xs font-mono border border-indigo-500/20">
                      {activeVoice.gender === "Female" ? (selectedLanguage === "hi" ? "महिला" : "Female") : (selectedLanguage === "hi" ? "पुरुष" : "Male")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {selectedLanguage === "hi" && activeVoice.id === "Kore" ? "एक सहज, प्राकृतिक भारतीय महिला की आवाज जो पेशेवर कहानी सुनाने और संवादात्मक ऑडियो के लिए आदर्श है।" : activeVoice.desc}
                  </p>

                  <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{l.supports}</div>
                      <div className="text-xs text-slate-300 mt-0.5">{l.activeVoiceSupports}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{l.encoding}</div>
                      <div className="text-xs text-slate-300 mt-0.5">{l.highFidelity}</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Quick Creator Tip */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Smile className="w-4 h-4 text-indigo-400" />
              <span>{l.pronunciationTipTitle}</span>
            </h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {l.pronunciationTipDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Generation History Table */}
      <div className="mt-10 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
        <h3 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          <span>{l.historyTitle} ({history.length})</span>
        </h3>

        {history.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
            <Music className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">{l.historyEmpty}</p>
            <p className="text-xs text-slate-500 mt-1">{l.historyEmptySub}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => {
              const audioUrl = `/audio/${item.audioFilename}`;
              const isPlaying = activePlayingId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <audio
                    ref={(el) => {
                      audioRefs.current[item.id] = el;
                    }}
                    src={audioUrl}
                    onEnded={() => setActivePlayingId(null)}
                    className="hidden"
                  />

                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <button
                      onClick={() => toggleHistoryPlay(item.id)}
                      className="w-10 h-10 rounded-full bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-300 line-clamp-1 pr-2">"{item.text}"</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                        <span className="text-indigo-400 font-semibold font-mono">{item.voiceId}</span>
                        <span>•</span>
                        <span>{item.characterCount} {l.chars}</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-auto w-full sm:w-auto justify-end">
                    {/* Thumbs Up / Down Rating System */}
                    <div className="flex items-center gap-1.5 border-r border-white/10 pr-2.5 mr-0.5">
                      <button
                        onClick={() => handleRateHistory(item.id, item.rating === "up" ? null : "up")}
                        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center hover:scale-[1.02] active:scale-95 ${
                          item.rating === "up"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "bg-white/5 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 border-white/10 hover:border-emerald-500/25"
                        }`}
                        title={item.rating === "up" ? "Remove positive rating" : "Rate as good generation"}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${item.rating === "up" ? "fill-emerald-400" : ""}`} />
                      </button>
                      <button
                        onClick={() => handleRateHistory(item.id, item.rating === "down" ? null : "down")}
                        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center hover:scale-[1.02] active:scale-95 ${
                          item.rating === "down"
                            ? "bg-red-500/20 text-red-400 border-red-500/40"
                            : "bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border-white/10 hover:border-red-500/25"
                        }`}
                        title={item.rating === "down" ? "Remove negative rating" : "Rate as poor generation"}
                      >
                        <ThumbsDown className={`w-3.5 h-3.5 ${item.rating === "down" ? "fill-red-400" : ""}`} />
                      </button>
                    </div>

                    <a
                      href={audioUrl}
                      download={`vaaniai_${item.id}.wav`}
                      className="px-3.5 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500 text-indigo-300 hover:text-white border border-indigo-500/20 hover:border-indigo-500 transition-all flex items-center gap-2 cursor-pointer font-medium text-xs shadow-sm hover:shadow-indigo-500/10 hover:scale-[1.02] active:scale-95"
                      title={l.downloadWav}
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden md:inline">{l.downloadWav}</span>
                    </a>
                    <button
                      onClick={() => setSharingItem(item)}
                      className="px-3.5 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/20 hover:border-purple-500 transition-all flex items-center gap-2 cursor-pointer font-medium text-xs shadow-sm hover:shadow-purple-500/10 hover:scale-[1.02] active:scale-95"
                      title="Share Audio Record"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="hidden md:inline">Share</span>
                    </button>
                    <button
                      onClick={() => handleDeleteHistory(item.id)}
                      className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-red-400 hover:text-red-300 hover:bg-red-500/5 hover:border-red-500/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                      title={l.deleteLog}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Voice Details Modal */}
      {selectedVoiceDetails && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b0d26] border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Hidden preview audio element */}
            <audio
              ref={previewAudioRef}
              src={previewAudioUrl || ""}
              onEnded={() => setPreviewIsPlaying(false)}
              className="hidden"
            />

            {/* Header with avatar & name */}
            <div className="relative p-6 border-b border-white/10 flex items-start gap-4">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500/50 shadow-lg shrink-0">
                {selectedVoiceDetails.avatarUrl && (
                  <img
                    src={selectedVoiceDetails.avatarUrl}
                    alt={selectedVoiceDetails.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 pt-1">
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  {selectedVoiceDetails.name}
                  <span className={`px-2 py-0.5 rounded font-mono font-bold uppercase text-[9px] border ${
                    selectedVoiceDetails.gender === "Female" 
                      ? "bg-pink-500/10 border-pink-500/20 text-pink-400"
                      : "bg-sky-500/10 border-sky-500/20 text-sky-400"
                  }`}>
                    {selectedVoiceDetails.gender === "Female" ? l.genderFemale : l.genderMale}
                  </span>
                </h3>
                <p className="text-xs text-indigo-400 font-mono mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {selectedVoiceDetails.accent || "Standard Accent"}
                </p>
              </div>
            </div>

            {/* Body details */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <p className="text-sm text-slate-300 leading-relaxed italic">
                  "{selectedVoiceDetails.desc}"
                </p>
              </div>

              {/* Vocal Styles pills */}
              {selectedVoiceDetails.styles && (
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500">
                    {l.voiceStyles}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedVoiceDetails.styles.map((style) => (
                      <span 
                        key={style}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold"
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Characteristics */}
              {selectedVoiceDetails.characteristics && (
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500">
                    {l.voiceCharacteristics}
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selectedVoiceDetails.characteristics}
                  </p>
                </div>
              )}

              {/* Best Suited For */}
              {selectedVoiceDetails.bestSuitedFor && (
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500">
                    {l.bestSuited}
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selectedVoiceDetails.bestSuitedFor}
                  </p>
                </div>
              )}

              {/* Quick Preview Section */}
              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-slate-300">{l.quickPreview}</span>
                  </div>
                  {previewIsPlaying && (
                    <div className="flex items-center gap-0.5">
                      <span className="w-1 h-3 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                      <span className="w-1 h-4 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1 h-3 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                    </div>
                  )}
                </div>

                {previewAudioUrl ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePreviewPlay}
                      className="w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
                    >
                      {previewIsPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-indigo-400 ${previewIsPlaying ? "w-full transition-all duration-[6000ms] ease-linear" : "w-0"}`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                        <span>0:00</span>
                        <span>~0:06</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleFetchPreview(selectedVoiceDetails.id)}
                    disabled={previewLoading}
                    className="w-full py-2.5 rounded-xl border border-dashed border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {previewLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{l.previewGenerating}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Click to Synthesize Preview</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/10 bg-white/[0.01] flex items-center gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all text-sm font-semibold cursor-pointer"
              >
                {l.closeBtn}
              </button>
              <button
                onClick={() => {
                  setSelectedVoice(selectedVoiceDetails.id);
                  handleCloseModal();
                }}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-sm font-semibold shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                Select Voice
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Share Modal */}
      {sharingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b0d26] border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="relative p-6 border-b border-white/10 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-indigo-400" />
                  <span>Share Generated Audio</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">Generate a public link or share directly to social platforms</p>
              </div>
              <button
                onClick={() => setSharingItem(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Text Preview */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500">
                  Audio Text Preview
                </span>
                <p className="text-xs text-slate-300 leading-relaxed italic line-clamp-2">
                  "{sharingItem.text}"
                </p>
              </div>

              {/* Share Options */}
              <div className="space-y-3">
                <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500">
                  One-Click Social Sharing
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {/* Twitter / X */}
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      `Listen to this high-fidelity AI voiceover I generated using @VaaniAI: "${sharingItem.text.substring(0, 50)}${sharingItem.text.length > 50 ? "..." : ""}"`
                    )}&url=${encodeURIComponent(
                      window.location.origin + "/audio/" + sharingItem.audioFilename
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white transition-all font-semibold text-xs hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                    <span>Share on X</span>
                  </a>

                  {/* LinkedIn */}
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                      window.location.origin + "/audio/" + sharingItem.audioFilename
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white transition-all font-semibold text-xs hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                    <span>LinkedIn</span>
                  </a>
                </div>
              </div>

              {/* Public Link Generator */}
              <div className="space-y-3">
                <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-500">
                  Public Share Link
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-mono select-all truncate">
                    {window.location.origin + "/audio/" + sharingItem.audioFilename}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        window.location.origin + "/audio/" + sharingItem.audioFilename
                      );
                      setCopiedShareLink(true);
                      setTimeout(() => setCopiedShareLink(false), 2000);
                    }}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20 hover:scale-105 cursor-pointer"
                    title="Copy Share Link"
                  >
                    {copiedShareLink ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Anyone with this link can listen to or download this audio directly in their browser.
                </p>
              </div>

              {/* Standard Web Share (if supported) */}
              {typeof navigator !== "undefined" && navigator.share && (
                <button
                  onClick={() => {
                    navigator.share({
                      title: "VaaniAI Generated Audio",
                      text: `Check out this AI voiceover: "${sharingItem.text.substring(0, 100)}..."`,
                      url: window.location.origin + "/audio/" + sharingItem.audioFilename,
                    }).catch((err) => console.log("Web share canceled or failed", err));
                  }}
                  className="w-full py-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500 text-indigo-300 hover:text-white border border-indigo-500/20 hover:border-indigo-500 transition-all font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Use Device Native Share</span>
                </button>
              )}
            </div>

            {/* Footer / Info */}
            <div className="p-4 bg-white/[0.02] border-t border-white/10 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>Temporary links rely on host storage availability.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
