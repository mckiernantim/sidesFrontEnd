# Firebase Storage Rules Deployment Guide

## Issue Identified
The backend is now storing callsheet images in a `/images` subfolder within the `/callsheets` directory, but the Firebase Storage rules only allow access to the `/callsheets` folder directly.

## Current Error
When accessing URLs with `/images` in the path, you get this XML error:
```xml
<Error>
<Code>AccessDenied</Code>
<Message>Access denied.</Message>
<Details>Anonymous caller does not have storage.objects.get access to the Google Cloud Storage object. Permission 'storage.objects.get' denied on resource (or it may not exist).</Details>
</Error>
```

## Solution
Update the Firebase Storage rules to include permissions for the `/images` folder.

## Steps to Deploy

### 1. Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `scriptthing-dev`
3. Navigate to **Storage** in the left sidebar
4. Click on the **Rules** tab

### 2. Update Storage Rules
Replace the current rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Callsheet uploads - only server can write, anyone can read
    match /callsheets/{allPaths=**} {
      allow read: if true; // Public read for Angular app
      allow write: if false; // Only server-side can write
    }
    
    // Images folder - for converted callsheet images
    match /images/{allPaths=**} {
      allow read: if true; // Public read for converted images
      allow write: if request.auth != null; // Only authenticated users can upload
    }
    
    // Other files require authentication
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Publish Rules
1. Click **Publish** to deploy the updated rules
2. Wait for the confirmation that rules have been published

### 4. Test the Fix
1. Upload a callsheet in your Angular app
2. Check the browser console for URL conversion logs
3. Verify that the image loads without CORS errors
4. Confirm the callsheet appears in the document preview

## Expected URL Pattern
After the fix, URLs should follow this pattern:
- **From backend**: `https://storage.googleapis.com/scriptthing-dev.firebasestorage.app/callsheets/images/filename`
- **Used directly**: No conversion needed - backend sends proper Firebase Storage URLs

## Verification
1. **Console Logs**: Look for "URLs from backend" messages
2. **Network Tab**: Check that requests to Firebase Storage URLs return 200 status
3. **Image Display**: Callsheet images should load in both preview and document
4. **No CORS Errors**: Browser console should be clean of CORS-related errors

## Troubleshooting
If issues persist after updating rules:
1. **Wait 5-10 minutes** for rules to propagate
2. **Clear browser cache** and try again
3. **Check Firebase Console** to confirm rules are published
4. **Verify URL format** in browser console logs 