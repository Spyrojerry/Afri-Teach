/**
 * Migration script to help move files from Supabase Storage to Cloudinary
 * 
 * Usage:
 * 1. Make sure .env file is set up with both Supabase and Cloudinary credentials
 * 2. Run: node scripts/migrate-to-cloudinary.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configure Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.VITE_CLOUDINARY_API_KEY,
  api_secret: process.env.VITE_CLOUDINARY_API_SECRET,
  secure: true
});

// Temp directory for downloads
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

async function downloadFile(url, filePath) {
  const response = await fetch(url);
  const buffer = await response.buffer();
  fs.writeFileSync(filePath, buffer);
  console.log(`Downloaded: ${filePath}`);
  return filePath;
}

async function uploadToCloudinary(filePath, userId, folder = 'avatars') {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      public_id: `${userId}_${path.basename(filePath)}`,
      overwrite: true
    });
    console.log(`Uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return null;
  }
}

async function updateUserProfile(userId, newImageUrl) {
  try {
    // Update auth metadata
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { avatar_url: newImageUrl }
    });
    
    if (authError) {
      console.error(`Error updating auth metadata for user ${userId}:`, authError);
    }
    
    // Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: newImageUrl })
      .eq('user_id', userId);
      
    if (profileError) {
      console.error(`Error updating profile for user ${userId}:`, profileError);
    }
    
    // Check if teacher profile exists
    const { data: teacherProfile } = await supabase
      .from('teacher_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    if (teacherProfile) {
      const { error: teacherError } = await supabase
        .from('teacher_profiles')
        .update({ avatar_url: newImageUrl })
        .eq('user_id', userId);
        
      if (teacherError) {
        console.error(`Error updating teacher profile for user ${userId}:`, teacherError);
      }
    }
    
    // Check if student profile exists
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    if (studentProfile) {
      const { error: studentError } = await supabase
        .from('student_profiles')
        .update({ avatar_url: newImageUrl })
        .eq('user_id', userId);
        
      if (studentError) {
        console.error(`Error updating student profile for user ${userId}:`, studentError);
      }
    }
    
    console.log(`Updated profile for user ${userId} with new image URL`);
    return true;
  } catch (error) {
    console.error(`Error updating profile for user ${userId}:`, error);
    return false;
  }
}

async function migrateImages() {
  try {
    console.log('Starting migration from Supabase Storage to Cloudinary...');
    
    // List all files in the avatars bucket
    const { data: files, error } = await supabase.storage.from('avatars').list();
    
    if (error) {
      throw error;
    }
    
    console.log(`Found ${files.length} files in the avatars bucket`);
    
    // Process each file
    for (const file of files) {
      // Get the user ID from the file path
      const userId = file.name.split('/')[0];
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(file.name);
      
      // Download the file
      const tempFilePath = path.join(TEMP_DIR, path.basename(file.name));
      await downloadFile(urlData.publicUrl, tempFilePath);
      
      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(tempFilePath, userId);
      
      if (cloudinaryUrl) {
        // Update user profiles with the new URL
        await updateUserProfile(userId, cloudinaryUrl);
      }
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath);
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Clean up temp directory
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmdirSync(TEMP_DIR, { recursive: true });
    }
  }
}

// Run the migration
migrateImages(); 