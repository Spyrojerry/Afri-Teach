# Setting Up Cloudinary for Afri-Teach

This document provides step-by-step instructions for setting up Cloudinary for image uploads in the Afri-Teach platform.

## 1. Create a Cloudinary Account

1. Sign up for a free Cloudinary account at [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. After signing up, you'll be taken to your dashboard

## 2. Create an Upload Preset

An upload preset is required for the widget to work correctly:

1. In your Cloudinary dashboard, go to Settings > Upload
2. Scroll down to "Upload presets" and click "Add upload preset"
3. Configure your preset:
   - **Upload preset name**: Choose a name like `afri_teach_profiles` (remember this for your .env file)
   - **Signing Mode**: Set to "Unsigned" (for client-side uploads)
   - **Folder**: Optional, but recommended (e.g., "profiles")
   - **Eager Transformations**: Optional, but you can add transformations like crop/resize here
   - **Notification URL**: Leave blank for now
4. Click "Save" to create the preset

## 3. Configure Environment Variables

Create a `.env` file in the root of your project (if not already present) and add:

```
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

Where:
- `your_cloud_name` is the Cloud Name from your Cloudinary dashboard
- `your_upload_preset` is the name you chose in step 2

## 4. Testing Your Configuration

To test if your Cloudinary setup is working correctly:

1. Start your development server: `npm run dev`
2. Navigate to a profile page where the CloudinaryUploader component is used
3. Click "Change Photo" to open the upload widget
4. Try uploading an image - if successful, it should appear on your profile
5. Check your Cloudinary Media Library to verify the image was uploaded

## 5. Troubleshooting

### Widget Not Loading

If the upload widget doesn't appear:
- Check your browser console for errors
- Verify your cloud name is correct in .env
- Make sure the Cloudinary script is loading (check network tab)

### Upload Failures

If uploads fail:
- Verify your upload preset is set to "Unsigned"
- Check that your upload preset name is correct in .env
- Ensure your cloud name matches your Cloudinary account

### Transformation Issues

If images aren't displaying correctly:
- Check the transformation parameters in the `getTransformedUrl` function
- Verify the URLs being generated match Cloudinary's URL structure
- Test transformations directly in the Cloudinary dashboard

## 6. Additional Resources

- [Cloudinary Upload Widget Documentation](https://cloudinary.com/documentation/upload_widget)
- [Cloudinary URL Transformations](https://cloudinary.com/documentation/image_transformations)
- [Cloudinary React SDK](https://cloudinary.com/documentation/react_integration) 