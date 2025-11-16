class PoseViewerService {
  private isCustomElementDefined = false;

  async definePoseViewerElement(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.isCustomElementDefined) {
      return;
    }

    try {
      const { defineCustomElements } = await import('pose-viewer/loader');
      defineCustomElements();
      this.isCustomElementDefined = true;
    } catch (error) {
      console.error('Failed to load pose-viewer:', error);
      throw error;
    }
  }

  async getPoseDuration(poseElement: HTMLElement & { duration?: number }): Promise<number> {
    if (!poseElement || typeof poseElement.duration !== 'number') {
      return 0;
    }
    return poseElement.duration;
  }

  async getPoseData(poseElement: HTMLElement & { getPose?: () => Promise<any> }): Promise<any> {
    if (!poseElement || typeof poseElement.getPose !== 'function') {
      throw new Error('Pose element does not have getPose method');
    }
    return await poseElement.getPose();
  }
}

export const poseViewerService = new PoseViewerService();


