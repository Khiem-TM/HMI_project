declare namespace JSX {
  interface IntrinsicElements {
    'pose-viewer': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string;
        autoplay?: string;
        'aspect-ratio'?: string;
        background?: string;
        loop?: string;
        width?: string;
        height?: string;
      },
      HTMLElement
    > & {
      duration?: number;
      currentTime?: number;
      play?: () => Promise<void>;
      pause?: () => Promise<void>;
      shadowRoot?: ShadowRoot;
      getPose?: () => Promise<any>;
      addEventListener?: (
        type: string,
        listener: EventListener | EventListenerObject | null,
        options?: boolean | AddEventListenerOptions
      ) => void;
      removeEventListener?: (
        type: string,
        listener: EventListener | EventListenerObject | null,
        options?: boolean | EventListenerOptions
      ) => void;
    };
    'model-viewer': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string;
        'camera-controls'?: boolean;
        'camera-orbit'?: string;
        'camera-target'?: string;
        'field-of-view'?: string;
        'interaction-prompt'?: string;
        loading?: string;
        preload?: boolean;
        ar?: boolean;
        'ar-scale'?: string;
        'xr-environment'?: boolean;
        'ar-modes'?: string;
        autoplay?: boolean;
        paused?: boolean;
        play?: () => Promise<void>;
      },
      HTMLElement
    >;
  }
}


