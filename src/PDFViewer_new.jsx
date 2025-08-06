import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

/* global PSPDFKit */

export default function PDFViewer() {
  const selectedData = useSelector((state) => state.selected.row);
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Show temporary status message
  const showStatus = (message, duration = 3000) => {
    setStatus(message);
    setTimeout(() => setStatus(''), duration);
  };

  // Clear all annotations
  const clearAnnotations = async () => {
    if (!instanceRef.current) return;
    try {
      const allAnnotations = await instanceRef.current.getAnnotations(0, instanceRef.current.totalPageCount - 1);
      if (allAnnotations.length > 0) {
        await instanceRef.current.delete(allAnnotations);
      }
    } catch (error) {
      console.error('Error clearing annotations:', error);
    }
  };

  // Create annotation from coordinates
  const createAnnotation = async (x0, x1, y0, y1, page) => {
    if (!instanceRef.current || x0 === null || x1 === null || y0 === null || y1 === null) {
      return;
    }

    try {
      const annotation = new PSPDFKit.Annotations.RectangleAnnotation({
        pageIndex: page || 0,
        boundingBox: new PSPDFKit.Geometry.Rect({
          left: Math.min(x0, x1),
          top: Math.min(y0, y1),
          width: Math.abs(x1 - x0),
          height: Math.abs(y1 - y0)
        }),
        strokeColor: PSPDFKit.Color.BLUE,
        fillColor: PSPDFKit.Color.BLUE.withAlpha(0.3),
        strokeWidth: 2
      });

      await instanceRef.current.create(annotation);
      
      // Navigate to the page
      if (page !== undefined && page !== null) {
        await instanceRef.current.setViewState(v => v.set('currentPageIndex', page));
      }
      
      console.log('Created annotation:', { x0, x1, y0, y1, page });
    } catch (error) {
      console.error('Error creating annotation:', error);
    }
  };

  // Load employee coordinates and show annotation
  const loadEmployeeAnnotation = async (employeeData) => {
    if (!employeeData || !instanceRef.current) return;

    try {
      setIsLoading(true);
      showStatus(`Loading annotation for ${employeeData.name}...`);
      
      // Clear existing annotations
      await clearAnnotations();

      // Create annotation from employee coordinates
      const { x0, x1, y0, y1, page } = employeeData;
      if (x0 !== null && x1 !== null && y0 !== null && y1 !== null) {
        await createAnnotation(x0, x1, y0, y1, page);
        showStatus(`✅ Showing annotation for ${employeeData.name}`);
      } else {
        showStatus(`ℹ️ No coordinates found for ${employeeData.name}`);
      }
    } catch (error) {
      console.error('Error loading employee annotation:', error);
      showStatus('❌ Error loading annotation');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize PDF viewer
  const initializePDF = async () => {
    if (!containerRef.current || instanceRef.current) return;

    try {
      const instance = await PSPDFKit.load({
        container: containerRef.current,
        document: "/sample.pdf",
        baseUrl: `${window.location.protocol}//${window.location.host}/`,
        toolbarItems: PSPDFKit.defaultToolbarItems,
        styleSheets: ["/pspdfkit-lib/pspdfkit.css"]
      });
      
      instanceRef.current = instance;
      console.log('PDF initialized successfully');
    } catch (error) {
      console.error('Error initializing PDF:', error);
      showStatus('❌ Error loading PDF');
    }
  };

  // Effect to initialize PDF on mount
  useEffect(() => {
    initializePDF();
    
    return () => {
      if (instanceRef.current) {
        instanceRef.current.unload();
        instanceRef.current = null;
      }
    };
  }, []);

  // Effect to load annotation when employee is selected
  useEffect(() => {
    if (selectedData && instanceRef.current) {
      loadEmployeeAnnotation(selectedData);
    }
  }, [selectedData]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      {/* PDF Container */}
      <div 
        ref={containerRef} 
        style={{ 
          width: "100%", 
          height: "100%",
          border: "1px solid #ddd"
        }} 
      />
      
      {/* Employee Info */}
      {selectedData && (
        <div style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "10px 15px",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "bold",
          zIndex: 1000
        }}>
          📍 Employee: <span style={{color: "#FFD700"}}>{selectedData.name}</span>
          <br />
          <small style={{color: "#ccc"}}>
            ID: {selectedData.id} | Page: {selectedData.page || 0}
          </small>
        </div>
      )}
      
      {/* Status */}
      {status && (
        <div style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          background: status.includes('✅') ? "rgba(76, 175, 80, 0.9)" : 
                     status.includes('ℹ️') ? "rgba(33, 150, 243, 0.9)" : 
                     "rgba(244, 67, 54, 0.9)",
          color: "white",
          padding: "8px 15px",
          borderRadius: "20px",
          fontSize: "12px",
          zIndex: 1000,
          maxWidth: "300px"
        }}>
          {status}
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "20px",
          borderRadius: "8px",
          fontSize: "16px",
          zIndex: 1001
        }}>
          🔄 Loading...
        </div>
      )}
    </div>
  );
}
