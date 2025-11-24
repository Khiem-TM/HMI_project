"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Volume2, Download, Copy, Loader2, Hand } from "lucide-react";
import { TranslatorErrorBoundary } from "./error-boundary";
import { useVideoStore } from "@/lib/stores/video-store";
import { useTranslatorStore } from "@/lib/stores/translator-store";
import { useHandDetection } from "@/hooks/useHandDetection";
import { apiService } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useSignRecognition } from "@/hooks/useSignRecognition";

let translationService: any = null;
let languageDetectionService: any = null;
let mediapipeLanguageDetectionService: any = null;
let SignWritingCanvas: any = null;
let VideoCanvas: any = null;
let SkeletonPoseViewer: any = null;
let AvatarPoseViewer: any = null;
let ViewerSelector: any = null;

async function loadServices() {
  if (typeof window === "undefined") return;

  try {
    if (!translationService) {
      const module = await import("@/lib/services/translation.service");
      translationService = module.translationService;
    }
    if (!languageDetectionService) {
      const module = await import("@/lib/services/language-detection.service");
      languageDetectionService = module.languageDetectionService;
    }
    if (!mediapipeLanguageDetectionService) {
      const module = await import(
        "@/lib/services/mediapipe-language-detection.service"
      );
      mediapipeLanguageDetectionService =
        module.mediapipeLanguageDetectionService;
    }
    if (!SignWritingCanvas) {
      const module = await import("@/components/translator/signwriting-canvas");
      SignWritingCanvas = module.SignWritingCanvas;
    }
    if (!VideoCanvas) {
      const module = await import("@/components/translator/video-canvas");
      VideoCanvas = module.VideoCanvas;
    }
    if (!SkeletonPoseViewer) {
      const module = await import(
        "@/components/translator/pose-viewer/skeleton-pose-viewer"
      );
      SkeletonPoseViewer = module.SkeletonPoseViewer;
    }
    if (!AvatarPoseViewer) {
      const module = await import(
        "@/components/translator/pose-viewer/avatar-pose-viewer"
      );
      AvatarPoseViewer = module.AvatarPoseViewer;
    }
    if (!ViewerSelector) {
      const module = await import(
        "@/components/translator/pose-viewer/viewer-selector"
      );
      ViewerSelector = module.ViewerSelector;
    }
  } catch (e) {
    console.error("Error loading services:", e);
    throw e;
  }
}

export interface SignWritingObj {
  fsw: string;
  description?: string;
}

