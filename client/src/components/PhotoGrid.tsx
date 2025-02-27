import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import PhotoCard from "./PhotoCard";
import type { Photo } from "@shared/schema";

interface PhotoGridProps {
  photos: Photo[];
  isLoading: boolean;
}

export default function PhotoGrid({ photos, isLoading }: PhotoGridProps) {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PhotoCard photo={photo} />
        </motion.div>
      ))}
    </div>
  );
}
