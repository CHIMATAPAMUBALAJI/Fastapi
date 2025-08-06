// Add Employee Modal Component
import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { THEME_CONFIG } from '../config/constants';

const AddEmployeeModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    manager_id: '',
    country: 'India'
  });
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [error, setError] = useState(null);

  // Load managers when modal opens
  useEffect(() => {
    if (isOpen) {
      loadManagers();
      // Reset form when modal opens
      setFormData({
        name: '',
        email: '',
        role: '',
        manager_id: '',
        country: 'India'
      });
      setError(null);
    }
  }, [isOpen]);

  const loadManagers = async () => {
    setLoadingManagers(true);
    try {
      const response = await apiService.getManagers();
      setManagers(response.managers || []);
      console.log('📄 Loaded managers:', response.managers);
    } catch (err) {
      console.error('❌ Error loading managers:', err);
      setError('Failed to load managers');
    } finally {
      setLoadingManagers(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.role || !formData.manager_id || !formData.country) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert manager_id to integer
      const employeeData = {
        ...formData,
        manager_id: parseInt(formData.manager_id)
      };

      // Call API to add employee
      const response = await apiService.addEmployee(employeeData);
      
      console.log('✅ Employee added:', response);
      
      // Call parent callback with new employee data
      if (onAdd) {
        onAdd({
          ...response,
          manager_name: managers.find(m => m.id === employeeData.manager_id)?.name || 'Unknown'
        });
      }
      
      // Close modal
      onClose();
      
    } catch (err) {
      console.error('❌ Error adding employee:', err);
      setError(err.message || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      name: '',
      email: '',
      role: '',
      manager_id: ''
    });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        width: '450px',
        maxWidth: '90vw',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        border: `2px solid ${THEME_CONFIG.COLORS.SECONDARY}`
      }}>
        <h2 style={{
          margin: '0 0 20px 0',
          color: THEME_CONFIG.COLORS.PRIMARY,
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          Add New Employee
        </h2>

        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {loadingManagers && (
          <div style={{
            backgroundColor: '#e3f2fd',
            color: THEME_CONFIG.COLORS.PRIMARY,
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            Loading managers...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 'bold',
              color: THEME_CONFIG.COLORS.PRIMARY
            }}>
              Name: *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="e.g., Ravi"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${THEME_CONFIG.COLORS.SECONDARY}`,
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 'bold',
              color: THEME_CONFIG.COLORS.PRIMARY
            }}>
              Email: *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="e.g., ravi@gmail.com"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${THEME_CONFIG.COLORS.SECONDARY}`,
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 'bold',
              color: THEME_CONFIG.COLORS.PRIMARY
            }}>
              Role: *
            </label>
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
              placeholder="e.g., Full Stack Developer"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${THEME_CONFIG.COLORS.SECONDARY}`,
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 'bold',
              color: THEME_CONFIG.COLORS.PRIMARY
            }}>
              Country: *
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              required
              placeholder="e.g., India"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${THEME_CONFIG.COLORS.SECONDARY}`,
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 'bold',
              color: THEME_CONFIG.COLORS.PRIMARY
            }}>
              Manager: *
            </label>
            <select
              name="manager_id"
              value={formData.manager_id}
              onChange={handleInputChange}
              required
              disabled={loadingManagers}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${THEME_CONFIG.COLORS.SECONDARY}`,
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
                backgroundColor: loadingManagers ? '#f5f5f5' : 'white'
              }}
            >
              <option value="">Select a manager...</option>
              {managers.map(manager => (
                <option key={manager.id} value={manager.id}>
                  {manager.name} ({manager.role})
                </option>
              ))}
            </select>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f5f5f5',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingManagers}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#ccc' : THEME_CONFIG.COLORS.PRIMARY,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (loading || loadingManagers) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Adding...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
