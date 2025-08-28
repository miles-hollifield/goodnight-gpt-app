'use client';

import React, { useState, useRef } from 'react';
import { uploadDocument, UploadResponse } from '@/services/api';
import { LoadingSpinner } from './LoadingSpinner';

interface DocumentUploadProps {
  onUploadSuccess?: (response: UploadResponse) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
}

const SUPPORTED_TYPES = [
  '.txt',
  '.pdf',
  '.docx',
  '.doc',
  '.csv'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function DocumentUpload({ onUploadSuccess, onUploadError, className = '' }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileValidation = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    // Check file type
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_TYPES.includes(fileExt)) {
      return `Unsupported file type. Supported types: ${SUPPORTED_TYPES.join(', ')}`;
    }

    return null;
  };

  const handleFileUpload = async (file: File) => {
    const validationError = handleFileValidation(file);
    if (validationError) {
      setUploadStatus(validationError);
      onUploadError?.(new Error(validationError));
      return;
    }

    setIsUploading(true);
    setUploadStatus(`Uploading ${file.name}...`);

    try {
      const response = await uploadDocument(file);
      setUploadStatus(`✅ Successfully uploaded ${file.name} (${response.chunks_indexed} chunks indexed)`);
      onUploadSuccess?.(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadStatus(`❌ Upload failed: ${errorMessage}`);
      onUploadError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    handleFileUpload(files[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`document-upload ${className}`}>
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_TYPES.join(',')}
          onChange={handleInputChange}
          className="file-input"
          disabled={isUploading}
        />
        
        <div className="upload-content">
          {isUploading ? (
            <div className="uploading-state">
              <LoadingSpinner />
              <p>Uploading and processing document...</p>
            </div>
          ) : (
            <div className="idle-state">
              <div className="upload-icon">📄</div>
              <h3>Upload Document</h3>
              <p>Drop a file here or click to browse</p>
              <p className="file-types">
                Supported: {SUPPORTED_TYPES.join(', ')}
              </p>
              <p className="file-size">
                Max size: {MAX_FILE_SIZE / (1024 * 1024)}MB
              </p>
            </div>
          )}
        </div>
      </div>
      
      {uploadStatus && (
        <div className={`upload-status ${uploadStatus.includes('❌') ? 'error' : uploadStatus.includes('✅') ? 'success' : 'info'}`}>
          {uploadStatus}
        </div>
      )}

      <style jsx>{`
        .document-upload {
          margin: 1rem 0;
        }

        .upload-area {
          border: 2px dashed #475569;
          border-radius: 8px;
          padding: 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #1e293b;
          min-height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .upload-area:hover {
          border-color: #60a5fa;
          background: #334155;
        }

        .upload-area.drag-active {
          border-color: #60a5fa;
          background: #1e3a8a;
          transform: scale(1.02);
        }

        .upload-area.uploading {
          border-color: #34d399;
          background: #022c22;
          cursor: not-allowed;
        }

        .file-input {
          display: none;
        }

        .upload-content {
          width: 100%;
        }

        .upload-icon {
          font-size: 2.5rem;
          margin-bottom: 0.8rem;
        }

        .idle-state h3 {
          margin: 0.5rem 0;
          color: #f9fafb;
          font-size: 1.1rem;
        }

        .idle-state p {
          margin: 0.4rem 0;
          color: #d1d5db;
          font-size: 0.875rem;
        }

        .file-types {
          font-size: 0.8rem;
          font-weight: 500;
          color: #9ca3af;
        }

        .file-size {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .uploading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.8rem;
        }

        .uploading-state p {
          color: #34d399;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .upload-status {
          margin-top: 0.8rem;
          padding: 0.6rem;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .upload-status.success {
          background: #022c22;
          color: #34d399;
          border: 1px solid #059669;
        }

        .upload-status.error {
          background: #7f1d1d;
          color: #fca5a5;
          border: 1px solid #dc2626;
        }

        .upload-status.info {
          background: #1e3a8a;
          color: #93c5fd;
          border: 1px solid #3b82f6;
        }
      `}</style>
    </div>
  );
}
