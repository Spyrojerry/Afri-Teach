import { v4 as uuidv4 } from 'uuid';
import { Cloudinary } from '@cloudinary/url-gen';

// Initialize Cloudinary URL generation SDK
export const cloudinary = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ''
  }
});

// Type definitions for the Cloudinary Widget
type CloudinaryWidgetCallback = (error: Error | null, result: CloudinaryResult) => void;

interface CloudinaryResult {
  event: string;
  info?: {
    secure_url: string;
    public_id: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface CloudinaryWidget {
  open: () => void;
  close: () => void;
  destroy: () => void;
}

interface CloudinaryWidgetOptions {
  cloudName: string;
  uploadPreset: string;
  folder?: string;
  tags?: string[];
  publicId?: string;
  clientAllowedFormats?: string[];
  maxImageFileSize?: number;
  cropping?: boolean;
  croppingAspectRatio?: number;
  showSkipCropButton?: boolean;
  styles?: {
    palette?: {
      [key: string]: string;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Add Cloudinary types to the global Window interface
declare global {
  interface Window {
    cloudinary: {
      createUploadWidget: (
        options: CloudinaryWidgetOptions, 
        callback: CloudinaryWidgetCallback
      ) => CloudinaryWidget;
      openUploadWidget: (
        options: CloudinaryWidgetOptions, 
        callback: CloudinaryWidgetCallback
      ) => void;
    };
  }
}

/**
 * Opens the Cloudinary Upload Widget to upload an image
 * @param userId The user's ID
 * @param onSuccess Callback when upload is successful
 * @param onFailure Callback when upload fails
 * @param folder The folder in Cloudinary to store the image
 */
export const openUploadWidget = (
  userId: string,
  onSuccess: (url: string) => void,
  onFailure: (error: string) => void,
  folder: string = 'avatars'
): void => {
  // Ensure the Cloudinary Widget script is loaded
  if (!window.cloudinary) {
    const script = document.createElement('script');
    script.src = 'https://upload-widget.cloudinary.com/global/all.js';
    script.async = true;
    document.body.appendChild(script);
    
    script.onload = () => {
      // Initialize widget after script loads
      initializeWidget(userId, onSuccess, onFailure, folder);
    };
    
    script.onerror = () => {
      onFailure('Failed to load Cloudinary upload widget');
    };
  } else {
    // Initialize widget if script is already loaded
    initializeWidget(userId, onSuccess, onFailure, folder);
  }
};

/**
 * Initialize and open the Cloudinary Upload Widget
 */
const initializeWidget = (
  userId: string,
  onSuccess: (url: string) => void,
  onFailure: (error: string) => void,
  folder: string
) => {
  const uploadOptions: CloudinaryWidgetOptions = {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string,
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string,
    folder: folder,
    tags: [userId, 'profile'],
    publicId: `${userId}_${uuidv4()}`,
    clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif'],
    maxImageFileSize: 2000000, // 2MB
    cropping: true,
    croppingAspectRatio: 1,
    showSkipCropButton: false,
    styles: {
      palette: {
        window: "#F5F5F5",
        sourceBg: "#FFFFFF",
        windowBorder: "#CCCCCC",
        tabIcon: "#6B46C1",
        inactiveTabIcon: "#CCCCCC",
        menuIcons: "#555555",
        link: "#6B46C1",
        action: "#6B46C1",
        inProgress: "#6B46C1",
        complete: "#33ff00",
        error: "#EA4335",
        textDark: "#000000",
        textLight: "#FFFFFF"
      }
    }
  };

  const widget = window.cloudinary.createUploadWidget(
    uploadOptions,
    (error, result) => {
      if (!error && result && result.event === 'success' && result.info) {
        const imageUrl = result.info.secure_url;
        onSuccess(imageUrl);
      } else if (error || (result && result.event === 'abort')) {
        onFailure(error ? error.message : 'Upload cancelled');
      }
    }
  );
  
  widget.open();
};

/**
 * Get a transformation URL for an image (resize, crop, etc.)
 * @param url Original Cloudinary URL
 * @param width Desired width
 * @param height Desired height
 * @returns Transformed URL
 */
export const getTransformedUrl = (url: string, width: number, height: number): string => {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }
  
  // Extract the version and public ID from the URL
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  
  if (uploadIndex === -1) {
    return url;
  }
  
  const transformationPath = `c_fill,w_${width},h_${height},g_face`;
  
  // Insert the transformation path
  parts.splice(uploadIndex + 1, 0, transformationPath);
  
  return parts.join('/');
}; 