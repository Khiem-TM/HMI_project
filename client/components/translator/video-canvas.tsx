"use client";

import { useEffect, useRef, useState } from 'react';
import { usePoseStore } from '@/lib/stores/pose-store';
import { useSignWritingStore } from '@/lib/stores/signwriting-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useVideoStore } from '@/lib/stores/video-store';
import { poseService } from '@/lib/services/pose.service';
import { signWritingService } from '@/lib/services/signwriting.service';
import { wait } from '@/lib/utils/wait';
import Stats from 'stats.js';

interface VideoCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraActive: boolean;
  showPose?: boolean;
  showSignWriting?: boolean;
  displayFps?: boolean;
}

export function VideoCanvas({
  videoRef,
  isCameraActive,
  showPose = true,
  showSignWriting = false,
  displayFps = true,
}: VideoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  const pose = usePoseStore((state) => state.pose);
  const signWritingState = useSignWritingStore((state) => state.state);
  const settings = useSettingsStore();
  const videoSettings = useVideoStore((state) => state.videoSettings);
  const videoSrc = useVideoStore((state) => state.src);
  const camera = useVideoStore((state) => state.camera);

  const fpsStatsRef = useRef<Stats | null>(null);
  const appLoopRef = useRef<boolean>(false);
  
  // Initialize pose service and set up callbacks
  useEffect(() => {
    const setupPoseService = async () => {
      await poseService.load();
      poseService.onResults((results: any) => {
        // Create a copy of the image canvas to avoid NGXS bug
        const fakeImage = document.createElement('canvas');
        fakeImage.width = results.image.width;
        fakeImage.height = results.image.height;
        const ctx = fakeImage.getContext('2d');
        if (ctx) {
          ctx.drawImage(results.image, 0, 0, fakeImage.width, fakeImage.height);
        }

        usePoseStore.getState().setPose({
          faceLandmarks: results.faceLandmarks || [],
          poseLandmarks: results.poseLandmarks || [],
          leftHandLandmarks: results.leftHandLandmarks || [],
          rightHandLandmarks: results.rightHandLandmarks || [],
          image: fakeImage,
        });
        usePoseStore.getState().setIsLoaded(true);
      });
    };

    setupPoseService();
  }, []);

  // Setup stats
  useEffect(() => {
    if (!statsRef.current || !displayFps) return;

    const fpsStats = new Stats();
    fpsStats.showPanel(0);
    fpsStats.dom.style.position = 'absolute';
    fpsStats.dom.style.top = '0';
    fpsStats.dom.style.left = '0';
    fpsStatsRef.current = fpsStats;
    statsRef.current.appendChild(fpsStats.dom);

    return () => {
      if (fpsStatsRef.current) {
        statsRef.current?.removeChild(fpsStats.dom);
      }
    };
  }, [displayFps]);

  // Setup video element
  useEffect(() => {
    const video = videoRef?.current;
    if (!video) return;

    video.muted = true;
    
    const handleLoadedMetadata = () => {
      video.play().catch(console.error);
    };
    
    const handleEnded = () => {
      setVideoEnded(true);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    // Set video source
    if (camera) {
      video.srcObject = camera;
      video.src = '';
      // If video is already loaded, play immediately
      if (video.readyState >= 2) {
        video.play().catch(console.error);
      }
    } else if (videoSrc) {
      video.src = videoSrc;
      video.srcObject = null;
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [camera, videoSrc, videoRef]);

  // Setup canvas dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !videoSettings) return;

    canvas.width = videoSettings.width;
    canvas.height = videoSettings.height;

    // Scale canvas
    requestAnimationFrame(() => {
      scaleCanvas();
    });
  }, [videoSettings]);

  // Scale canvas function
  const scaleCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    requestAnimationFrame(() => {
      const bbox = container.getBoundingClientRect();
      const documentBbox = document.body.getBoundingClientRect();

      const width = Math.min(bbox.width, documentBbox.width);
      const scale = width / canvas.width;
      canvas.style.transform = `scale(-${scale}, ${scale}) translateX(-100%)`;
      canvas.style.transformOrigin = 'top left';

      // Set container height
      container.style.height = canvas.height * scale + 'px';
      canvas.parentElement!.style.width = width + 'px';
    });
  };

  // Resize observer for canvas scaling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      scaleCanvas();
    });
    resizeObserver.observe(container);
    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Frame processing loop
  useEffect(() => {
    const video = videoRef?.current;
    if (!video || !isCameraActive) return;

    appLoopRef.current = true;

    const appLoop = async () => {
      let lastTime: number | null = null;

      while (appLoopRef.current) {
        if (video.readyState === 0) {
          // Video is no longer available
          break;
        }

        // Make sure the frame changed
        if (video.currentTime !== lastTime) {
          lastTime = video.currentTime;

          // Get pose estimation
          try {
            await poseService.predict(video);
          } catch (e) {
            console.error('Pose prediction error:', e);
          }
        }

        await wait(0);
      }
    };

    const handleLoadedData = () => {
      setIsLoaded(true);
      appLoop();
    };

    // Check if video is already loaded (readyState >= 2 means HAVE_CURRENT_DATA or higher)
    if (video.readyState >= 2) {
      setIsLoaded(true);
      appLoop();
    } else {
      video.addEventListener('loadeddata', handleLoadedData);
    }

    return () => {
      appLoopRef.current = false;
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [isCameraActive, videoRef]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pose) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video background
    if (settings.drawVideo) {
      ctx.drawImage(pose.image, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw pose skeleton
    if (settings.drawPose && showPose) {
      ctx.save();
      poseService.draw(pose, ctx).catch((e) => {
        console.error('Error drawing pose:', e);
      });
    }

    // Draw SignWriting symbols
    if (settings.drawSignWriting && showSignWriting) {
      signWritingService.draw(signWritingState, ctx).catch(console.error);
    }

    // Update FPS stats
    if (fpsStatsRef.current) {
      fpsStatsRef.current.end();
      fpsStatsRef.current.begin();
    }
  }, [pose, signWritingState, settings, showPose, showSignWriting]);

  const replayVideo = () => {
    const video = videoRef?.current;
    if (!video) return;
    setVideoEnded(false);
    video.currentTime = 0;
    video.play();
  };

  if (!isLoaded && isCameraActive) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Loading pose estimation...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="hidden"
        muted
        playsInline
        crossOrigin="anonymous"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ transformOrigin: 'top left' }}
      />
      <div ref={statsRef} className="absolute top-0 left-0" />
      {videoEnded && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 cursor-pointer hover:bg-opacity-40 transition"
          onClick={replayVideo}
        >
          <svg
            className="w-16 h-16 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

