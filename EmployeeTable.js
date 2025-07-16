import React from 'react';
import {
  Paper, Box, Typography, Button, CircularProgress, Alert, IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Delete, Refresh } from '@mui/icons-material';
import axios from 'axios';

const EmployeeTable = ({ employees, loading, error, onRefresh }) => {
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:9000/employees/${id}`);
      onRefresh();
    } catch (err) {
      console.error('Error deleting employee:', err);
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    { field: 'department', headerName: 'Department', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <IconButton color="error" onClick={() => handleDelete(params.row.id)}>
          <Delete />
        </IconButton>
      )
    }
  ];

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Employee Directory</Typography>
        <Button variant="contained" color="primary" startIcon={<Refresh />} onClick={onRefresh} disabled={loading}>
          Refresh
        </Button>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : (
        <div style={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={employees}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 20]}
            disableSelectionOnClick
          />
        </div>
      )}
    </Paper>
  );
};

export default EmployeeTable;
