import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
      console.log('Generating video for photos:', selectedPhotos.map(p => p.id));

      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photos: selectedPhotos.map(p => p.id)
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to generate video');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    } catch (error) {
      console.error('Video generation error:', error);
      toast({
        title: "错误",
        description: "生成视频失败，请重试。",
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
    <Dialog open>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>生成视频</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            将生成包含 {selectedPhotos.length} 张照片的视频幻灯片
          </p>
          {!videoUrl ? (
            <Button 
              onClick={generateVideo} 
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  正在生成...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  生成视频
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
                  关闭
                </Button>
                <Button
                  onClick={downloadVideo}
                >
                  下载
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}