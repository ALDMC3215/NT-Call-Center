export const formatPhoneNumber = (phone: string) => {
  if (!phone) return '';
  const p = phone.trim();
  if (p.length === 11 && /^\d+$/.test(p)) {
    return p.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  return p;
};
