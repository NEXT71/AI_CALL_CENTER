# Render Setup Guide - Quick Fix for Audio Issues

## The Problem
Audio files are returning 404 because they're stored on **ephemeral storage** that gets wiped on every deployment/restart.

## The Solution (5 Minutes)
Add a **Persistent Disk** to your Render service to keep audio files between deployments.

---

## Step-by-Step Setup

### Option 1: Use Render Dashboard (Easiest - 5 minutes)

#### Step 1: Add Persistent Disk

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your backend service (ai-call-center-backend)
3. Click **"Disks"** tab in the left sidebar
4. Click **"Add Disk"** button
5. Fill in:
   - **Name:** `call-recordings`
   - **Mount Path:** `/app/uploads`
   - **Size:** `10` GB (start small, can increase later)
6. Click **"Save"**

**Cost:** ~$2.50/month for 10GB

#### Step 2: Update Environment Variable

1. Still in your service, click **"Environment"** tab
2. Find `UPLOAD_DIR` or add it:
   - **Key:** `UPLOAD_DIR`
   - **Value:** `/app/uploads/calls`
3. Click **"Save Changes"**

#### Step 3: Install FFmpeg

~~1. Click **"Settings"** tab~~
~~2. Scroll to **"Build & Deploy"** section~~
~~3. Find **"Build Command"**~~
~~4. Update it to:~~
   ```bash
   npm install && apt-get update && apt-get install -y ffmpeg
   ```
~~5. Click **"Save Changes"**~~

**UPDATE:** FFmpeg is now handled automatically via the `ffmpeg-static` npm package (already installed). No build command changes needed!

#### Step 4: Deploy

Render will automatically redeploy with the new configuration. Wait for deployment to complete (~3-5 minutes).

#### Step 5: Verify

1. After deployment, click **"Shell"** tab
2. Run these commands:
   ```bash
   # Check if disk is mounted
   df -h /app/uploads
   
   # Check if directories exist
   ls -la /app/uploads/
   
   # ffmpeg-static is bundled with your app
   node -e "console.log(require('ffmpeg-static'))"
   ```

You should see:
- Disk mounted at `/app/uploads` with your configured size
- Directories created
- Path to the ffmpeg binary

---

### Option 2: Use render.yaml (Infrastructure as Code)

If you prefer configuration as code:

1. **The `render.yaml` file is already created in your project root**

2. **Commit and push to Git:**
   ```bash
   git add render.yaml
   git commit -m "Add Render configuration with persistent disk"
   git push
   ```

3. **In Render Dashboard:**
   - Click your service
   - Click "Settings" → "Build & Deploy"
   - Render will detect `render.yaml` and ask if you want to use it
   - Click "Yes"

4. **Redeploy**

---

### Option 3: Use Docker (Optional)

If you prefer Docker:

1. **Dockerfile is already created in backend directory**

2. **Update Render service:**
   - Go to Settings → Build & Deploy
   - Change "Environment" to **"Docker"**
   - Render will automatically detect and use the Dockerfile

3. **Save and redeploy**

---

## Testing the Fix

### 1. Upload a Test Audio File

Use your frontend or API to upload a call recording.

### 2. Check if File Persists

In Render Shell:
```bash
ls -la /app/uploads/calls/
```

You should see your uploaded file.

### 3. Test Audio Playback

Click on a call in your frontend and try to play the audio. It should work now!

### 4. Test Audio Trimming

Try the trim feature. If FFmpeg is installed correctly, it should work.

### 5. Restart Service and Verify

1. In Render Dashboard, click "Manual Deploy" → "Clear build cache & deploy"
2. After restart, check Shell again:
   ```bash
   ls -la /app/uploads/calls/
   ```
   
**Your files should still be there!** 🎉

---

## Troubleshooting

### Issue: Files still disappear after restart

**Solution:** Make sure the mount path is exactly `/app/uploads` and `UPLOAD_DIR` is `/app/uploads/calls`

### Issue: "No space left on device"

