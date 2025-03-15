/**
 * Utility functions for parsing and formatting durations
 */

/**
 * Parse a duration string (like "1d2h30m") into milliseconds
 * @param {string} durationString - The duration string to parse
 * @returns {number} The duration in milliseconds
 */
function parseDuration(durationString) {
    if (!durationString) return 0;
  
    const regex = /(\d+)([dhms])/g;
    let matches;
    let ms = 0;
  
    while ((matches = regex.exec(durationString)) !== null) {
      const value = parseInt(matches[1], 10);
      const unit = matches[2];
  
      switch (unit) {
        case 'd':
          ms += value * 24 * 60 * 60 * 1000; // days to ms
          break;
        case 'h':
          ms += value * 60 * 60 * 1000; // hours to ms
          break;
        case 'm':
          ms += value * 60 * 1000; // minutes to ms
          break;
        case 's':
          ms += value * 1000; // seconds to ms
          break;
      }
    }
  
    return ms;
  }
  
  /**
   * Format a duration in milliseconds to a human-readable string
   * @param {number} ms - The duration in milliseconds
   * @returns {string} The formatted duration string
   */
  function formatDuration(ms) {
    if (ms <= 0) return '0s';
  
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  
    const parts = [];
  
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
  
    return parts.join(' ');
  }
  
  module.exports = {
    parseDuration,
    formatDuration
  };