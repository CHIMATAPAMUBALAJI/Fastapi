// Backup Balaji's code
// src/App.jsx
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Split } from '@geoffcox/react-splitter';
import TreeGrid from "./TreeGrid";
import PDFViewer from './PDFViewer';
import './styles/splitter.css';

const App = () => {
  const [showPDF, setShowPDF] = useState(true); // Show PDF by default
  const selectedRow = useSelector((state) => state.selected.row);

  // Show PDF when a row is selected or annotation update is triggered
  useEffect(() => {
    if (selectedRow) {
      setShowPDF(true);
    }
  }, [selectedRow]);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Split
        horizontal={false} // Vertical split (left-right)
        initialPrimarySize="50%" // Initial size of left pane
        minPrimarySize="200px" // Minimum size of AG Grid
        minSecondarySize="300px" // Minimum size of PDF viewer
        splitterStyle={{
          backgroundColor: '#e0e0e0',
          width: '6px',
          cursor: 'col-resize',
          borderLeft: '1px solid #ccc',
          borderRight: '1px solid #ccc'
        }}
        style={{ height: '100%' }}
      >
        {/* Left Pane - AG Grid */}
        <div style={{ 
          height: '100%', 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <TreeGrid />
        </div>
        
        {/* Right Pane - PDF Viewer */}
        <div style={{ 
          height: '100%', 
          overflow: 'hidden'
        }}>
          {showPDF && <PDFViewer />}
        </div>
      </Split>
    </div>
  );
};

export default App;