**Solution:** Increase disk size in Render dashboard:
- Go to Disks tab
- Click your disk
- Increase size
- Save (will not cause data loss)

### Issue: FFmpeg not found

**Solution:** Check build logs for errors. Make sure build command includes:
```bash
apt-get update && apt-get install -y ffmpeg
```

### Issue: Permission denied when writing files

**Solution:** Ensure directories have correct permissions in startup:
```bash
chmod -R 755 /app/uploads
```

Add to your start command or use Dockerfile to set permissions.

---

## Cost Breakdown

### Current Setup (Recommended for Starting)
- **Render Starter Plan:** $7/month (or Free tier)
- **Persistent Disk (10GB):** $2.50/month
- **Total:** ~$9.50/month (or $2.50 if using free tier)

### Storage Capacity Estimate
- Average call: 2-5MB
- 10GB = ~2,000-5,000 calls
- 100GB = ~20,000-50,000 calls

### When to Upgrade Disk Size
- Monitor usage in Shell: `df -h /app/uploads`
- Upgrade when reaching 80% capacity
- Can resize without data loss

---

## Next Steps After Setup

### 1. Implement File Cleanup (Optional but Recommended)

To manage disk space, implement automatic cleanup of old files:

**Option A:** Enable existing cleanup job in your code
- Already have `backend/src/jobs/fileCleanup.js`
- Uncomment in `server.js` if disabled

**Option B:** Manual cleanup via cron (in Render)
- Add a cron job in Render to delete files older than X days

### 2. Monitor Disk Usage

**Set up alerts:**
- Create a monitoring endpoint: `GET /api/disk-usage`
- Use Render's monitoring or external service (UptimeRobot, Better Uptime)
- Get notified at 80% capacity

### 3. Backup Strategy (Important!)

Render doesn't automatically backup persistent disks. Options:

**Option A:** Scheduled S3 backup
```javascript
// Add to jobs/backupAudio.js
const cron = require('node-cron');
const AWS = require('aws-sdk');

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  // Copy files from /app/uploads to S3
  // Keep last 30 days in S3
});
```

**Option B:** Use Render's backup service (if available in your plan)

### 4. Consider Migration to S3 When:
- You exceed 100GB storage
- You need multi-region redundancy
- You want automatic backups
- You need global CDN delivery
- You have high traffic from multiple regions

---

## Alternative: Quick Migration to Cloudinary

If you want to avoid managing storage entirely:

### 1. Install Cloudinary
```bash
cd backend
npm install cloudinary multer
```

### 2. Update callController.js
```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// In upload handler
const result = await cloudinary.uploader.upload(req.file.path, {
  resource_type: 'video', // audio files use 'video' type
  folder: 'call-recordings',
});

call.audioFilePath = result.secure_url;
call.cloudinaryPublicId = result.public_id;
```

### 3. Update audio playback
```javascript
// Just redirect to Cloudinary URL
res.redirect(call.audioFilePath);
```

**Cloudinary Benefits:**
- ✅ Free tier: 25GB storage + 25GB bandwidth
- ✅ Built-in audio trimming via URL transformations
- ✅ No FFmpeg needed
- ✅ Automatic CDN
- ✅ Automatic backups

**Cloudinary URL Trimming:**
```javascript
// Trim audio via URL (no FFmpeg needed!)
const trimmedUrl = cloudinary.url(call.cloudinaryPublicId, {
  resource_type: 'video',
  start_offset: startTime,
  end_offset: endTime,
  format: 'mp3',
});
```

---

## Summary

✅ **Completed:**
- Enhanced error messages for missing files
- Auto-create upload directories
- FFmpeg availability check
- Render configuration files created

⚠️ **Do This Now (5 minutes):**
1. Add Persistent Disk in Render Dashboard
2. Update UPLOAD_DIR environment variable
3. Add FFmpeg to build command
4. Deploy and test

🚀 **You're Done!**
Audio playback and trimming should work perfectly after these changes.

Need help? Check the detailed guide in `AUDIO_PLAYBACK_FIX.md`
