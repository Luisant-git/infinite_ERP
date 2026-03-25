// Validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

export const validateGST = (gst) => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst);
};

export const validateMobile = (mobile) => {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
};

// Formatting utilities
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN');
};

// Permission utilities
export const hasAnyPermission = (userPermissions, requiredPermissions) => {
  return requiredPermissions.some(permission => userPermissions[permission]);
};

// Financial Year utilities
export const getFYRange = (fyString, tenant) => {
  let startMonth = 4; // April
  let startDay = 1;
  let endMonth = 3; // March
  let endDay = 31;

  if (tenant && tenant.startMonth) {
    startMonth = tenant.startMonth;
    startDay = tenant.startDay || 1;
    endMonth = tenant.endMonth || 3;
    endDay = tenant.endDay || 31;
  }

  // Parse "FY 25-26" -> 2025, 2026
  if (!fyString) return null;
  const match = fyString.match(/(\d+)-(\d+)/);
  if (!match) return null;

  const startYear = 2000 + parseInt(match[1]);
  const endYear = startMonth > endMonth ? startYear + 1 : startYear; // Handle calendar year case if startMonth <= endMonth

  const startDate = new Date(startYear, startMonth - 1, startDay);
  const endDate = new Date(endYear, endMonth - 1, endDay);
  
  // End date should be at 23:59:59.999
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};