import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import PSPDFKit from "pspdfkit";

export default function PDFViewer() {
  const selectedData = useSelector((state) => state.selected.row);
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
//selectedData: This is the employee selected in the AG Grid.
//containerRef: Holds the HTML element where PSPDFKit will render the PDF.
//instanceRef: Stores the actual PSPDFKit instance (so we can use its API).
//status: Message box to show save/load/success/error info.
//isLoading: Controls the loading overlay UI.

  // Show temporary status message
  const showStatus = (message, duration = 3000) => {
    setStatus(message);
    setTimeout(() => setStatus(''), duration);
  };

  // Clear all annotations
  const clearAnnotations = async () => {
    if (!instanceRef.current) return;
    try {
      const totalPages = instanceRef.current.totalPageCount;
      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const annots = await instanceRef.current.getAnnotations(pageIndex);
        if (annots.size > 0) {
          await instanceRef.current.delete(annots);
        }
      }
    } catch (error) {
      console.error('Error clearing annotations:', error);
    }
  };

  // Display annotation from coordinates (using proven reference implementation)
  const displayAnnotation = async (x0, x1, y0, y1, page) => {
    if (!instanceRef.current || x0 == null || x1 == null || y0 == null || y1 == null) {
      showStatus('❌ Missing annotation data');
      console.log('❌ Cannot display annotation - missing data:', { x0, x1, y0, y1, page, instance: !!instanceRef.current });
      return;
    }
    
    try {
      console.log('🎯 Displaying annotation with coordinates:', { x0, x1, y0, y1, page });
      
      // Clear existing annotations first
      await clearAnnotations();
      
      const annotation = new PSPDFKit.Annotations.RectangleAnnotation({
        pageIndex: page || 0,
        boundingBox: new PSPDFKit.Geometry.Rect({
          left: Math.min(x0, x1),
          top: Math.min(y0, y1),
          width: Math.abs(x1 - x0),
          height: Math.abs(y1 - y0)
        }),
        strokeColor: new PSPDFKit.Color({ r: 0, g: 0, b: 255 }), // Blue color
        fillColor: new PSPDFKit.Color({ r: 0, g: 0, b: 255, a: 0.3 }), // Blue with alpha
        strokeWidth: 0, // Reduced from 3 to 1 for thinner border
        opacity: 0.5
      });
      
      console.log('📝 Annotation object created:', annotation);
      await instanceRef.current.create(annotation);
      console.log('✅ Annotation created in PSPDFKit');

      // Navigate to the annotation's page
      if (page !== undefined && page !== null) {
        const state = instanceRef.current.viewState;
        const newState = state.set("currentPageIndex", page);
        instanceRef.current.setViewState(newState);
        console.log(`📄 Navigated to page ${page}`);
      }
      
      showStatus('✅ Annotation displayed');
      console.log('✅ Annotation displayed successfully:', { x0, x1, y0, y1, page });
      
    } catch (error) {
      console.error('❌ Error displaying annotation:', error);
      showStatus('❌ Failed to display annotation');
    }
  };

  // Load employee coordinates and show annotation from backend
  const loadEmployeeAnnotation = useCallback(async (employeeData) => {
    if (!employeeData || !instanceRef.current) return;

    try {
      setIsLoading(true);
      showStatus(`Loading annotation for ${employeeData.name}...`);
      
      // Load from backend API
      const response = await fetch(`http://localhost:9000/employee/${employeeData.id}/annotation`);
      
      await clearAnnotations();
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Loaded annotation data:', data);
        
        if (data.has_annotation && data.coordinates) {
          const { x0, x1, y0, y1, page } = data.coordinates;
          
          // Navigate to the employee's page first
          if (page !== null && page !== undefined) {
            try {
              const currentViewState = instanceRef.current.viewState;
              const newViewState = currentViewState.set('currentPageIndex', page);
              await instanceRef.current.setViewState(newViewState);
              console.log(`📄 Navigated to page ${page}`);
            } catch (error) {
              console.error('❌ Page navigation error:', error);
              // Fallback: try direct page navigation
              try {
                await instanceRef.current.setCurrentPageIndex(page);
                console.log(`📄 Navigated to page ${page} (fallback method)`);
              } catch (fallbackError) {
                console.error('❌ Fallback navigation failed:', fallbackError);
              }
            }
          }
          
          // Display the visual annotation
          await displayAnnotation(x0, x1, y0, y1, page);
          showStatus(`✅ Showing annotation for ${data.employee_name}`);
        } else {
          showStatus(`ℹ️ No annotation found for ${data.employee_name}`);
        }
      } else {
        // Fallback to employee data coordinates if backend fails
        const { x0, x1, y0, y1, page } = employeeData;
        if (x0 != null && x1 != null && y0 != null && y1 != null) {
          await displayAnnotation(x0, x1, y0, y1, page);
          showStatus(`✅ Showing annotation for ${employeeData.name}`);
        } else {
          showStatus(`ℹ️ No coordinates found for ${employeeData.name}`);
        }
      }
    } catch (error) {
      console.error('Error loading employee annotation:', error);
      showStatus('❌ Error loading annotation');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save annotation to backend (manual save functionality)
  const saveAnnotationToBackend = async (annotation) => {  //From here text also gets extracted from the PDF
    console.log('💾 Starting manual save process...');
    
    if (!selectedData?.id) {
      console.error('❌ Cannot save: No employee selected');
      showStatus('❌ Cannot save: No employee selected');
      return;
    }
    
    if (!annotation) {
      console.error('❌ Cannot save: No annotation provided');
      showStatus('❌ Cannot save: No annotation provided');
      return;
    }
    
    console.log('💾 Saving annotation for employee:', selectedData.name, 'ID:', selectedData.id);

    const boundingBox = annotation.boundingBox;//Extracts the coordinates and size of the rectangle:
    let extractedText = '';//Initializes a variable extractedText to store the final text result.
    
    try {
      // ULTRA-ENHANCED text extraction with MAXIMUM support for light-colored text
      const textLines = await instanceRef.current.textLinesForPageIndex(annotation.pageIndex);// LINE THAT EXTRACTS ALL TEXT LINES FROM A PAGE:
      //This is the line that fetches all the text from the same page as your annotation.

      console.log('🔍 ULTRA-ENHANCED Processing', textLines.length, 'text lines for maximum extraction');
      console.log('📐 Annotation bounds:', {
        left: boundingBox.left,
        top: boundingBox.top,
        right: boundingBox.left + boundingBox.width,
        bottom: boundingBox.top + boundingBox.height,
        width: boundingBox.width,
        height: boundingBox.height
      });
      
      // DEBUG: Log all text lines to understand what's available
      console.log('📝 ALL TEXT LINES ON PAGE:');
      textLines.forEach((line, index) => {
        console.log(`Line ${index}:`, {
          content: line.contents,
          bounds: line.boundingBox,
          length: line.contents.length
        });
      });
      
      let extractedWords = [];
      let processedLines = 0;
      
      // PRECISE TEXT EXTRACTION: Only capture text within annotation boundaries
      console.log('🎯 PRECISE EXTRACTION: Only text within annotation rectangle');
      
      for (const textLine of textLines) {
        const lineRect = textLine.boundingBox;
        
        // Check if line intersects with annotation rectangle (no extra tolerance)
        const lineOverlapsHorizontally = 
          (lineRect.left < (boundingBox.left + boundingBox.width)) &&
          ((lineRect.left + lineRect.width) > boundingBox.left);
          
        const lineOverlapsVertically = 
          (lineRect.top < (boundingBox.top + boundingBox.height)) &&
          ((lineRect.top + lineRect.height) > boundingBox.top);
        
        if (lineOverlapsHorizontally && lineOverlapsVertically) {
          processedLines++;
          console.log('📄 Processing intersecting line:', {
            content: textLine.contents,
            lineBounds: lineRect,
            annotationBounds: boundingBox
          });
          
          // PRECISE WORD-BY-WORD EXTRACTION: Only include words that are actually within the rectangle
          const words = textLine.contents.split(/\s+/).filter(w => w.trim());
          if (words.length === 0) continue;
          
          const lineWidth = lineRect.width;
          const lineLeft = lineRect.left;
          const avgCharWidth = lineWidth / Math.max(textLine.contents.length, 1);
          
          let currentPos = lineLeft;
          for (const word of words) {
            if (!word.trim()) continue;
            
            const wordWidth = word.length * avgCharWidth;
            const wordLeft = currentPos;
            const wordRight = currentPos + wordWidth;
            const wordCenter = currentPos + (wordWidth / 2);
            
            // PRECISE CHECK: Word must be substantially within the annotation rectangle
            const annotLeft = boundingBox.left;
            const annotRight = boundingBox.left + boundingBox.width;
            const annotTop = boundingBox.top;
            const annotBottom = boundingBox.top + boundingBox.height;
            
            // Check if word center is within annotation bounds OR if significant portion overlaps
            const wordCenterInside = (wordCenter >= annotLeft && wordCenter <= annotRight);
            
            // Calculate overlap percentage for this word
            const overlapLeft = Math.max(wordLeft, annotLeft);
            const overlapRight = Math.min(wordRight, annotRight);
            const overlapWidth = Math.max(0, overlapRight - overlapLeft);
            const wordOverlapPercentage = wordWidth > 0 ? (overlapWidth / wordWidth) : 0;
            
            // Include word if center is inside OR if more than 50% of word overlaps
            if (wordCenterInside || wordOverlapPercentage > 0.5) {
              extractedWords.push(word);
              console.log('✅ Added word:', word, '(center inside:', wordCenterInside, ', overlap:', (wordOverlapPercentage * 100).toFixed(1), '%)');
            } else {
              console.log('❌ Skipped word:', word, '(center inside:', wordCenterInside, ', overlap:', (wordOverlapPercentage * 100).toFixed(1), '%)');
            }
            
            currentPos += wordWidth + avgCharWidth; // Add space width
          }
        } else {
          // Log why line was skipped
          console.log('❌ Skipped line (no intersection):', {
            content: textLine.contents.substring(0, 30) + '...',
            horizontalOverlap: lineOverlapsHorizontally,
            verticalOverlap: lineOverlapsVertically
          });
        }
      }
      
      // Combine the extracted words and clean up
      extractedText = extractedWords.join(' ').replace(/\s+/g, ' ').trim();//Combine all words into one snippet
      
      console.log('📝 Final extracted text:', extractedText);
      console.log('📊 Extraction stats:', {
        totalLines: textLines.length,
        processedLines: processedLines,
        extractedWords: extractedWords.length,
        finalTextLength: extractedText.length
      });
      
    } catch (textError) {
      console.warn('⚠️ Text extraction failed, saving without snippet:', textError);
      extractedText = '';
    }
// Upload the data to backend:
    const dataToSend = {
      x0: boundingBox.left,
      y0: boundingBox.top,
      x1: boundingBox.left + boundingBox.width,
      y1: boundingBox.top + boundingBox.height,
      page: annotation.pageIndex,
      snippet: extractedText || null
    };

    try {
      const response = await fetch(`http://localhost:9000/employee/${selectedData.id}/annotation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      
      if (response.ok) {
        console.log('✅ Manual save completed - Annotation saved to PostgreSQL:', dataToSend);
        const snippetPreview = extractedText ? ` ("${extractedText.substring(0, 50)}${extractedText.length > 50 ? '...' : ''}")` : '';
        showStatus(`✅ Manual save successful for ${selectedData.name}${snippetPreview}`);
      } else {
        console.error('❌ Manual save failed:', response.status);
        showStatus('❌ Manual save failed - Server error');
      }
    } catch (err) {
      console.error("❌ Annotation save failed:", err);
      showStatus('❌ Network error during save');
    }
  };

  // Initialize PDF viewer
  const initializePDF = useCallback(async () => {
    if (!containerRef.current || instanceRef.current) return;

    try {
      const instance = await PSPDFKit.load({
        container: containerRef.current,
        document: "/pdf/wellcome.pdf",
        baseUrl: `${window.location.protocol}//${window.location.host}/pspdfkit-lib/`,
        toolbarItems: PSPDFKit.defaultToolbarItems,
        // Configure thinner annotation edges during drawing
        annotationPresets: {
          rectangle: {
            strokeWidth: 1, // Thin edges while drawing
            strokeColor: new PSPDFKit.Color({ r: 0, g: 0, b: 255 }), // Blue color
            fillColor: new PSPDFKit.Color({ r: 0, g: 0, b: 255, a: 0.1 }), // Light blue fill
            opacity: 0.8
          }
        }
      });

      instanceRef.current = instance;
      console.log('PDF initialized successfully - Manual save only mode with thin annotation edges');
      
      // Configure annotation creation defaults for even thinner edges
      instance.addEventListener('annotations.willCreate', (event) => {
        event.annotations.forEach(annotation => {
          if (annotation instanceof PSPDFKit.Annotations.RectangleAnnotation) {
            // Make drawing edges very thin
            annotation.strokeWidth = 0.5;
            annotation.strokeColor = new PSPDFKit.Color({ r: 0, g: 0, b: 255 });
            // annotation.fillColor = new PSPDFKit.Color({ r: 0, g: 0, b: 255, a: 0.1 });
            console.log('🎨 Applied thin edges to new rectangle annotation');
          }
        });
      });
      
      // AUTO-SAVE DISABLED: Only manual save via "Save Anno-Coor" button
      // No annotation event listeners added to prevent auto-save behavior
      
    } catch (error) {
      console.error('Error initializing PDF:', error);
      showStatus('❌ Error loading PDF');
    }
  }, []);

  // Effect to initialize PDF on mount
  useEffect(() => {
    initializePDF();

    // Copy containerRef.current to variable for cleanup
    const container = containerRef.current;
    return () => {
      if (instanceRef.current) {
        try {
          PSPDFKit.unload(container);
        } catch (error) {
          console.log('PSPDFKit unload completed');
        }
        instanceRef.current = null;
      }
    };
  }, [initializePDF]);

  // Effect to load annotation when employee is selected
  useEffect(() => {
    if (selectedData && instanceRef.current) {
      loadEmployeeAnnotation(selectedData);
    }
  }, [selectedData, loadEmployeeAnnotation]);

  // Event listeners for custom events from TreeGrid buttons
  useEffect(() => {
    const handleSaveAnnotation = (event) => {
      console.log('💾 Manual save annotation event triggered!', event);
      
      // Validate prerequisites
      if (!instanceRef.current) {
        console.log('❌ No PDF instance found');
        showStatus('❌ PDF not loaded yet');
        return;
      }
      
      if (!selectedData?.id) {
        console.log('❌ No employee selected');
        showStatus('❌ Please select an employee first!');
        return;
      }
      
      console.log('💾 PDF instance and employee found, getting annotations...');
      console.log('💾 Selected employee:', selectedData.name, 'ID:', selectedData.id);
      
      // Get all annotations on current page and save the last one
      const currentPage = instanceRef.current.viewState.currentPageIndex;
      console.log('💾 Current page:', currentPage);
      
      instanceRef.current.getAnnotations(currentPage).then(annotations => {
        console.log('💾 Found total annotations:', annotations.size);
        const rectangleAnnotations = Array.from(annotations).filter(
          ann => ann instanceof PSPDFKit.Annotations.RectangleAnnotation
        );
        console.log('💾 Rectangle annotations found:', rectangleAnnotations.length);
        
        if (rectangleAnnotations.length > 0) {
          const lastAnnotation = rectangleAnnotations[rectangleAnnotations.length - 1];
          console.log('💾 Saving last annotation:', lastAnnotation);
          console.log('💾 Annotation details:', {
            pageIndex: lastAnnotation.pageIndex,
            boundingBox: lastAnnotation.boundingBox,
            type: lastAnnotation.constructor.name
          });
          saveAnnotationToBackend(lastAnnotation);
        } else {
          console.log('❌ No rectangle annotations found on current page');
          showStatus('❌ No annotation to save - draw a rectangle first!');
        }
      }).catch(error => {
        console.error('❌ Error getting annotations:', error);
        showStatus('❌ Error getting annotations: ' + error.message);
      });
    };

    const handleDebugAnnotations = async (event) => {
      if (instanceRef.current) {
        try {
          const currentPage = instanceRef.current.viewState.currentPageIndex;
          const allAnnotations = await instanceRef.current.getAnnotations(currentPage);
          console.log(`🔍 Page ${currentPage} annotations:`, Array.from(allAnnotations));
          console.log(`🔍 Total annotations on page: ${allAnnotations.size}`);
          
          // Also check all pages
          for (let i = 0; i < 5; i++) {
            const pageAnnotations = await instanceRef.current.getAnnotations(i);
            if (pageAnnotations.size > 0) {
              console.log(`📄 Page ${i} has ${pageAnnotations.size} annotations:`, Array.from(pageAnnotations));
            }
          }
          
          showStatus(`🔍 Found ${allAnnotations.size} annotations on current page`);
        } catch (error) {
          console.error('❌ Debug error:', error);
        }
      }
    };

    // Add event listeners
    window.addEventListener('savePDFAnnotation', handleSaveAnnotation);
    window.addEventListener('debugPDFAnnotations', handleDebugAnnotations);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('savePDFAnnotation', handleSaveAnnotation);
      window.removeEventListener('debugPDFAnnotations', handleDebugAnnotations);
    };
  }, [selectedData]); // Include selectedData to avoid stale closure

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