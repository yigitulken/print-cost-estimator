// ============================================================
// STL Parser - Supports both Binary and ASCII formats
// ============================================================

export interface Triangle {
  normal: [number, number, number];
  vertices: [[number, number, number], [number, number, number], [number, number, number]];
}

export interface ParsedSTL {
  triangles: Triangle[];
  isBinary: boolean;
}

/**
 * Detects if an STL buffer is binary or ASCII format
 * Binary STL: 80-byte header + 4-byte triangle count + 50 bytes per triangle
 */
function isBinarySTL(buffer: Buffer): boolean {
  if (buffer.length < 84) {
    // Check if it might be ASCII - must start with "solid" (word boundary)
    const header = buffer.toString('utf-8', 0, Math.min(80, buffer.length)).toLowerCase().trim();
    return !header.startsWith('solid');
  }

  // Read triangle count from bytes 80-83 (little-endian uint32)
  const triangleCount = buffer.readUInt32LE(80);
  const expectedSize = 84 + triangleCount * 50;

  // Binary STL should have exact size (or close to it)
  // Some files have trailing bytes, so we check if the header doesn't look like ASCII
  if (Math.abs(buffer.length - expectedSize) <= 100) {
    return true;
  }

  // Fallback: check if header starts with "solid" (ASCII marker)
  const header = buffer.toString('utf-8', 0, 80).toLowerCase().trim();
  return !header.startsWith('solid') || (triangleCount > 0 && expectedSize <= buffer.length + 100);
}

/**
 * Parse binary STL format
 * Structure: 80-byte header + uint32 count + (50 bytes per triangle)
 * Each triangle: 12 floats (normal[3] + vertices[3][3]) + 2-byte attribute
 */
function parseBinarySTL(buffer: Buffer): Triangle[] {
  if (buffer.length < 84) {
    throw new Error('Invalid binary STL: file too small');
  }

  const triangleCount = buffer.readUInt32LE(80);
  const expectedSize = 84 + triangleCount * 50;

  if (buffer.length < expectedSize) {
    throw new Error(`Invalid binary STL: expected ${expectedSize} bytes, got ${buffer.length}`);
  }

  const triangles: Triangle[] = [];
  let offset = 84;

  for (let i = 0; i < triangleCount; i++) {
    const normal: [number, number, number] = [
      buffer.readFloatLE(offset),
      buffer.readFloatLE(offset + 4),
      buffer.readFloatLE(offset + 8),
    ];

    const v1: [number, number, number] = [
      buffer.readFloatLE(offset + 12),
      buffer.readFloatLE(offset + 16),
      buffer.readFloatLE(offset + 20),
    ];

    const v2: [number, number, number] = [
      buffer.readFloatLE(offset + 24),
      buffer.readFloatLE(offset + 28),
      buffer.readFloatLE(offset + 32),
    ];

    const v3: [number, number, number] = [
      buffer.readFloatLE(offset + 36),
      buffer.readFloatLE(offset + 40),
      buffer.readFloatLE(offset + 44),
    ];

    triangles.push({
      normal,
      vertices: [v1, v2, v3],
    });

    offset += 50; // 48 bytes for floats + 2 bytes attribute
  }

  return triangles;
}

/**
 * Parse ASCII STL format
 * Tolerant parsing of facet/vertex lines
 */
function parseASCIISTL(content: string): Triangle[] {
  const triangles: Triangle[] = [];
  const lines = content.split('\n').map(l => l.trim().toLowerCase());

  let currentNormal: [number, number, number] | null = null;
  let currentVertices: [number, number, number][] = [];

  for (const line of lines) {
    if (line.startsWith('facet normal')) {
      const parts = line.split(/\s+/).filter(p => p !== '');
      if (parts.length >= 5) {
        currentNormal = [
          parseFloat(parts[2]),
          parseFloat(parts[3]),
          parseFloat(parts[4]),
        ];
      } else {
        currentNormal = [0, 0, 0];
      }
      currentVertices = [];
    } else if (line.startsWith('vertex')) {
      const parts = line.split(/\s+/).filter(p => p !== '');
      if (parts.length >= 4) {
        currentVertices.push([
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3]),
        ]);
      }
    } else if (line.startsWith('endfacet')) {
      if (currentNormal && currentVertices.length === 3) {
        triangles.push({
          normal: currentNormal,
          vertices: [currentVertices[0], currentVertices[1], currentVertices[2]],
        });
      }
      currentNormal = null;
      currentVertices = [];
    }
  }

  return triangles;
}

/**
 * Main STL parsing function
 */
export function parseSTL(buffer: Buffer): ParsedSTL {
  const isBinary = isBinarySTL(buffer);

  if (isBinary) {
    return {
      triangles: parseBinarySTL(buffer),
      isBinary: true,
    };
  } else {
    const content = buffer.toString('utf-8');
    return {
      triangles: parseASCIISTL(content),
      isBinary: false,
    };
  }
}

/**
 * Compute bounding box from triangles (in mm)
 */
export function computeBoundingBox(triangles: Triangle[]): { x: number; y: number; z: number } {
  if (triangles.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const tri of triangles) {
    for (const [x, y, z] of tri.vertices) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
  }

  return {
    x: Math.round((maxX - minX) * 100) / 100,
    y: Math.round((maxY - minY) * 100) / 100,
    z: Math.round((maxZ - minZ) * 100) / 100,
  };
}

/**
 * Compute volume using signed tetrahedron method
 * Each triangle forms a tetrahedron with the origin
 * Volume = sum of signed volumes of all tetrahedra
 * Returns volume in mm³
 */
export function computeVolumeMm3(triangles: Triangle[]): number {
  let totalVolume = 0;

  for (const tri of triangles) {
    const [v1, v2, v3] = tri.vertices;

    // Signed volume of tetrahedron formed by triangle and origin
    // V = (v1 · (v2 × v3)) / 6
    const crossX = v2[1] * v3[2] - v2[2] * v3[1];
    const crossY = v2[2] * v3[0] - v2[0] * v3[2];
    const crossZ = v2[0] * v3[1] - v2[1] * v3[0];

    const signedVolume = (v1[0] * crossX + v1[1] * crossY + v1[2] * crossZ) / 6;
    totalVolume += signedVolume;
  }

  // Return absolute value (mesh orientation may be inside-out)
  return Math.abs(totalVolume);
}

/**
 * Convert mm³ to cm³
 */
export function mm3ToCm3(volumeMm3: number): number {
  return volumeMm3 / 1000;
}

/**
 * Compute surface area of mesh by summing triangle areas
 * Area of triangle = |cross product| / 2
 * Returns surface area in mm²
 */
export function computeSurfaceAreaMm2(triangles: Triangle[]): number {
  let totalArea = 0;

  for (const tri of triangles) {
    const [v1, v2, v3] = tri.vertices;

    // Vectors from v1 to v2 and v1 to v3
    const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
    const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];

    // Cross product
    const crossX = edge1[1] * edge2[2] - edge1[2] * edge2[1];
    const crossY = edge1[2] * edge2[0] - edge1[0] * edge2[2];
    const crossZ = edge1[0] * edge2[1] - edge1[1] * edge2[0];

    // Magnitude of cross product
    const crossMagnitude = Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ);

    // Area of triangle = |cross| / 2
    totalArea += crossMagnitude / 2;
  }

  return totalArea;
}
