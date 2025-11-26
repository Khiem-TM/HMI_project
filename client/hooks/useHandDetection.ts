"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

interface HandLandmarks {
  landmarks: HandLandmark[];
  handedness: "Left" | "Right";
  score: number;
}

interface UseHandDetectionOptions {
  onHandsDetected?: (hands: HandLandmarks[]) => void;
  onNoHands?: () => void;
  confidenceThreshold?: number;
  detectionInterval?: number; // milliseconds
}

export function useHandDetection(
  videoRef: React.RefObject<HTMLVideoElement |
   null>,
  enabled: boolean = false,
  options: UseHandDetectionOptions = {}
) {
  const {
    onHandsDetected,
    onNoHands,
    confidenceThreshold = 0.5,
    detectionInterval = 100,
  } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handCount, setHandCount] = useState(0);

  const handLandmarkerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);

  // Initialize MediaPipe Hands
  const initializeHands = useCallback(async () => {
    if (isInitialized || handLandmarkerRef.current) return;

    try {
      // Dynamic import MediaPipe
      const { HandLandmarker, FilesetResolver } = await import(
        "@mediapipe/tasks-vision"
      );

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: confidenceThreshold,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      handLandmarkerRef.current = handLandmarker;
      setIsInitialized(true);
      setError(null);
    } catch (err: any) {
      console.error("Failed to initialize MediaPipe Hands:", err);
      setError(
        err.message || "Failed to initialize hand detection. Please refresh."
      );
    }
  }, [isInitialized, confidenceThreshold]);

  // Detect hands from video frame
  const detectHands = useCallback(
    async (video: HTMLVideoElement) => {
      if (!handLandmarkerRef.current || !video || video.readyState !== 4) {
        return;
      }

      const now = Date.now();
      if (now - lastDetectionTimeRef.current < detectionInterval) {
        return;
      }
      lastDetectionTimeRef.current = now;

      try {
        const results = handLandmarkerRef.current.detectForVideo(
          video,
          performance.now()
        );

        if (results.landmarks && results.landmarks.length > 0) {
          const hands: HandLandmarks[] = results.landmarks.map(
            (landmarks: any[], index: number) => ({
              landmarks: landmarks.map((lm) => ({
                x: lm.x,
                y: lm.y,
                z: lm.z,
              })),
              handedness:
                results.handednesses?.[index]?.[0]?.categoryName || "Right",
              score:
                results.handednesses?.[index]?.[0]?.score || confidenceThreshold,
            })
          );

          setHandCount(hands.length);
          onHandsDetected?.(hands);

          // Draw landmarks on canvas
          if (canvasRef.current) {
            drawLandmarks(canvasRef.current, video, hands);
          }
        } else {
          setHandCount(0);
          onNoHands?.();
          if (canvasRef.current) {
            clearCanvas(canvasRef.current);
          }
        }
      } catch (err: any) {
        console.error("Hand detection error:", err);
      }
    },
    [onHandsDetected, onNoHands, confidenceThreshold, detectionInterval]
  );

  // Draw hand landmarks on canvas
  const drawLandmarks = (
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    hands: HandLandmarks[]
  ) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Hand connections (MediaPipe standard)
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [5, 9], [9, 13], [13, 17], [17, 5], // Palm
    ];

    // Draw each hand with enhanced colors and animations
    hands.forEach((hand, handIndex) => {
      // Enhanced colors with better visibility
      const color =
        hand.handedness === "Left"
          ? "#00ff88"
          : "#ff44ff"; // Brighter green and purple
      const shadowColor = hand.handedness === "Left" ? "#00cc66" : "#cc00cc";

      // Draw connections first with enhanced styling
      ctx.strokeStyle = shadowColor;
      ctx.lineWidth = 4;
      ctx.shadowBlur = 5;
      ctx.shadowColor = color;
      connections.forEach(([start, end]) => {
        if (start < hand.landmarks.length && end < hand.landmarks.length) {
          const startX = hand.landmarks[start].x * canvas.width;
          const startY = hand.landmarks[start].y * canvas.height;
          const endX = hand.landmarks[end].x * canvas.width;
          const endY = hand.landmarks[end].y * canvas.height;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      });
      ctx.shadowBlur = 0;

      // Draw main connections
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      connections.forEach(([start, end]) => {
        if (start < hand.landmarks.length && end < hand.landmarks.length) {
          const startX = hand.landmarks[start].x * canvas.width;
          const startY = hand.landmarks[start].y * canvas.height;
          const endX = hand.landmarks[end].x * canvas.width;
          const endY = hand.landmarks[end].y * canvas.height;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      });

      // Draw landmarks as dots with enhanced visualization
      hand.landmarks.forEach((landmark, index) => {
        const x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;

        // Key point sizes (wrist and fingertips are larger)
        const isKeyPoint =
          index === 0 || index === 4 || index === 8 || index === 12 || index === 16 || index === 20;
        const radius = isKeyPoint ? 6 : 4;

        // Draw shadow/glow effect
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, radius + 1, 0, 2 * Math.PI);
        ctx.fill();

        // Draw main point
        ctx.shadowBlur = 0;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();

        // Highlight wrist
        if (index === 0) {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      // Draw hand label
      if (hand.landmarks.length > 0) {
        const wristX = hand.landmarks[0].x * canvas.width;
        const wristY = hand.landmarks[0].y * canvas.height;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.font = "bold 14px Arial";
        ctx.strokeText(
          `${hand.handedness} (${(hand.score * 100).toFixed(0)}%)`,
          wristX - 40,
          wristY - 10
        );
        ctx.fillText(
          `${hand.handedness} (${(hand.score * 100).toFixed(0)}%)`,
          wristX - 40,
          wristY - 10
        );
      }
    });
  };

  // Clear canvas
  const clearCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Detection loop
  const detectionLoop = useCallback(() => {
    if (!enabled || !isDetecting || !videoRef.current) {
      animationFrameRef.current = null;
      return;
    }

    const video = videoRef.current;
    if (video.readyState === 4 && video.videoWidth > 0 && video.videoHeight > 0) {
      detectHands(video);
    }

    animationFrameRef.current = requestAnimationFrame(detectionLoop);
  }, [enabled, isDetecting, videoRef, detectHands]);

  // Initialize when enabled
  useEffect(() => {
    if (enabled && !isInitialized) {
      initializeHands();
    }
  }, [enabled, isInitialized, initializeHands]);

  // Start/stop detection
  useEffect(() => {
    if (enabled && isInitialized && videoRef.current) {
      setIsDetecting(true);
      detectionLoop();
    } else {
      setIsDetecting(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (canvasRef.current) {
        clearCanvas(canvasRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [enabled, isInitialized, videoRef, detectionLoop]);

  return {
    isInitialized,
    isDetecting,
    error,
    handCount,
    canvasRef,
  };
}

