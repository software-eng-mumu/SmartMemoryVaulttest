import { useState } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import type { Photo } from "@shared/schema";
import PhotoCard from "./PhotoCard";
import VideoGenerator from "./VideoGenerator";

interface PhotoGridProps {
  photos: Photo[];
  isLoading: boolean;
}

export default function PhotoGrid({ photos, isLoading }: PhotoGridProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([]);
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);

  const togglePhotoSelection = (photo: Photo) => {
    if (selectedPhotos.find(p => p.id === photo.id)) {
      setSelectedPhotos(selectedPhotos.filter(p => p.id !== photo.id));
    } else {
      setSelectedPhotos([...selectedPhotos, photo]);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <>
      {selectedPhotos.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setShowVideoGenerator(true)}
            className="shadow-lg"
          >
            <Video className="mr-2 h-4 w-4" />
            Generate Video ({selectedPhotos.length})
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PhotoCard 
              photo={photo}
              selected={!!selectedPhotos.find(p => p.id === photo.id)}
              onSelect={() => togglePhotoSelection(photo)}
            />
          </motion.div>
        ))}
      </div>

      {showVideoGenerator && (
        <VideoGenerator
          selectedPhotos={selectedPhotos}
          onClose={() => {
            setShowVideoGenerator(false);
            setSelectedPhotos([]);
          }}
        />
      )}
    </>
  );
}