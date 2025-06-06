import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads an image to Supabase Storage
 * @param file The file to upload
 * @param userId The user's ID
 * @param bucket The storage bucket to use
 * @returns URL of the uploaded image or null if failed
 */
export const uploadProfileImage = async (
  file: File,
  userId: string,
  bucket: string = 'avatars'
): Promise<string | null> => {
  try {
    // Check if the file is an image
    if (!file.type.match('image.*')) {
      throw new Error('Please upload an image file');
    }

    // Maximum file size: 2MB
    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size should be less than 2MB');
    }

    // Create a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

/**
 * Delete an image from Supabase Storage
 * @param url The URL of the image to delete
 * @param bucket The storage bucket
 * @returns Success status
 */
export const deleteProfileImage = async (
  url: string,
  bucket: string = 'avatars'
): Promise<boolean> => {
  try {
    // Extract the file path from the URL
    const urlObj = new URL(url);
    const path = urlObj.pathname.split('/').slice(2).join('/');

    // Delete the file
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}; 