# Audio Playback and Trimming Fix

## Issues Identified

Based on the logs showing 404 errors for audio endpoints:
```
{"level":"info","message":"10.21.77.3 - - [15/Feb/2026:21:11:37 +0000] \"GET /api/v1/calls/698fb39e40584ddfa656c74f/audio HTTP/1.1\" 404 50 ..."}
```

### Root Causes

1. **Missing Audio Files** - Audio files are not present on the backend server disk
2. **Ephemeral Storage** - Deployed on serverless/container platform where files don't persist
3. **Missing FFmpeg** - Audio trimming requires FFmpeg which may not be installed
4. **Missing Upload Directory** - The uploads directory wasn't being created on server startup

## Fixes Applied

### 1. Enhanced Error Messages ✅

Updated `backend/src/controllers/callController.js` to provide detailed error messages when audio files are missing:

- Check if `audioFilePath` exists in database
- Check if file exists on disk
- Log detailed error information including file path and name
- Return helpful error messages to users

**Before:**
```javascript
if (!fs.existsSync(call.audioFilePath)) {
  return res.status(404).json({
    success: false,
    message: 'Audio file not found',
  });
}
```

**After:**
```javascript
if (!call.audioFilePath) {
  logger.error('Audio file path is missing from database', { callId: call._id });
  return res.status(404).json({
    success: false,
    message: 'Audio file path not configured for this call',
  });
}

if (!fs.existsSync(call.audioFilePath)) {
  logger.error('Audio file not found on disk', { 
    callId: call._id, 
    audioFilePath: call.audioFilePath,
    audioFileName: call.audioFileName 
  });
  return res.status(404).json({
    success: false,
    message: 'Audio file not found. The file may have been deleted or moved. Please contact support if this is a recent upload.',
    details: {
      expectedPath: call.audioFilePath,
      fileName: call.audioFileName
    }
  });
}
```

### 2. Auto-Create Upload Directories ✅

Updated `backend/src/server.js` to automatically create required directories on startup:

```javascript
// Ensure upload directories exist
const fs = require('fs');
const path = require('path');
const ensureUploadDirectories = () => {
  const directories = [
    config.upload.dir,  // ./uploads/calls
    path.join(__dirname, '../temp')  // ./temp
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  });
};

ensureUploadDirectories();
```

### 3. FFmpeg Availability Check ✅

Updated `trimCallAudio` function to check if FFmpeg is installed before attempting to trim:

```javascript
// Check if ffmpeg is available
try {
  await execPromise('ffmpeg -version');
} catch (ffmpegCheckError) {
  logger.error('FFmpeg not available', { error: ffmpegCheckError.message });
  return res.status(500).json({
    success: false,
    message: 'Audio trimming is not available. FFmpeg is not installed on the server. Please contact your administrator.',
  });
}
```

## Critical Issue: File Storage on Render

### The Problem

Your backend is deployed on **Render** while your frontend is on Vercel. The issue is that Render uses **ephemeral storage** by default:

- Files uploaded during runtime are stored temporarily
- Files are **deleted** when the service restarts or redeploys
- Each deployment gets a fresh file system
- Container restarts wipe uploaded files

### The Solution: Two Options

#### Option A: Render Persistent Disks (Easiest - Recommended for Render)

Render offers **Persistent Disks** that survive restarts and deployments. This is the easiest solution if staying on Render.

#### Option B: Cloud Storage (Best for Scale)

Migrate to cloud storage (S3, Cloudinary) for unlimited scale and reliability.

#### Solution A: Render Persistent Disk (Recommended for Render)

**Pros:**
- ✅ Easy setup - just add a disk in Render dashboard
- ✅ No code changes needed
- ✅ Lower cost for small scale ($1-5/month for 1-10GB)
- ✅ Files persist across deployments

**Cons:**
- ❌ Limited to single region
- ❌ No automatic backups (you need to configure)
- ❌ Slower than CDN for global users

**Setup Steps:**

