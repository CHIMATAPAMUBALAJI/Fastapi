// Application Configuration Constants
// This is context menu

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:9000',
  ENDPOINTS: {
    SEARCH: '/api/search',
    EMPLOYEES: {
      UPDATE: '/api/employees',
      ADD: '/api/employees',
      DELETE: '/api/employees'
    },
    MANAGERS: {
      GET_ALL: '/api/managers'
    },
    ANNOTATIONS: {
      SAVE: '/api/annotations/save',
      GET: '/api/annotations/get'
    }
  },
  TIMEOUT: 10000
};

// UI Configuration
export const UI_CONFIG = {
  GRID: {
    DEFAULT_EXPANDED_GROUPS: ['Aneesh', 'Sampath'],
    SEARCH_PLACEHOLDER: 'Search employee name',
    ROW_HEIGHT: 35,
    HEADER_HEIGHT: 40
  },
  SEARCH: {
    DEBOUNCE_DELAY: 300,
    MIN_SEARCH_LENGTH: 1
  }
};

// Theme Configuration
export const THEME_CONFIG = {
  COLORS: {
    PRIMARY: '#1565c0',
    SECONDARY: '#90caf9',
    BACKGROUND: '#e3f2fd',
    ROW_PRIMARY: '#f3f9ff',
    ROW_SECONDARY: '#e8f4fd',
    HOVER: '#bbdefb',
    SELECTED: '#64b5f6',
    BORDER: '#c5e1ff',
    MANAGER_BG: '#90caf9'
  }
};

// Grid Column Configuration
export const GRID_CONFIG = {
  COLUMNS: [
    { 
      field: "hierarchy", 
      headerName: "Hierarchy", 
      flex: 2,
      sortable: true,
      filter: true,
      resizable: true
    },
    { 
      field: "email", 
      headerName: "Email", 
      flex: 3,
      sortable: true,
      filter: true,
      resizable: true
    },
    { 
      field: "role", 
      headerName: "Role", 
      flex: 2,
      sortable: true,
      filter: true,
      resizable: true
    },
    { 
      field: "country", 
      headerName: "Country", 
      flex: 1,
      sortable: true,
      filter: true,
      resizable: true
    },
    { 
      field: "snippet", 
      headerName: "Snippet", 
      flex: 3,
      sortable: true,
      filter: true,
      resizable: true,
      cellStyle: { fontSize: '12px', color: '#666' },
      tooltipField: "snippet"
    }
  ],
  DEFAULT_COL_DEF: {
    sortable: true,
    filter: true,
    resizable: true
  }
};

// Context Menu Configuration
export const CONTEXT_MENU_CONFIG = {
  EMPLOYEE_MENU: [
    {
      name: "📝 Load Annotations",
      action: "LOAD_ANNOTATIONS"
    },
    "separator",
    {
      name: "✏️ Edit Employee",
      action: "EDIT_EMPLOYEE"
    },
    "separator",
    {
      name: "📊 Export to Excel",
      action: "EXPORT_EXCEL"
    },
    "separator",
    {
      name: "🗑️ Delete Row",
      action: "DELETE_ROW"
    }
  ],
  MANAGER_MENU: [
    {
      name: "➕ Add Employee",
      action: "ADD_EMPLOYEE"
    },
    "separator",
    {
      name: "Manager Options",
      action: "MANAGER_OPTIONS"
    },
    "separator",
    {
      name: "📊 Export to Excel",
      action: "EXPORT_EXCEL"
    }
  ]
};

// Messages and Labels
export const MESSAGES = {
  LOADING: 'Loading...',
  ERROR: {
    FETCH_FAILED: 'Error fetching search results',
    NETWORK_ERROR: 'Network error occurred',
    INVALID_DATA: 'Invalid data received'
  },
  SUCCESS: {
    DATA_LOADED: 'Data loaded successfully',
    ANNOTATION_SAVED: 'Annotation saved successfully'
  },
  CONFIRM: {
    DELETE_ROW: 'Are you sure you want to delete this employee?'
  }
};
