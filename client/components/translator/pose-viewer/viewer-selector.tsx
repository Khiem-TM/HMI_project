"use client";

import { useTranslatorStore, PoseViewerMode } from '@/lib/stores/translator-store';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export function ViewerSelector() {
  const mode = useTranslatorStore((state) => state.poseViewerMode);
  const setMode = useTranslatorStore((state) => state.setPoseViewerMode);

  return (
    <div className="flex items-center gap-4 p-2 bg-muted rounded-lg">
      <Label className="text-sm font-medium">View Mode:</Label>
      <RadioGroup
        value={mode}
        onValueChange={(value) => setMode(value as PoseViewerMode)}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="skeleton" id="skeleton" />
          <Label htmlFor="skeleton" className="cursor-pointer">Skeleton</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="avatar" id="avatar" />
          <Label htmlFor="avatar" className="cursor-pointer">Avatar</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="signwriting" id="signwriting" />
          <Label htmlFor="signwriting" className="cursor-pointer">SignWriting</Label>
        </div>
      </RadioGroup>
    </div>
  );
}

