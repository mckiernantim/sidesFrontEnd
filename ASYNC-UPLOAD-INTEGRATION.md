# Async Upload Integration - Frontend Guide

## Overview

The frontend now **automatically handles both synchronous and asynchronous PDF processing** without any code changes in components. The upload service detects the response type and adapts accordingly.

## What Changed

### Upload Service (`upload.service.ts`)

#### New Methods Added

1. **`postFileAsync(file)`** - Explicitly use async upload
   ```typescript
   uploadService.postFileAsync(file).subscribe(response => {
     console.log('Upload initiated:', response.jobId);
     // Start polling...
   });
   ```

2. **`checkJobStatus(jobId)`** - Check processing status
   ```typescript
   uploadService.checkJobStatus(jobId).subscribe(status => {
     console.log('Progress:', status.progress);
     console.log('Status:', status.status);
   });
   ```

3. **`getJobResult(jobId)`** - Get completed result
   ```typescript
   uploadService.getJobResult(jobId).subscribe(result => {
     console.log('Processing complete:', result);
   });
   ```

4. **`pollUntilComplete(jobId)`** - Auto-polling helper
   ```typescript
   uploadService.pollUntilComplete(jobId).subscribe({
     next: (result) => console.log('Complete:', result),
     error: (err) => console.error('Failed:', err)
   });
   ```

#### Modified Method: `postFile()`

The existing `postFile()` method now **automatically detects** async vs sync responses:

```typescript
// BEFORE: Always waited for sync response
postFile(file) // 7-15 seconds

// AFTER: Automatically adapts
postFile(file) // Returns immediately if async, waits if sync
```

**How it works:**

```typescript
// Component code stays THE SAME
this.upload.postFile(file).subscribe(result => {
  // Gets result either way!
  this.router.navigate(['/dashboard']);
});
```

**Behind the scenes:**

```typescript
// Response check
if (response.jobId && response.status === 'processing') {
  // Async: Poll until complete
  return this.pollUntilComplete(response.jobId);
} else {
  // Sync: Return immediately
  return of(response);
}
```

## How It Works

### Sync Flow (Traditional)
```
User uploads PDF
  ↓
POST /api
  ↓
Wait 7-15s
  ↓
Get complete result
  ↓
Navigate to dashboard
```

### Async Flow (Cloud Run - Automatic)
```
User uploads PDF
  ↓
POST /api
  ↓
Immediate response with jobId (<500ms)
  ↓
Auto-polling every 1 second
  ↓ (backend shows "processing...")
Poll GET /api/async/status/:jobId
  ↓ (progress updates via scanProgress$)
Status: complete
  ↓
GET /api/async/result/:jobId
  ↓
Navigate to dashboard
```

## UI Updates

### Progress Messages

The existing progress UI automatically works with async polling:

```typescript
// Component already subscribes to this
this.upload.scanProgress$.subscribe(progress => {
  // Shows progress updates during polling
  this.progressMessage = progress.message;
  this.progressPercent = progress.progress;
});
```

**Async progress messages:**
- "Your document is queued for processing..." (pending)
- "Analyzing your script..." (processing)
- "Processing complete!" (complete)

### Existing Upload Component

**No changes needed!** The upload component automatically benefits:

```typescript
// upload.component.ts - UNCHANGED
this.upload.postFileStream(file).subscribe({
  next: (response) => {
    // Works with both sync and async!
    this.router.navigate(['/dashboard']);
  },
  error: (error) => {
    // Error handling unchanged
  }
});
```

## Manual Async Usage (Optional)

If you want to explicitly control async flow:

```typescript
// Explicitly use async upload
this.upload.postFileAsync(file).subscribe({
  next: (response) => {
    const jobId = response.jobId;
    
    // Start polling
    const interval = setInterval(() => {
      this.upload.checkJobStatus(jobId).subscribe(status => {
        this.updateProgress(status.progress);
        
        if (status.status === 'complete') {
          clearInterval(interval);
          
          // Get result
          this.upload.getJobResult(jobId).subscribe(result => {
            this.router.navigate(['/dashboard']);
          });
        }
      });
    }, 1000);
  }
});
```

## Response Formats

### Sync Response (Traditional)
```json
{
  "success": true,
  "data": {
    "allLines": [...],
    "individualPages": [...],
    "allChars": [...],
    "title": "Script Title",
    "firstAndLastLinesOfScenes": [...]
  }
}
```

### Async Response (Initial)
```json
{
  "success": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "message": "Upload received, processing started",
  "pollingEndpoint": "/api/async/status/550e8400-...",
  "resultEndpoint": "/api/async/result/550e8400-..."
}
```

### Status Response (During Polling)
```json
{
  "success": true,
  "jobId": "550e8400-...",
  "status": "processing",
  "progress": 45,
  "progressMessage": "Analyzing page 12 of 120...",
  "linesProcessed": null
}
```

