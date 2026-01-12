// ============================================================
// STL Parser Tests
// ============================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseSTL, computeBoundingBox, computeVolumeMm3, mm3ToCm3, computeSurfaceAreaMm2 } from '../src/stl-parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

// Expected values for a 10x10x10 cube
const EXPECTED_BBOX = { x: 10, y: 10, z: 10 };
const EXPECTED_VOLUME_MM3 = 1000; // 10 * 10 * 10
const EXPECTED_VOLUME_CM3 = 1; // 1000 / 1000
const EXPECTED_SURFACE_AREA_MM2 = 600; // 6 faces * 100 mm² each

// Helper to create fixtures if they don't exist
function ensureFixtures(): void {
  const asciiPath = join(fixturesDir, 'cube-ascii.stl');
  const binaryPath = join(fixturesDir, 'cube-binary.stl');

  if (!existsSync(asciiPath) || !existsSync(binaryPath)) {
    // Create fixtures inline
    const cubeVertices = [
      [0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0],
      [0, 0, 10], [10, 0, 10], [10, 10, 10], [0, 10, 10],
    ];

    const cubeTriangles = [
      { normal: [0, 0, -1], v1: cubeVertices[0], v2: cubeVertices[2], v3: cubeVertices[1] },
      { normal: [0, 0, -1], v1: cubeVertices[0], v2: cubeVertices[3], v3: cubeVertices[2] },
      { normal: [0, 0, 1], v1: cubeVertices[4], v2: cubeVertices[5], v3: cubeVertices[6] },
      { normal: [0, 0, 1], v1: cubeVertices[4], v2: cubeVertices[6], v3: cubeVertices[7] },
      { normal: [0, -1, 0], v1: cubeVertices[0], v2: cubeVertices[1], v3: cubeVertices[5] },
      { normal: [0, -1, 0], v1: cubeVertices[0], v2: cubeVertices[5], v3: cubeVertices[4] },
      { normal: [0, 1, 0], v1: cubeVertices[2], v2: cubeVertices[3], v3: cubeVertices[7] },
      { normal: [0, 1, 0], v1: cubeVertices[2], v2: cubeVertices[7], v3: cubeVertices[6] },
      { normal: [-1, 0, 0], v1: cubeVertices[0], v2: cubeVertices[4], v3: cubeVertices[7] },
      { normal: [-1, 0, 0], v1: cubeVertices[0], v2: cubeVertices[7], v3: cubeVertices[3] },
      { normal: [1, 0, 0], v1: cubeVertices[1], v2: cubeVertices[2], v3: cubeVertices[6] },
      { normal: [1, 0, 0], v1: cubeVertices[1], v2: cubeVertices[6], v3: cubeVertices[5] },
    ];

    // ASCII STL
    let ascii = 'solid cube\n';
    for (const tri of cubeTriangles) {
      ascii += `  facet normal ${tri.normal[0]} ${tri.normal[1]} ${tri.normal[2]}\n`;
      ascii += '    outer loop\n';
      ascii += `      vertex ${tri.v1[0]} ${tri.v1[1]} ${tri.v1[2]}\n`;
      ascii += `      vertex ${tri.v2[0]} ${tri.v2[1]} ${tri.v2[2]}\n`;
      ascii += `      vertex ${tri.v3[0]} ${tri.v3[1]} ${tri.v3[2]}\n`;
      ascii += '    endloop\n';
      ascii += '  endfacet\n';
    }
    ascii += 'endsolid cube\n';
    writeFileSync(asciiPath, ascii);

    // Binary STL
    const buffer = Buffer.alloc(84 + 12 * 50);
    buffer.write('Binary STL cube fixture', 0);
    buffer.writeUInt32LE(12, 80);
    let offset = 84;
    for (const tri of cubeTriangles) {
      buffer.writeFloatLE(tri.normal[0], offset);
      buffer.writeFloatLE(tri.normal[1], offset + 4);
      buffer.writeFloatLE(tri.normal[2], offset + 8);
      buffer.writeFloatLE(tri.v1[0], offset + 12);
      buffer.writeFloatLE(tri.v1[1], offset + 16);
      buffer.writeFloatLE(tri.v1[2], offset + 20);
      buffer.writeFloatLE(tri.v2[0], offset + 24);
      buffer.writeFloatLE(tri.v2[1], offset + 28);
      buffer.writeFloatLE(tri.v2[2], offset + 32);
      buffer.writeFloatLE(tri.v3[0], offset + 36);
      buffer.writeFloatLE(tri.v3[1], offset + 40);
      buffer.writeFloatLE(tri.v3[2], offset + 44);
      buffer.writeUInt16LE(0, offset + 48);
      offset += 50;
    }
    writeFileSync(binaryPath, buffer);
  }
}

