// ============================================================
// STL Streaming Analyzer - Binary-only, no memory buffering
// ============================================================

import { Readable } from 'stream';

export interface StreamAnalysisResult {
  boundingBoxMm: { x: number; y: number; z: number };
  volumeMm3: number;
  surfaceAreaMm2: number;
  triangleCount: number;
}

/**
 * Check if STL header indicates ASCII format
 * ASCII STL starts with "solid" (word boundary) and contains "facet" within first ~512 bytes
 */
async function detectASCIISTL(stream: NodeJS.ReadableStream): Promise<boolean> {
  const reader = stream as Readable;
  
  // Read first chunk (usually at least 512 bytes)
  const chunk = reader.read(512) || reader.read();
  
  if (!chunk) {
    throw new Error('Empty file or failed to read header');
  }

  // Push chunk back for further reading
  reader.unshift(chunk);

  // Check if it starts with "solid" (case-insensitive, trimmed)
  const header = chunk.toString('utf-8', 0, Math.min(80, chunk.length)).toLowerCase().trim();
  if (!header.startsWith('solid')) {
    return false;
  }

  // If it starts with "solid", check for "facet" keyword (ASCII marker)
  const headerLong = chunk.toString('utf-8', 0, Math.min(512, chunk.length)).toLowerCase();
  return headerLong.includes('facet');
}

/**
 * Read exact number of bytes from stream
 */
async function readExactBytes(stream: Readable, count: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let totalRead = 0;

  while (totalRead < count) {
    const chunk = stream.read(count - totalRead);
    if (chunk === null) {
      // Wait for more data
      await new Promise<void>((resolve, reject) => {
        const onReadable = () => {
          stream.off('readable', onReadable);
          stream.off('end', onEnd);
          stream.off('error', onError);
          resolve();
        };
        const onEnd = () => {
          stream.off('readable', onReadable);
          stream.off('end', onEnd);
          stream.off('error', onError);
          reject(new Error('Unexpected end of stream'));
        };
        const onError = (err: Error) => {
          stream.off('readable', onReadable);
          stream.off('end', onEnd);
          stream.off('error', onError);
          reject(err);
        };

        stream.once('readable', onReadable);
        stream.once('end', onEnd);
        stream.once('error', onError);
      });
      continue;
    }

    chunks.push(chunk);
    totalRead += chunk.length;
  }

  return Buffer.concat(chunks, count);
}

/**
 * Stream-process binary STL file and compute geometry metrics
 * 
 * Binary STL format:
 * - 80 bytes: header
 * - 4 bytes: uint32 LE triangle count
 * - For each triangle (50 bytes):
 *   - 12 bytes: normal (3 x float32 LE) - ignored
 *   - 36 bytes: vertices (9 x float32 LE)
 *   - 2 bytes: attribute byte count - ignored
 */
export async function analyzeSTLStream(stream: NodeJS.ReadableStream): Promise<StreamAnalysisResult> {
  const readable = stream as Readable;

  // Detect ASCII STL and reject
  const isASCII = await detectASCIISTL(readable);
  if (isASCII) {
    throw new Error('ASCII STL format is not supported. Please convert to binary STL format.');
  }

  // Read 80-byte header
  const header = await readExactBytes(readable, 80);
  
  // Read triangle count (4 bytes, uint32 LE)
  const countBuffer = await readExactBytes(readable, 4);
  const triangleCount = countBuffer.readUInt32LE(0);

  if (triangleCount === 0) {
    throw new Error('STL file contains no triangles');
  }

  if (triangleCount > 100_000_000) {
    throw new Error('STL file contains too many triangles (> 100M)');
  }

  // Initialize bounding box tracking
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  // Initialize volume accumulator (using signed tetrahedron method)
  let totalVolume = 0;

  // Initialize surface area accumulator
  let totalSurfaceArea = 0;

  // Process each triangle
  for (let i = 0; i < triangleCount; i++) {
    // Read 50 bytes for this triangle
    const triangleBuffer = await readExactBytes(readable, 50);

    // Skip normal (bytes 0-11)
    // Read vertices (bytes 12-47)
    const v1x = triangleBuffer.readFloatLE(12);
    const v1y = triangleBuffer.readFloatLE(16);
    const v1z = triangleBuffer.readFloatLE(20);

    const v2x = triangleBuffer.readFloatLE(24);
    const v2y = triangleBuffer.readFloatLE(28);
    const v2z = triangleBuffer.readFloatLE(32);

    const v3x = triangleBuffer.readFloatLE(36);
    const v3y = triangleBuffer.readFloatLE(40);
    const v3z = triangleBuffer.readFloatLE(44);

    // Skip attribute bytes (bytes 48-49)

    // Update bounding box
    minX = Math.min(minX, v1x, v2x, v3x);
    maxX = Math.max(maxX, v1x, v2x, v3x);
    minY = Math.min(minY, v1y, v2y, v3y);
    maxY = Math.max(maxY, v1y, v2y, v3y);
    minZ = Math.min(minZ, v1z, v2z, v3z);
    maxZ = Math.max(maxZ, v1z, v2z, v3z);

    // Compute signed volume of tetrahedron formed by triangle and origin
    // V = (v1 · (v2 × v3)) / 6
    const crossX = v2y * v3z - v2z * v3y;
    const crossY = v2z * v3x - v2x * v3z;
    const crossZ = v2x * v3y - v2y * v3x;

    const signedVolume = (v1x * crossX + v1y * crossY + v1z * crossZ) / 6;
    totalVolume += signedVolume;

    // Compute surface area of this triangle
    // Edge vectors from v1
    const edge1x = v2x - v1x;
    const edge1y = v2y - v1y;
    const edge1z = v2z - v1z;

    const edge2x = v3x - v1x;
    const edge2y = v3y - v1y;
    const edge2z = v3z - v1z;

    // Cross product of edges
    const areaCrossX = edge1y * edge2z - edge1z * edge2y;
    const areaCrossY = edge1z * edge2x - edge1x * edge2z;
    const areaCrossZ = edge1x * edge2y - edge1y * edge2x;

    // Magnitude of cross product / 2 = triangle area
    const crossMagnitude = Math.sqrt(
      areaCrossX * areaCrossX + areaCrossY * areaCrossY + areaCrossZ * areaCrossZ
    );
    totalSurfaceArea += crossMagnitude / 2;
  }

  // Verify we've read all triangles
  const remaining = readable.read();
  if (remaining && remaining.length > 0) {
    console.warn(`Warning: ${remaining.length} extra bytes after triangle data`);
  }

  // Compute final values
  const volumeMm3 = Math.abs(totalVolume);
  const boundingBoxMm = {
    x: Math.round((maxX - minX) * 100) / 100,
    y: Math.round((maxY - minY) * 100) / 100,
    z: Math.round((maxZ - minZ) * 100) / 100,
  };

  return {
    boundingBoxMm,
    volumeMm3,
    surfaceAreaMm2: totalSurfaceArea,
    triangleCount,
  };
}
