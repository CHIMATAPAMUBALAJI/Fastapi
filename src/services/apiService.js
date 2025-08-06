// API Service Layer
import { API_CONFIG, MESSAGES } from '../config/constants';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Generic fetch wrapper with error handling
  async fetchWithErrorHandling(url, options = {}) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw new Error(error.message || MESSAGES.ERROR.NETWORK_ERROR);
    }
  }

  // Search employees
  async searchEmployees(searchTerm = '') {
    const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.SEARCH}?name=${encodeURIComponent(searchTerm)}`;
    
    try {
      const data = await this.fetchWithErrorHandling(url);
      console.log('📊 Raw data from backend:', data);
      return data;
    } catch (error) {
      console.error(MESSAGES.ERROR.FETCH_FAILED, error);
      throw error;
    }
  }

  // Save annotations
  async saveAnnotations(employeeId, annotations) {
    const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.ANNOTATIONS.SAVE}`;
    
    try {
      const response = await this.fetchWithErrorHandling(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employeeId,
          annotations: annotations
        })
      });
      
      console.log(MESSAGES.SUCCESS.ANNOTATION_SAVED);
      return response;
    } catch (error) {
      console.error('Error saving annotations:', error);
      throw error;
    }
  }

  // Get annotations
  async getAnnotations(employeeId) {
    const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.ANNOTATIONS.GET}/${employeeId}`;
    
    try {
      const data = await this.fetchWithErrorHandling(url);
      console.log('📝 Annotations loaded for employee:', employeeId);
      return data;
    } catch (error) {
      console.error('Error loading annotations:', error);
      throw error;
    }
  }

  // Update employee details
  async updateEmployee(employeeId, employeeData) {
    const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.EMPLOYEES.UPDATE}/${employeeId}`;
    
    try {
      const response = await this.fetchWithErrorHandling(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData)
      });
      
      console.log('✅ Employee updated successfully:', employeeId);
      return response;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  // Add new employee
  async addEmployee(employeeData) {
    const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.EMPLOYEES.ADD}`;
    
    try {
      const response = await this.fetchWithErrorHandling(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData)
      });
      
      console.log('✅ Employee added successfully:', response);
      return response;
    } catch (error) {
      console.error('Error adding employee:', error);
      throw error;
    }
  }

  // Get all managers
  async getManagers() {
    const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.MANAGERS.GET_ALL}`;
    
    try {
      const response = await this.fetchWithErrorHandling(url);
      console.log('📄 Managers loaded successfully');
      return response;
    } catch (error) {
      console.error('Error loading managers:', error);
      throw error;
    }
  }

  // Delete employee
  async deleteEmployee(employeeId) {
    const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.EMPLOYEES.DELETE}/${employeeId}`;
    
    try {
      const response = await this.fetchWithErrorHandling(url, {
        method: 'DELETE'
      });
      
      console.log('✅ Employee deleted successfully:', employeeId);
      return response;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;
