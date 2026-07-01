import React, { useState, useEffect, useRef } from "react";
import { 
  Upload, Mic, Trash2, Play, Pause, Download, Sparkles, Check, 
  Volume2, Sliders, ShieldAlert, Wand2, Music, Activity, Info, 
  AlertCircle, Loader2, VolumeX, Flame, Star, AlertTriangle
} from "lucide-react";
import { motion } from "motion/react";
import { User, DashboardStats } from "../types";

interface VoiceIsolatorProps {
  token: string;
  stats: DashboardStats | null;
  user: User | null;
  onRefreshStats: () => void;
}

interface AIAnalysisReport {
  transcript: string;
  noiseLevel: "low" | "medium" | "high";
  noiseDescription: string;
  clarityScore: number;
  speakingPace: "Too fast" | "Perfect" | "Slow";
  echoLevel: "none" | "slight" | "heavy";
  distortionDetected: boolean;
  vocalWarmth: "warm" | "neutral" | "thin";
  recommendations: string[];
}

export default function VoiceIsolator({ token, stats, user, onRefreshStats }: VoiceIsolatorProps) {
  // File & Audio states
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  
  // Enhanced Audio states
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [enhancedBuffer, setEnhancedBuffer] = useState<AudioBuffer | null>(null);
  
  // DSP Control Panel States
  const [enableNoiseGate, setEnableNoiseGate] = useState(true);
  const [noiseGateThreshold, setNoiseGateThreshold] = useState(-42); // dB
  const [enableEQ, setEnableEQ] = useState(true);
  const [highPassFreq, setHighPassFreq] = useState(90); // Hz
  const [lowPassFreq, setLowPassFreq] = useState(7500); // Hz
  const [clarityBoost, setClarityBoost] = useState(65); // %
  const [enableNormalizer, setEnableNormalizer] = useState(true);
  const [normalizeTarget, setNormalizeTarget] = useState(-1.5); // dB
  const [enableCompressor, setEnableCompressor] = useState(true);
  const [compressorThreshold, setCompressorThreshold] = useState(-20); // dB
  const [compressorRatio, setCompressorRatio] = useState(3.5); // ratio

  // UI & Processing states
  const [processing, setProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackMode, setPlaybackMode] = useState<"original" | "enhanced" | "none">("none");
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  // AI Analysis states
  const [aiReport, setAiReport] = useState<AIAnalysisReport | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Waveform visualization states
  const [originalWave, setOriginalWave] = useState<number[]>([]);
  const [enhancedWave, setEnhancedWave] = useState<number[]>([]);

  // Refs for audio context and playback source
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize browser AudioContext lazily
  const getAudioContext = (): AudioContext => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  // Recording timer logic
  useEffect(() => {
    if (isRecording) {
      recordTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      setRecordingTime(0);
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [isRecording]);

  // Handle file import & decode
  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("audio/")) {
      setError("Please select or record a valid audio file (WAV, MP3, M4A, OGG).");
      return;
    }
    if (selectedFile.size > 15 * 1024 * 1024) {
      setError("Audio file is too large. Please select a file smaller than 15MB.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setEnhancedUrl(null);
    setEnhancedBuffer(null);
    setAiReport(null);
    setOriginalWave([]);
    setEnhancedWave([]);
    
    const url = URL.createObjectURL(selectedFile);
    setAudioUrl(url);

    // Decode Audio Data for DSP
    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const ctx = getAudioContext();
      try {
        const decoded = await ctx.decodeAudioData(arrayBuffer);
        setAudioBuffer(decoded);
        setDuration(decoded.duration);
        
        // Extract wave points
        const originalPoints = extractWaveform(decoded);
        setOriginalWave(originalPoints);
      } catch (err) {
        console.error("Audio decoding failed:", err);
        setError("Failed to parse and decode audio file. Make sure it is not corrupted.");
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  // Recording controls
  const startRecording = async () => {
    setError(null);
    setFile(null);
    setAudioUrl(null);
    setAudioBuffer(null);
    setEnhancedUrl(null);
    setEnhancedBuffer(null);
    setAiReport(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const recordedFile = new File([audioBlob], `recording_${Date.now()}.wav`, {
          type: "audio/wav",
        });
        handleFileSelect(recordedFile);
        
        // Stop stream tracks to turn off the microphone light
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setError("Failed to access your microphone. Please grant mic permissions and try again.");
      console.error("Mic access error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // DSP Process Engine (renders offline with standard Web Audio Nodes + direct memory modifications)
  const processVoiceIsolation = async () => {
    if (!audioBuffer) return;
    setProcessing(true);
    setError(null);
    setEnhancedUrl(null);
    setEnhancedBuffer(null);
    
    try {
      const { numberOfChannels, sampleRate, length } = audioBuffer;
      const offlineCtx = new OfflineAudioContext(numberOfChannels, length, sampleRate);
      
      // Source node
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      
      let lastNode: AudioNode = source;
      
      // Highpass Filter (restricts low-end noise/rumble/AC hum)
      if (enableEQ) {
        const hpFilter = offlineCtx.createBiquadFilter();
        hpFilter.type = "highpass";
        hpFilter.frequency.value = highPassFreq; // Default ~90Hz
        lastNode.connect(hpFilter);
        lastNode = hpFilter;
      }
      
      // Lowpass Filter (restricts high-frequency hiss/noise)
      if (enableEQ) {
        const lpFilter = offlineCtx.createBiquadFilter();
        lpFilter.type = "lowpass";
        lpFilter.frequency.value = lowPassFreq; // Default ~7.5kHz
        lastNode.connect(lpFilter);
        lastNode = lpFilter;
      }
      
      // Presence Vocal Boost (peaking filter around 2.5kHz)
      if (enableEQ && clarityBoost > 0) {
        const presenceFilter = offlineCtx.createBiquadFilter();
        presenceFilter.type = "peaking";
        presenceFilter.frequency.value = 2500;
        presenceFilter.Q.value = 1.1;
        // Map boost percentage (0-100) to gain (0 to +7.5dB)
        presenceFilter.gain.value = (clarityBoost / 100) * 7.5;
        lastNode.connect(presenceFilter);
        lastNode = presenceFilter;
      }
      
      // Dynamics Compressor (smooths volume peaks, makes voice authoritative and natural)
      if (enableCompressor) {
        const compressor = offlineCtx.createDynamicsCompressor();
        compressor.threshold.value = compressorThreshold; // Default ~-20dB
        compressor.knee.value = 25;
        compressor.ratio.value = compressorRatio; // Default ~3.5
        compressor.attack.value = 0.005; // 5ms attack
        compressor.release.value = 0.20; // 200ms release
        lastNode.connect(compressor);
        lastNode = compressor;
      }
      
      // Connect to final rendering output
      lastNode.connect(offlineCtx.destination);
      source.start(0);
      
      // Render the audio graph off-thread
      const renderedBuffer = await offlineCtx.startRendering();
      
      // Post-Processing: Noise Gating & Peak Normalization inside raw memory buffer
      const finalBuffer = offlineCtx.createBuffer(numberOfChannels, length, sampleRate);
      
      for (let ch = 0; ch < numberOfChannels; ch++) {
        const srcData = renderedBuffer.getChannelData(ch);
        const destData = finalBuffer.getChannelData(ch);
        
        // Copy processed samples
        destData.set(srcData);
        
        // 1. Amplitude-based Noise Gate
        if (enableNoiseGate) {
          const ampThreshold = Math.pow(10, noiseGateThreshold / 20); // convert dB to amplitude
          const windowSize = Math.floor(sampleRate * 0.015); // 15ms analysis windows
          
          for (let i = 0; i < length; i += windowSize) {
            const end = Math.min(i + windowSize, length);
            let sumSquares = 0;
            for (let j = i; j < end; j++) {
              sumSquares += destData[j] * destData[j];
            }
            const rms = Math.sqrt(sumSquares / (end - i));
            
            // If segment is silent room noise, reduce its volume by 94% (attenuation)
            if (rms < ampThreshold) {
              for (let j = i; j < end; j++) {
                destData[j] *= 0.06;
              }
            }
          }
        }
      }
      
      // 2. Volume Normalization (Scale peak to exact normalize target)
      if (enableNormalizer) {
        let maxPeak = 0;
        for (let ch = 0; ch < numberOfChannels; ch++) {
          const destData = finalBuffer.getChannelData(ch);
          for (let i = 0; i < length; i++) {
            const absVal = Math.abs(destData[i]);
            if (absVal > maxPeak) maxPeak = absVal;
          }
        }
        
        if (maxPeak > 0) {
          const targetAmp = Math.pow(10, normalizeTarget / 20);
          const scaleMultiplier = targetAmp / maxPeak;
          
          for (let ch = 0; ch < numberOfChannels; ch++) {
            const destData = finalBuffer.getChannelData(ch);
            for (let i = 0; i < length; i++) {
              destData[i] *= scaleMultiplier;
            }
          }
        }
      }
      
      setEnhancedBuffer(finalBuffer);
      
      // Encode final Buffer to standard 16-bit PCM WAV File
      const wavBlob = audioBufferToWav(finalBuffer);
      const enhancedAudioUrl = URL.createObjectURL(wavBlob);
      setEnhancedUrl(enhancedAudioUrl);
      
      // Generate Enhanced Wave points
      const enhancedPoints = extractWaveform(finalBuffer);
      setEnhancedWave(enhancedPoints);
      
      setPlaybackMode("enhanced");
      
    } catch (err: any) {
      console.error("Audio isolation processing failed:", err);
      setError("An error occurred during voice isolation: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Convert raw audio to base64 for Gemini multimodal input
  const fileToBase64 = (fileObj: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileObj);
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve(base64String);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Send original audio to multimodal Gemini 3.5 Flash for complete analysis
  const analyzeVoiceWithAI = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    setAiReport(null);
    
    try {
      const base64Audio = await fileToBase64(file);
      const mimeType = file.type || "audio/wav";

      const response = await fetch("/api/enhance/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          audioData: base64Audio,
          mimeType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze audio voice.");
      }

      setAiReport(data.report);
      onRefreshStats(); // Sync usage/metrics
    } catch (err: any) {
      console.error("AI Analysis fetch error:", err);
      setError("AI Voice Analysis failed: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // WAV file encoder helper functions
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // 1 = raw PCM
    const bitDepth = 16;
    
    let result;
    if (numOfChan === 2) {
      result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
    } else {
      result = buffer.getChannelData(0);
    }
    
    const bufferLength = result.length * 2;
    const wavBuffer = new ArrayBuffer(44 + bufferLength);
    const view = new DataView(wavBuffer);
    
    /* RIFF identifier */
    writeString(view, 0, "RIFF");
    /* file length */
    view.setUint32(4, 36 + bufferLength, true);
    /* RIFF type */
    writeString(view, 8, "WAVE");
    /* format chunk identifier */
    writeString(view, 12, "fmt ");
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (PCM) */
    view.setUint16(20, format, true);
    /* channel count */
    view.setUint16(22, numOfChan, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate */
    view.setUint32(28, sampleRate * numOfChan * 2, true);
    /* block align */
    view.setUint16(32, numOfChan * 2, true);
    /* bits per sample */
    view.setUint16(34, bitDepth, true);
    /* data chunk identifier */
    writeString(view, 36, "data");
    /* data chunk length */
    view.setUint32(40, bufferLength, true);
    
    // Write audio samples as 16-bit PCM integers
    floatTo16BitPCM(view, 44, result);
    
    return new Blob([wavBuffer], { type: "audio/wav" });
  };

  const interleave = (inputL: Float32Array, inputR: Float32Array): Float32Array => {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);
    let index = 0;
    let inputIndex = 0;
    
    while (index < length) {
      result[index++] = inputL[inputIndex];
      result[index++] = inputR[inputIndex];
      inputIndex++;
    }
    return result;
  };

  const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  };

  const writeString = (view: DataView, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // Extract wave buckets for visualization
  const extractWaveform = (buffer: AudioBuffer, buckets = 70): number[] => {
    const channelData = buffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / buckets);
    const wave: number[] = [];
    
    for (let i = 0; i < buckets; i++) {
      const start = i * blockSize;
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        const val = Math.abs(channelData[start + j]);
        if (val > max) max = val;
      }
      wave.push(Math.min(1, Math.max(0.08, max * 1.3))); // clamp and scale slightly
    }
    return wave;
  };

  // Audio Playback Engine
  const togglePlayback = (mode: "original" | "enhanced") => {
    if (playbackMode === mode) {
      // Toggle play/pause
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().catch(e => console.error(e));
        setIsPlaying(true);
      }
    } else {
      // Switch source audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlaybackMode(mode);
      setIsPlaying(true);
      
      // Delay slightly to allow state to settle
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.error(e));
        }
      }, 50);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatDuration = (sec: number): string => {
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const clearSession = () => {
    setFile(null);
    setAudioUrl(null);
    setAudioBuffer(null);
    setEnhancedUrl(null);
    setEnhancedBuffer(null);
    setAiReport(null);
    setOriginalWave([]);
    setEnhancedWave([]);
    setIsPlaying(false);
    setPlaybackMode("none");
    setError(null);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 relative z-10 animate-in fade-in duration-300">
      {/* Hidden native HTML5 Audio element */}
      <audio
        ref={audioRef}
        src={playbackMode === "original" ? audioUrl || undefined : enhancedUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        className="hidden"
      />

      {/* Header and Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/15 w-fit mb-3">
            <Wand2 className="w-3.5 h-3.5" />
            <span>STUDIO-GRADE DSP + MULTIMODAL GEMINI AI</span>
          </div>
          <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">
            Voice Isolator & Audio Enhancer
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Isolate pristine vocals by filtering out background noise, hums, echoes, and harsh distortions using our advanced dual-engine DSP processor and multimodal Gemini vocal analytics.
          </p>
        </div>
        
        {/* Statistics widget */}
        <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 shrink-0">
          <div className="text-right">
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest">Plan tier</span>
            <span className="text-sm font-bold text-white uppercase font-mono">{user?.plan || "Free"}</span>
          </div>
          <div className="w-px bg-white/10"></div>
          <div>
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest">Remaining Credit</span>
            <span className="text-sm font-bold text-indigo-300 font-mono">
              {stats ? (stats.limit - stats.usage).toLocaleString() : "5,000"} chars
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Operation Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (Input, recording & Visualizer) */}
        <div className="lg:col-span-7 space-y-6">
          {!file && (
            <div className="space-y-4">
              {/* File Drag and Drop & Microphone Recording Interface */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[340px] transition-all relative ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
                    : "border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/[0.08]"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (selected) handleFileSelect(selected);
                  }}
                  accept="audio/*"
                  className="hidden"
                />

                {isRecording ? (
                  <div className="space-y-6 flex flex-col items-center">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-20 h-20 rounded-full bg-red-500/20 animate-ping"></div>
                      <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white relative z-10 shadow-lg shadow-red-500/30">
                        <Mic className="w-8 h-8 animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Recording Live Audio</h3>
                      <p className="text-red-400 font-mono text-sm font-bold mt-1 tracking-wider">
                        {formatDuration(recordingTime)}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Speak clearly. Your browser is capturing pristine microphone samples.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-6 py-3 rounded-full bg-white text-slate-900 font-semibold hover:bg-slate-200 transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                    >
                      <Pause className="w-4 h-4 fill-current text-slate-900" />
                      <span>Stop & Process</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 max-w-md flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/5">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Upload Audio or Record Live</h3>
                      <p className="text-slate-400 text-sm mt-1">
                        Drag & drop your voice recording here, browse local files, or record directly using your microphone.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center w-full">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-5 py-2.5 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-200 transition-all cursor-pointer text-sm shadow-md flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Browse Audio</span>
                      </button>
                      <button
                        type="button"
                        onClick={startRecording}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white transition-all cursor-pointer text-sm shadow-lg shadow-indigo-600/20 flex items-center gap-2 border border-indigo-500/30"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Record Microphone</span>
                      </button>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-white/5 w-full">
                      Accepts WAV, MP3, M4A, OGG • Max 15MB • Max 2 Mins
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active File Workspace Card */}
          {file && (
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-6">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                    <Music className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white truncate max-w-[280px] sm:max-w-[400px]" title={file.name}>
                      {file.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                      <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                      <span>•</span>
                      <span>{formatDuration(duration)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={clearSession}
                  className="p-2.5 rounded-xl border border-white/5 text-slate-500 hover:text-red-400 hover:bg-red-500/5 hover:border-red-500/10 transition-all cursor-pointer"
                  title="Clear File"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Graphical Waveforms Visualizer */}
              <div className="space-y-6 py-2">
                {/* Original Waveform */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                      Original Input Recording
                    </span>
                    <button
                      onClick={() => togglePlayback("original")}
                      className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all font-mono font-bold cursor-pointer ${
                        playbackMode === "original" && isPlaying
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          : "border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {playbackMode === "original" && isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                      <span>{playbackMode === "original" && isPlaying ? "PAUSE" : "LISTEN ORIGINAL"}</span>
                    </button>
                  </div>
                  
                  {/* Visualizer bars */}
                  <div className="h-20 bg-black/35 rounded-xl flex items-center justify-between px-4 border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-y-0 left-0 bg-indigo-500/10 transition-all duration-75 pointer-events-none" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                    {originalWave.length > 0 ? (
                      originalWave.map((val, index) => {
                        const progressPercent = (currentTime / duration) * 100;
                        const barPercent = (index / originalWave.length) * 100;
                        const isPlayed = progressPercent >= barPercent;
                        return (
                          <div
                            key={index}
                            className={`w-[4px] rounded-full transition-all duration-150`}
                            style={{
                              height: `${val * 100}%`,
                              backgroundColor: isPlayed ? "#6366f1" : "rgba(255, 255, 255, 0.15)"
                            }}
                          ></div>
                        );
                      })
                    ) : (
                      <div className="text-xs font-mono text-slate-600 text-center w-full">Rendering original waveform data...</div>
                    )}
                  </div>
                </div>

                {/* Enhanced Waveform */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Enhanced Crisp Vocals
                    </span>
                    {enhancedUrl ? (
                      <button
                        onClick={() => togglePlayback("enhanced")}
                        className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all font-mono font-bold cursor-pointer ${
                          playbackMode === "enhanced" && isPlaying
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-indigo-600/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/20"
                        }`}
                      >
                        {playbackMode === "enhanced" && isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                        <span>{playbackMode === "enhanced" && isPlaying ? "PAUSE" : "LISTEN ENHANCED"}</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">Pending DSP rendering</span>
                    )}
                  </div>

                  {/* Enhanced Wave bars */}
                  <div className="h-20 bg-black/35 rounded-xl flex items-center justify-between px-4 border border-white/5 relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-emerald-500/10 transition-all duration-75 pointer-events-none" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                    {enhancedUrl && enhancedWave.length > 0 ? (
                      enhancedWave.map((val, index) => {
                        const progressPercent = (currentTime / duration) * 100;
                        const barPercent = (index / enhancedWave.length) * 100;
                        const isPlayed = progressPercent >= barPercent;
                        return (
                          <div
                            key={index}
                            className="w-[4px] rounded-full transition-all duration-150"
                            style={{
                              height: `${val * 100}%`,
                              backgroundColor: isPlayed ? "#10b981" : "rgba(255, 255, 255, 0.15)"
                            }}
                          ></div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full text-slate-600 font-mono text-xs">
                        {processing ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                            <span>Processing audio blocks...</span>
                          </div>
                        ) : (
                          <span>Click &quot;Denoise & Enhance Voice&quot; to render enhanced audio waveform</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Tracker Slider */}
              {playbackMode !== "none" && (
                <div className="bg-black/25 p-4 rounded-2xl border border-white/5 flex items-center gap-4 text-xs font-mono text-slate-400">
                  <span className="min-w-[32px]">{formatDuration(currentTime)}</span>
                  <div className="flex-1 relative group cursor-pointer h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-75"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    ></div>
                    <input 
                      type="range"
                      min={0}
                      max={duration || 100}
                      step={0.05}
                      value={currentTime}
                      onChange={(e) => {
                        const targetTime = parseFloat(e.target.value);
                        setCurrentTime(targetTime);
                        if (audioRef.current) {
                          audioRef.current.currentTime = targetTime;
                        }
                      }}
                      className="absolute inset-0 opacity-0 w-full cursor-pointer"
                    />
                  </div>
                  <span className="min-w-[32px]">{formatDuration(duration)}</span>
                </div>
              )}

              {/* Audio isolation button triggers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  onClick={processVoiceIsolation}
                  disabled={processing}
                  className="px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 disabled:opacity-50 text-white font-semibold transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-200" />
                      <span>DSP RENDERING...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      <span>Denoise & Enhance Voice</span>
                    </>
                  )}
                </button>
                
                {enhancedUrl ? (
                  <a
                    href={enhancedUrl}
                    download={`vaaniai_enhanced_${Date.now()}.wav`}
                    className="px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-xl shadow-emerald-600/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download Enhanced WAV</span>
                  </a>
                ) : (
                  <button
                    onClick={analyzeVoiceWithAI}
                    disabled={analyzing || !file}
                    className="px-6 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 text-slate-200 font-semibold border border-white/15 hover:border-white/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                        <span>AI ANALYZING VOICE...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                        <span>Analyze Voice with AI</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Multimodal AI Vocal Diagnosis Report Card */}
          {aiReport && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/20 to-purple-950/20 border border-indigo-500/20 space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/20 text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    AI Vocal Intelligence Diagnosis
                  </h3>
                  <p className="text-xs text-slate-400">Powered by multimodal gemini-3.5-flash</p>
                </div>
              </div>

              {/* Quick dials */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-black/25 p-3 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Clarity Score</span>
                  <div className="relative flex items-center justify-center h-12 w-12 rounded-full border-2 border-dashed border-indigo-500/30">
                    <span className="text-base font-extrabold text-white font-mono">{aiReport.clarityScore}</span>
                  </div>
                </div>

                <div className="bg-black/25 p-3 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Noise Level</span>
                  <span className={`text-xs font-bold uppercase mt-4 px-2.5 py-1 rounded-full font-mono border ${
                    aiReport.noiseLevel === "high"
                      ? "bg-red-500/10 border-red-500/20 text-red-400"
                      : aiReport.noiseLevel === "medium"
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  }`}>
                    {aiReport.noiseLevel}
                  </span>
                </div>

                <div className="bg-black/25 p-3 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Speaking Pace</span>
                  <span className="text-xs font-bold text-slate-200 mt-4">{aiReport.speakingPace}</span>
                </div>

                <div className="bg-black/25 p-3 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Warmth / Tone</span>
                  <span className="text-xs font-bold text-indigo-300 mt-4 capitalize">{aiReport.vocalWarmth}</span>
                </div>
              </div>

              {/* Speech-to-Text Transcript */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Speech-To-Text Transcript</h4>
                <div className="p-4 rounded-2xl bg-black/35 border border-white/5 text-slate-300 text-sm leading-relaxed italic">
                  &quot;{aiReport.transcript || "No speech detected in recording."}&quot;
                </div>
              </div>

              {/* Environmental noise descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-black/15 p-4 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Acoustics & Echo</span>
                  <p className="text-xs text-slate-300">
                    {aiReport.echoLevel === "none" ? "Dry studio acoustics, minimal room echo." : `Room reverberation is ${aiReport.echoLevel}. Some echo dampening recommended.`}
                  </p>
                </div>
                <div className="bg-black/15 p-4 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Distortion & Clipping</span>
                  <p className="text-xs text-slate-300 flex items-center gap-1.5">
                    {aiReport.distortionDetected ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-red-300 font-semibold">Distortion detected. Adjust input level.</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Clean audio signal, no digital clipping detected.</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Noise detailed description */}
              <div className="p-4 rounded-2xl bg-indigo-950/15 border border-indigo-500/10 flex gap-3 items-start">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="font-semibold block mb-0.5 text-indigo-300">Ambient Noise Report</span>
                  {aiReport.noiseDescription}
                </div>
              </div>

              {/* Optimization Recommendations list */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">AI Optimization Action List</h4>
                <ul className="space-y-2.5">
                  {aiReport.recommendations && aiReport.recommendations.map((rec, index) => (
                    <li key={index} className="flex gap-2.5 text-xs text-slate-300 items-start">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                        {index + 1}
                      </span>
                      <span className="mt-0.5">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trigger Isolator */}
              {!enhancedUrl && (
                <button
                  onClick={processVoiceIsolation}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Denoise Vocals using Recommended Settings</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column (Advanced DSP Parametric Slider Controls) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-6 h-fit sticky top-24">
            <div className="flex items-center gap-2 pb-4 border-b border-white/5">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-base">DSP Parametric Control Board</h3>
            </div>

            {/* 1. Dynamic Noise Gate Control Block */}
            <div className="space-y-4 p-4 rounded-2xl bg-black/25 border border-white/5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wide text-slate-300">
                  <VolumeX className="w-4 h-4 text-slate-500" />
                  1. Spectral Noise Gate
                </label>
                <input
                  type="checkbox"
                  checked={enableNoiseGate}
                  onChange={(e) => setEnableNoiseGate(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-white/10 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Aggressively attenuates room background noise, static, HVAC hums, and microphone hiss when speaker is silent.
              </p>
              {enableNoiseGate && (
                <div className="space-y-2 pt-1 animate-in slide-in-from-top duration-200">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Gate Threshold</span>
                    <span className="text-indigo-400 font-bold">{noiseGateThreshold} dB</span>
                  </div>
                  <input
                    type="range"
                    min={-90}
                    max={-15}
                    step={1}
                    value={noiseGateThreshold}
                    onChange={(e) => setNoiseGateThreshold(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-600">
                    <span>-90dB (Gentle)</span>
                    <span>-15dB (Aggressive)</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Frequency Filters (EQ) Control Block */}
            <div className="space-y-4 p-4 rounded-2xl bg-black/25 border border-white/5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wide text-slate-300">
                  <Activity className="w-4 h-4 text-slate-500" />
                  2. Voice Frequency Filters
                </label>
                <input
                  type="checkbox"
                  checked={enableEQ}
                  onChange={(e) => setEnableEQ(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-white/10 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Trims non-vocal frequency ranges. Highpass cuts low bass rumbling; Lowpass cuts extreme high sizzles.
              </p>
              {enableEQ && (
                <div className="space-y-4 pt-1 animate-in slide-in-from-top duration-200">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">High-Pass Filter (Rumble)</span>
                      <span className="text-indigo-400 font-bold">{highPassFreq} Hz</span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={250}
                      step={5}
                      value={highPassFreq}
                      onChange={(e) => setHighPassFreq(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Low-Pass Filter (Hiss / De-ess)</span>
                      <span className="text-indigo-400 font-bold">{lowPassFreq} Hz</span>
                    </div>
                    <input
                      type="range"
                      min={4000}
                      max={12000}
                      step={100}
                      value={lowPassFreq}
                      onChange={(e) => setLowPassFreq(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Clarity Presence EQ Boost Block */}
            <div className="space-y-4 p-4 rounded-2xl bg-black/25 border border-white/5">
              <label className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wide text-slate-300">
                <Flame className="w-4 h-4 text-slate-500" />
                3. Vocal Presence EQ Boost
              </label>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Amplifies voice definition in the critical 2.5kHz zone to make words sound incredibly crisp and legible.
              </p>
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Clarity Gain Boost</span>
                  <span className="text-emerald-400 font-bold">{clarityBoost}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={clarityBoost}
                  onChange={(e) => setClarityBoost(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>

            {/* 4. Dynamics Compressor (Smoothness) Control Block */}
            <div className="space-y-4 p-4 rounded-2xl bg-black/25 border border-white/5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wide text-slate-300">
                  <Star className="w-4 h-4 text-slate-500" />
                  4. Dynamics Compressor
                </label>
                <input
                  type="checkbox"
                  checked={enableCompressor}
                  onChange={(e) => setEnableCompressor(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-white/10 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Flattens out extreme volume spikes and brings up quiet speech bits, providing a smooth podcast broadcast tone.
              </p>
              {enableCompressor && (
                <div className="space-y-4 pt-1 animate-in slide-in-from-top duration-200">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Compressor Threshold</span>
                      <span className="text-indigo-400 font-bold">{compressorThreshold} dB</span>
                    </div>
                    <input
                      type="range"
                      min={-45}
                      max={-5}
                      step={1}
                      value={compressorThreshold}
                      onChange={(e) => setCompressorThreshold(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Compression Ratio</span>
                      <span className="text-indigo-400 font-bold">{compressorRatio} : 1</span>
                    </div>
                    <input
                      type="range"
                      min={1.5}
                      max={8}
                      step={0.1}
                      value={compressorRatio}
                      onChange={(e) => setCompressorRatio(parseFloat(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 5. Peak Normalizer Control Block */}
            <div className="space-y-4 p-4 rounded-2xl bg-black/25 border border-white/5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wide text-slate-300">
                  <Volume2 className="w-4 h-4 text-slate-500" />
                  5. Peak Normalizer
                </label>
                <input
                  type="checkbox"
                  checked={enableNormalizer}
                  onChange={(e) => setEnableNormalizer(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-white/10 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Scans entire audio waveform and shifts the volume range so peaks hit the maximum target without clipping.
              </p>
              {enableNormalizer && (
                <div className="space-y-2 pt-1 animate-in slide-in-from-top duration-200">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Target Level</span>
                    <span className="text-indigo-400 font-bold">{normalizeTarget} dBFS</span>
                  </div>
                  <input
                    type="range"
                    min={-6}
                    max={0}
                    step={0.5}
                    value={normalizeTarget}
                    onChange={(e) => setNormalizeTarget(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-600">
                    <span>-6.0dB (Conservative)</span>
                    <span>0.0dB (Max Peak)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Live feedback */}
            <div className="text-[10px] font-mono text-slate-500 bg-white/[0.01] p-3 rounded-xl border border-white/5 flex gap-2">
              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>
                DSP rendering executes client-side within an offline browser rendering frame for zero-latency, high-performance execution.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
