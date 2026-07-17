export const formatPhoneNumber = (phone: string) => {
  if (!phone) return '';
  const p = phone.trim();
  if (p.length === 11 && /^\d+$/.test(p)) {
    return p.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  return p;
};

export const applyCertificateFee = (priceStr?: string) => {
  if (!priceStr) return priceStr;
  
  const normalized = priceStr.replace(/[۰-۹]/g, d => '0123456789'[d.charCodeAt(0) - 1776]);
  const match = normalized.match(/([0-9,]+)/);
  if (!match) return priceStr;
  
  const num = parseInt(match[1].replace(/,/g, ''), 10);
  if (isNaN(num)) return priceStr;
  
  const newNum = num + 300000;
  return normalized.replace(match[1], newNum.toLocaleString('en-US'));
};
