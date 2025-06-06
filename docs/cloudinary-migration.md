# Migrating from Supabase Storage to Cloudinary

This document outlines the steps to migrate image storage from Supabase Storage to Cloudinary in the Afri-Teach platform.

## Why Cloudinary?

Cloudinary offers several advantages over Supabase Storage:

1. **Advanced Image Transformations**: Crop, resize, and optimize images on-the-fly
2. **Automatic Format Optimization**: Deliver images in WebP and AVIF formats for better performance
3. **Global CDN**: Fast delivery worldwide
4. **Better Media Management**: Superior dashboard for managing media assets
5. **Video Support**: For future video content needs
6. **Generous Free Tier**: 25GB storage and 25GB bandwidth monthly

## Migration Steps

### 1. Set Up Cloudinary Account

1. Sign up for a free Cloudinary account at [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. From your dashboard, note your Cloud Name
3. Create an upload preset:
   - Go to Settings > Upload
   - Scroll down to "Upload presets" and click "Add upload preset"
   - Set "Upload preset name" (e.g., "profile_images")
   - Set Mode to "Unsigned"
   - Configure any desired transformations
   - Click "Save"

### 2. Configure Environment Variables

Add the following variables to your `.env` file:

```
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

### 3. Install Required Dependencies

```bash
npm install @cloudinary/url-gen @cloudinary/react
```

### 4. Update Components

The migration uses the Cloudinary Upload Widget which loads via a script tag and doesn't require the Node.js SDK, avoiding browser compatibility issues.

Replace all instances of ImageUploader with CloudinaryUploader in your components:

```tsx
// Change from
import { ImageUploader } from "@/components/ImageUploader";

// To
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
```

### 5. Verify Migration

After implementing the changes, verify that:
- All images appear correctly in the application
- New image uploads work with Cloudinary
- Profile images are displayed correctly

### 6. Clean Up (Optional)

Once you've verified everything is working correctly, you can:

1. Remove the Supabase Storage bucket creation scripts
2. Delete the old `uploadService.ts` file
3. Remove any Supabase Storage policies from your database

## Troubleshooting

### Widget Not Loading

If the Cloudinary widget doesn't load:

1. Check the browser console for errors
2. Verify your cloud name is correct
3. Make sure your upload preset is properly configured and set to "unsigned"

### Upload Failures

If image uploads fail:

1. Check your Cloudinary credentials
2. Verify the upload preset name is correct
3. Test the upload preset directly in the Cloudinary dashboard

## Additional Resources

- [Cloudinary Upload Widget Documentation](https://cloudinary.com/documentation/upload_widget)
- [Cloudinary React SDK](https://cloudinary.com/documentation/react_integration)
- [Cloudinary URL Transformations](https://cloudinary.com/documentation/image_transformations) 