1. **Add Persistent Disk in Render Dashboard**
   - Go to your backend service in Render
   - Navigate to "Disks" tab
   - Click "Add Disk"
   - Name: `call-recordings`
   - Mount Path: `/app/uploads`
   - Size: Start with 10GB (costs ~$2.50/month)

2. **Update Environment Variable**
   ```env
   UPLOAD_DIR=/app/uploads/calls
   ```

3. **Verify in Render Dashboard**
   - After deployment, check Shell tab
   - Run: `ls -la /app/uploads`
   - Should show your uploads directory

4. **Done!** Files will now persist across deployments and restarts.

#### Solution B: Cloud Storage Options

1. **AWS S3** (Most Popular)
   - Reliable and cost-effective
   - Easy integration with Node.js
   - Support for presigned URLs for secure access
   
2. **Cloudinary** (Audio-Optimized)
   - Built for media files
   - Automatic format conversion
   - Built-in audio trimming API
   
3. **Google Cloud Storage**
   - Good for Google Cloud deployments
   - Similar to S3
   
4. **Azure Blob Storage**
   - Good for Azure deployments

#### Implementation Steps:

##### Option 1: AWS S3 (Recommended)

1. **Install Dependencies**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer-s3
```

2. **Update Environment Variables**
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

3. **Update Multer Configuration** in `callController.js`:

```javascript
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const storage = multerS3({
  s3: s3Client,
  bucket: process.env.AWS_S3_BUCKET,
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const uniqueName = `calls/${uuidv4()}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});
```

4. **Update Audio Streaming** in `getCallAudio`:

```javascript
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Generate presigned URL (valid for 1 hour)
const command = new GetObjectCommand({
  Bucket: process.env.AWS_S3_BUCKET,
  Key: call.audioFilePath, // Now stores S3 key instead of local path
});

const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

// Redirect to presigned URL or stream from S3
res.redirect(signedUrl);
```

##### Option 2: Cloudinary (Easier for Audio)

1. **Install Dependencies**
```bash
npm install cloudinary multer
```

2. **Configure Cloudinary**:

```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload file
const result = await cloudinary.uploader.upload(req.file.path, {
  resource_type: 'video',Render

**Option A: Install via Build Command (Recommended)**

Update your Render service configuration:

1. **In Render Dashboard:**
   - Go to your service → Settings → Build & Deploy
   - Add to Build Command:
   ```bash
   npm install && apt-get update && apt-get install -y ffmpeg
   ```

2. **Or create `render.yaml` in project root:**
   ```yaml
   services:
     - type: web
       name: ai-call-center-backend
       env: node
       buildCommand: npm inst for Render

### 1. Add Persistent Disk (5 Minutes - Recommended)

**This is the quickest solution for Render:**

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your backend service
3. Click "Disks" tab
4. Click "Add Disk"
   - Name: `call-recordings`
   - Mount Path: `/app/uploads`
   - Size: 10GB (adjust based on needs)
5. Click "Save"
6. Render will redeploy automatically

7. Update environment variable in Render:
   - Go to "Environment" tab
   - Add/Update: `UPLOAD_DIR=/app/uploads/calls`
   - Click "Save Changes"

### 2. Install FFmpeg

**Add to your Render Build Command:**

In Render Dashboard → Settings → Build & Deploy:
```bash
npm install && apt-get update && apt-get install -y ffmpeg
```

Or use the `render.yaml` configuration shown above.

### 3. Check Current Storage Situation

After deploying, use Render's Shell:
1. Go to your service in Render
2. Click "Shell" tab
3. Run:
```bash
ls -la /app/uploads/calls/
df -h /app/uploads
```

If uploads directory is empty, **previous audio files are lost** (they were on ephemeral storage)
FROM node:18

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
```

In Render:
- Set "Docker" as environment
- Render will automatically detect and use the Dockerfileove and implement it ASAP. **This is not optional** for serverless deployments.

### 3. Install FFmpeg on Server

For Vercel, you need to use a custom build configuration or Docker:

**Option A: Use FFmpeg Layer (Vercel)**
Add to `vercel.json`:
```json
{
  "functions": {
    "api/**/*.js": {
      "includeFiles": "ffmpeg-bin/**"
    }
  }
}
```

Install ffmpeg-static:
```bash
npm install ffmpeg-static
```

Update code to use it:
```javascript
const ffmpegPath = require('ffmpeg-static');
const ffmpegCommand = `"${ffmpegPath}" -i "${call.audioFilePath}" ...`;
```

**Option B: Self-Host Backend (Recommended)**

Deploy backend on a platform that supports persistent storage:
- **Render** - Has persistent disks, FFmpeg can be installed
- **Railway** - Similar to Render
- **AWS EC2** - Full control
- **DigitalOcean Droplets** - Full control

### 4. Update Database (If Needed)

If migrating existing calls, you'll need to:
1. Download existing audio files (if any still exist)
2. Upload them to cloud storage
3. Update database with new URLs

```javascript

**For Render (Immediate - Do This Now):**
1. ✅ **Add Persistent Disk** in Render Dashboard (5 min) - **CRITICAL**
2. ✅ **Install FFmpeg** via build command (2 min)
3. ✅ Update `UPLOAD_DIR=/app/uploads/calls` environment variable
4. ✅ Test upload and playback after deployment

**Optional (For Scale):**
5. Consider cloud storage (S3, Cloudinary) when you reach 50GB+ or need global CDN
6. Implement backup strategy for persistent disk
7. Test thoroughly after migration

### Render-Specific Best Practices

**Persistent Disk Management:**
- Monitor disk usage in Render dashboard
- Set up alerts when disk reaches 80% capacity
- Persistent disks can be resized without data loss
- Backups: Render doesn't auto-backup disks, use a cron job to copy to S3

**Cost Optimization:**
- Persistent Disk: $0.25/GB/month (~$2.50 for 10GB)
- Much cheaper than S3 for small-medium scale
- Switch to S3 when you need:
  - More than 100GB storage
  - Global CDN delivery
  - Multi-region redundancy
  - Automatic backups

**Performance:**
- Persistent disks on Render are SSD-backed
- Fast local access (faster than S3 for same-region requests)
- For global users, consider Cloudflare CDN in front of Render

### Long-term Recommendations
- Implement file cleanup jobs to manage disk space
- Consider audio compression to reduce storage
- Monitor disk usage with alerts
- Plan migration to S3 when scaling beyond 100GB
  }
}
```

## Testing the Fixes

### 1. Test Error Messages
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-api.com/api/v1/calls/CALL_ID/audio
```

