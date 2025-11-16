"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { PlayableVideoEncoder } from '@/lib/services/video-encoder.service';
import { poseViewerService } from '@/lib/services/pose-viewer.service';
import { useTranslatorStore } from '@/lib/stores/translator-store';

interface BasePoseViewerProps {
  src: string;
  background?: string;
  autoplay?: boolean;
  onVideoReady?: (url: string) => void;
}

export function useBasePoseViewer({
  src,
  background,
  autoplay = true,
  onVideoReady,
}: BasePoseViewerProps) {
  const poseViewerRef = useRef<HTMLElement & { 
    duration?: number;
    currentTime?: number;
    play?: () => Promise<void>;
    pause?: () => Promise<void>;
    shadowRoot?: ShadowRoot;
    getPose?: () => Promise<any>;
  } | null>(null);
  const [videoEncoder, setVideoEncoder] = useState<PlayableVideoEncoder | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [lastRendered, setLastRendered] = useState<number>(NaN);
  const mediaSubscriptionsRef = useRef<(() => void)[]>([]);
  const recordedChunksRef = useRef<Blob[]>([]);
  const videoEncoderRef = useRef<PlayableVideoEncoder | null>(null);
  const frameIndexRef = useRef<number>(0); // Use ref to track frame index for consistent timestamps
  const isFinalizingRef = useRef<boolean>(false);
  const finalizationPromiseRef = useRef<Promise<Blob> | null>(null);
  const setSignedLanguageVideo = useTranslatorStore((state) => state.setSignedLanguageVideo);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPoseViewer = async () => {
      await poseViewerService.definePoseViewerElement();
    };

    initPoseViewer();
  }, []);

  const fps = useCallback(async (): Promise<number> => {
    if (!poseViewerRef.current) return 30;
    try {
      const pose = await poseViewerService.getPoseData(poseViewerRef.current);
      return pose.body?.fps || 30;
    } catch {
      return 30;
    }
  }, []);

  const initVideoEncoder = useCallback(async (image: ImageBitmap) => {
    const fpsValue = await fps();
    const encoder = new PlayableVideoEncoder(image, fpsValue);
    await encoder.init();
    videoEncoderRef.current = encoder;
    setVideoEncoder(encoder);
  }, [fps]);

  const createEncodedVideo = useCallback(async () => {
    const encoder = videoEncoderRef.current;
    if (!encoder) return;
    
    // Prevent multiple finalizations
    if (isFinalizingRef.current) {
      // Wait for existing finalization to complete
      try {
        await finalizationPromiseRef.current;
      } catch {
        // Ignore errors from previous finalization
      }
      return;
    }
    
    isFinalizingRef.current = true;
    const finalizationPromise = encoder.finalize();
    finalizationPromiseRef.current = finalizationPromise;
    
    try {
      const blob = await finalizationPromise;
      const url = URL.createObjectURL(blob);
      setSignedLanguageVideo(url);
      onVideoReady?.(url);
    } catch (error) {
      // Only log if it's not an abort error (expected during cleanup)
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to create encoded video:', error);
      }
    } finally {
      isFinalizingRef.current = false;
      finalizationPromiseRef.current = null;
    }
  }, [setSignedLanguageVideo, onVideoReady]);

  const initMediaRecorder = useCallback((stream: MediaStream) => {
    recordedChunksRef.current = [];
    const mimeTypes = [
      'video/webm; codecs=vp9',
      'video/webm; codecs=vp8',
      'video/webm',
      'video/mp4',
      'video/ogv',
    ];

    let supportedMimeType: string | undefined;
    let recorder: MediaRecorder | undefined;

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        const videoBitsPerSecond = 1_000_000_000; // 1Gbps to act as infinity
        recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond });
        supportedMimeType = mimeType;
        break;
      }
    }

    if (!recorder || !supportedMimeType) {
      return;
    }

    setMediaRecorder(recorder);

    const handleDataAvailable = (event: BlobEvent) => {
      recordedChunksRef.current.push(event.data);
    };

    const handleStop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(recordedChunksRef.current, { type: recorder!.mimeType });
      const url = URL.createObjectURL(blob);
      setSignedLanguageVideo(url);
      onVideoReady?.(url);
    };

    recorder.addEventListener('dataavailable', handleDataAvailable);
    recorder.addEventListener('stop', handleStop);

    mediaSubscriptionsRef.current.push(() => {
      recorder?.removeEventListener('dataavailable', handleDataAvailable);
      recorder?.removeEventListener('stop', handleStop);
    });

    if (poseViewerRef.current?.duration) {
      const duration = poseViewerRef.current.duration * 1000;
      recorder.start(duration);
    }
  }, [setSignedLanguageVideo, onVideoReady]);

  const startRecording = useCallback(async (canvas: HTMLCanvasElement) => {
    // Must get canvas context for FireFox
    canvas.getContext('2d');
    const fpsValue = await fps();
    const stream = canvas.captureStream(fpsValue);
    initMediaRecorder(stream);
  }, [fps, initMediaRecorder]);

  const stopRecording = useCallback(() => {
    if (videoEncoderRef.current) {
      void createEncodedVideo();
      return;
    }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }, [mediaRecorder, createEncodedVideo]);

  const addCacheFrame = useCallback(async (image: ImageBitmap) => {
    if (PlayableVideoEncoder.isSupported()) {
      let encoder = videoEncoderRef.current;
      if (!encoder) {
        await initVideoEncoder(image);
        encoder = videoEncoderRef.current;
      }
      if (encoder) {
        // Use ref to ensure consistent, monotonically increasing frame indices
        const currentIndex = frameIndexRef.current;
        encoder.addFrame(currentIndex, image);
        frameIndexRef.current = currentIndex + 1;
        setFrameIndex(frameIndexRef.current);
      }
    }
  }, [initVideoEncoder]);

  const handleFirstRender = useCallback(async () => {
    if (!poseViewerRef.current) return;

    const pose = poseViewerRef.current;
    const poseCanvas = pose.shadowRoot?.querySelector('canvas') as HTMLCanvasElement | null;

    if (!poseCanvas) return;

    pose.currentTime = 0; // Force time back to 0
    
    // Reset frame index when starting new recording
    frameIndexRef.current = 0;
    setFrameIndex(0);

    // startRecording is imperfect, specifically when the tab is out of focus.
    if (!PlayableVideoEncoder.isSupported()) {
      await startRecording(poseCanvas);
    }
  }, [startRecording]);

  const handleRender = useCallback(async () => {
    if (!poseViewerRef.current) return;

    const pose = poseViewerRef.current;
    if (pose.currentTime === lastRendered) {
      // There are possibly redundant renders when video is paused or tab is out of focus
      return;
    }

    const poseCanvas = pose.shadowRoot?.querySelector('canvas') as HTMLCanvasElement | null;
    if (!poseCanvas) return;

    // Check if canvas has valid dimensions before capturing
    if (poseCanvas.width === 0 || poseCanvas.height === 0) {
      return;
    }

    try {
      const imageBitmap = await createImageBitmap(poseCanvas);
      try {
        await addCacheFrame(imageBitmap);
        setLastRendered(pose.currentTime || 0);
      } finally {
        // Always close ImageBitmap to prevent memory leaks
        imageBitmap.close();
      }
    } catch (error) {
      // Silently ignore errors for frames that aren't ready yet
      if (error instanceof Error && error.name !== 'InvalidStateError') {
        console.error('Failed to capture frame:', error);
      }
    }
  }, [lastRendered, addCacheFrame]);

  const handleEnded = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  useEffect(() => {
    return () => {
      // Cleanup
      mediaSubscriptionsRef.current.forEach((unsub) => unsub());
      
      // Wait for finalization to complete before closing encoder
      const encoder = videoEncoderRef.current;
      if (encoder) {
        if (isFinalizingRef.current && finalizationPromiseRef.current) {
          // Wait for finalization with timeout (max 5 seconds)
          Promise.race([
            finalizationPromiseRef.current,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Finalization timeout')), 5000))
          ])
            .then(() => {
              // Finalization completed, safe to close
              try {
                encoder.close();
              } catch (error) {
                // Ignore cleanup errors
              }
            })
            .catch(() => {
              // Finalization failed or timed out, close anyway
              try {
                encoder.close();
              } catch (error) {
                // Ignore cleanup errors
              }
            });
        } else {
          // No finalization in progress, close immediately
          try {
            encoder.close();
          } catch (error) {
            // Ignore cleanup errors
          }
        }
        videoEncoderRef.current = null;
      }
      
      // Cleanup media recorder
      if (mediaRecorder) {
        try {
          if (mediaRecorder.state !== 'inactive' && mediaRecorder.state !== 'closed') {
            mediaRecorder.stop();
          }
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [mediaRecorder]);

  return {
    poseViewerRef,
    handleFirstRender,
    handleRender,
    handleEnded,
  };
}
