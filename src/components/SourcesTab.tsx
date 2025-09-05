'use client';

import React, { useState, useEffect } from 'react';
import { DocumentUpload } from '@/components';
import { UploadResponse, deleteDocument, listDocuments, DocumentInfo } from '@/services/api';

interface UploadedDocument {
  id: string;
  filename: string;
  fileType: string;
  chunksIndexed: number;
  uploadedAt: Date;
  size?: number;
  documentId: string; // ID used in Pinecone for deletion
  columns?: string[]; // For CSV files
  pages?: number; // For PDFs
}

interface SourcesTabProps {
  onUploadSuccess?: (response: UploadResponse) => void;
  onUploadError?: (error: Error) => void;
}

export function SourcesTab({ onUploadSuccess, onUploadError }: SourcesTabProps) {
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [pineconeDocuments, setPineconeDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Load documents from Pinecone on component mount
  useEffect(() => {
    loadPineconeDocuments();
  }, []);

  const loadPineconeDocuments = async () => {
    setLoading(true);
    try {
      const response = await listDocuments();
      setPineconeDocuments(response.documents);
    } catch (error) {
      console.error('Error loading documents from Pinecone:', error);
    } finally {
      setLoading(false);
    }
  };

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
  documentId: response.document_id, // Use the document_id returned by the backend
  columns: response.columns,
  pages: response.pages
    };

    const updatedDocs = [newDoc, ...uploadedDocs];
    setUploadedDocs(updatedDocs);
    saveDocsToStorage(updatedDocs);
    
    // Refresh Pinecone documents list
    loadPineconeDocuments();
    
    onUploadSuccess?.(response);
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      // Call backend to delete from Pinecone
      await deleteDocument(documentId);
      
      // Refresh the Pinecone documents list
      await loadPineconeDocuments();
      
      console.log(`Successfully deleted document ${documentId} from knowledge base`);
      
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(`Failed to delete document. Please try again.`);
    }
  };

  // Note: date formatting helper removed (unused)

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
          {pineconeDocuments.length > 0 && (
            <span className="docs-count">{pineconeDocuments.length} document{pineconeDocuments.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {pineconeDocuments.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <p>No documents uploaded yet</p>
            <span>Upload documents above to build your knowledge base</span>
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <p>Loading documents from knowledge base...</p>
          </div>
        )}

        {pineconeDocuments.length > 0 && (
          <div className="documents-list">
            {pineconeDocuments.map((doc) => {
              const local = uploadedDocs.find(u => u.documentId === doc.document_id);
              const preferredType = (local?.fileType || doc.type || '').toLowerCase();
              const displayName = local?.filename || doc.source;
              const displayTypeLabel = (preferredType || 'unknown').toUpperCase();
              const columnsCount = local?.columns?.length ?? undefined;
              const pages = doc.pages ?? local?.pages;

              return (
                <div key={doc.document_id} className="document-item">
                  <div className="doc-header">
                    <div className="doc-icon">{getFileTypeIcon(preferredType)}</div>
                    <div className="doc-info">
                      <div className="doc-name" title={displayName}>{displayName}</div>
                      <div className="doc-meta">
                        <span className="file-type">{displayTypeLabel}</span>
                        {preferredType === 'csv' && (typeof (doc.columns_count ?? columnsCount) === 'number') && (
                          <span className="columns-count">{(doc.columns_count ?? columnsCount)} column{(doc.columns_count ?? columnsCount) !== 1 ? 's' : ''}</span>
                        )}
                        {preferredType === 'pdf' && typeof pages === 'number' && (
                          <span className="columns-count">{pages} page{pages !== 1 ? 's' : ''}</span>
                        )}
                        <span className="chunk-count">{doc.chunk_count} chunks</span>
                        <span className="total-chunks">({doc.total_chunks} total)</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteDocument(doc.document_id)}
                    aria-label={`Delete ${displayName}`}
                    title="Remove from knowledge base"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .sources-tab {
          display: flex;
          flex-direction: column;
          height: 100%;
          gap: 1.5rem;
        }

        .upload-section {
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 1.5rem;
        }

        .sources-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .section-title {
          color: #111827;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .docs-count {
          color: #6b7280;
          font-size: 14px;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .empty-state p {
          margin: 0.5rem 0;
          font-weight: 500;
          color: #374151;
          font-size: 16px;
        }

        .empty-state span {
          font-size: 14px;
          color: #9ca3af;
        }

        .documents-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .document-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
        }

        .document-item:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .doc-header {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
          gap: 0.75rem;
        }

        .doc-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .doc-info {
          flex: 1;
          min-width: 0;
        }

        .doc-name {
          color: #111827;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 0.25rem;
        }

        .doc-meta {
          display: flex;
          gap: 0.75rem;
          font-size: 12px;
          color: #6b7280;
        }

        .columns-count {
          color: #374151;
        }

        .file-type {
          background: #f3f4f6;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-weight: 500;
          color: #374151;
        }

        .chunk-count {
          color: var(--brand-red);
        }

        .upload-date {
          color: #6b7280;
        }

        .total-chunks {
          color: #6b7280;
          font-style: italic;
        }

        .loading-state {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          color: #6b7280;
          font-style: italic;
        }

        .delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 6px;
          color: #6b7280;
          transition: all 0.2s ease;
          flex-shrink: 0;
          font-size: 16px;
        }

        .delete-btn:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        .delete-btn:focus {
          outline: 2px solid #dc2626;
          outline-offset: 2px;
        }

        /* Scrollbar styling */
        .documents-list::-webkit-scrollbar {
          width: 6px;
        }

        .documents-list::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 3px;
        }

        .documents-list::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }

        .documents-list::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}
