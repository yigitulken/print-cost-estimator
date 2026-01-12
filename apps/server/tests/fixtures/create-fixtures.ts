// ============================================================
// Script to create STL test fixtures
// Run with: npx tsx tests/fixtures/create-fixtures.ts
// ============================================================

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 10mm cube - 12 triangles (2 per face)
// Vertices of a 10x10x10 cube centered at (5,5,5)
const cubeVertices = [
  [0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0], // bottom face z=0
  [0, 0, 10], [10, 0, 10], [10, 10, 10], [0, 10, 10], // top face z=10
];

// 12 triangles for a cube (2 per face, 6 faces)
const cubeTriangles: { normal: number[]; v1: number[]; v2: number[]; v3: number[] }[] = [
  // Bottom face (z=0) - normal (0,0,-1)
  { normal: [0, 0, -1], v1: cubeVertices[0], v2: cubeVertices[2], v3: cubeVertices[1] },
  { normal: [0, 0, -1], v1: cubeVertices[0], v2: cubeVertices[3], v3: cubeVertices[2] },
  // Top face (z=10) - normal (0,0,1)
  { normal: [0, 0, 1], v1: cubeVertices[4], v2: cubeVertices[5], v3: cubeVertices[6] },
  { normal: [0, 0, 1], v1: cubeVertices[4], v2: cubeVertices[6], v3: cubeVertices[7] },
  // Front face (y=0) - normal (0,-1,0)
  { normal: [0, -1, 0], v1: cubeVertices[0], v2: cubeVertices[1], v3: cubeVertices[5] },
  { normal: [0, -1, 0], v1: cubeVertices[0], v2: cubeVertices[5], v3: cubeVertices[4] },
  // Back face (y=10) - normal (0,1,0)
  { normal: [0, 1, 0], v1: cubeVertices[2], v2: cubeVertices[3], v3: cubeVertices[7] },
  { normal: [0, 1, 0], v1: cubeVertices[2], v2: cubeVertices[7], v3: cubeVertices[6] },
  // Left face (x=0) - normal (-1,0,0)
  { normal: [-1, 0, 0], v1: cubeVertices[0], v2: cubeVertices[4], v3: cubeVertices[7] },
  { normal: [-1, 0, 0], v1: cubeVertices[0], v2: cubeVertices[7], v3: cubeVertices[3] },
  // Right face (x=10) - normal (1,0,0)
  { normal: [1, 0, 0], v1: cubeVertices[1], v2: cubeVertices[2], v3: cubeVertices[6] },
  { normal: [1, 0, 0], v1: cubeVertices[1], v2: cubeVertices[6], v3: cubeVertices[5] },
];

// Create ASCII STL
function createASCIISTL(): string {
  let content = 'solid cube\n';
  for (const tri of cubeTriangles) {
    content += `  facet normal ${tri.normal[0]} ${tri.normal[1]} ${tri.normal[2]}\n`;
    content += '    outer loop\n';
    content += `      vertex ${tri.v1[0]} ${tri.v1[1]} ${tri.v1[2]}\n`;
    content += `      vertex ${tri.v2[0]} ${tri.v2[1]} ${tri.v2[2]}\n`;
    content += `      vertex ${tri.v3[0]} ${tri.v3[1]} ${tri.v3[2]}\n`;
    content += '    endloop\n';
    content += '  endfacet\n';
  }
  content += 'endsolid cube\n';
  return content;
}

// Create Binary STL
function createBinarySTL(): Buffer {
  const triangleCount = cubeTriangles.length;
  const bufferSize = 80 + 4 + triangleCount * 50;
  const buffer = Buffer.alloc(bufferSize);

  // 80-byte header
  const header = 'Binary STL cube fixture';
  buffer.write(header, 0, 'utf-8');

  // Triangle count (uint32 little-endian)
  buffer.writeUInt32LE(triangleCount, 80);

  let offset = 84;
  for (const tri of cubeTriangles) {
    // Normal (3 floats)
    buffer.writeFloatLE(tri.normal[0], offset);
    buffer.writeFloatLE(tri.normal[1], offset + 4);
    buffer.writeFloatLE(tri.normal[2], offset + 8);

    // Vertex 1 (3 floats)
    buffer.writeFloatLE(tri.v1[0], offset + 12);
    buffer.writeFloatLE(tri.v1[1], offset + 16);
    buffer.writeFloatLE(tri.v1[2], offset + 20);

    // Vertex 2 (3 floats)
    buffer.writeFloatLE(tri.v2[0], offset + 24);
    buffer.writeFloatLE(tri.v2[1], offset + 28);
    buffer.writeFloatLE(tri.v2[2], offset + 32);

    // Vertex 3 (3 floats)
    buffer.writeFloatLE(tri.v3[0], offset + 36);
    buffer.writeFloatLE(tri.v3[1], offset + 40);
    buffer.writeFloatLE(tri.v3[2], offset + 44);

    // Attribute byte count (uint16, usually 0)
    buffer.writeUInt16LE(0, offset + 48);

    offset += 50;
  }

  return buffer;
}

// Write files
const asciiContent = createASCIISTL();
const binaryContent = createBinarySTL();

writeFileSync(join(__dirname, 'cube-ascii.stl'), asciiContent);
writeFileSync(join(__dirname, 'cube-binary.stl'), binaryContent);

console.log('Created cube-ascii.stl and cube-binary.stl');
console.log(`ASCII size: ${asciiContent.length} bytes`);
console.log(`Binary size: ${binaryContent.length} bytes`);

