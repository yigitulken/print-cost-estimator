import { useCallback, useState, useRef } from 'react';
import './FileUpload.css';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.toLowerCase().endsWith('.stl')) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  return (
    <div
      className={`file-upload ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".stl"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      <div className="upload-icon">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 4L4 20V44L32 60L60 44V20L32 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M4 20L32 36M32 36L60 20M32 36V60" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M32 16L44 23V37L32 44L20 37V23L32 16Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      </div>
      
      <div className="upload-text">
        <h2>Drop your STL file here</h2>
        <p>or click to browse</p>
      </div>
      
      <div className="upload-info">
        <span className="info-badge">STL files only</span>
        <span className="info-badge">Max 400MB</span>
      </div>
    </div>
  );
}

