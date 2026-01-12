import { describe, it, expect } from 'vitest';
import { formatBytes } from './formatBytes';

describe('formatBytes', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1023)).toBe('1023 B');
  });

  it('formats kilobytes correctly', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(10240)).toBe('10.0 KB');
  });

  it('formats megabytes correctly', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB');
    expect(formatBytes(50 * 1024 * 1024)).toBe('50.0 MB');
    // 47.7 MB for 50,000,000 bytes
    expect(formatBytes(50000000)).toBe('47.7 MB');
  });

  it('formats gigabytes correctly', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB');
    expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
  });

  it('handles edge cases', () => {
    expect(formatBytes(1023.9)).toBe('1023.9 B');
    expect(formatBytes(1024.5)).toBe('1.0 KB');
    expect(formatBytes(1048575)).toBe('1024.0 KB');
    expect(formatBytes(1048576)).toBe('1.0 MB');
  });

  it('formats with one decimal place for KB/MB/GB', () => {
    expect(formatBytes(1536)).toMatch(/^\d+\.\d KB$/);
    expect(formatBytes(1.5 * 1024 * 1024)).toMatch(/^\d+\.\d MB$/);
    expect(formatBytes(1.5 * 1024 * 1024 * 1024)).toMatch(/^\d+\.\d GB$/);
  });
});
