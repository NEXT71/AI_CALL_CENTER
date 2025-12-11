# Security Audit Report - QualityPulse AI Call Center
**Date:** December 12, 2025  
**Auditor:** System Security Review  
**Scope:** Frontend & Backend Authentication, Authorization, Data Exposure

---

## 🔴 CRITICAL SEVERITY ISSUES

### 1. **Complete Frontend Auth Bypass - Guest Mode Vulnerability**
**Severity:** CRITICAL  
**Location:** `frontend/src/components/Layout.jsx`, `frontend/src/App.jsx`  
**Issue:**  
- All `/app/*` routes are completely accessible without authentication
- Guest users can access Dashboard, Calls, Upload, Rules, Analytics pages
- No frontend route guards protecting sensitive pages
- Backend API calls are attempted even when not logged in

**Impact:**  
- Unauthorized access to application UI
- Potential data exposure if backend doesn't enforce auth strictly
- Users can attempt to view/manipulate data without credentials

**Proof:**
```javascript
// Layout.jsx line 33-34
// Shows all navigation items when no user is logged in
const filteredNavigation = user ? navigation.filter(item => hasRole(item.roles)) : navigation;
```

**Reproduction:**
1. Open browser in incognito mode
2. Navigate to `http://localhost:5173/app/dashboard`
3. Dashboard loads with "Guest User" / "Demo Mode" shown
4. Can navigate to all app pages without login

**Recommended Fix:**
```javascript
// App.jsx - Add ProtectedRoute wrapper
import ProtectedRoute from './components/ProtectedRoute';

<Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
  {/* ... all app routes */}
</Route>

// ProtectedRoute.jsx - New component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return <LoadingSpinner />;
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};
```

---

### 2. **API Calls Without Authentication Tokens**
**Severity:** CRITICAL  
**Location:** `frontend/src/services/api.js`  
**Issue:**  
- Frontend makes API calls even when no user is logged in
- API interceptor tries to add token from localStorage (which is null for guests)
- Backend APIs are protected, but frontend doesn't prevent failed calls
- Error handling silently fails, showing empty data states

**Impact:**  
- Console filled with 401 errors
- Poor user experience with loading states that fail
- Potential information leakage through error messages
- Resource waste on failed API calls

**Proof:**
```javascript
// Dashboard.jsx makes API calls regardless of auth state
const fetchDashboardData = async () => {
  const [callsResponse, analyticsResponse, salesResponse] = await Promise.all([
    callService.getCalls({ limit: 10, status: 'completed' }), // Will fail with 401
    reportService.getAnalyticsSummary(dateRange).catch(() => ({ data: null })),
    reportService.getSalesSummary(dateRange).catch(() => ({ data: null })),
  ]);
};
```

**Recommended Fix:**
```javascript
// Dashboard.jsx - Check auth before API calls
const fetchDashboardData = async () => {
  if (!user) {
    // Show demo data or redirect to login
    return;
  }
  // ... existing API calls
};
```

---

### 3. **Open Registration Endpoint**
**Severity:** CRITICAL  
**Location:** `backend/src/routes/authRoutes.js`  
**Issue:**  
- `/api/auth/register` is completely open to public
- Anyone can create unlimited accounts
- No email verification required
- No CAPTCHA or bot prevention
- Rate limiting exists but can be bypassed with IP rotation

**Impact:**  
- Database can be flooded with fake accounts
- Resource exhaustion attacks possible
- Spam account creation
- Credential stuffing preparation

**Proof:**
```javascript
// authRoutes.js line 13-19
// NOTE: Registration should be protected in production (admin-only)
router.post(
  '/register',
  registerLimiter,
  validateRegister,
  handleValidationErrors,
  authController.register
);
```

**Recommended Fix:**
```javascript
// Option 1: Admin-only registration after initial setup
router.post(
  '/register',
  registerLimiter,
  protect,
  authorize('Admin'),
  validateRegister,
  handleValidationErrors,
  authController.register
);

// Option 2: Add email verification flow
// - Send verification email on registration
// - Mark account as inactive until verified
// - Add CAPTCHA (Google reCAPTCHA v3)
// - Implement invite-only system for production
```

