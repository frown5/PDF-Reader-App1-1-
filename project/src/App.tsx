import React, { useState } from 'react';
import PDFUploader from './components/PDFUploader';
import PDFViewer from './components/PDFViewer';
import AIAssistant from './components/AIAssistant';
import { FileText, Bot, Upload } from 'lucide-react';

interface PDFData {
  file: File;
  text: string;
  name: string;
}

function App() {
  const [uploadedPDF, setUploadedPDF] = useState<PDFData | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'viewer' | 'assistant'>('upload');

  const handlePDFUpload = (pdfData: PDFData) => {
    setUploadedPDF(pdfData);
    setActiveTab('assistant');
  };

  const tabs = [
    { id: 'upload', label: 'Upload PDF', icon: Upload },
    { id: 'viewer', label: 'PDF Viewer', icon: FileText, disabled: !uploadedPDF },
    { id: 'assistant', label: 'AI Assistant', icon: Bot, disabled: !uploadedPDF },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  PDF AI Assistant
                </h1>
                <p className="text-sm text-gray-500">Upload, analyze, and chat with your PDFs</p>
              </div>
            </div>
            
            {uploadedPDF && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Current PDF:</span> {uploadedPDF.name}
              </div>
            )}
          </div>
          
          {/* Tab Navigation */}
          <div className="mt-4 flex space-x-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                  disabled={tab.disabled}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : tab.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'upload' && (
          <PDFUploader onPDFUpload={handlePDFUpload} />
        )}
        
        {activeTab === 'viewer' && uploadedPDF && (
          <PDFViewer pdfFile={uploadedPDF.file} />
        )}
        
        {activeTab === 'assistant' && uploadedPDF && (
          <AIAssistant pdfData={uploadedPDF} />
        )}
      </div>
    </div>
  );
}

export default App;