describe('STL Parser', () => {
  beforeAll(() => {
    ensureFixtures();
  });

  describe('Binary STL parsing', () => {
    it('should parse binary STL and detect correct format', () => {
      const buffer = readFileSync(join(fixturesDir, 'cube-binary.stl'));
      const result = parseSTL(buffer);

      expect(result.isBinary).toBe(true);
      expect(result.triangles).toHaveLength(12);
    });

    it('should compute correct bounding box from binary STL', () => {
      const buffer = readFileSync(join(fixturesDir, 'cube-binary.stl'));
      const { triangles } = parseSTL(buffer);
      const bbox = computeBoundingBox(triangles);

      expect(bbox).toEqual(EXPECTED_BBOX);
    });

    it('should compute correct volume from binary STL', () => {
      const buffer = readFileSync(join(fixturesDir, 'cube-binary.stl'));
      const { triangles } = parseSTL(buffer);
      const volumeMm3 = computeVolumeMm3(triangles);

      expect(volumeMm3).toBeCloseTo(EXPECTED_VOLUME_MM3, 1);
    });

    it('should compute correct surface area from binary STL', () => {
      const buffer = readFileSync(join(fixturesDir, 'cube-binary.stl'));
      const { triangles } = parseSTL(buffer);
      const surfaceArea = computeSurfaceAreaMm2(triangles);

      expect(surfaceArea).toBeCloseTo(EXPECTED_SURFACE_AREA_MM2, 1);
    });
  });

  describe('ASCII STL parsing', () => {
    it('should parse ASCII STL and detect correct format', () => {
      const buffer = readFileSync(join(fixturesDir, 'cube-ascii.stl'));
      const result = parseSTL(buffer);

      expect(result.isBinary).toBe(false);
      expect(result.triangles).toHaveLength(12);
    });

    it('should compute correct bounding box from ASCII STL', () => {
      const buffer = readFileSync(join(fixturesDir, 'cube-ascii.stl'));
      const { triangles } = parseSTL(buffer);
      const bbox = computeBoundingBox(triangles);

      expect(bbox).toEqual(EXPECTED_BBOX);
    });

    it('should compute correct volume from ASCII STL', () => {
      const buffer = readFileSync(join(fixturesDir, 'cube-ascii.stl'));
      const { triangles } = parseSTL(buffer);
      const volumeMm3 = computeVolumeMm3(triangles);

      expect(volumeMm3).toBeCloseTo(EXPECTED_VOLUME_MM3, 1);
    });

    it('should compute correct surface area from ASCII STL', () => {
      const buffer = readFileSync(join(fixturesDir, 'cube-ascii.stl'));
      const { triangles } = parseSTL(buffer);
      const surfaceArea = computeSurfaceAreaMm2(triangles);

      expect(surfaceArea).toBeCloseTo(EXPECTED_SURFACE_AREA_MM2, 1);
    });
  });

  describe('mm3 to cm3 conversion', () => {
    it('should correctly convert mm3 to cm3', () => {
      expect(mm3ToCm3(1000)).toBe(1);
      expect(mm3ToCm3(1)).toBe(0.001);
      expect(mm3ToCm3(500000)).toBe(500);
      expect(mm3ToCm3(0)).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should return zero dimensions for empty triangles', () => {
      const bbox = computeBoundingBox([]);
      expect(bbox).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should return zero volume for empty triangles', () => {
      const volume = computeVolumeMm3([]);
      expect(volume).toBe(0);
    });

    it('should return zero surface area for empty triangles', () => {
      const surfaceArea = computeSurfaceAreaMm2([]);
      expect(surfaceArea).toBe(0);
    });
  });
});

