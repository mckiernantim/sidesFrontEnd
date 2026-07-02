# Local Development Setup Guide

## 🚀 Quick Start

Your frontend is now configured to **automatically detect** your environment and point to the correct backend. No manual configuration needed!

## 🎯 How It Works

When you run `ng serve` and open `http://localhost:4200`, the app will automatically:

✅ **Use DEV Firebase** (`scriptthing-dev`)  
✅ **Use DEV Heroku Backend** (`https://sides3-dev-e045a1d9ac46.herokuapp.com`)  
✅ **Show configuration logs** in the browser console

## 📋 Testing Your Setup

### Step 1: Start the Frontend
```bash
cd sidesWaysFrontEnd
ng serve
```

### Step 2: Open Browser
Navigate to: `http://localhost:4200`

### Step 3: Check Console
Open DevTools (F12) and look for:
```
🏠 Running on localhost - Using DEV environment
📡 Backend: https://sides3-dev-e045a1d9ac46.herokuapp.com (DEV)
🔥 Firebase: scriptthing-dev
💡 Tip: To use local backend, run: localStorage.setItem("USE_LOCAL_BACKEND", "true")
```

### Step 4: Upload a PDF
The app will now use the **DEV backend** with:
- Cloud Run processing service
- Dev Firebase/Firestore for job tracking
- Progress updates every second

## 🔧 Advanced: Local Backend Testing

If you're also running the backend locally and want to test against it:

### Option 1: Browser Console
1. Open DevTools (F12)
2. Run: `localStorage.setItem("USE_LOCAL_BACKEND", "true")`
3. Refresh the page
4. Console will show: `📡 Backend: http://localhost:8080 (LOCAL)`

### Option 2: Revert to Dev Backend
```javascript
localStorage.removeItem("USE_LOCAL_BACKEND")
// Refresh page
```

## 🌍 Environment Auto-Detection

| URL | Firebase | Backend | Notes |
|-----|----------|---------|-------|
| `localhost:4200` | scriptthing-dev | sides3-dev (or local) | Local development |
| `scriptthing-dev.web.app` | scriptthing-dev | sides3-dev | Dev staging |
| `scriptthing.web.app` | scriptthing | sides3 | Production |

## 🐛 Troubleshooting

### "CORS error" or "Network request failed"
- ✅ Make sure dev backend is running: `https://sides3-dev-e045a1d9ac46.herokuapp.com/health`
- ✅ Check Heroku logs: `heroku logs --tail --app sides3-dev`

### "Job not found" errors
- ✅ Ensure Cloud Run is deployed: Check Cloud Run console
- ✅ Check Firestore permissions: Dev backend needs access to `scriptthing-dev` Firestore

### Progress not updating
- ✅ Check browser console for polling logs
- ✅ Verify job status: Look for "Job status:" logs
- ✅ Check Firestore: Job document should have `progress` and `progressMessage` fields

### Local backend not connecting
1. Make sure backend is running on port 8080
2. Enable local backend: `localStorage.setItem("USE_LOCAL_BACKEND", "true")`
3. Refresh page
4. Check console logs

## 📝 Notes

- **No code changes needed** - Everything is automatic!
- **Console logs** show exactly what configuration is being used
- **localStorage** override is preserved across page refreshes
- **Environment detection** happens on every page load

## ✅ Verify Your Fix

To test the progress update fix you just implemented:

1. Start frontend: `ng serve`
2. Upload a PDF
3. Watch the progress modal - it should now show:
   - **0-10%**: Initial upload
   - **10-20%**: Scanning PDF / Extracting text
   - **50-70%**: Sanitizing & Classifying
   - **80-100%**: Uploading results & Completing

The percentages should now match the backend's actual progress! 🎉