function TranslatorPageContent() {
  const [mode, setMode] = useState<"text-to-sign" | "sign-to-text">(
    "text-to-sign"
  );
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [signWriting, setSignWriting] = useState<SignWritingObj[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string>("en");
  const [selectedSpokenLanguage, setSelectedSpokenLanguage] =
    useState<string>("en");
  const [selectedSignedLanguage, setSelectedSignedLanguage] =
    useState<string>("ase");
  const [poseUrl, setPoseUrl] = useState<string | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [servicesLoaded, setServicesLoaded] = useState(false);

  // Sign-to-text states
  const [capturedLandmarks, setCapturedLandmarks] = useState<number[][][]>([]);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionMode, setRecognitionMode] = useState<"single" | "sequence">(
    "single"
  );
  const [recordedSequence, setRecordedSequence] = useState<number[][][][]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const { toast } = useToast();
const [realtimeSign, setRealtimeSign] = useState<string>("");
  // Hand detection hook
  const {
    isInitialized: isHandDetectionReady,
    isDetecting: isHandDetecting,
    error: handDetectionError,
    handCount,
    canvasRef,
  } = useHandDetection(videoRef, isCameraActive && mode === "sign-to-text", {
    onHandsDetected: (hands) => {
      const landmarks = hands.map((hand) =>
        hand.landmarks.map((lm) => [lm.x, lm.y, lm.z])
      );
      setCapturedLandmarks(landmarks);

      if (isRecording && landmarks.length > 0) {
        setRecordedSequence((prev) => [...prev, landmarks]);
      }
    },
    onNoHands: () => {
      setCapturedLandmarks([]);
    },
    confidenceThreshold: 0.5,
    detectionInterval: 100,
  });

  useSignRecognition(videoRef, {
    // Chỉ bật khi Camera đang mở VÀ đang ở chế độ Sign-to-Text
    enabled: isCameraActive && mode === "sign-to-text",
    
    onResult: (text, score) => {
      // Chỉ chấp nhận nếu độ tin cậy > 60%
      if (score > 0.6) {
        console.log(`AI Detected: ${text} (${score})`);
        setTranslatedText(text); // Cập nhật chữ lên màn hình
        
        // (Tùy chọn) Nếu muốn chữ tự động điền vào ô kết quả bên phải:
        // setTranslatedText(text); 
      }
    }
  });
  // -----------------------------------------------------------

  useEffect(() => {
    loadServices()
      .then(() => {
        setServicesLoaded(true);
      })
      .catch((e) => {
        console.error("Failed to load services:", e);
      });
  }, []);

  const { startCamera, stopVideo, camera } = useVideoStore();
  const {
    signedLanguageVideo,
    poseViewerMode,
    setSignedLanguageVideo,
    setSignedLanguagePose,
  } = useTranslatorStore();

  useEffect(() => {
    return () => {
      const videoUrl = signedLanguageVideo;
      if (videoUrl && videoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, []);

  const handleStartCamera = async () => {
    setIsLoading(true);
    setCameraError(null);

    try {
      await startCamera();
      // Get camera stream from store
      const stream = useVideoStore.getState().camera;

      if (stream) {
        setIsCameraActive(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }

        setIsLoading(false);
      } else {
        throw new Error("Camera stream not available");
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setCameraError(
        err.message || "Cannot access camera. Please check permissions."
      );
      setIsLoading(false);
      setIsCameraActive(false);
    }
  };

  const handleStopCamera = () => {
    stopVideo();
    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      videoRef.current.pause();
    }
    setIsCameraActive(false);
    setIsLoading(false);
    setCameraError(null);
  };

  const handleVideoError = (
    e: React.SyntheticEvent<HTMLVideoElement, Event>
  ) => {
    const error = e.currentTarget.error;
    console.error("Video playback error:", error);
    if (error) {
      setVideoError(`Video error: ${error.message || "Unknown error"}`);
    }
  };

  const handleRecognizeSign = async () => {
    const landmarksToUse =
      recognitionMode === "sequence" && recordedSequence.length > 0
        ? recordedSequence
        : capturedLandmarks;

    // Check
    //Firebase API
    const hasVideo =
      recordedVideoUrl || (videoRef.current && videoRef.current.srcObject);

    if (landmarksToUse.length === 0 && !hasVideo) {
      toast({
        title: "No Hands Detected",
        description:
          "Please show your hands to the camera or record a sequence",
        variant: "destructive",
      });
      return;
    }

    setIsRecognizing(true);
    setTranslatedText("");

    try {
      let recognizedText = "";

      if (recordedVideoUrl && translationService) {
        try {
          console.log("Trying Firebase API with recorded video...");
          const result = await translationService.translateSignedToSpokenText(
            recordedVideoUrl,
            selectedSignedLanguage || "ase",
            selectedSpokenLanguage === "auto" ? "en" : selectedSpokenLanguage
          );
          recognizedText = result.text;
          console.log("Firebase API success:", recognizedText);
        } catch (firebaseError: any) {
          console.warn(
            "Firebase API failed, falling back to backend:",
            firebaseError
          );
        }
      }

      if (!recognizedText && landmarksToUse.length > 0) {
        try {
          console.log("Using backend API with landmarks...");
          const response = await apiService.translations.signToText({
            landmarks: landmarksToUse,
            sign_language: selectedSignedLanguage || "ase",
            mode: recognitionMode,
          });

          if (response.data.success) {
            recognizedText = response.data.translation.output_text;
            console.log("Backend API success:", recognizedText);
          } else {
            throw new Error(response.data.message || "Recognition failed");
          }
        } catch (backendError: any) {
          console.error("Backend recognition failed:", backendError);
          throw backendError;
        }
      }

      if (recognizedText) {
        setTranslatedText(recognizedText);
        toast({
          title: "Sign Recognized",
          description: `Detected: ${recognizedText}`,
        });
      } else {
        throw new Error("No text recognized from either API");
      }
    } catch (error: any) {
      console.error("Sign recognition error:", error);
      toast({
        title: "Recognition Failed",
        description:
          error.response?.data?.message ||
          error.message ||
          "An error occurred. Please try again.",
        variant: "destructive",
      });
      setTranslatedText("Recognition failed. Please try again.");
    } finally {
      setIsRecognizing(false);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordedSequence([]);
    setRecordedVideoBlob(null);
    setRecordedVideoUrl(null);

    // Start recording video from camera if available
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const chunks: Blob[] = [];

      try {
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
            ? "video/webm; codecs=vp9"
            : MediaRecorder.isTypeSupported("video/webm")
            ? "video/webm"
            : "video/mp4",
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
          const url = URL.createObjectURL(blob);
          setRecordedVideoBlob(blob);
          setRecordedVideoUrl(url);
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
      } catch (err) {
        console.warn(
          "MediaRecorder not supported, recording landmarks only:",
          err
        );
      }
    }

    toast({
      title: "Recording Started",
      description: "Show sign language gestures. Click Stop to finish.",
    });
  };

  const stopRecording = () => {
    setIsRecording(false);

    // Stop video recording if active
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    toast({
      title: "Recording Stopped",
      description: `Recorded ${recordedSequence.length} frames${
        recordedVideoBlob ? " and video" : ""
      }`,
    });
  };

  // Handle text translation using external API (Firebase Cloud Functions)
  const handleTranslate = async () => {
    if (!inputText.trim() || !translationService || !languageDetectionService) {
      setTranslationError("Please enter text to translate");
      return;
    }

    setIsTranslating(true);
    setTranslationError(null);
    setVideoError(null);
    setSignWriting([]);
    setPoseUrl(null);
    // Clear previous video URL (will revoke blob URL in store)
    setSignedLanguageVideo(null);
    setSignedLanguagePose(null);

    try {
      // Detect language if not manually selected (use MediaPipe if available)
      let spokenLang = selectedSpokenLanguage;
      if (!selectedSpokenLanguage || selectedSpokenLanguage === "auto") {
        if (mediapipeLanguageDetectionService) {
          try {
            await mediapipeLanguageDetectionService.init();
            spokenLang =
              await mediapipeLanguageDetectionService.detectSpokenLanguage(
                inputText
              );
          } catch (e) {
            console.warn("MediaPipe detection failed, using fallback:", e);
            spokenLang = await languageDetectionService.detectSpokenLanguage(
              inputText
            );
          }
        } else {
          spokenLang = await languageDetectionService.detectSpokenLanguage(
            inputText
          );
        }
        setDetectedLanguage(spokenLang);
      }

      const videoUrl = translationService.getSpokenToSignedVideoUrl(
        inputText.trim(),
        spokenLang,
        selectedSignedLanguage
      );
      setSignedLanguageVideo(videoUrl);

      const poseUrlValue = translationService.getSpokenToSignedPoseUrl(
        inputText.trim(),
        spokenLang,
        selectedSignedLanguage
      );
      setPoseUrl(poseUrlValue);
      setSignedLanguagePose(poseUrlValue);

      // Split into sentences
      const sentences = translationService.splitSpokenSentences(
        spokenLang,
        inputText.trim()
      );

      // Translate to SignWriting
      const result = await translationService.translateSpokenToSignWriting(
        inputText.trim(),
        sentences,
        spokenLang,
        selectedSignedLanguage
      );

      // Convert FSW string to array of SignWriting objects
      // FSW signs are separated by spaces, filter out empty strings
      const fswSigns = result.text
        .split(/\s+/)
        .filter((s: string) => s.trim().length > 0 && !s.match(/^\$[a-z]+$/)); // Filter out language tags like $en $ase

      if (fswSigns.length === 0) {
        throw new Error("Translation returned no sign language symbols");
      }

      const signWritingObjs: SignWritingObj[] = fswSigns.map((fsw: string) => ({
        fsw: fsw.trim(),
      }));
      setSignWriting(signWritingObjs);
    } catch (err: any) {
      console.error("Translation error:", err);
      const errorMessage =
        err.message || "Translation failed. Please try again.";

      // Provide user-friendly error messages
      if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        setTranslationError(
          "Translation models not found. Please ensure models are downloaded."
        );
      } else if (
        errorMessage.includes("empty") ||
        errorMessage.includes("no sign language symbols")
      ) {
        setTranslationError(
          "Translation returned no results. Please try different text."
        );
      } else if (errorMessage.includes("Worker not initialized")) {
        setTranslationError(
          "Translation engine failed to initialize. Please refresh the page."
        );
      } else {
        setTranslationError(errorMessage);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  // Auto-detect language when text changes
  useEffect(() => {
    if (
      inputText.trim() &&
      selectedSpokenLanguage === "auto" &&
      languageDetectionService
    ) {
      languageDetectionService
        .detectSpokenLanguage(inputText)
        .then(setDetectedLanguage)
        .catch(console.error);
    }
  }, [inputText, selectedSpokenLanguage]);

  if (!servicesLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-4">Translator</h1>
        <p className="text-muted-foreground mb-2">
          <span className="text-accent font-semibold">
            Text to Sign Language:
          </span>{" "}
          Converts written text into accurate sign language animations, enabling
          easy understanding for hearing-impaired users.
        </p>
        <p className="text-muted-foreground">
          <span className="text-accent font-semibold">
            Sign Language to Text:
          </span>{" "}
          Users can express sign language through a camera, which is recognized
          and converted back into text.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-4 mb-8">
        <Button
          variant={mode === "text-to-sign" ? "default" : "outline"}
          onClick={() => setMode("text-to-sign")}
          className="flex items-center gap-2"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Translate Text to ASL
        </Button>
        <Button
          variant={mode === "sign-to-text" ? "default" : "outline"}
          onClick={() => setMode("sign-to-text")}
          className="flex items-center gap-2"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          Translate ASL to Text
        </Button>
      </div>

      {/* Translator Interface */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Panel - Camera/Input */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {mode === "sign-to-text"
                ? "Sign Language Detection"
                : "Text Input"}
            </h2>

            {mode === "sign-to-text" ? (
              <div className="space-y-4">
                <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                  {/* Video element */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover rounded-lg ${
                      isCameraActive ? "block" : "hidden"
                    }`}
                    onLoadedMetadata={(e) => {
                      console.log("Video metadata loaded");
                      e.currentTarget.play().catch(console.error);
                    }}
                  />

                  {/* Canvas overlay for hand landmarks */}
                  {isCameraActive && (
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full pointer-events-none z-10"
                      style={{ mixBlendMode: "screen" }}
                    />
                  )}

                  {/* Hand detection status overlay */}
                  {isCameraActive && isHandDetectionReady && (
                    <div className="absolute top-4 left-4 z-20 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        <Hand className="h-4 w-4" />
                        <span>
                          {handCount > 0
                            ? `${handCount} hand${
                                handCount > 1 ? "s" : ""
                              } detected`
                            : "No hands detected"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Loading state */}
                  {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-2"></div>
                      <p className="text-sm text-muted-foreground">
                        Starting camera...
                      </p>
                    </div>
                  )}

                  {/* Error state */}
                  {cameraError && !isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted p-4">
                      <Camera className="h-16 w-16 text-red-500 mb-2" />
                      <p className="text-sm text-red-500 text-center">
                        {cameraError}
                      </p>
                    </div>
                  )}
{/* 👇 [CHÈN ĐOẠN CODE HIỂN THỊ KẾT QUẢ NÀY VÀO] */}
                  {isCameraActive && realtimeSign && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center z-30 pointer-events-none">
                      <div className="bg-black/70 backdrop-blur-sm text-white px-6 py-2 rounded-full border border-green-500 shadow-lg animate-in slide-in-from-bottom-2">
                        <p className="text-xl font-bold flex items-center gap-2">
                          <span className="text-sm font-normal text-gray-300">AI Detected:</span>
                          <span className="text-green-400 uppercase">{realtimeSign}</span>
                        </p>
                      </div>
                    </div>
                  )}
                  {/* ------------------------------------------- */}
                  {/* Idle state */}
                  {!isCameraActive && !isLoading && !cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <Camera className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={
                      isCameraActive ? handleStopCamera : handleStartCamera
                    }
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "Starting..."
                      : isCameraActive
                      ? "Stop Camera"
                      : "Start Camera"}
                  </Button>

                  {isCameraActive && (
                    <Button
                      onClick={handleRecognizeSign}
                      disabled={isRecognizing || capturedLandmarks.length === 0}
                      className="flex-1"
                    >
                      {isRecognizing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Recognizing...
                        </>
                      ) : (
                        "Recognize Sign"
                      )}
                    </Button>
                  )}
                </div>

                {isCameraActive && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={isRecording ? stopRecording : startRecording}
                      className="flex-1"
                    >
                      {isRecording ? "Stop Recording" : "Record Sequence"}
                    </Button>
                    <select
                      className="border rounded-md px-3 py-1 text-sm flex-1"
                      value={recognitionMode}
                      onChange={(e) =>
                        setRecognitionMode(
                          e.target.value as "single" | "sequence"
                        )
                      }
                    >
                      <option value="single">Single Sign</option>
                      <option value="sequence">Sequence</option>
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter text to translate to sign language..."
                  className="min-h-[300px] resize-none"
                  maxLength={500}
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{inputText.length} / 500</span>
                  {detectedLanguage && selectedSpokenLanguage === "auto" && (
                    <span>Detected: {detectedLanguage.toUpperCase()}</span>
                  )}
                </div>
                {translationError && (
                  <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
                    {translationError}
                  </div>
                )}
                <Button
                  className="w-full"
                  onClick={handleTranslate}
                  disabled={isTranslating || !inputText.trim()}
                >
                  {isTranslating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    "Translate to Sign Language"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Panel - Output */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {mode === "sign-to-text"
                  ? "Translated Text"
                  : "Sign Language Animation"}
              </h2>
              <div className="flex gap-2">
                <select
                  className="border rounded-md px-3 py-1 text-sm"
                  value={selectedSpokenLanguage}
                  onChange={(e) => setSelectedSpokenLanguage(e.target.value)}
                >
                  <option value="auto">Auto-detect</option>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
                <select
                  className="border rounded-md px-3 py-1 text-sm"
                  value={selectedSignedLanguage}
                  onChange={(e) => setSelectedSignedLanguage(e.target.value)}
                >
                  <option value="ase">American Sign Language</option>
                  <option value="bfi">British Sign Language</option>
                  <option value="fsl">French Sign Language</option>
                  <option value="gsg">German Sign Language</option>
                </select>
              </div>
            </div>

            {mode === "sign-to-text" ? (
              <div className="space-y-4">
                <div className="min-h-[300px] p-4 bg-muted rounded-lg">
                  <p className="text-lg">{translatedText}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent">
                    <Volume2 className="h-4 w-4 mr-2" />
                    Listen
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {isTranslating ? (
                  <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Translating...</p>
                  </div>
                ) : signedLanguageVideo ? (
                  <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                    <video
                      src={signedLanguageVideo}
                      autoPlay
                      loop
                      muted
                      playsInline
                      onError={handleVideoError}
                      onLoadedData={() => {
                        console.log("Video loaded successfully");
                        setVideoError(null);
                      }}
                      className="w-full h-full"
                    />
                    {videoError && (
                      <div className="absolute bottom-0 left-0 right-0 bg-destructive/90 text-destructive-foreground p-2 text-sm">
                        {videoError}
                      </div>
                    )}
                  </div>
                ) : poseUrl && (SkeletonPoseViewer || AvatarPoseViewer) ? (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                    {poseViewerMode === "skeleton" && SkeletonPoseViewer ? (
                      <SkeletonPoseViewer
                        src={poseUrl}
                        onVideoReady={(url: string) =>
                          setSignedLanguageVideo(url)
                        }
                      />
                    ) : poseViewerMode === "avatar" && AvatarPoseViewer ? (
                      <AvatarPoseViewer
                        src={poseUrl}
                        onVideoReady={(url: string) =>
                          setSignedLanguageVideo(url)
                        }
                      />
                    ) : signWriting.length > 0 && SignWritingCanvas ? (
                      <SignWritingCanvas
                        signs={signWriting}
                        width={600}
                        height={400}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                ) : signWriting.length > 0 && SignWritingCanvas ? (
                  <SignWritingCanvas
                    signs={signWriting}
                    width={600}
                    height={400}
                  />
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground text-center px-4">
                      Enter text and click "Translate to Sign Language" to see
                      the sign language symbols here
                    </p>
                  </div>
                )}
                {(poseUrl || signedLanguageVideo) && ViewerSelector && (
                  <ViewerSelector />
                )}
                {signedLanguageVideo && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = signedLanguageVideo;
                        a.download = "sign-language-video.webm";
                        a.click();
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Video
                    </Button>
                    {navigator.share && (
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={async () => {
                          try {
                            const response = await fetch(signedLanguageVideo);
                            const blob = await response.blob();
                            const file = new File(
                              [blob],
                              "sign-language-video.webm",
                              {
                                type: blob.type,
                              }
                            );
                            await navigator.share({
                              files: [file],
                              title: "Sign Language Translation",
                            });
                          } catch (e) {
                            console.error("Share failed:", e);
                          }
                        }}
                      >
                        Share
                      </Button>
                    )}
                  </div>
                )}
                {signWriting.length > 0 && !signedLanguageVideo && (
                  <Button variant="outline" className="w-full bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Download Animation
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const TranslatorPageContentDynamic = dynamic(
  () => Promise.resolve(TranslatorPageContent),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    ),
  }
);

export default function TranslatorPage() {
  return (
    <TranslatorErrorBoundary>
      <TranslatorPageContentDynamic />
    </TranslatorErrorBoundary>
  );
}
