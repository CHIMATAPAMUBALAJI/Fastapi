// Employee Edit Modal Component
import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { THEME_CONFIG } from '../config/constants';

const EmployeeEditModal = ({ employee, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    country: 'India'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize form data when employee changes
  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        role: employee.role || '',
        country: employee.country || 'India'
      });
      setError(null);
    }
  }, [employee]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!employee?.id) {
      setError('Employee ID is missing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call API to update employee
      const response = await apiService.updateEmployee(employee.id, formData);
      
      console.log('✅ Employee updated:', response);
      
      // Call parent callback with updated data
      if (onSave) {
        onSave({
          ...employee,
          ...formData,
          message: response.message
        });
      }
      
      // Close modal
      onClose();
      
    } catch (err) {
      console.error('❌ Error updating employee:', err);
      setError(err.message || 'Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        role: employee.role || ''
      });
    }
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
        width: '400px',
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
          Edit Employee Details
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: 'bold',
              color: THEME_CONFIG.COLORS.PRIMARY
            }}>
              Name:
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
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
              Email:
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
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
              Role:
            </label>
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
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
              Country:
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              required
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
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#ccc' : THEME_CONFIG.COLORS.PRIMARY,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeEditModal;
