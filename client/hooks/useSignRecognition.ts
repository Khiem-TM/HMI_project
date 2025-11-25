"use client";

import { useEffect, useRef, useState, useCallback } from "react";
// Đảm bảo bạn đã chạy: npm install @mediapipe/tasks-vision
import { GestureRecognizer, FilesetResolver, GestureRecognizerResult } from "@mediapipe/tasks-vision";

interface UseSignRecognitionOptions {
  enabled?: boolean;
  onResult?: (text: string, confidence: number) => void;
}

export function useSignRecognition(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options: UseSignRecognitionOptions = {}
) {
  const { enabled = false, onResult } = options;
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastVideoTime = useRef<number>(-1);

  // 1. Load Model
  useEffect(() => {
    const loadModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        recognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            // Đường dẫn này trỏ tới client/public/models/gesture_recognizer.task
            modelAssetPath: "/models/gesture_recognizer.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2, // Nhận diện 2 bàn tay
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        setIsModelLoaded(true);
        console.log("✅ AI Model Loaded Successfully!");
      } catch (error) {
        console.error("❌ Error loading AI model:", error);
      }
    };

    loadModel();
  }, []);

  // 2. Hàm dự đoán (Loop)
  const predict = useCallback(() => {
    if (!enabled || !recognizerRef.current || !videoRef.current) return;

    const video = videoRef.current;
    
    // Chỉ xử lý khi video đang chạy và có frame mới
    if (video.readyState === 4 && !video.paused && !video.ended) {
       // Kiểm tra xem frame đã thay đổi chưa để tránh tính toán trùng lặp
       if (video.currentTime !== lastVideoTime.current) {
          lastVideoTime.current = video.currentTime;
          
          try {
            const nowInMs = Date.now();
            const results = recognizerRef.current.recognizeForVideo(video, nowInMs);
            
            // Xử lý kết quả
            if (results.gestures.length > 0) {
              const firstHand = results.gestures[0][0];
              const categoryName = firstHand.categoryName;
              const score = firstHand.score;

              // Loại bỏ các kết quả rác (None)
              if (categoryName !== "None" && onResult) {
                 onResult(categoryName, score);
              }
            }
          } catch (e) {
            console.error(e);
          }
       }
    }

    requestRef.current = requestAnimationFrame(predict);
  }, [enabled, onResult]);

  // 3. Kích hoạt Loop
  useEffect(() => {
    if (enabled && isModelLoaded) {
      requestRef.current = requestAnimationFrame(predict);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [enabled, isModelLoaded, predict]);

  return { isModelLoaded };
}