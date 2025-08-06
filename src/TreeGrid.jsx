// TreeGrid Component - Employee Hierarchy Display

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import "./grid-theme.css";

import { ModuleRegistry } from "ag-grid-community";
import { ClientSideRowModelModule } from "ag-grid-community";
import { MenuModule } from "ag-grid-enterprise";
import { ExcelExportModule } from "ag-grid-enterprise";

// Configuration and utilities
import { UI_CONFIG, GRID_CONFIG, THEME_CONFIG, MESSAGES } from "./config/constants";
import apiService from "./services/apiService";
import { createHierarchicalData, getRowStyle, validateEmployeeData, debounce } from "./utils/gridUtils";
import { createContextMenuItems } from "./utils/contextMenuUtils";
import { setSelectedRow } from "./selectedSlice";
import EmployeeEditModal from "./components/EmployeeEditModal";
import AddEmployeeModal from "./components/AddEmployeeModal";

ModuleRegistry.registerModules([ClientSideRowModelModule, MenuModule, ExcelExportModule]);

const TreeGrid = () => {
  const dispatch = useDispatch();
  const selectedData = useSelector((state) => state.selected.row);
  const [rowData, setRowData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState(new Set(UI_CONFIG.GRID.DEFAULT_EXPANDED_GROUPS));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  
  // Add employee modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  // Hierarchy START
  const columnDefs = [
    {
      ...GRID_CONFIG.COLUMNS[0], // hierarchy column
      cellRenderer: (params) => {
        if (params.data.isGroupHeader) {
          const isExpanded = expandedGroups.has(params.data.manager_name);
          const arrow = isExpanded ? '▼' : '►';
          return (
            <div 
              style={{ 
                cursor: 'pointer', 
                fontWeight: 'bold',
                color: THEME_CONFIG.COLORS.PRIMARY
              }}
              onClick={() => toggleGroup(params.data.manager_name)}
            >
              {arrow} {params.data.manager_name} ({params.data.employeeCount})
            </div>
          );
        } else {
          return (
            <div style={{ 
              paddingLeft: '20px',
              color: THEME_CONFIG.COLORS.PRIMARY
            }}>
              {params.data.name}
            </div>
          );
        }
      }
    },
    ...GRID_CONFIG.COLUMNS.slice(1) // email and role columns
  ];
  // Hierarchy END

  // Use configuration for default column definition
  const defaultColDef = GRID_CONFIG.DEFAULT_COL_DEF;

  const toggleGroup = useCallback((managerName) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(managerName)) {
        newSet.delete(managerName);
      } else {
        newSet.add(managerName);
      }
      return newSet;
    });
  }, []);

  // Refresh data function that can be called externally
  const refreshData = useCallback(async () => {
    console.log('🔄 Refreshing AgGrid data after annotation save...');
    setLoading(true);
    setError(null);

    try {
      // Fetch fresh data using current search term
      const data = await apiService.searchEmployees(searchTerm);
      
      // Validate data structure
      if (!validateEmployeeData(data)) {
        throw new Error(MESSAGES.ERROR.INVALID_DATA);
      }
      
      // Create hierarchical structure using utility function
      const hierarchicalData = createHierarchicalData(data, expandedGroups);
      
      setRowData(hierarchicalData);
      console.log('✅ AgGrid data refreshed successfully after annotation save');
      
    } catch (err) {
      console.error('❌ Failed to refresh AgGrid data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, expandedGroups]);

  // Search employees using API service
  const handleSearch = useCallback(async () => {
    // Allow empty search to show all employees (fixed search reset issue)
    // Only skip search if term is too short but not empty
    if (searchTerm.length > 0 && searchTerm.length < UI_CONFIG.SEARCH.MIN_SEARCH_LENGTH) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch data using API service - empty searchTerm will return all employees
      const data = await apiService.searchEmployees(searchTerm);
      
      // Validate data structure
      if (!validateEmployeeData(data)) {
        throw new Error(MESSAGES.ERROR.INVALID_DATA);
      }
      
      // Create hierarchical structure using utility function
      const hierarchicalData = createHierarchicalData(data, expandedGroups);
      
      setRowData(hierarchicalData);
      console.log(searchTerm ? `🔍 Search results loaded for: "${searchTerm}"` : '📊 All employees loaded');
      
    } catch (err) {
      console.error(MESSAGES.ERROR.FETCH_FAILED, err);
      setError(err.message);
      setRowData([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, expandedGroups]);

  useEffect(() => {
    const handleRefreshEvent = (event) => {
      console.log('📨 Received refreshAgGrid event from PDFViewer:', event.detail);
      refreshData();
    };

    // Add event listener for AgGrid refresh
    window.addEventListener('refreshAgGrid', handleRefreshEvent);

    // Cleanup event listener
    return () => {
      window.removeEventListener('refreshAgGrid', handleRefreshEvent);
    };
  }, [refreshData]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  // Handle employee row clicks (ignore manager headers)
  const handleRowClick = useCallback((event) => {
    // Don't handle clicks on manager header rows
    if (event.data.isGroupHeader || event.data.is_manager) {
      console.log('💼 Manager header clicked - ignoring:', event.data.manager_name);
      return;
    }
    
    console.log('👤 Employee selected:', event.data.name, '(ID:', event.data.id, ')');
    console.log('📤 Dispatching to Redux:', event.data);
    dispatch(setSelectedRow(event.data));
  }, [dispatch]);

  // Handle opening edit modal
  const handleEditEmployee = useCallback((employee) => {
    console.log('✏️ Opening edit modal for employee:', employee);
    setEditingEmployee(employee);
    setEditModalOpen(true);
  }, []);

  // Handle saving edited employee
  const handleSaveEmployee = useCallback(async (updatedEmployee) => {
    console.log('💾 Saving updated employee:', updatedEmployee);
    
    try {
      // Update the row data with the new employee information
      setRowData(prevData => {
        return prevData.map(row => {
          if (!row.isGroupHeader && row.id === updatedEmployee.id) {
            return {
              ...row,
              name: updatedEmployee.name,
              email: updatedEmployee.email,
              role: updatedEmployee.role
            };
          }
          return row;
        });
      });
      
      console.log('✅ Employee data updated in grid');
      
      // Show success message
      if (updatedEmployee.message) {
        // You could add a toast notification here
        console.log('📢 Success:', updatedEmployee.message);
      }
      
    } catch (error) {
      console.error('❌ Error updating employee in grid:', error);
      setError('Failed to update employee in grid');
    }
  }, []);

  // Handle closing edit modal
  const handleCloseEditModal = useCallback(() => {
    setEditModalOpen(false);
    setEditingEmployee(null);
  }, []);

  // Handle opening add employee modal
  const handleAddEmployee = useCallback((managerData) => {
    console.log('➕ Opening add employee modal for manager:', managerData);
    setAddModalOpen(true);
  }, []);

  // Handle adding new employee
  const handleSaveNewEmployee = useCallback(async (newEmployee) => {
    console.log('💾 Adding new employee:', newEmployee);
    
    try {
      // Add the new employee to the row data
      setRowData(prevData => {
        // Find the manager group and add the employee
        const updatedData = [...prevData];
        
        // Create new employee row
        const employeeRow = {
          id: newEmployee.id,
          name: newEmployee.name,
          email: newEmployee.email,
          role: newEmployee.role,
          manager_id: newEmployee.manager_id,
          manager_name: newEmployee.manager_name,
          isGroupHeader: false,
          path: [newEmployee.manager_name, newEmployee.name]
        };
        
        // Find where to insert the new employee (after the manager header)
        let insertIndex = -1;
        for (let i = 0; i < updatedData.length; i++) {
          if (updatedData[i].isGroupHeader && updatedData[i].manager_name === newEmployee.manager_name) {
            // Find the end of this manager's employees
            let j = i + 1;
            while (j < updatedData.length && !updatedData[j].isGroupHeader) {
              j++;
            }
            insertIndex = j;
            break;
          }
        }
        
        if (insertIndex !== -1) {
          updatedData.splice(insertIndex, 0, employeeRow);
        } else {
          // If manager group not found, add at the end
          updatedData.push(employeeRow);
        }
        
        return updatedData;
      });
      
      console.log('✅ New employee added to grid');
      
      // Show success message
      if (newEmployee.message) {
        console.log('📢 Success:', newEmployee.message);
      }
      
    } catch (error) {
      console.error('❌ Error adding employee to grid:', error);
      setError('Failed to add employee to grid');
    }
  }, []);

  // Handle closing add employee modal
  const handleCloseAddModal = useCallback(() => {
    setAddModalOpen(false);
  }, []);

  // Handle deleting employee
  const handleDeleteEmployee = useCallback(async (employee, params) => {
    console.log('🗑️ Deleting employee:', employee);
    
    try {
      // Call API to delete employee from database
      const response = await apiService.deleteEmployee(employee.id);
      
      console.log('✅ Employee deleted from database:', response);
      
      // Remove from UI after successful database deletion
      params.api.applyTransaction({ remove: [employee] });
      
      console.log('✅ Employee removed from grid');
      
      // Show success message
      if (response.message) {
        console.log('📢 Success:', response.message);
      }
      
    } catch (error) {
      console.error('❌ Error deleting employee:', error);
      setError(`Failed to delete employee: ${error.message}`);
    }
  }, []);

  // Create context menu items using utility function
  const getContextMenuItems = useCallback((params) => {
    return createContextMenuItems(params, dispatch, setSelectedRow, handleEditEmployee, handleAddEmployee, handleDeleteEmployee);
  }, [dispatch, handleEditEmployee, handleAddEmployee, handleDeleteEmployee]);

  // Create debounced search function
  const debouncedSearch = useMemo(
    () => debounce(() => handleSearch(), UI_CONFIG.SEARCH.DEBOUNCE_DELAY),
    [handleSearch]
  );

  // Handle search input changes
  const handleSearchInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch();
  }, [debouncedSearch]);

  return (
    <div style={{ height: "100%" }}>
      {/* Search Section */}
      <div style={{ 
        margin: "10px",
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }}>
        <input
          type="text"
          value={searchTerm}
          placeholder={UI_CONFIG.GRID.SEARCH_PLACEHOLDER}
          onChange={handleSearchInputChange}
          style={{
            padding: "8px",
            border: `1px solid ${THEME_CONFIG.COLORS.SECONDARY}`,
            borderRadius: "4px",
            backgroundColor: THEME_CONFIG.COLORS.ROW_PRIMARY,
            color: THEME_CONFIG.COLORS.PRIMARY,
            flex: 1
          }}
        />
        <button 
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: "8px 16px",
            backgroundColor: THEME_CONFIG.COLORS.SECONDARY,
            color: THEME_CONFIG.COLORS.PRIMARY,
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? MESSAGES.LOADING : 'Search'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          margin: "0 10px 10px",
          padding: "8px",
          backgroundColor: "#ffebee",
          color: "#77b763ff",
          borderRadius: "4px",
          fontSize: "14px"
        }}>
          {error}
        </div>
      )}

      {/* PDF Annotation Controls */}
      {selectedData && (
        <div style={{
          margin: "0 10px 10px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          alignItems: "center",
          padding: "8px",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
          border: "1px solid #ddd"
        }}>
          <div style={{
            fontSize: "12px",
            fontWeight: "bold",
            color: "#333",
            minWidth: "180px"
          }}>
            Employee: {selectedData.name} (ID: {selectedData.id}) | Page: {selectedData.page || 0}
          </div>
          
          <button
            onClick={() => {
              console.log('🔘 Save Anno-Coor button clicked!', selectedData);
              // This will be handled by PDFViewer component
              const event = new CustomEvent('savePDFAnnotation', { detail: selectedData });
              console.log('📤 Dispatching savePDFAnnotation event:', event);
              window.dispatchEvent(event);
              console.log('✅ Event dispatched successfully');
            }}
            style={{
              padding: "6px 12px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
            }}
          >
            💾 Save Anno-Coor
          </button>
          
          <button
            onClick={() => {
              // This will be handled by PDFViewer component
              const event = new CustomEvent('debugPDFAnnotations', { detail: selectedData });
              window.dispatchEvent(event);
            }}
            style={{
              padding: "6px 12px",
              backgroundColor: "#FF9800",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
            }}
          >
            🔍 Debug Annotations
          </button>
        </div>
      )}

      {/* Grid Section */}
      <div className="ag-theme-balham" style={{ 
        height: selectedData ? 
          (error ? "calc(100% - 150px)" : "calc(100% - 110px)") : 
          (error ? "calc(100% - 90px)" : "calc(100% - 50px)"), 
        width: "100%",
        "--ag-background-color": THEME_CONFIG.COLORS.BACKGROUND,
        "--ag-header-background-color": THEME_CONFIG.COLORS.SECONDARY,
        "--ag-header-foreground-color": THEME_CONFIG.COLORS.PRIMARY,
        "--ag-row-background-color": THEME_CONFIG.COLORS.ROW_PRIMARY,
        "--ag-odd-row-background-color": THEME_CONFIG.COLORS.ROW_SECONDARY,
        "--ag-row-hover-color": THEME_CONFIG.COLORS.HOVER,
        "--ag-selected-row-background-color": THEME_CONFIG.COLORS.SELECTED
      }}>
         <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          gridOptions={{
            headerHeight: UI_CONFIG.GRID.HEADER_HEIGHT,
            rowHeight: UI_CONFIG.GRID.ROW_HEIGHT,
            animateRows: true,
            suppressRowClickSelection: false,
            rowSelection: "single"
          }}
          onRowClicked={handleRowClick}
          getContextMenuItems={getContextMenuItems}
          getRowStyle={getRowStyle}
          onGridReady={(params) => {
            // console.log('🎉 Grid ready - Employee hierarchy loaded');
          }}
          loading={loading}
        />
      </div>
      
      {/* Employee Edit Modal */}
      <EmployeeEditModal
        employee={editingEmployee}
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveEmployee}
      />
      
      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={addModalOpen}
        onClose={handleCloseAddModal}
        onAdd={handleSaveNewEmployee}
      />
    </div>
  );
};

export default TreeGrid;
