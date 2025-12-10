/**
 * Formatters
 * Number, currency, date, and time formatting utilities
 */

const Formatters = {
  /**
   * Format currency value
   * @param {number} value - Value to format
   * @param {string} symbol - Currency symbol (default from config)
   * @param {number} decimals - Decimal places
   * @returns {string} Formatted currency
   */
  currency(value, symbol = CONFIG.CURRENCY.symbol, decimals = CONFIG.CURRENCY.decimals) {
    if (value === null || value === undefined || isNaN(value)) {
      return `${symbol}0.00`;
    }
    return `${symbol}${value.toFixed(decimals)}`;
  },

  /**
   * Format number with thousands separator
   * @param {number} value - Value to format
   * @param {number} decimals - Decimal places
   * @returns {string} Formatted number
   */
  number(value, decimals = 0) {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  },

  /**
   * Format percentage
   * @param {number} value - Value (0-100)
   * @param {number} decimals - Decimal places
   * @returns {string} Formatted percentage
   */
  percent(value, decimals = 1) {
    if (value === null || value === undefined || isNaN(value)) {
      return '0%';
    }
    return `${value.toFixed(decimals)}%`;
  },

  /**
   * Format time from minutes to "Xh Xm" or "Xm"
   * @param {number} minutes - Time in minutes
   * @returns {string} Formatted time
   */
  time(minutes) {
    if (minutes === null || minutes === undefined || isNaN(minutes) || minutes <= 0) {
      return '0m';
    }

    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (hrs > 0 && mins > 0) {
      return `${hrs}h ${mins}m`;
    } else if (hrs > 0) {
      return `${hrs}h`;
    } else {
      return `${mins}m`;
    }
  },

  /**
   * Format time from minutes to "X hours X minutes" (verbose)
   * @param {number} minutes - Time in minutes
   * @returns {string} Formatted time
   */
  timeVerbose(minutes) {
    if (minutes === null || minutes === undefined || isNaN(minutes) || minutes <= 0) {
      return '0 minutes';
    }

    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    const parts = [];
    if (hrs > 0) {
      parts.push(`${hrs} hour${hrs > 1 ? 's' : ''}`);
    }
    if (mins > 0) {
      parts.push(`${mins} minute${mins > 1 ? 's' : ''}`);
    }

    return parts.join(' ') || '0 minutes';
  },

  /**
   * Format weight in grams (auto-convert to kg if > 1000g)
   * @param {number} grams - Weight in grams
   * @param {number} decimals - Decimal places
   * @returns {string} Formatted weight
   */
  weight(grams, decimals = 1) {
    if (grams === null || grams === undefined || isNaN(grams)) {
      return '0g';
    }

    if (grams >= 1000) {
      return `${(grams / 1000).toFixed(decimals)}kg`;
    }
    return `${grams.toFixed(decimals)}g`;
  },

  /**
   * Format length in mm (auto-convert to m if > 1000mm)
   * @param {number} mm - Length in millimeters
   * @param {number} decimals - Decimal places
   * @returns {string} Formatted length
   */
  length(mm, decimals = 2) {
    if (mm === null || mm === undefined || isNaN(mm)) {
      return '0mm';
    }

    if (mm >= 1000) {
      return `${(mm / 1000).toFixed(decimals)}m`;
    }
    return `${mm.toFixed(decimals)}mm`;
  },

  /**
   * Format power in watts
   * @param {number} watts - Power in watts
   * @returns {string} Formatted power
   */
  power(watts) {
    if (watts === null || watts === undefined || isNaN(watts)) {
      return '0W';
    }
    return `${Math.round(watts)}W`;
  },

  /**
   * Format energy in kWh
   * @param {number} kwh - Energy in kilowatt-hours
   * @param {number} decimals - Decimal places
   * @returns {string} Formatted energy
   */
  energy(kwh, decimals = 3) {
    if (kwh === null || kwh === undefined || isNaN(kwh)) {
      return '0 kWh';
    }
    return `${kwh.toFixed(decimals)} kWh`;
  },

  /**
   * Format date to locale string
   * @param {string|Date} date - Date to format
   * @returns {string} Formatted date
   */
  date(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString();
  },

  /**
   * Format date and time to locale string
   * @param {string|Date} date - Date to format
   * @returns {string} Formatted date and time
   */
  dateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString();
  },

  /**
   * Format date to ISO string (YYYY-MM-DD)
   * @param {string|Date} date - Date to format
   * @returns {string} ISO date string
   */
  isoDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  },

  /**
   * Format file size
   * @param {number} bytes - Size in bytes
   * @param {number} decimals - Decimal places
   * @returns {string} Formatted size
   */
  fileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  },

  /**
   * Format price per gram
   * @param {number} pricePerGram - Price per gram
   * @returns {string} Formatted price
   */
  pricePerGram(pricePerGram) {
    if (pricePerGram === null || pricePerGram === undefined || isNaN(pricePerGram)) {
      return `${CONFIG.CURRENCY.symbol}0.00/g`;
    }
    return `${CONFIG.CURRENCY.symbol}${pricePerGram.toFixed(4)}/g`;
  },

  /**
   * Format price per hour
   * @param {number} pricePerHour - Price per hour
   * @returns {string} Formatted price
   */
  pricePerHour(pricePerHour) {
    if (pricePerHour === null || pricePerHour === undefined || isNaN(pricePerHour)) {
      return `${CONFIG.CURRENCY.symbol}0.00/hr`;
    }
    return `${CONFIG.CURRENCY.symbol}${pricePerHour.toFixed(4)}/hr`;
  },

  /**
   * Format electricity rate
   * @param {number} rate - Rate per kWh
   * @returns {string} Formatted rate
   */
  electricityRate(rate) {
    if (rate === null || rate === undefined || isNaN(rate)) {
      return `${CONFIG.CURRENCY.symbol}0.00/kWh`;
    }
    return `${CONFIG.CURRENCY.symbol}${rate.toFixed(2)}/kWh`;
  },

  /**
   * Format temperature
   * @param {number} temp - Temperature in Celsius
   * @returns {string} Formatted temperature
   */
  temperature(temp) {
    if (temp === null || temp === undefined || isNaN(temp)) {
      return '0°C';
    }
    return `${Math.round(temp)}°C`;
  },

  /**
   * Format temperature range
   * @param {number} min - Minimum temperature
   * @param {number} max - Maximum temperature
   * @returns {string} Formatted range
   */
  temperatureRange(min, max) {
    return `${Math.round(min)}°C - ${Math.round(max)}°C`;
  },

  /**
   * Format build volume
   * @param {Object} volume - { x, y, z } dimensions in mm
   * @returns {string} Formatted volume
   */
  buildVolume(volume) {
    if (!volume) return '';
    return `${volume.x} × ${volume.y} × ${volume.z} mm`;
  },

  /**
   * Truncate text with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  truncate(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  },
};
