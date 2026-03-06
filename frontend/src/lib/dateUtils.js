/**
 * Utility functions to consistently enforce Asia/Kolkata (IST) time zone across the application.
 */

const TIMEZONE = 'Asia/Kolkata';

/**
 * Returns a new native Date object shifted so that its local time methods (getFullYear, getMonth, getDate) 
 * correspond to the current time in IST.
 */
export const getISTDate = (date = new Date()) => {
    const istString = new Date(date).toLocaleString("en-US", { timeZone: TIMEZONE });
    return new Date(istString);
};

/**
 * Returns today's date formatted as YYYY-MM-DD in IST.
 */
export const getISTTodayString = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
};

/**
 * Returns the 1st day of the current month formatted as YYYY-MM-DD in IST.
 */
export const getISTMonthStartString = () => {
    const istDate = getISTDate();
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
};

/**
 * Returns the last day of the current month formatted as YYYY-MM-DD in IST.
 */
export const getISTMonthEndString = () => {
    const istDate = getISTDate();
    const year = istDate.getFullYear();
    const month = istDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
};

/**
 * Returns a date string formatted as YYYY-MM-DD that is `days` before today in IST.
 */
export const getISTDateStringDaysAgo = (days) => {
    const istDate = getISTDate();
    istDate.setDate(istDate.getDate() - days);

    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const day = String(istDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};
