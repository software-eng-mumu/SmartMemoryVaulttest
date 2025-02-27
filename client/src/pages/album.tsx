import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import PhotoGrid from "@/components/PhotoGrid";
import type { Album, Photo } from "@shared/schema";

type AlbumWithPhotos = Album & { photos: Photo[] };

export default function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  
  const { data: album, isLoading } = useQuery<AlbumWithPhotos>({
    queryKey: [`/api/albums/${id}`],
  });

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!album) {
    return <div className="container mx-auto px-4 py-8">Album not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {album.name}
        </h1>
      </div>

      {album.description && (
        <p className="text-muted-foreground mb-8">{album.description}</p>
      )}

      <PhotoGrid photos={album.photos} isLoading={isLoading} />
    </div>
  );
}
