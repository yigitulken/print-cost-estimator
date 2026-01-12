/**
 * Formats bytes to human-readable string with appropriate unit
 * Uses binary (base 1024) conversion
 * 
 * @param bytes - Number of bytes to format
 * @returns Formatted string (e.g., "47.7 MB", "1.2 KB", "512 B")
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;
  
  if (bytes < MB) {
    return `${(bytes / KB).toFixed(1)} KB`;
  }
  
  if (bytes < GB) {
    return `${(bytes / MB).toFixed(1)} MB`;
  }
  
  return `${(bytes / GB).toFixed(1)} GB`;
}
