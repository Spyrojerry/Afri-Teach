import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, X } from "lucide-react";
import { openUploadWidget } from "@/services/cloudinaryService";
import { useToast } from "@/components/ui/use-toast";

interface ImageUploaderProps {
  currentImageUrl?: string;
  userId: string;
  onImageUpload: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
  name: string;
  disabled?: boolean;
}

export const ImageUploader = ({
  currentImageUrl,
  userId,
  onImageUpload,
  size = 'md',
  name,
  disabled = false
}: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(currentImageUrl);
  const { toast } = useToast();

  // Update image URL when currentImageUrl prop changes
  useEffect(() => {
    setImageUrl(currentImageUrl);
  }, [currentImageUrl]);

  // Get initials from name for the avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Get size class based on the prop
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'h-16 w-16';
      case 'lg': return 'h-32 w-32';
      case 'md':
      default: return 'h-24 w-24';
    }
  };

  // Handle upload button click
  const handleUploadClick = () => {
    if (disabled || isUploading) return;
    
    setIsUploading(true);
    
    openUploadWidget(
      userId,
      (url) => {
        // Success callback
        setImageUrl(url);
        onImageUpload(url);
        setIsUploading(false);
        toast({
          title: "Image uploaded",
          description: "Your profile image has been updated.",
        });
      },
      (error) => {
        // Error callback
        setIsUploading(false);
        if (error !== 'Upload cancelled') {
          toast({
            title: "Upload failed",
            description: error,
            variant: "destructive",
          });
        }
      }
    );
  };

  // Clear selected image
  const clearImage = () => {
    setImageUrl(undefined);
    onImageUpload('');
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative">
        <Avatar className={`${getSizeClass()} border-2 border-gray-200`}>
          <AvatarImage 
            src={imageUrl} 
            alt={name} 
          />
          <AvatarFallback className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        
        {!disabled && (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute bottom-0 right-0 rounded-full h-8 w-8 shadow-md"
            onClick={handleUploadClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {!disabled && (
        <>          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={handleUploadClick}
              disabled={isUploading}
            >
              <Upload className="h-3 w-3 mr-1" />
              Change Photo
            </Button>
            
            {imageUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={clearImage}
                disabled={isUploading}
              >
                <X className="h-3 w-3 mr-1" />
                Remove
              </Button>
            )}
          </div>
          
          <p className="text-xs text-gray-500">
            Max size: 2MB. Formats: JPG, PNG, GIF
          </p>
        </>
      )}
    </div>
  );
}; 