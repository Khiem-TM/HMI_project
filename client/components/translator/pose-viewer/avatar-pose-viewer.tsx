"use client";

import { useEffect, useRef, useState } from "react";
import { poseViewerService } from "@/lib/services/pose-viewer.service";
import { useAnimationStore } from "@/lib/stores/animation-store";
import { AvatarAnimation } from "../avatar-animation";

interface AvatarPoseViewerProps {
  src: string;
  onVideoReady?: (url: string) => void;
}

export function AvatarPoseViewer({ src, onVideoReady }: AvatarPoseViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const poseViewerRef = useRef<
    | (HTMLElement & {
        getPose?: () => Promise<any>;
        shadowRoot?: ShadowRoot;
      })
    | null
  >(null);
  const [effectiveFps, setEffectiveFps] = useState(30);
  const setTracks = useAnimationStore((state) => state.setTracks);
  const setFps = useAnimationStore((state) => state.setFps);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const setupPoseViewer = async () => {
      await poseViewerService.definePoseViewerElement();

      if (!poseViewerRef.current) return;

      const poseEl = poseViewerRef.current;

      const handleFirstRender = async () => {
        try {
          const pose = await poseViewerService.getPoseData(poseEl);
          const fps = pose.body?.fps || 30;
          setEffectiveFps(fps);
          setFps(fps);

          // Convert pose data to animation tracks
          // This is a simplified version - full implementation would convert
          // pose landmarks to quaternion tracks for each bone
          if (pose.body?.landmarks) {
            // TODO: Convert pose landmarks to quaternion tracks
            // For now, we'll use a placeholder
            const tracks: Record<string, number[][]> = {};
            setTracks(tracks);
          }
        } catch (error) {
          console.error("Failed to get pose data:", error);
        }
      };

      poseEl.addEventListener("firstRender$" as any, handleFirstRender);

      return () => {
        poseEl.removeEventListener("firstRender$" as any, handleFirstRender);
      };
    };

    setupPoseViewer();
  }, [setTracks, setFps]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <pose-viewer
        ref={poseViewerRef as any}
        src={src}
        autoplay="false"
        loop="false"
        width="10px"
        height="10px"
        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
      />
      <AvatarAnimation fps={effectiveFps} />
    </div>
  );
}
