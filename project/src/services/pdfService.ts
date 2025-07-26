import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.entry?worker';

// ✅ Vite-compatible PDF.js worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items with proper spacing
      const pageText = textContent.items
        .map((item: any) => {
          if ('str' in item) {
            return item.str;
          }
          return '';
        })
        .join(' ');
      
      fullText += `\n\n--- Page ${pageNum} ---\n${pageText}`;
    }
    
    // Clean up the text
    return fullText
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n\n') // Clean up multiple newlines
      .trim();
      
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

export const getPDFInfo = async (file: File) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const metadata = await pdf.getMetadata();

    const info = metadata.info as {
      Title?: string;
      Author?: string;
      Subject?: string;
      Creator?: string;
      CreationDate?: string;
    };

    return {
      numPages: pdf.numPages,
      title: info.Title || file.name,
      author: info.Author || 'Unknown',
      subject: info.Subject || '',
      creator: info.Creator || '',
      creationDate: info.CreationDate || null,
    };
  } catch (error) {
    console.error('Error getting PDF info:', error);
    throw new Error('Failed to get PDF information');
  }
};
