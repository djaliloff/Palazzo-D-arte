/**
 * Simple logger utility
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

export const logger = {
  info: (...args) => {
    console.log(`${colors.cyan}ℹ${colors.reset}`, ...args);
  },
  
  success: (...args) => {
    console.log(`${colors.green}✓${colors.reset}`, ...args);
  },
  
  error: (...args) => {
    console.error(`${colors.red}✗${colors.reset}`, ...args);
  },
  
  warn: (...args) => {
    console.warn(`${colors.yellow}⚠${colors.reset}`, ...args);
  },
  
  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${colors.magenta}🐛${colors.reset}`, ...args);
    }
  },
};

