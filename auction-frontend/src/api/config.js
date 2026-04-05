// API Configuration
export const API_BASE_URL = 'https://cricket-auction-bcie.onrender.com/api';

// Utility to format currency
export const formatCurrency = (amount, symbol = '$') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  }).format(amount).replace('$', symbol);
};

export const getDriveDirectUrl = (url) => {
  if (!url) return url;
  if (url.includes('drive.google.com/file/d/')) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      // The lh3.googleusercontent.com/d/ endpoint reliably serves raw image bytes for public Google Drive files
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }
  return url;
};

export const fetchApi = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API Error: ${response.status}`);
  }

  return response.json();
};
