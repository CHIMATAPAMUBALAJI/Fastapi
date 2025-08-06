// Context Menu Utility Functions
import { CONTEXT_MENU_CONFIG, MESSAGES } from '../config/constants';

/**
 * Create context menu items based on row type
 * @param {Object} params - AgGrid context menu parameters
 * @param {Function} dispatch - Redux dispatch function
 * @param {Function} setSelectedRow - Redux action creator
 * @param {Function} onEditEmployee - Callback for edit employee action
 * @param {Function} onAddEmployee - Callback for add employee action
 * @param {Function} onDeleteEmployee - Callback for delete employee action
 * @returns {Array} Context menu items array
 */
export const createContextMenuItems = (params, dispatch, setSelectedRow, onEditEmployee, onAddEmployee, onDeleteEmployee) => {
  const { node } = params;
  const rowData = node.data;

  // Manager header context menu
  if (rowData.isGroupHeader || rowData.is_manager) {
    return CONTEXT_MENU_CONFIG.MANAGER_MENU.map(item => ({
      name: item.name,
      action: () => handleManagerAction(item.action, rowData, params, onAddEmployee)
    }));
  }

  // Employee context menu
  return CONTEXT_MENU_CONFIG.EMPLOYEE_MENU.map(item => {
    if (item === "separator") return item;
    
    return {
      name: item.name,
      action: () => handleEmployeeAction(item.action, rowData, dispatch, setSelectedRow, params, onEditEmployee, onDeleteEmployee)
    };
  });
};

/**
 * Handle manager-specific actions
 * @param {String} action - Action type
 * @param {Object} rowData - Manager row data
 * @param {Object} params - AgGrid parameters
 * @param {Function} onAddEmployee - Callback for add employee action
 */
const handleManagerAction = (action, rowData, params, onAddEmployee) => {
  switch (action) {
    case 'ADD_EMPLOYEE':
      console.log(`➕ Opening add employee modal for manager: ${rowData.manager_name}`);
      if (onAddEmployee) {
        onAddEmployee(rowData);
      } else {
        console.warn('No add employee callback provided');
      }
      break;
      
    case 'MANAGER_OPTIONS':
      alert(`Manager: ${rowData.manager_name}`);
      break;
      
    case 'EXPORT_EXCEL':
      console.log(`📊 Exporting data to Excel...`);
      params.api.exportDataAsExcel({
        fileName: `employee_data_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'Employee Data'
      });
      break;
      
    default:
      console.warn('Unknown manager action:', action);
  }
};

/**
 * Handle employee-specific actions
 * @param {String} action - Action type
 * @param {Object} rowData - Employee row data
 * @param {Function} dispatch - Redux dispatch function
 * @param {Function} setSelectedRow - Redux action creator
 * @param {Object} params - AgGrid parameters
 * @param {Function} onEditEmployee - Callback for edit employee action
 * @param {Function} onDeleteEmployee - Callback for delete employee action
 */
const handleEmployeeAction = (action, rowData, dispatch, setSelectedRow, params, onEditEmployee, onDeleteEmployee) => {
  switch (action) {
    case 'LOAD_ANNOTATIONS':
      console.log(`📝 Loading annotations for: ${rowData.name} (ID: ${rowData.id})`);
      console.log('📊 Full employee data being selected:', rowData);
      console.log('📊 Employee ID type:', typeof rowData.id);
      console.log('📊 Employee properties:', Object.keys(rowData));
      dispatch(setSelectedRow(rowData));
      console.log('✅ Employee selection dispatched to Redux store');
      break;
      
    case 'EDIT_EMPLOYEE':
      console.log(`✏️ Opening edit modal for: ${rowData.name} (ID: ${rowData.id})`);
      if (onEditEmployee) {
        onEditEmployee(rowData);
      } else {
        console.warn('No edit employee callback provided');
      }
      break;
      
    case 'DELETE_ROW':
      if (window.confirm(`${MESSAGES.CONFIRM.DELETE_ROW}\nEmployee: ${rowData.name}`)) {
        console.log(`🗑️ Attempting to delete employee: ${rowData.name} (ID: ${rowData.id})`);
        if (onDeleteEmployee) {
          onDeleteEmployee(rowData, params);
        } else {
          console.warn('No delete employee callback provided');
          // Fallback to old behavior if callback not provided
          params.api.applyTransaction({ remove: [rowData] });
        }
      }
      break;
      
    case 'EXPORT_EXCEL':
      console.log(`📊 Exporting data to Excel...`);
      params.api.exportDataAsExcel({
        fileName: `employee_data_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'Employee Data'
      });
      break;
      
    default:
      console.warn('Unknown employee action:', action);
      
  }
};
