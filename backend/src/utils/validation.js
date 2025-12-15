/**
 * Shared validation utilities
 * Eliminates duplicate validation logic across frontend and backend
 */

/**
 * Validate email format
 */
exports.isValidEmail = (email) => {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
exports.isValidPassword = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase) {
    return { valid: false, message: 'Password must include at least one uppercase letter' };
  }
  if (!hasLowerCase) {
    return { valid: false, message: 'Password must include at least one lowercase letter' };
  }
  if (!hasNumber) {
    return { valid: false, message: 'Password must include at least one number' };
  }
  if (!hasSpecialChar) {
    return { valid: false, message: 'Password must include at least one special character' };
  }

  return { valid: true };
};

/**
 * Get password strength score (0-4)
 */
exports.getPasswordStrength = (password) => {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

  return Math.min(strength, 4); // 0=very weak, 1=weak, 2=fair, 3=good, 4=strong
};

/**
 * Sanitize user input to prevent XSS
 */
exports.sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
};

/**
 * Validate phone number (basic)
 */
exports.isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate audio file extension
 */
exports.isValidAudioFile = (filename) => {
  const validExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma'];
  const extension = filename.split('.').pop().toLowerCase();
  return validExtensions.includes(extension);
};

/**
 * Validate file size (in bytes)
 */
exports.isValidFileSize = (size, maxSize = 100 * 1024 * 1024) => { // Default 100MB
  return size > 0 && size <= maxSize;
};

/**
 * Validate MongoDB ObjectId
 */
exports.isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Validate date range
 */
exports.isValidDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, message: 'Invalid date format' };
  }
  
  if (start > end) {
    return { valid: false, message: 'Start date must be before end date' };
  }
  
  return { valid: true };
};

/**
 * Validate pagination parameters
 */
exports.validatePagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  
  const validPage = pageNum >= 1 ? pageNum : 1;
  const validLimit = limitNum >= 1 && limitNum <= 100 ? limitNum : 10; // Max 100 per page
  
  return { page: validPage, limit: validLimit };
};
