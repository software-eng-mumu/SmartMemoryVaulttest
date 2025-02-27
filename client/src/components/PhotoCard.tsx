import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Share2, MoreVertical, Trash, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Photo } from "@shared/schema";
import PhotoEditor from "./PhotoEditor";

interface PhotoCardProps {
  photo: Photo;
  selected?: boolean;
  onSelect?: () => void;
}

export default function PhotoCard({ photo, selected, onSelect }: PhotoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const deletePhoto = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/photos/${photo.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      toast({
        title: "Photo deleted",
        description: "The photo has been successfully deleted.",
      });
    },
  });

  const sharePhoto = () => {
    navigator.clipboard.writeText(photo.url);
    toast({
      title: "Link copied",
      description: "Photo link has been copied to clipboard.",
    });
  };

  return (
    <>
      <Card
        className={`overflow-hidden ${selected ? 'ring-2 ring-primary' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onSelect}
      >
        <CardHeader className="p-0 relative aspect-square">
          <img
            src={photo.url}
            alt={photo.title}
            className="w-full h-full object-cover transition-transform duration-300"
            style={{
              transform: isHovered ? "scale(1.05)" : "scale(1)",
            }}
          />
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="font-medium truncate">{photo.title}</h3>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <div className="flex gap-2 flex-wrap">
            {photo.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={sharePhoto}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => deletePhoto.mutate()}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardFooter>
      </Card>

      <PhotoEditor
        photo={photo}
        open={isEditing}
        onOpenChange={setIsEditing}
      />
    </>
  );
}