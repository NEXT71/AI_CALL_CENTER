# Production Deployment Checklist

## ⚠️ CRITICAL - Security & Environment

### 1. Generate Strong Secrets
```bash
# Run the secret generator
node src/scripts/generateSecrets.js

# Copy the output to your .env file
# Secrets should be 64+ characters
```

### 2. Environment Variables
Update all production environment variables:

**Required:**
- [ ] `MONGO_URI` - Use strong password, enable IP whitelist
- [ ] `JWT_SECRET` - 64+ character random string
- [ ] `JWT_REFRESH_SECRET` - 64+ character random string
- [ ] `NODE_ENV=production`
- [ ] `ALLOWED_ORIGINS` - Your production frontend URL
- [ ] `STRIPE_SECRET_KEY` - Use live key (sk_live_)
- [ ] `STRIPE_PUBLISHABLE_KEY` - Use live key (pk_live_)
- [ ] `STRIPE_WEBHOOK_SECRET` - From Stripe Dashboard

**Recommended:**
- [ ] `AI_SERVICE_URL` - Your production AI service
- [ ] `SMTP_USER` & `SMTP_PASS` - For email notifications
- [ ] `FRONTEND_URL` - For email links and redirects

### 3. Database Security
- [ ] Rotate MongoDB password
- [ ] Enable MongoDB IP whitelist (only server IPs)
- [ ] Enable MongoDB audit logging
- [ ] Set up automated backups (MongoDB Atlas)
- [ ] Test backup restoration

### 4. Stripe Configuration
- [ ] Switch to live Stripe keys
- [ ] Create live products and prices
- [ ] Update Price IDs in .env
- [ ] Configure webhook endpoint in Stripe Dashboard
- [ ] Test payment flow with live keys
- [ ] Enable Stripe fraud detection

### 5. CORS & Security Headers
- [ ] Update `ALLOWED_ORIGINS` with production domains
- [ ] Verify Helmet security headers
- [ ] Test CORS from production frontend
- [ ] Enable HTTPS only

### 6. Logging & Monitoring
- [ ] Set up error monitoring (Sentry recommended)
- [ ] Configure log aggregation (LogDNA, Datadog)
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Configure alerts for critical errors
- [ ] Set up performance monitoring (New Relic/Datadog APM)

### 7. Rate Limiting
- [ ] Review rate limit configurations
- [ ] Adjust based on expected traffic
- [ ] Monitor for abuse

### 8. File Storage
- [ ] Migrate uploads to S3/Cloudinary
- [ ] Update file upload paths
- [ ] Test file upload/download
- [ ] Configure CDN for static assets

### 9. Database Indexes
Already created in models, verify they're applied:
```bash
# Connect to MongoDB and check indexes
db.calls.getIndexes()
db.users.getIndexes()
db.auditlogs.getIndexes()
```

### 10. Testing
- [ ] Run all API endpoints with production config
- [ ] Test authentication flow
- [ ] Test payment processing (use Stripe test cards first)
- [ ] Test email delivery
- [ ] Test file uploads
- [ ] Load test critical endpoints
- [ ] Test error handling

## 🚀 Deployment Steps

### Option 1: Render.com

1. **Create New Web Service**
   - Connect GitHub repository
   - Select `backend` directory
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Environment Variables**
   - Add all variables from `.env.example`
   - Use Render secret variables for sensitive data

3. **Configure**
   - Set health check path: `/health`
   - Configure auto-deploy from main branch

### Option 2: Railway.app

1. **New Project from GitHub**
   - Select repository
   - Set root directory to `backend`

2. **Configure**
   - Add environment variables
   - Railway auto-detects Node.js

3. **Deploy**
   - Automatic deployments on push

### Option 3: DigitalOcean App Platform

1. **Create App**
   - Connect GitHub
   - Select backend folder

2. **Configure**
   - Build: `npm install`
   - Run: `npm start`
   - Health check: `/health`

3. **Environment**
   - Add encrypted variables
   - Configure MongoDB access

## 📊 Post-Deployment

### 1. Verify Deployment
```bash
# Health check
curl https://your-api.com/health

# API version
curl https://your-api.com/api/v1/health
```

### 2. Test Critical Flows
- [ ] User registration
- [ ] Email verification
- [ ] Login/Logout
- [ ] Password reset
- [ ] Subscription checkout
- [ ] Webhook handling
- [ ] Call upload & processing

### 3. Monitor
- [ ] Check error logs
- [ ] Monitor response times
- [ ] Watch memory usage
- [ ] Track API usage

### 4. Security Scan
```bash
# Run npm audit
npm audit

# Fix critical vulnerabilities
npm audit fix
```

### 5. Performance Optimization
- [ ] Enable compression (already enabled)
- [ ] Configure caching headers
- [ ] Optimize database queries
- [ ] Enable CDN for static assets

## 🔄 Maintenance

### Regular Tasks
- **Daily:** Monitor error logs, uptime
- **Weekly:** Review security alerts, performance metrics
- **Monthly:** Rotate secrets, update dependencies
- **Quarterly:** Security audit, load testing

### Backup Strategy
- MongoDB: Automated daily backups (Atlas)
- Files: S3 versioning enabled
- Config: Store .env template in secure vault

## 🆘 Rollback Plan

If deployment fails:
1. Revert to previous Git commit
2. Redeploy from previous stable version
3. Check environment variables
4. Review recent changes in logs

## 📞 Support Contacts

- **Database Issues:** MongoDB Atlas Support
- **Payment Issues:** Stripe Support Dashboard
- **Hosting Issues:** Platform support (Render/Railway/DO)
- **DNS Issues:** Domain registrar support

## ✅ Production Readiness Score

Current Status: **45%**

**Blockers:**
- [ ] MongoDB credentials exposed (rotate immediately)
- [ ] Weak JWT secrets (generate 64+ char)
- [ ] No error monitoring configured
- [ ] No automated backups verified
- [ ] CORS allows all in production

**Complete these blockers before going live!**
