import React, { useState, useRef, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { useScreenshotDetector } from '../hooks/useScreenshotDetector'; // Adjust path; create if needed

function PDFViewer({ url, filename, onClose, sessionId }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onPageLoadError = (error) => {
    console.error('Page load error:', error);
    alert('Error loading PDF—check connection');
  };

  // Screenshot Detector Hook (activates on viewer mount)
  useScreenshotDetector();

  // Dynamic Noise Overlay
  useEffect(() => {
    if (loading || !canvasRef.current || !viewerRef.current) return;

    const generateNoise = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = viewerRef.current.clientWidth;
      canvas.height = viewerRef.current.clientHeight;

      // Clear and regenerate faint random noise (red dots)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 5000; i++) {
        ctx.fillStyle = `rgba(${Math.random() * 255}, 0, 0, 0.005)`;
        ctx.fillRect(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          2, 2
        );
      }
    };

    generateNoise(); // Initial generation

    // Throttled redraw on resize using requestAnimationFrame
    let rafId;
    const resizeHandler = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(generateNoise);
    };
    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [loading]);

  // Event Blocking for Deterrence
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p')) {
        e.preventDefault();
        // Brief blur to disrupt
        if (viewerRef.current) {
          viewerRef.current.style.filter = 'blur(5px)';
          setTimeout(() => {
            if (viewerRef.current) viewerRef.current.style.filter = '';
          }, 1000);
        }
      }
    };

    const handleContext = (e) => {
      if (e.target.closest('.pdf-viewer-container')) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContext);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContext);
    };
  }, []);

  return (
    <div 
      ref={viewerRef}
      className="pdf-viewer-container"
      style={{ position: 'relative', border: '1px solid #ccc', padding: '10px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{filename}</h2>
        <button onClick={onClose}>Close Viewer</button>
      </div>
      {loading && <p>Loading PDF...</p>}
      <Document 
        file={url} 
        onLoadSuccess={onDocumentLoadSuccess} 
        onLoadError={onPageLoadError}
        loading={<p>Processing document...</p>}
      >
        {/* Partial Rendering Clip */}
        <div style={{ 
          overflow: 'hidden', 
          height: '70vh', // Limits to viewport height
          position: 'relative',
          background: 'white' // Ensures clean clip
        }}>
          <Page 
            pageNumber={pageNumber} 
            width={Math.min(800, window.innerWidth - 40)} 
            renderTextLayer={false} // Security: Disable copy
            renderAnnotationLayer={false}
          />
          {/* Simple Text Watermark */}
          {!loading && (
            <div style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(255, 255, 255, 0.8)',
              padding: '5px',
              fontSize: '10px',
              color: 'red',
              pointerEvents: 'none',
              zIndex: 5
            }}>
              Viewed: {new Date(parseInt(sessionId)).toLocaleString()}
            </div>
          )}
        </div>
      </Document>
      {numPages && numPages > 1 && (
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <button 
            onClick={() => setPageNumber(Math.max(pageNumber - 1, 1))} 
            disabled={pageNumber <= 1}
          >
            Previous
          </button>
          <span> Page {pageNumber} of {numPages} </span>
          <button 
            onClick={() => setPageNumber(Math.min(pageNumber + 1, numPages))} 
            disabled={pageNumber >= numPages}
          >
            Next
          </button>
        </div>
      )}
      {/* Existing CSS Grid Overlay */}
      {!loading && (
        <div 
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            pointerEvents: 'none', zIndex: 10,
            backgroundImage: `linear-gradient(90deg, transparent 49%, rgba(255,0,0,0.02) 50%, transparent 51%),
                              repeating-linear(0deg, transparent, transparent 1px, rgba(0,0,255,0.02) 1px, rgba(0,0,255,0.02) 2px)`,
            backgroundSize: '4px 100%, 100% 2px',
          }}
        />
      )}
      {/* Canvas Noise Overlay */}
      {!loading && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            pointerEvents: 'none', zIndex: 11 // Above grid
          }}
        />
      )}
    </div>
  );
}

export default PDFViewer;