/**
 * Format a number as currency (USD)
 * @param {number|string} value - The value to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(parseFloat(value));
};

/**
 * Format a number as percentage
 * @param {number|string} value - The value to format
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value) => {
    return `${value}%`;
};

/**
 * Calculate days between two dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Number of days between dates
 */
export const daysBetween = (date1, date2) => {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    return Math.round(Math.abs((date1 - date2) / oneDay));
};

/**
 * Check if a date is within a date range
 * @param {Date} date - The date to check
 * @param {Date} startDate - Start of the range
 * @param {Date} endDate - End of the range
 * @returns {boolean} True if date is within range
 */
export const isDateInRange = (date, startDate, endDate) => {
    return date >= startDate && date <= endDate;
}; 