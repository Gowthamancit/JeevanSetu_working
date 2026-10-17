/**
 * Formats a date string to DD/MM/YYYY as required by the UX specifications.
 * @param {string|Date} dateVal 
 * @returns {string}
 */
export const formatDate = (dateVal) => {
  if (!dateVal) return 'N/A';
  
  try {
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return String(dateVal);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateVal);
  }
};

/**
 * Formats a date string to YYYY-MM-DD for standard HTML date input fields.
 * @param {string|Date} dateVal 
 * @returns {string}
 */
export const formatInputDate = (dateVal) => {
  if (!dateVal) return '';
  try {
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};