---

### 4. **No Trial Expiration Logic**
**Severity:** HIGH  
**Location:** `frontend/src/pages/Signup.jsx`, `backend/src/controllers/authController.js`  
**Issue:**  
- Signup flow collects plan and trial information but never stores trial expiration
- No `trialExpiresAt` field in User model
- Users can access system indefinitely without payment
- No background job to check trial status

**Impact:**  
- Free access to paid features forever
- No revenue generation
- Business model broken

**Recommended Fix:**
```javascript
// User model - Add fields
trialExpiresAt: {
  type: Date,
  default: function() {
    return new Date(Date.now() + (this.trialDays || 14) * 24 * 60 * 60 * 1000);
  }
},
trialDays: { type: Number, default: 14 },
subscriptionStatus: {
  type: String,
  enum: ['trial', 'active', 'expired', 'cancelled'],
  default: 'trial'
},

// Middleware to check trial status
exports.checkTrialExpiration = async (req, res, next) => {
  if (req.user.subscriptionStatus === 'trial' && 
      new Date() > req.user.trialExpiresAt) {
    req.user.subscriptionStatus = 'expired';
    await req.user.save();
    return res.status(402).json({
      success: false,
      message: 'Trial period expired. Please upgrade your plan.'
    });
  }
  next();
};
```

---

### 5. **Hardcoded Demo Credentials in Frontend**
**Severity:** HIGH  
**Location:** `frontend/src/pages/Login.jsx`  
**Issue:**  
- Demo credentials are displayed in plain text on login page
- Provides attackers with valid login credentials
- These accounts likely have elevated privileges (Admin, Manager)
- Should never be in production code

**Proof:**
```javascript
// Login.jsx
<div className="mt-6 p-4 bg-gray-50 rounded-lg">
  <p className="text-xs text-gray-600 font-medium mb-2">Demo Credentials:</p>
  <div className="text-xs text-gray-500 space-y-1">
    <p>• Admin: admin@nextel.com / Admin123!</p>
    <p>• Manager: manager@nextel.com / Manager123!</p>
    <p>• Agent: agent1@nextel.com / Agent123!</p>
  </div>
</div>
```

**Impact:**  
- Anyone can login with admin access
- Data manipulation/deletion possible
- System configuration changes
- Complete security compromise

**Recommended Fix:**
```javascript
// Remove demo credentials section entirely in production
// OR use environment variable to control visibility
{import.meta.env.MODE === 'development' && (
  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
    {/* Demo credentials only in dev mode */}
  </div>
)}
```

---

## 🟠 HIGH SEVERITY ISSUES

### 6. **No Role-Based UI Restrictions**
**Severity:** HIGH  
**Location:** `frontend/src/components/Layout.jsx`  
**Issue:**  
- Role-based filtering only hides navigation items
- Direct URL access bypasses role checks
- Agent role can access `/app/rules` by typing URL directly
- Frontend only cosmetic restriction, backend must enforce

**Proof:**
```javascript
// Layout.jsx - Navigation filtered by role
const filteredNavigation = user ? navigation.filter(item => hasRole(item.roles)) : navigation;

// But routes in App.jsx have no role protection
<Route path="rules" element={<ComplianceRules />} />
```

**Recommended Fix:**
```javascript
// Create RoleGuard component
const RoleGuard = ({ allowedRoles, children }) => {
  const { user, hasRole } = useAuth();
  
  if (!hasRole(allowedRoles)) {
    return <Navigate to="/app/dashboard" replace />;
  }
  
  return children;
};

// App.jsx
<Route path="rules" element={
  <RoleGuard allowedRoles={['Admin', 'Manager']}>
    <ComplianceRules />
  </RoleGuard>
} />
```

---

