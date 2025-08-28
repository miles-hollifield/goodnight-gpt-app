'use client';

import React, { useState, useEffect } from 'react';
import { DocumentUpload } from '@/components';
import { UploadResponse, deleteDocument } from '@/services/api';

interface UploadedDocument {
  id: string;
  filename: string;
  fileType: string;
  chunksIndexed: number;
  uploadedAt: Date;
  size?: number;
  documentId: string; // ID used in Pinecone for deletion
}

interface SourcesTabProps {
  onUploadSuccess?: (response: UploadResponse) => void;
  onUploadError?: (error: Error) => void;
}

export function SourcesTab({ onUploadSuccess, onUploadError }: SourcesTabProps) {
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);

  // Load uploaded documents from localStorage on component mount
  useEffect(() => {
    const savedDocs = localStorage.getItem('uploaded_documents');
    if (savedDocs) {
      try {
        const docs = JSON.parse(savedDocs);
        // Convert date strings back to Date objects and add missing documentId for old entries
        const parsedDocs = docs.map((doc: UploadedDocument & { uploadedAt: string }) => ({
          ...doc,
          uploadedAt: new Date(doc.uploadedAt),
          documentId: doc.documentId || `legacy-${doc.id}` // Add documentId for old entries
        }));
        setUploadedDocs(parsedDocs);
      } catch (error) {
        console.error('Error loading uploaded documents:', error);
      }
    }
  }, []);

  // Save documents to localStorage whenever the list changes
  const saveDocsToStorage = (docs: UploadedDocument[]) => {
    try {
      localStorage.setItem('uploaded_documents', JSON.stringify(docs));
    } catch (error) {
      console.error('Error saving uploaded documents:', error);
    }
  };

  const handleUploadSuccess = (response: UploadResponse) => {
    // Extract filename from message if possible
    const filename = response.message.match(/Successfully processed (.+?)(?:\s|$)/)?.[1] || 'Unknown file';
    
    const newDoc: UploadedDocument = {
      id: crypto.randomUUID(),
      filename,
      fileType: response.file_type,
      chunksIndexed: response.chunks_indexed,
      uploadedAt: new Date(),
      documentId: response.document_id // Use the document_id returned by the backend
    };

    const updatedDocs = [newDoc, ...uploadedDocs];
    setUploadedDocs(updatedDocs);
    saveDocsToStorage(updatedDocs);
    
    onUploadSuccess?.(response);
  };

  const handleDeleteDocument = async (docId: string) => {
    const docToDelete = uploadedDocs.find(doc => doc.id === docId);
    if (!docToDelete) return;

    try {
      // Call backend to delete from Pinecone
      await deleteDocument(docToDelete.documentId);
      
      // Remove from local state
      const updatedDocs = uploadedDocs.filter(doc => doc.id !== docId);
      setUploadedDocs(updatedDocs);
      saveDocsToStorage(updatedDocs);
      
      // You could add a success notification here
      console.log(`Successfully deleted ${docToDelete.filename} from knowledge base`);
      
    } catch (error) {
      console.error('Error deleting document:', error);
      // You could add an error notification here
      alert(`Failed to delete ${docToDelete.filename}. Please try again.`);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf': return '📄';
      case 'docx':
      case 'doc': return '📝';
      case 'txt': return '📋';
      case 'csv': return '📊';
      default: return '📁';
    }
  };

  return (
    <div className="sources-tab">
      {/* Upload Section */}
      <div className="upload-section">
        <h3 className="section-title">Upload Documents</h3>
        <DocumentUpload
          onUploadSuccess={handleUploadSuccess}
          onUploadError={onUploadError}
        />
      </div>

      {/* Sources List */}
      <div className="sources-list">
        <div className="section-header">
          <h3 className="section-title">Knowledge Base</h3>
          {uploadedDocs.length > 0 && (
            <span className="docs-count">{uploadedDocs.length} document{uploadedDocs.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {uploadedDocs.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <p>No documents uploaded yet</p>
            <span>Upload documents above to build your knowledge base</span>
          </div>
        )}

        {uploadedDocs.length > 0 && (
          <div className="documents-list">
            {uploadedDocs.map((doc) => (
              <div key={doc.id} className="document-item">
                <div className="doc-header">
                  <div className="doc-icon">{getFileTypeIcon(doc.fileType)}</div>
                  <div className="doc-info">
                    <div className="doc-name" title={doc.filename}>{doc.filename}</div>
                    <div className="doc-meta">
                      <span className="file-type">{doc.fileType.toUpperCase()}</span>
                      <span className="chunk-count">{doc.chunksIndexed} chunks</span>
                      <span className="upload-date">{formatDate(doc.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteDocument(doc.id)}
                  aria-label={`Delete ${doc.filename}`}
                  title="Remove from knowledge base"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .sources-tab {
          display: flex;
          flex-direction: column;
          height: 100%;
          gap: 1rem;
        }

        .upload-section {
          border-bottom: 1px solid #374151;
          padding-bottom: 1rem;
        }

        .sources-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .section-title {
          color: #f9fafb;
          font-size: 0.9rem;
          font-weight: 600;
          margin: 0 0 0.8rem 0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.8rem;
        }

        .docs-count {
          color: #9ca3af;
          font-size: 0.75rem;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 2rem;
          color: #9ca3af;
        }

        .empty-state {
          text-align: center;
          padding: 2rem 1rem;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          margin: 0.5rem 0;
          font-weight: 500;
          color: #9ca3af;
        }

        .empty-state span {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .documents-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .document-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem;
          background: #374151;
          border-radius: 6px;
          border: 1px solid #4b5563;
          transition: all 0.2s ease;
        }

        .document-item:hover {
          background: #4b5563;
          border-color: #6b7280;
        }

        .doc-header {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
          gap: 0.75rem;
        }

        .doc-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .doc-info {
          flex: 1;
          min-width: 0;
        }

        .doc-name {
          color: #f9fafb;
          font-size: 0.85rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 0.25rem;
        }

        .doc-meta {
          display: flex;
          gap: 0.5rem;
          font-size: 0.7rem;
          color: #9ca3af;
        }

        .file-type {
          background: #1f2937;
          padding: 0.1rem 0.3rem;
          border-radius: 3px;
          font-weight: 500;
        }

        .chunk-count {
          color: #60a5fa;
        }

        .upload-date {
          color: #9ca3af;
        }

        .delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          color: #9ca3af;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .delete-btn:hover {
          background: #ef4444;
          color: white;
        }

        .delete-btn:focus {
          outline: 2px solid #ef4444;
          outline-offset: 2px;
        }

        /* Scrollbar styling for dark theme */
        .documents-list::-webkit-scrollbar {
          width: 4px;
        }

        .documents-list::-webkit-scrollbar-track {
          background: #374151;
        }

        .documents-list::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 2px;
        }

        .documents-list::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}
