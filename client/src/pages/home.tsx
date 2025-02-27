import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import PhotoGrid from "@/components/PhotoGrid";
import UploadButton from "@/components/UploadButton";
import type { Photo } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: photos, isLoading } = useQuery<Photo[]>({
    queryKey: [searchQuery ? `/api/photos/search?q=${searchQuery}` : "/api/photos"],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Photo Album
        </h1>
        <UploadButton />
      </div>

      <div className="relative mb-8">
        <Input
          type="text"
          placeholder="Search photos by title or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      <PhotoGrid photos={photos || []} isLoading={isLoading} />
    </div>
  );
}
