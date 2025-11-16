import type { Output, EncodedVideoPacketSource } from 'mediabunny';
import { EncodedPacket } from 'mediabunny';

export function getMediaSourceClass(): typeof MediaSource | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if ('ManagedMediaSource' in window) {
    return (window as any).ManagedMediaSource as typeof MediaSource;
  }
  if ('MediaSource' in window) {
    return MediaSource;
  }
  if ('WebKitMediaSource' in window) {
    return (window as any).WebKitMediaSource as typeof MediaSource;
  }

  console.warn('Neither ManagedMediaSource nor MediaSource are supported on this device');
  return null;
}

export class PlayableVideoEncoder {
  output: Output | null = null;
  packetSource: EncodedVideoPacketSource | null = null;
  videoEncoder: VideoEncoder | null = null;
  frameBuffer: VideoFrame[] = []; // Buffer frames until the encoder is ready

  container: 'webm' | 'mp4' = 'webm';
  codec: string = 'vp09.00.10.08';
  bitrate = 10_000_000; // 10Mbps max! (https://github.com/Vanilagy/mp4-muxer/issues/36)
  alpha = true;

  width: number;
  height: number;

  constructor(
    private image: ImageBitmap,
    private fps: number
  ) {
    this.width = image.width;
    this.height = image.height;
  }

  static isSupported(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return 'VideoEncoder' in globalThis;
  }

  async init(): Promise<void> {
    await this.createWebMMuxer();
    let playable = await this.isPlayable();
    if (!playable) {
      // If WebM is not playable or undetermined, fall back to MP4
      await this.createMP4Muxer();
    }

    await this.createVideoEncoder();
  }

  async isPlayable(): Promise<boolean> {
    if (typeof window === 'undefined' || !('navigator' in globalThis)) {
      return false;
    }

    if (!('mediaCapabilities' in navigator)) {
      const mediaSourceClass = getMediaSourceClass();
      if (!mediaSourceClass) {
        return false;
      }

      const mimeType = `video/${this.container}; codecs="${this.codec}"`;
      return mediaSourceClass.isTypeSupported(mimeType);
    }

    const videoConfig = {
      contentType: `video/${this.container}; codecs="${this.codec}"`,
      width: this.width,
      height: this.height,
      bitrate: this.bitrate,
      framerate: this.fps,
      hasAlphaChannel: this.alpha,
    };

    const { supported } = await navigator.mediaCapabilities.decodingInfo({
      type: 'file',
      video: videoConfig,
    });
    return supported;
  }

  async createWebMMuxer(): Promise<void> {
    const { Output, WebMOutputFormat, BufferTarget, EncodedVideoPacketSource } = await import(
      'mediabunny'
    );

    // Set the metadata
    this.container = 'webm';
    this.codec = 'vp09.00.10.08';
    this.width = this.image.width;
    this.height = this.image.height;

    // Create the packet source
    this.packetSource = new EncodedVideoPacketSource('vp9');

    // Create the output
    this.output = new Output({
      format: new WebMOutputFormat(),
      target: new BufferTarget(),
    });

    this.output.addVideoTrack(this.packetSource, {
      frameRate: this.fps,
    });
  }

  async createMP4Muxer(): Promise<void> {
    const { Output, Mp4OutputFormat, BufferTarget, EncodedVideoPacketSource } = await import(
      'mediabunny'
    );

    // Set the metadata
    this.container = 'mp4';
    this.codec = 'avc1.42001f';
    // H264 only supports even sized frames
    this.width = this.image.width + (this.image.width % 2);
    this.height = this.image.height + (this.image.height % 2);

    // Create the packet source
    this.packetSource = new EncodedVideoPacketSource('avc');

    // Create the output
    this.output = new Output({
      format: new Mp4OutputFormat({
        fastStart: 'in-memory',
      }),
      target: new BufferTarget(),
    });

    this.output.addVideoTrack(this.packetSource);
  }

  async createVideoEncoder(): Promise<void> {
    if (!this.packetSource || !this.output) {
      throw new Error('Muxer not initialized');
    }

    this.videoEncoder = new VideoEncoder({
      output: (chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata) => {
        const packet = EncodedPacket.fromEncodedChunk(chunk);
        this.packetSource!.add(packet, meta);
      },
      error: (e: Error) => console.error('VideoEncoder error:', e),
    });

    const config: VideoEncoderConfig = {
      codec: this.codec,
      width: this.width,
      height: this.height,
      bitrate: this.bitrate,
      framerate: this.fps,
      // TODO: alpha is not yet supported in Chrome
      // alpha: this.alpha ? 'keep' as AlphaOption : 'discard'
    };

    this.videoEncoder.configure(config);

    // Start the output
    await this.output.start();

    // Flush the frame buffer
    for (const frame of this.frameBuffer) {
      this.encodeFrame(frame);
    }
    this.frameBuffer = [];
  }

  addFrame(index: number, image: ImageBitmap): void {
    const ms = 1_000_000; // 1µs
    const frame = new VideoFrame(image, {
      timestamp: (ms * index) / this.fps,
      duration: ms / this.fps,
    });

    if (this.videoEncoder) {
      this.encodeFrame(frame);
    } else {
      this.frameBuffer.push(frame);
    }
  }

  encodeFrame(frame: VideoFrame): void {
    if (!this.videoEncoder) {
      return;
    }
    this.videoEncoder.encode(frame);
    frame.close();
  }

  async finalize(): Promise<Blob> {
    if (!this.videoEncoder || !this.packetSource || !this.output) {
      throw new Error('Video encoder not initialized');
    }

    try {
      await this.videoEncoder.flush();
      this.packetSource.close();
      await this.output.finalize();
      
      const buffer = (this.output.target as any).buffer as ArrayBuffer;
      const blob = new Blob([buffer], { type: `video/${this.container}` });
      
      // Close encoder after successful finalization
      if (this.videoEncoder && this.videoEncoder.state !== 'closed') {
        try {
          this.videoEncoder.close();
        } catch (error) {
          // Ignore close errors - encoder may already be closing
        }
      }
      
      return blob;
    } catch (error) {
      // Ensure encoder is closed even on error
      if (this.videoEncoder && this.videoEncoder.state !== 'closed') {
        try {
          this.videoEncoder.close();
        } catch {
          // Ignore close errors during error handling
        }
      }
      throw error;
    }
  }

  close(): void {
    if (this.videoEncoder) {
      try {
        // Check if encoder is already closed
        if (this.videoEncoder.state !== 'closed') {
          this.videoEncoder.close();
        }
      } catch (error) {
        // Ignore errors if encoder is already closed
        if (error instanceof Error && !error.message.includes('closed')) {
          console.error('Error closing video encoder:', error);
        }
      }
      this.videoEncoder = null;
    }
    if (this.packetSource) {
      try {
        this.packetSource.close();
      } catch (error) {
        // Ignore errors during cleanup
      }
      this.packetSource = null;
    }
    if (this.output) {
      this.output = null;
    }
  }
}