### 7. **Missing Input Sanitization on Frontend Forms**
**Severity:** HIGH  
**Location:** All form components (Signup, Login, UploadCall, ComplianceRules)  
**Issue:**  
- No XSS protection in form inputs
- No HTML entity encoding
- Script tags could be injected via name, company fields
- DOMPurify or similar sanitization library not used

**Impact:**  
- XSS attacks possible
- Stored XSS in database
- Session hijacking
- Cookie theft

**Recommended Fix:**
```javascript
// Install DOMPurify
npm install dompurify

// Use in forms
import DOMPurify from 'dompurify';

const sanitizeInput = (input) => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

const handleSubmit = (e) => {
  e.preventDefault();
  const sanitizedData = {
    name: sanitizeInput(formData.name),
    company: sanitizeInput(formData.company),
    // ... etc
  };
};
```

---

### 8. **Weak Password Requirements**
**Severity:** HIGH  
**Location:** `frontend/src/pages/Signup.jsx`  
**Issue:**  
- Minimum password length only 6 characters
- No complexity requirements (uppercase, numbers, symbols)
- No password strength meter
- Easily brute-forced

**Proof:**
```javascript
// Signup.jsx line 76-79
if (formData.password.length < 6) {
  setError('Password must be at least 6 characters');
  return;
}
```

**Recommended Fix:**
```javascript
// Stronger validation
const validatePassword = (password) => {
  const minLength = 12;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length < minLength) {
    return 'Password must be at least 12 characters';
  }
  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return 'Password must include uppercase, lowercase, numbers, and special characters';
  }
  return null;
};
```

---

### 9. **JWT Token in localStorage (XSS Vulnerability)**
**Severity:** HIGH  
**Location:** `frontend/src/context/AuthContext.jsx`, `frontend/src/services/api.js`  
**Issue:**  
- Access tokens stored in localStorage are vulnerable to XSS
- If XSS vulnerability exists, tokens can be stolen
- Should use httpOnly cookies for tokens
- Refresh tokens also in localStorage

**Proof:**
```javascript
// AuthContext.jsx line 47-49
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
localStorage.setItem('user', JSON.stringify(user));
```

**Impact:**  
- Token theft via XSS
- Account takeover
- Session hijacking

**Recommended Fix:**
```javascript
// Backend should set tokens in httpOnly cookies
// authController.js
res.cookie('accessToken', accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000 // 15 minutes
});

res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

// Frontend - Remove token from localStorage, use cookie automatically
```

---

### 10. **No CSRF Protection**
**Severity:** HIGH  
**Location:** Backend API endpoints  
**Issue:**  
- No CSRF tokens implemented
- State-changing operations (POST, PUT, DELETE) vulnerable
- If using cookies for auth (recommended), CSRF protection is critical

**Recommended Fix:**
```javascript
// Install csurf middleware
npm install csurf

// app.js
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

---

## 🟡 MEDIUM SEVERITY ISSUES

### 11. **No Rate Limiting on Login Page**
**Severity:** MEDIUM  
**Location:** `frontend/src/pages/Login.jsx`  
**Issue:**  
- Frontend has no protection against rapid login attempts
- Backend has rate limiting, but frontend should also throttle
- Brute force attempts can overload backend

**Recommended Fix:**
```javascript
// Add client-side rate limiting
import { useState, useEffect } from 'react';

const [loginAttempts, setLoginAttempts] = useState(0);
const [lockoutTime, setLockoutTime] = useState(null);

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (lockoutTime && Date.now() < lockoutTime) {
    const remainingSeconds = Math.ceil((lockoutTime - Date.now()) / 1000);
    setError(`Too many attempts. Please wait ${remainingSeconds} seconds.`);
    return;
  }
  
  // ... login logic
  
  if (!result.success) {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    
    if (newAttempts >= 5) {
      setLockoutTime(Date.now() + 60000); // 60 second lockout
      setLoginAttempts(0);
    }
  }
};
```

---

### 12. **Sensitive Data in Error Messages**
**Severity:** MEDIUM  
**Location:** `backend/src/middleware/auth.js`, API error responses  
**Issue:**  
- Error messages may reveal system information
- "User not found or inactive" confirms user existence
- Stack traces in development mode leak server info

**Recommended Fix:**
```javascript
// Generic error messages for auth
return res.status(401).json({
  success: false,
  message: 'Invalid credentials' // Don't specify which field is wrong
});