You should now get detailed error messages.

### 2. Test Directory Creation
Restart your backend server and check logs for:
```
✅ DEBUG: Created directory: ./uploads/calls
✅ DEBUG: Created directory: ./temp
```

### 3. Test FFmpeg Check
Try to trim audio and verify you get the FFmpeg error message if it's not installed.

## Performance Considerations

### Cloud Storage Benefits:
- ✅ Files persist across deployments
- ✅ No server disk space limitations
- ✅ Can use CDN for faster delivery
- ✅ Built-in backup and redundancy
- ✅ Can scale to millions of files

### Cloud Storage Costs:
- S3: ~$0.023/GB/month storage + $0.09/GB transfer
- Cloudinary: 25GB free, then ~$0.12/GB
- For 1000 calls @ 5MB each = 5GB = ~$0.50-$1/month

## Summary

### Completed ✅
- Enhanced error messages for missing audio files
- Auto-create upload directories on startup
- FFmpeg availability check before trimming

### Required Next Steps ⚠️
1. **Migrate to cloud storage** (S3, Cloudinary, etc.) - **CRITICAL**
2. Install FFmpeg on production server or use ffmpeg-static
3. Consider self-hosting backend if Vercel limitations are too restrictive
4. Test thoroughly after migration

### Long-term Recommendations
- Use cloud storage for ALL user-uploaded files
- Implement file cleanup jobs to manage costs
- Consider audio compression to reduce storage costs
- Implement CDN caching for frequently accessed audio files
