import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';


pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const PdfViewer = () => {
    const [numPages, setNumPages] = useState(null);
    const [selectedPdf, setSelectedPdf] = useState('');

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const pdfFiles = {
        'Security and Privacy Policy': '/Security.pdf',
        'Acceptable Use Policy': '/UsePolicy.pdf',
        'DMCA Notice and Takedown Policy': '/DMCANotice.pdf',
        'Database Model for DMCA Requests': '/DMCARequests.pdf'
    };

    return (
        <div>
            <select onChange={(e) => setSelectedPdf(e.target.value)} value={selectedPdf}>
                <option value="">Select a Policy Document</option>
                {Object.keys(pdfFiles).map((key) => (
                    <option key={key} value={pdfFiles[key]}>
                        {key}
                    </option>
                ))}
            </select>

            {selectedPdf && (
                <Document
    file={`${selectedPdf}`} 
    onLoadSuccess={onDocumentLoadSuccess}
>

                    {Array.from(new Array(numPages), (el, index) => (
                        <Page key={`page_${index + 1}`} pageNumber={index + 1} />
                    ))}
                </Document>
            )}
        </div>
    );
};

export default PdfViewer;