// Ensure stack traces only in development
if (process.env.NODE_ENV === 'production') {
  delete error.stack;
}
```

---

### 13. **No Email Verification Flow**
**Severity:** MEDIUM  
**Location:** `frontend/src/pages/Signup.jsx`, `backend/src/controllers/authController.js`  
**Issue:**  
- Users can signup with any email address
- No email ownership verification
- Typos in email lead to lost accounts
- Fake emails accepted

**Recommended Fix:**
```javascript
// User model
emailVerified: { type: Boolean, default: false },
emailVerificationToken: String,
emailVerificationExpires: Date,

// Send verification email on signup
// Block sensitive actions until verified
exports.requireEmailVerification = (req, res, next) => {
  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email before accessing this feature'
    });
  }
  next();
};
```

---

### 14. **No Audit Logging**
**Severity:** MEDIUM  
**Location:** All backend controllers  
**Issue:**  
- No logging of sensitive actions (login, data changes, deletions)
- Can't track who did what and when
- No forensics capability
- Compliance issues (GDPR, SOC2)

**Recommended Fix:**
```javascript
// Create AuditLog model
const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: String, // 'login', 'create_call', 'delete_rule', etc.
  resource: String,
  resourceId: String,
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now },
  details: mongoose.Schema.Types.Mixed
});

// Middleware to log actions
const auditLog = (action) => async (req, res, next) => {
  await AuditLog.create({
    user: req.user?._id,
    action,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    details: { body: req.body, params: req.params }
  });
  next();
};
```

---

### 15. **No File Upload Validation**
**Severity:** MEDIUM  
**Location:** `backend/src/routes/callRoutes.js`, `frontend/src/pages/UploadCall.jsx`  
**Issue:**  
- File type validation may be insufficient
- File size limits not clearly enforced on frontend
- Malicious files could be uploaded
- No virus scanning

**Recommended Fix:**
```javascript
// Frontend - Strict file validation
const validateFile = (file) => {
  const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3'];
  const maxSize = 100 * 1024 * 1024; // 100MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only WAV and MP3 files are allowed');
  }
  
  if (file.size > maxSize) {
    throw new Error('File size must be less than 100MB');
  }
};

// Backend - Add ClamAV virus scanning
const clamscan = require('clamscan');

const scanFile = async (filePath) => {
  const scanner = await new clamscan().init();
  const { isInfected, viruses } = await scanner.scanFile(filePath);
  
  if (isInfected) {
    fs.unlinkSync(filePath);
    throw new Error(`Malicious file detected: ${viruses.join(', ')}`);
  }
};
```

---

## 🟢 LOW SEVERITY ISSUES

### 16. **Plan Data Not Stored in User Model**
**Severity:** LOW (Business Logic)  
**Location:** `frontend/src/pages/Signup.jsx`  
**Issue:**  
- User selects a plan during signup
- Plan is passed to register() function
- But User model may not have `plan` field
- Billing data not properly tracked

**Recommended Fix:**
```javascript
// User model - Add subscription fields
subscription: {
  plan: { 
    type: String, 
    enum: ['starter', 'professional', 'enterprise'],
    default: 'starter'
  },
  status: { 
    type: String, 
    enum: ['trial', 'active', 'cancelled', 'expired'],
    default: 'trial'
  },
  trialEndsAt: Date,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  stripeCustomerId: String,
  stripeSubscriptionId: String
}
```

---

### 17. **Missing Environment Variable Validation**
**Severity:** LOW  
**Location:** `frontend/src/services/api.js`, `backend/src/config/config.js`  
**Issue:**  
- No validation that required env vars are set
- App may start with default/incorrect values
- Hard to debug misconfigurations

**Recommended Fix:**
```javascript
// Backend config/config.js
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'OPENAI_API_KEY'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

