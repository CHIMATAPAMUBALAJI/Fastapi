import React, { useState, useEffect } from 'react';
import {
  Container, CssBaseline, ThemeProvider, createTheme,
  Box, CircularProgress, Alert, Paper
} from '@mui/material';
import EmployeeTable from './components/EmployeeTable';
import EmployeeForm from './components/EmployeeForm';
import Header from './components/Header';
import axios from 'axios';

const theme = createTheme({
  palette: {
    primary: { main: '#3f51b5' },
    secondary: { main: '#f50057' },
    background: {
      default: 'rgba(255, 255, 255, 0.85)',
      paper: 'rgba(255, 255, 255, 0.95)',
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
        }
      }
    }
  }
});

function App() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("http://localhost:9000/employees"); // ← No trailing slash

      console.log('Fetched employees:', response.data);

      setEmployees(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const appStyle = {
    minHeight: '100vh',
    backgroundImage: 'url(https://png.pngtree.com/background/20230416/original/pngtree-website-blue-technology-line-background-picture-image_2443655.jpg)',
    backgroundSize: 'cover',
    backgroundAttachment: 'fixed',
    backgroundPosition: 'center',
    padding: '20px 0',
  };

  const contentStyle = {
    maxWidth: '95%',
    margin: '0 auto',
  };

  return (
    <ThemeProvider theme={theme}>
      <div style={appStyle}>
        <CssBaseline />
        <Header />
        <Container maxWidth="lg" style={contentStyle}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <EmployeeForm onEmployeeAdded={fetchEmployees} />
          </Paper>
          <Paper elevation={3} sx={{ p: 3 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress size={60} />
              </Box>
            ) : (
              <EmployeeTable
                employees={employees}
                loading={loading}
                error={error}
                onRefresh={fetchEmployees}
              />
            )}
          </Paper>
        </Container>
      </div>
    </ThemeProvider>
  );
}

export default App;
