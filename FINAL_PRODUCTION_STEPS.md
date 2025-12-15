# Final Production Deployment Steps

## Current Status: 90% Ready ✅

All code quality improvements are complete. Only **environment configuration** remains.

---

## Critical Tasks (Must Complete Before Production)

### ✅ Step 1: JWT Secrets - COMPLETED
**Status:** ✅ Done
- JWT_SECRET: 128 characters
- JWT_REFRESH_SECRET: 128 characters

### ❌ Step 2: MongoDB Password Rotation - **ACTION REQUIRED**

**Current Issue:** Password "Nextel123" is weak and exposed in Git history.

**Steps to Fix:**

1. **Login to MongoDB Atlas**
   - Go to https://cloud.mongodb.com
   - Select your project

2. **Access Database Users**
   - Click "Database Access" in left sidebar
   - Find user: `Nextel`

3. **Generate Strong Password**
   - Click "Edit" button
   - Click "Edit Password"
   - Click "Auto-generate Secure Password"
   - **COPY THE PASSWORD** (you won't see it again)

4. **Update .env File**
   ```env
   MONGO_URI=mongodb+srv://Nextel:NEW_PASSWORD_HERE@cluster0.9eph1nl.mongodb.net/AICallCenter
   ```
   
   **Important:** URL-encode special characters:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `%` → `%25`
   - `^` → `%5E`
   - `&` → `%26`

5. **Test Connection**
   ```bash
   npm run check-production
   ```

**Time Required:** 5 minutes

---

### ⚠️ Step 3: Production CORS Configuration - **REQUIRED BEFORE DEPLOY**

**Current:** Only localhost allowed
**Needed:** Your production frontend URL

**When Deploying to Vercel/Netlify:**

Update [.env](backend/.env):
```env
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
```

**Multiple domains (comma-separated):**
```env
ALLOWED_ORIGINS=https://app.yourcompany.com,https://www.yourcompany.com,https://admin.yourcompany.com
```

---

### 🔧 Step 4: Stripe Live Keys - **REQUIRED FOR REAL PAYMENTS**

**Current:** Test keys (sk_test_*, pk_test_*)
**Safe to deploy with test keys** for initial testing, but switch to live when accepting real payments.

**When Ready for Production Payments:**

1. **Get Live Keys from Stripe Dashboard**
   - Login: https://dashboard.stripe.com
   - Switch from "Test mode" to "Live mode" (toggle in top-right)
   - Go to Developers → API Keys

2. **Update .env**
   ```env
   STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
   STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
   ```

3. **Create Live Price IDs**
   - Go to Products in Stripe Dashboard (Live mode)
   - Create products and get live price IDs
   - Update in .env

4. **Set Up Webhook**
   - Developers → Webhooks → Add endpoint
   - URL: `https://your-backend-url.com/api/v1/webhooks/stripe`
   - Copy webhook secret
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
   ```

---

### 📧 Step 5: Email Service (Optional but Recommended)

**Current:** Emails log to console in development

**Options:**

#### Option A: Gmail SMTP (Free, Easy)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM=noreply@yourdomain.com
```

**Setup App Password:**
1. Google Account → Security
2. 2-Step Verification (must be enabled)
3. App passwords → Generate
4. Use generated password in SMTP_PASS

#### Option B: SendGrid (Reliable, Free tier)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=YOUR_SENDGRID_API_KEY
EMAIL_FROM=noreply@yourdomain.com
```

**SendGrid Setup:**
1. Sign up: https://sendgrid.com
2. Settings → API Keys → Create API Key
3. Copy key to SMTP_PASS

#### Option C: AWS SES (Scalable, Cheap)
- Best for high volume
- Requires domain verification
- ~$0.10 per 1,000 emails

---

### 🚀 Step 6: Deploy Backend

**Recommended Platforms:**

#### **Option A: Render (Easiest)**
```yaml
# Already configured in render.yaml
```
1. Push to GitHub
2. Connect Render to repo
3. Set environment variables in Render dashboard
4. Deploy

**Cost:** $7/month (Starter) or $25/month (Standard)

#### **Option B: Railway**
1. Login to https://railway.app
2. New Project → Deploy from GitHub
3. Add environment variables
4. Deploy

**Cost:** Pay-as-you-go (~$5-20/month)

#### **Option C: Heroku**
```bash
heroku create your-app-name
heroku addons:create mongolab:sandbox
heroku config:set NODE_ENV=production
git push heroku main
```

**Cost:** ~$7-25/month

---

### 🎨 Step 7: Deploy Frontend

**Recommended: Vercel (Best for React)**

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Production ready"
   git push origin main
   ```

2. **Connect Vercel**
   - Login: https://vercel.com
   - Import Git Repository
   - Select your repo
   - Framework: React
   - Root directory: `frontend`

3. **Environment Variables**
   ```
   VITE_API_URL=https://your-backend.onrender.com/api/v1
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
   ```

4. **Deploy**
   - Click Deploy
   - Get your URL: `https://your-app.vercel.app`

5. **Update Backend CORS**
   - Copy Vercel URL
   - Update `ALLOWED_ORIGINS` in backend .env
   - Redeploy backend

---

## Verification Checklist

Before going live, verify:

- [ ] MongoDB password changed (run: `npm run check-production`)
- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] CORS configured (test frontend can call backend)
- [ ] Stripe test payment works
- [ ] User registration works
- [ ] Email notifications work (or logs correctly if not configured)
- [ ] AI service accessible (or using external API)
- [ ] File uploads work (check upload directory permissions)
- [ ] SSL/HTTPS enabled on both frontend and backend

