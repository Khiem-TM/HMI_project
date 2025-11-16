"use client";

import { useEffect, useRef } from 'react';
import { useBasePoseViewer } from './base-pose-viewer';

interface SkeletonPoseViewerProps {
  src: string;
  background?: string;
  autoplay?: boolean;
  onVideoReady?: (url: string) => void;
}

export function SkeletonPoseViewer({
  src,
  background,
  autoplay = true,
  onVideoReady,
}: SkeletonPoseViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { poseViewerRef, handleFirstRender, handleRender, handleEnded } = useBasePoseViewer({
    src,
    background,
    autoplay,
    onVideoReady,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cleanup: (() => void) | undefined;

    const setupPoseViewer = async () => {
      if (!containerRef.current || !poseViewerRef.current) return;

      const pose = poseViewerRef.current;

      // Wait a bit for pose-viewer to initialize
      await new Promise(resolve => setTimeout(resolve, 100));

      // Listen to custom events from pose-viewer
      const handleFirstRenderEvent = () => {
        handleFirstRender();
      };

      const handleRenderEvent = () => {
        handleRender();
      };

      const handleEndedEvent = () => {
        handleEnded();
      };

      // Handle visibility change
      const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible') {
          await pose.play?.();
        } else {
          await pose.pause?.();
        }
      };

      pose.addEventListener('firstRender$' as any, handleFirstRenderEvent);
      pose.addEventListener('render$' as any, handleRenderEvent);
      pose.addEventListener('ended$' as any, handleEndedEvent);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      cleanup = () => {
        try {
          pose.removeEventListener('firstRender$' as any, handleFirstRenderEvent);
          pose.removeEventListener('render$' as any, handleRenderEvent);
          pose.removeEventListener('ended$' as any, handleEndedEvent);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        } catch (error) {
          // Ignore cleanup errors
        }
      };
    };

    setupPoseViewer();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [handleFirstRender, handleRender, handleEnded]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <pose-viewer
        ref={poseViewerRef as any}
        src={src}
        autoplay={autoplay ? 'true' : 'false'}
        aspect-ratio="1"
        background={background}
        width="100%"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

