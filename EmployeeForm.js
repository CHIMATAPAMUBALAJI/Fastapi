import React, { useState } from 'react';
import {
  TextField, Button, Grid, Paper, Typography, Alert
} from '@mui/material';
import axios from 'axios';

const EmployeeForm = ({ onEmployeeAdded }) => {
  const [formData, setFormData] = useState({ name: '', email: '', department: '' });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, department } = formData;
    if (!name.trim() || !email.trim() || !department.trim()) {
      setError("All fields are required.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await axios.post('http://localhost:9000/employees/bulk_create', {
        employees: [formData]
      });
      setSuccess(true);
      setFormData({ name: '', email: '', department: '' });
      onEmployeeAdded();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Add New Employee</Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }}>Employee added successfully!</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={1}>
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              sx={{ height: '56px' }}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default EmployeeForm;
