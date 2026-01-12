import { Suspense, useMemo, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, Environment } from '@react-three/drei';
import * as THREE from 'three';
import './STLViewer.css';

// Max file size for client-side preview (50 MB)
const PREVIEW_MAX_BYTES = 50 * 1024 * 1024;

interface STLViewerProps {
  file: File;
}

interface ParsedMesh {
  geometry: THREE.BufferGeometry;
}

// Parse STL file in the browser
function parseSTLBuffer(buffer: ArrayBuffer): THREE.BufferGeometry {
  const data = new DataView(buffer);
  
  // Check if binary or ASCII
  const isBinary = checkIfBinary(buffer);
  
  if (isBinary) {
    return parseBinarySTL(data);
  } else {
    const text = new TextDecoder().decode(buffer);
    return parseASCIISTL(text);
  }
}

function checkIfBinary(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 84) {
    const header = new TextDecoder().decode(buffer.slice(0, Math.min(80, buffer.byteLength))).toLowerCase();
    return !header.includes('solid');
  }
  
  const data = new DataView(buffer);
  const triangleCount = data.getUint32(80, true);
  const expectedSize = 84 + triangleCount * 50;
  
  if (Math.abs(buffer.byteLength - expectedSize) <= 100) {
    return true;
  }
  
  const header = new TextDecoder().decode(buffer.slice(0, 80)).toLowerCase();
  return !header.includes('solid');
}

function parseBinarySTL(data: DataView): THREE.BufferGeometry {
  const triangleCount = data.getUint32(80, true);
  const positions = new Float32Array(triangleCount * 9);
  const normals = new Float32Array(triangleCount * 9);
  
  let offset = 84;
  
  for (let i = 0; i < triangleCount; i++) {
    // Normal
    const nx = data.getFloat32(offset, true);
    const ny = data.getFloat32(offset + 4, true);
    const nz = data.getFloat32(offset + 8, true);
    
    // Vertices
    for (let j = 0; j < 3; j++) {
      const vOffset = offset + 12 + j * 12;
      const idx = i * 9 + j * 3;
      
      positions[idx] = data.getFloat32(vOffset, true);
      positions[idx + 1] = data.getFloat32(vOffset + 4, true);
      positions[idx + 2] = data.getFloat32(vOffset + 8, true);
      
      normals[idx] = nx;
      normals[idx + 1] = ny;
      normals[idx + 2] = nz;
    }
    
    offset += 50;
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  
  return geometry;
}

function parseASCIISTL(text: string): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  
  const lines = text.split('\n');
  let currentNormal = [0, 0, 0];
  const vertices: number[][] = [];
  
  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    
    if (trimmed.startsWith('facet normal')) {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 5) {
        currentNormal = [parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4])];
      }
      vertices.length = 0;
    } else if (trimmed.startsWith('vertex')) {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 4) {
        vertices.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
      }
    } else if (trimmed.startsWith('endfacet')) {
      if (vertices.length === 3) {
        for (const v of vertices) {
          positions.push(v[0], v[1], v[2]);
          normals.push(currentNormal[0], currentNormal[1], currentNormal[2]);
        }
      }
    }
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
  
  return geometry;
}

function Model({ geometry }: { geometry: THREE.BufferGeometry }) {
  // Center and scale the geometry
  const processedGeometry = useMemo(() => {
    const geo = geometry.clone();
    geo.computeBoundingBox();
    
    if (geo.boundingBox) {
      const center = new THREE.Vector3();
      geo.boundingBox.getCenter(center);
      geo.translate(-center.x, -center.y, -center.z);
      
      // Scale to fit in a unit box
      const size = new THREE.Vector3();
      geo.boundingBox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const scale = 2 / maxDim;
        geo.scale(scale, scale, scale);
      }
    }
    
    geo.computeVertexNormals();
    return geo;
  }, [geometry]);

  return (
    <mesh geometry={processedGeometry}>
      <meshStandardMaterial
        color="#7090b0"
        metalness={0.3}
        roughness={0.5}
        flatShading={false}
      />
    </mesh>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#404050" wireframe />
    </mesh>
  );
}

export function STLViewer({ file }: STLViewerProps) {
  const [mesh, setMesh] = useState<ParsedMesh | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Check if file is too large for preview
  const isFileTooLargeForPreview = file.size > PREVIEW_MAX_BYTES;

  useEffect(() => {
    // Skip parsing if file is too large
    if (isFileTooLargeForPreview) {
      return;
    }

    let cancelled = false;

    async function loadFile() {
      try {
        const buffer = await file.arrayBuffer();
        if (cancelled) return;
        
        const geometry = parseSTLBuffer(buffer);
        if (cancelled) return;
        
        setMesh({ geometry });
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load STL file');
          console.error('STL parse error:', err);
        }
      }
    }

    loadFile();

    return () => {
      cancelled = true;
    };
  }, [file, isFileTooLargeForPreview]);

  // Show placeholder for large files
  if (isFileTooLargeForPreview) {
    return (
      <div className="viewer-placeholder">
        <div className="viewer-placeholder-content">
          <div className="viewer-placeholder-icon">📦</div>
          <h3 className="viewer-placeholder-title">Preview disabled for large files</h3>
          <p className="viewer-placeholder-text">
            This STL is large and may slow down your browser. You can still get pricing estimates.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="viewer-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="stl-viewer">
      <Canvas
        camera={{ position: [3, 2, 3], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#12121a']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} />
        
        <Suspense fallback={<LoadingFallback />}>
          <Center>
            {mesh && <Model geometry={mesh.geometry} />}
          </Center>
          <Environment preset="city" />
        </Suspense>
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={10}
        />
        
        {/* Grid helper */}
        <gridHelper args={[4, 20, '#2a2a3a', '#1a1a26']} />
      </Canvas>
      
      <div className="viewer-controls-hint">
        <span>🖱️ Drag to rotate</span>
        <span>📍 Scroll to zoom</span>
      </div>
    </div>
  );
}

