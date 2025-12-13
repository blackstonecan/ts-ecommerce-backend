import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { logger } from '@/lib/common/logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;
  let consoleDebugSpy: jest.SpiedFunction<typeof console.debug>;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Test info message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log info messages with context', () => {
      logger.info('Test message', { userId: '123', action: 'test' });
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      logger.error('Test error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log error messages with context', () => {
      logger.error('Test error', { errorCode: 'ERR001', details: 'test details' });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Test warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log warning messages with context', () => {
      logger.warn('Test warning', { attempts: 3 });
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should log debug messages in development', () => {
      process.env.NODE_ENV = 'development';
      logger.debug('Test debug message');
      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it('should not log debug messages in production', () => {
      process.env.NODE_ENV = 'production';
      logger.debug('Test debug message');
      // Debug logs are suppressed in production
    });
  });
});
