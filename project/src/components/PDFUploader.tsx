import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { extractTextFromPDF } from '../services/pdfService';

interface PDFData {
  file: File;
  text: string;
  name: string;
}

interface PDFUploaderProps {
  onPDFUpload: (pdfData: PDFData) => void;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ onPDFUpload }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const extractedText = await extractTextFromPDF(file);
      
      if (!extractedText.trim()) {
        setError('Could not extract text from this PDF. The file might be image-based or corrupted.');
        return;
      }

      const pdfData: PDFData = {
        file,
        text: extractedText,
        name: file.name
      };

      setSuccess(`Successfully extracted ${extractedText.length} characters from ${file.name}`);
      setTimeout(() => {
        onPDFUpload(pdfData);
      }, 1000);

    } catch (err) {
      console.error('PDF processing error:', err);
      setError('Failed to process PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Upload Your PDF</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload a PDF document to analyze it with AI. Our assistant will extract the text and help you understand, 
          summarize, and answer questions about your document.
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        
        <div className="space-y-4">
          {isProcessing ? (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-700">Processing PDF...</h3>
              <p className="text-gray-500">Extracting text and preparing for AI analysis</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700">
                {isDragOver ? 'Drop your PDF here' : 'Upload PDF Document'}
              </h3>
              <p className="text-gray-500">
                Drag and drop your PDF file here, or click to browse
              </p>
              <div className="text-sm text-gray-400">
                Supported: PDF files up to 10MB
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Features */}
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-white rounded-xl shadow-sm">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">Text Extraction</h3>
          <p className="text-gray-600 text-sm">
            Advanced PDF parsing to extract clean, readable text from your documents
          </p>
        </div>

        <div className="text-center p-6 bg-white rounded-xl shadow-sm">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">Smart Analysis</h3>
          <p className="text-gray-600 text-sm">
            AI-powered analysis to understand context, themes, and key information
          </p>
        </div>

        <div className="text-center p-6 bg-white rounded-xl shadow-sm">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-2">Interactive Chat</h3>
          <p className="text-gray-600 text-sm">
            Ask questions and get detailed answers about your PDF content
          </p>
        </div>
      </div>
    </div>
  );
};

export default PDFUploader;