// Grid Utility Functions
import { THEME_CONFIG, MESSAGES } from '../config/constants';

/**
 * Transform flat employee data into hierarchical structure
 * @param {Array} employees - Array of employee objects from API
 * @param {Set} expandedGroups - Set of expanded manager groups
 * @returns {Array} Hierarchical data structure for AgGrid
 */
export const createHierarchicalData = (employees, expandedGroups) => {
  const hierarchicalData = [];
  const managerGroups = {};
  
  // Group employees by manager
  employees.forEach(employee => {
    const managerName = employee.manager_name || 'No Manager';
    if (!managerGroups[managerName]) {
      managerGroups[managerName] = [];
    }
    managerGroups[managerName].push(employee);
  });
  
  // Sort managers alphabetically for consistent display
  const sortedManagers = Object.keys(managerGroups).sort();
  
  // Create hierarchical structure
  sortedManagers.forEach(managerName => {
    // Skip if manager name is null or undefined
    if (!managerName || managerName === 'null') {
      return;
    }
    
    // Add manager header row
    hierarchicalData.push({
      id: `manager_${managerName}`,
      hierarchy: managerName,
      name: managerName, // Add name field for consistency
      manager_name: managerName,
      email: '',
      role: 'Manager',
      isGroupHeader: true,
      employeeCount: managerGroups[managerName].length,
      is_manager: true
    });
    
    // Add employee rows if group is expanded
    if (expandedGroups.has(managerName)) {
      // Sort employees by name for consistent display
      const sortedEmployees = managerGroups[managerName].sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      
      sortedEmployees.forEach(employee => {
        hierarchicalData.push({
          ...employee,
          hierarchy: `  ${employee.name}`, // Indented for visual hierarchy
          isGroupHeader: false,
          is_manager: false
        });
      });
    }
  });
  
  console.log('🌳 Hierarchical data created:', {
    totalRows: hierarchicalData.length,
    managers: sortedManagers,
    expandedGroups: Array.from(expandedGroups)
  });
  return hierarchicalData;
};

/**
 * Generate row styles based on row type and index
 * @param {Object} params - AgGrid row parameters
 * @returns {Object} Style object for the row
 */
export const getRowStyle = (params) => {
  const { data, node } = params;
  
  // Style manager header rows
  if (data.isGroupHeader) {
    return {
      backgroundColor: THEME_CONFIG.COLORS.MANAGER_BG,
      fontWeight: 'bold',
      color: THEME_CONFIG.COLORS.PRIMARY
    };
  }
  
  // Style regular employee rows with alternating colors
  return {
    backgroundColor: node.rowIndex % 2 === 0 
      ? THEME_CONFIG.COLORS.ROW_PRIMARY 
      : THEME_CONFIG.COLORS.ROW_SECONDARY,
    color: THEME_CONFIG.COLORS.PRIMARY
  };
};

/**
 * Create cell renderer for hierarchy column
 * @param {Function} toggleGroup - Function to toggle group expansion
 * @returns {Function} Cell renderer function
 */
export const createHierarchyCellRenderer = (toggleGroup) => {
  return (params) => {
    if (params.data.isGroupHeader) {
      const isExpanded = params.data.expanded || false;
      const arrow = isExpanded ? '▼' : '►';
      return {
        template: `
          <div style="cursor: pointer; font-weight: bold; color: ${THEME_CONFIG.COLORS.PRIMARY};">
            ${arrow} ${params.data.manager_name} (${params.data.employeeCount})
          </div>
        `,
        onClick: () => toggleGroup(params.data.manager_name)
      };
    } else {
      return {
        template: `
          <div style="padding-left: 20px; color: ${THEME_CONFIG.COLORS.PRIMARY};">
            ${params.data.name}
          </div>
        `
      };
    }
  };
};

/**
 * Validate employee data structure
 * @param {Array} data - Employee data array
 * @returns {Boolean} True if data is valid
 */
export const validateEmployeeData = (data) => {
  if (!Array.isArray(data)) {
    console.error(MESSAGES.ERROR.INVALID_DATA, 'Data is not an array');
    return false;
  }
  
  const requiredFields = ['id', 'name', 'email'];
  const isValid = data.every(employee => 
    requiredFields.every(field => employee.hasOwnProperty(field))
  );
  
  if (!isValid) {
    console.error(MESSAGES.ERROR.INVALID_DATA, 'Missing required fields');
  }
  
  return isValid;
};

/**
 * Debounce function for search input
 * @param {Function} func - Function to debounce
 * @param {Number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};
