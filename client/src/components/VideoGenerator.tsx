import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Photo } from "@shared/schema";

interface VideoGeneratorProps {
  selectedPhotos: Photo[];
  onClose: () => void;
}

export default function VideoGenerator({ selectedPhotos, onClose }: VideoGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const generateVideo = async () => {
    try {
      setGenerating(true);
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photos: selectedPhotos.map(p => p.url),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate video");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadVideo = () => {
    if (!videoUrl) return;
    
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = "photo-slideshow.mp4";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Video</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Generate a video slideshow with {selectedPhotos.length} selected photos
          </p>
          {!videoUrl ? (
            <Button 
              onClick={generateVideo} 
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  Generate Video
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <video 
                src={videoUrl} 
                controls 
                className="w-full rounded-lg"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Close
                </Button>
                <Button
                  onClick={downloadVideo}
                >
                  Download
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
