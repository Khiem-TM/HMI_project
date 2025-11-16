"use client";

import { useEffect, useRef } from 'react';
import { SignWritingObj } from '@/app/translator/page';
import { signWritingService, SignWritingService } from '@/lib/services/signwriting.service';

interface SignWritingCanvasProps {
  signs: SignWritingObj[];
  width?: number;
  height?: number;
}

export function SignWritingCanvas({
  signs,
  width = 600,
  height = 400,
}: SignWritingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    // Load SignWriting fonts and components
    const loadSignWriting = async () => {
      if (isLoadedRef.current) return;

      try {
        // Load fonts first
        await signWritingService.loadFonts();
        
        // Wait for CSS to be loaded
        await signWritingService.cssLoaded();

        // Load custom elements for SignWriting display
        const { defineCustomElements } = await import(
          '@sutton-signwriting/sgnw-components/loader'
        );
        await defineCustomElements();
        
        isLoadedRef.current = true;
      } catch (error) {
        console.error('Failed to load SignWriting:', error);
        // Don't throw - component will still render, just without fonts
        // User will see fallback text
      }
    };

    loadSignWriting();
  }, []);

  if (signs.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-muted rounded-lg"
        style={{ width, height }}
      >
        <p className="text-muted-foreground">No signs to display</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-white dark:bg-gray-900 rounded-lg p-4 overflow-auto flex flex-wrap gap-2 items-center justify-center"
      style={{ width, minHeight: height }}
    >
      {signs.map((sign, index) => (
        <fsw-sign
          key={index}
          sign={sign.fsw}
          style={{
            fontSize: '4rem',
            fontFamily: 'SuttonSignWritingOneD, sans-serif',
          }}
        />
      ))}
    </div>
  );
}

