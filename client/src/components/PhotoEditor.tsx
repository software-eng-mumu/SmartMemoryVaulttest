import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { Photo } from "@shared/schema";

interface PhotoEditorProps {
  photo: Photo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PhotoEditor({ photo, open, onOpenChange }: PhotoEditorProps) {
  const [brightness, setBrightness] = useState(100); // 100% is normal
  const [contrast, setContrast] = useState(100);    // 100% is normal
  const [saturation, setSaturation] = useState(100); // 100% is normal

  const imageStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
    transition: "filter 0.2s ease-in-out",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Photo - {photo.title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6">
          {/* Image Preview */}
          <div className="aspect-video relative overflow-hidden rounded-lg">
            <img
              src={photo.url}
              alt={photo.title}
              className="w-full h-full object-contain"
              style={imageStyle}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Brightness ({brightness}%)</Label>
              <Slider
                value={[brightness]}
                min={0}
                max={200}
                step={1}
                onValueChange={(value) => setBrightness(value[0])}
              />
            </div>

            <div className="space-y-2">
              <Label>Contrast ({contrast}%)</Label>
              <Slider
                value={[contrast]}
                min={0}
                max={200}
                step={1}
                onValueChange={(value) => setContrast(value[0])}
              />
            </div>

            <div className="space-y-2">
              <Label>Saturation ({saturation}%)</Label>
              <Slider
                value={[saturation]}
                min={0}
                max={200}
                step={1}
                onValueChange={(value) => setSaturation(value[0])}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setBrightness(100);
              setContrast(100);
              setSaturation(100);
            }}>
              Reset
            </Button>
            <Button variant="default" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