---

### 18. **No Logout All Devices Feature**
**Severity:** LOW  
**Location:** `frontend/src/context/AuthContext.jsx`  
**Issue:**  
- Users can't invalidate all sessions if token is compromised
- Logout only clears local storage
- Tokens remain valid until expiration

**Recommended Fix:**
```javascript
// User model - Track token versions
tokenVersion: { type: Number, default: 0 },

// Middleware to validate token version
const decoded = jwt.verify(token, config.jwt.secret);
const user = await User.findById(decoded.id);

if (decoded.tokenVersion !== user.tokenVersion) {
  return res.status(401).json({ message: 'Token invalidated' });
}

// Logout all devices - increment token version
exports.logoutAllDevices = async (req, res) => {
  req.user.tokenVersion += 1;
  await req.user.save();
  res.json({ message: 'Logged out from all devices' });
};
```

---

### 19. **No Content Security Policy (CSP)**
**Severity:** LOW  
**Location:** `backend/src/app.js`  
**Issue:**  
- No CSP headers to prevent XSS
- Inline scripts allowed
- External resources unrestricted

**Recommended Fix:**
```javascript
// Install helmet
npm install helmet

// app.js
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Remove unsafe-inline in production
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.API_URL],
    },
  },
}));
```

---

### 20. **Missing 404 and Error Boundaries**
**Severity:** LOW  
**Location:** `frontend/src/App.jsx`  
**Issue:**  
- Invalid routes redirect to home
- No custom 404 page
- No React Error Boundaries to catch crashes
- Poor user experience

**Recommended Fix:**
```javascript
// Create ErrorBoundary component
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorPage />;
    }
    return this.props.children;
  }
}

// App.jsx
<Route path="*" element={<NotFound />} />
```

---

## 📋 SUMMARY

### Critical Issues: 5
1. Complete frontend auth bypass
2. API calls without authentication
3. Open registration endpoint
4. No trial expiration logic
5. Hardcoded demo credentials

### High Issues: 5
6. No role-based UI restrictions
7. Missing input sanitization
8. Weak password requirements
9. JWT in localStorage
10. No CSRF protection

### Medium Issues: 5
11. No frontend rate limiting
12. Sensitive error messages
13. No email verification
14. No audit logging
15. No file upload validation

### Low Issues: 5
16. Plan data not stored
17. No env var validation
18. No logout all devices
19. No CSP headers
20. Missing error boundaries

---

## 🎯 PRIORITY FIX ORDER

### Phase 1 - Immediate (Critical Security)
1. Add ProtectedRoute wrapper to `/app/*` routes
2. Remove demo credentials from production
3. Implement trial expiration logic
4. Add frontend auth checks before API calls
5. Secure registration endpoint (admin-only or email verification)

### Phase 2 - Short Term (High Security)
6. Implement role-based route guards
7. Add input sanitization to all forms
8. Strengthen password requirements
9. Move tokens to httpOnly cookies
10. Implement CSRF protection

### Phase 3 - Medium Term (Hardening)
11. Add client-side rate limiting
12. Generic error messages
13. Email verification flow
14. Audit logging system
15. File upload validation & scanning

### Phase 4 - Long Term (Polish)
16. Complete subscription management
17. Environment validation
18. Logout all devices feature
19. CSP headers
20. Error boundaries & 404 pages

---

## 🛡️ COMPLIANCE CONSIDERATIONS

**GDPR Requirements:**
- ✅ User data stored in database
- ❌ No data deletion endpoint
- ❌ No data export endpoint
- ❌ No privacy policy linked properly
- ❌ No cookie consent banner

**SOC2 Requirements:**
- ❌ No audit logging
- ❌ No access control documentation
- ❌ No encryption at rest verification
- ❌ No security incident response plan

**PCI DSS (if handling payments):**
- ❌ No payment data isolation
- ❌ No card data encryption
- ❌ No vulnerability scanning
- ❌ No penetration testing

---

**End of Security Audit Report**
