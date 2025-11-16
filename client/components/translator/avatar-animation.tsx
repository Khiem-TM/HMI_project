"use client";

import { useEffect, useRef, useState } from 'react';
import { useAnimationStore } from '@/lib/stores/animation-store';
// Use threeService to ensure single instance (though warning may still appear from pose-viewer)
import { threeService } from '@/lib/services/three.service';

interface AvatarAnimationProps {
  fps: number;
}

export function AvatarAnimation({ fps }: AvatarAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelViewerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const tracks = useAnimationStore((state) => state.tracks);
  const animationIndexRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadModelViewer = async () => {
      // Load model-viewer custom element
      if (!customElements.get('model-viewer')) {
        await import('@google/model-viewer/lib/model-viewer');
        await customElements.whenDefined('model-viewer');
      }

      const ModelViewerElement = customElements.get('model-viewer');
      if (ModelViewerElement) {
        // Always render the highest quality
        (ModelViewerElement as any).minimumRenderScale = 1;
      }
    };

    loadModelViewer();
  }, []);

  useEffect(() => {
    if (!modelViewerRef.current || !isLoaded || Object.keys(tracks).length === 0) {
      return;
    }

    const setupAnimation = async () => {
      await threeService.load();
      const THREE = threeService.module;

      const el = modelViewerRef.current;
      const scene = getScene(el);

      if (!scene) return;

      const name = 'u' + animationIndexRef.current++;
      const animationTracks: typeof THREE.QuaternionKeyframeTrack[] = [];

      Object.entries(tracks).forEach(([boneName, quaternions]) => {
        const times = quaternions.map((_, j) => j / fps);
        const flatQs = quaternions.flat();
        animationTracks.push(
          new THREE.QuaternionKeyframeTrack(boneName, times, flatQs)
        );
      });

      const newAnimation = new THREE.AnimationClip(name, 0, animationTracks);
      scene.animationsByName.set(name, newAnimation);
      scene.playAnimation(name);

      if (el.paused) {
        el.play();
      }
    };

    setupAnimation();
  }, [tracks, fps, isLoaded]);

  const getScene = (el: any) => {
    if (!el) return null;
    const symbol = Object.getOwnPropertySymbols(el).find(
      (symbol) => String(symbol) === 'Symbol(scene)'
    );
    return el[symbol];
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      <model-viewer
        ref={modelViewerRef}
        src="https://firebasestorage.googleapis.com/v0/b/sign-mt-assets/o/3d%2Fcharacter.glb?alt=media"
        autoplay
        camera-controls
        camera-orbit="0deg 90deg auto"
        camera-target="0m 2.8m 0m"
        field-of-view="90deg"
        interaction-prompt="none"
        loading="eager"
        style={{ width: '100%', height: '100%' }}
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          console.error('Failed to load 3D avatar model:', e);
        }}
      />
    </div>
  );
}

