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
          border: 2px dashed #cbd5e1;
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #f8fafc;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .upload-area:hover {
          border-color: #3b82f6;
          background: #f1f5f9;
        }

        .upload-area.drag-active {
          border-color: #3b82f6;
          background: #eff6ff;
          transform: scale(1.02);
        }

        .upload-area.uploading {
          border-color: #10b981;
          background: #f0fdf4;
          cursor: not-allowed;
        }

        .file-input {
          display: none;
        }

        .upload-content {
          width: 100%;
        }

        .upload-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .idle-state h3 {
          margin: 0.5rem 0;
          color: #1f2937;
          font-size: 1.25rem;
        }

        .idle-state p {
          margin: 0.5rem 0;
          color: #6b7280;
        }

        .file-types {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .file-size {
          font-size: 0.875rem;
          color: #9ca3af;
        }

        .uploading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .uploading-state p {
          color: #059669;
          font-weight: 500;
        }

        .upload-status {
          margin-top: 1rem;
          padding: 0.75rem;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .upload-status.success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .upload-status.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .upload-status.info {
          background: #dbeafe;
          color: #1e40af;
          border: 1px solid #93c5fd;
        }

        @media (prefers-color-scheme: dark) {
          .upload-area {
            background: #1e293b;
            border-color: #475569;
          }

          .upload-area:hover {
            background: #334155;
            border-color: #60a5fa;
          }

          .upload-area.drag-active {
            background: #1e3a8a;
            border-color: #60a5fa;
          }

          .upload-area.uploading {
            background: #022c22;
            border-color: #34d399;
          }

          .idle-state h3 {
            color: #f9fafb;
          }

          .idle-state p {
            color: #d1d5db;
          }

          .uploading-state p {
            color: #34d399;
          }

          .upload-status.success {
            background: #022c22;
            color: #34d399;
            border-color: #059669;
          }

          .upload-status.error {
            background: #7f1d1d;
            color: #fca5a5;
            border-color: #dc2626;
          }

          .upload-status.info {
            background: #1e3a8a;
            color: #93c5fd;
            border-color: #3b82f6;
          }
        }
      `}</style>
    </div>
  );
}