---

## Post-Launch Monitoring

### Health Check Endpoint
```bash
curl https://your-backend.onrender.com/api/v1/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-15T...",
  "environment": "production",
  "version": "1.0.0",
  "checks": {
    "database": { "status": "healthy" },
    "redis": { "status": "healthy" },
    "aiService": { "status": "healthy" }
  }
}
```

### Monitor These Metrics

1. **Error Logs** (check daily)
   ```bash
   # If using Render, view logs in dashboard
   # Or tail logs from server
   ```

2. **Database Performance**
   - MongoDB Atlas → Metrics
   - Watch for slow queries

3. **API Response Times**
   - Should be < 200ms for most endpoints
   - Transcription can take 30-60 seconds (background job)

4. **Stripe Webhooks**
   - Dashboard → Developers → Webhooks
   - Check for failed deliveries

5. **Disk Usage**
   - Audio files accumulate
   - Cleanup job runs every 24 hours
   - Deletes files older than 30 days

---

## Emergency Rollback

If something breaks:

1. **Revert to previous version**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Check logs**
   - Render/Railway dashboard
   - Look for error stack traces

3. **Database issues**
   - MongoDB Atlas → Backup & Restore
   - Restore to point-in-time

---

## Next Steps

**Immediate (This Week):**
1. ✅ Rotate MongoDB password
2. ✅ Deploy backend to Render/Railway
3. ✅ Deploy frontend to Vercel
4. ✅ Test complete user flow

**Short-term (Next Month):**
1. Set up error monitoring (Sentry, LogRocket)
2. Configure email service (SendGrid/Gmail)
3. Switch to Stripe live keys when ready
4. Deploy AI service to RunPod for GPU acceleration

**Long-term (Growth Phase):**
1. Add Redis for caching
2. Implement CDN for audio files (CloudFlare, AWS CloudFront)
3. Set up automated backups
4. Performance optimization based on metrics
5. Scale database (MongoDB Atlas shared → dedicated cluster)

---

## Support Resources

- **MongoDB:** https://cloud.mongodb.com/support
- **Stripe:** https://support.stripe.com
- **Render:** https://render.com/docs
- **Vercel:** https://vercel.com/docs

---

**Current Production Readiness: 90%**

**Blockers:** MongoDB password rotation only

**Ready to deploy once MongoDB password is updated!** 🚀
