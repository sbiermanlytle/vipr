// The two helpers Gaia's programs use from okapi's core library (libs/core/src): Log, from
// Log.ts, and hexToRgb, from utils.ts.

export const LOGS_ENABLED = true;

export class Log {
  static formatMessage(source, msg: string) {
    if (typeof source === 'string' || source instanceof String) {
      return `[${source}] ${msg}`;
    }
    return `[${source.constructor.name}] ${msg}`;
  }

  static info(source, msg: string) {
    if (LOGS_ENABLED) {
      console.log(Log.formatMessage(source, msg)); // eslint-disable-line no-console
    }
  }

  static warn(source, msg: string) {
    if (LOGS_ENABLED) {
      console.warn(Log.formatMessage(source, msg)); // eslint-disable-line no-console
    }
  }

  static error(source, msg: string) {
    if (LOGS_ENABLED) {
      console.error(Log.formatMessage(source, msg)); // eslint-disable-line no-console
    }
  }
}

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}