### Final Result Response
```json
{
  "success": true,
  "jobId": "550e8400-...",
  "data": {
    "allLines": [...],
    "individualPages": [...],
    "allChars": [...],
    "title": "Script Title",
    "firstAndLastLinesOfScenes": [...]
  },
  "message": "Script processed successfully"
}
```

## User Experience

### Before (Sync Only)
- Upload PDF
- **Wait 7-15 seconds** (loading spinner)
- See result

**User perception:** "This is taking forever..."

### After (Async - Automatic)
- Upload PDF
- **Immediate acknowledgment** (<500ms)
- Progress updates during polling
- See result

**User perception:** "Wow, that was fast!"

## Error Handling

### Polling Timeout
```typescript
// Automatically handled
pollUntilComplete(jobId, maxAttempts: 120) // 2 minutes max
```

If polling times out:
```
Error: "Polling timeout - job took too long"
```

### Processing Error
```json
{
  "success": false,
  "status": "error",
  "error": "PDF validation failed",
  "jobId": "550e8400-..."
}
```

### Network Error
```typescript
// Existing error handling works
.pipe(
  catchError((error) => {
    // Same error display
    this.showError(error.message);
  })
)
```

## Testing

### Test Sync Flow
```bash
# On backend, disable Cloud Run
heroku config:set CLOUD_RUN_ENABLED=false

# Upload PDF in frontend
# Should see 7-15 second wait
```

### Test Async Flow
```bash
# On backend, enable Cloud Run
heroku config:set CLOUD_RUN_ENABLED=true
heroku config:set CLOUD_RUN_TRAFFIC_PERCENT=100

# Upload PDF in frontend
# Should see immediate response + polling
```

### Monitor in Browser Console
```javascript
// Watch for detection
// Console will show:
"Sync response detected, processing..."
// OR
"Async response detected, polling for result..."

// Watch for polling
"Polling attempt 1/120: {status: 'processing', progress: 10}"
"Polling attempt 2/120: {status: 'processing', progress: 25}"
...
"Polling attempt 15/120: {status: 'complete', progress: 100}"
```

## Gradual Rollout Impact

### Phase 1: 0% Async (Current)
- All uploads use sync flow
- No user-visible changes

### Phase 2: 10% Async
- 10% of users see instant response
- 90% see traditional 7-15s wait
- **Both groups end up in same place**

### Phase 3: 50% Async
- Half instant, half traditional
- User doesn't know which they're getting
- Both work identically

### Phase 4: 100% Async
- All users see instant response
- Polling happens automatically
- Same end result, better UX

## Advantages

### 1. Zero Code Changes in Components
```typescript
// Upload component doesn't change at all!
this.upload.postFile(file).subscribe(...);
```

### 2. Automatic Adaptation
- Backend controls routing via feature flags
- Frontend automatically adapts
- No frontend deployment needed for rollout

### 3. Seamless Rollback
```bash
# Backend issue? Instant rollback
heroku config:set CLOUD_RUN_ENABLED=false

# Frontend continues working
# No code changes needed
```

### 4. Better User Experience
- Immediate feedback
- Progress updates during processing
- Same familiar flow

## LocalStorage Management

### Stored During Upload
```javascript
localStorage.setItem('name', filename);
localStorage.setItem('currentJobId', jobId); // Async only
```

### Cleared After Completion
```javascript
localStorage.removeItem('currentJobId');
```

### Recovery on Page Refresh
```typescript
// Component can check for pending job
ngOnInit() {
  const pendingJobId = localStorage.getItem('currentJobId');
  if (pendingJobId) {
    // Resume polling
    this.upload.pollUntilComplete(pendingJobId).subscribe(...);
  }
}
```

## Migration Path

### Current State
✅ Upload component uses `postFile()` or `postFileStream()`  
✅ Both work with sync responses

### After This Update
✅ Same components, no changes  
✅ Both methods auto-detect async responses  
✅ Polling happens transparently  
✅ Progress updates via existing `scanProgress$`

### Future Enhancement (Optional)
```typescript
// Could add explicit async mode
<button (click)="useAsyncUpload()">
  Fast Upload (Beta)
</button>

useAsyncUpload() {
  this.upload.postFileAsync(this.file).subscribe(...);
}
```

## Debugging

### Check Response Type
```typescript
// Add in component
this.upload.postFile(file).subscribe(response => {
  console.log('Response type:', 
    response.jobId ? 'ASYNC' : 'SYNC'
  );
});
```

### Monitor Polling
```typescript
// Upload service already logs
"Polling attempt 5/120: {status: 'processing', progress: 35}"
```

### Check Feature Flags
```bash
# Backend
heroku config | grep CLOUD_RUN

# Console Network Tab
# Look at /api response:
# - Has "data"? → Sync
# - Has "jobId"? → Async
```

## Summary

✅ **No component changes required**  
✅ **Automatic sync/async detection**  
✅ **Backward compatible**  
✅ **Better user experience**  
✅ **Easy to test and rollback**  

The frontend is now fully ready for the Cloud Run async migration! 🚀

