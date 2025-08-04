import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    console.log('Submitting login form...');
    const result = await login(formData);
    console.log('Login result:', result);
    
    if (result.success) {
      console.log('Login successful, navigating to dashboard...');
      navigate('/dashboard');
    } else {
      console.log('Login failed:', result.error);
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm" className="min-h-screen flex items-center justify-center">
      <Paper elevation={8} className="p-8 w-full">
        <Box className="text-center mb-6">
          <LockOutlined className="text-4xl text-primary-600 mb-4" />
          <Typography variant="h4" component="h1" className="font-bold text-gray-800">
            Connexion
          </Typography>
          <Typography variant="body2" className="text-gray-600 mt-2">
            Connectez-vous à votre compte administrateur
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} className="space-y-4">
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            variant="outlined"
            className="mb-4"
          />

          <TextField
            fullWidth
            label="Mot de passe"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            variant="outlined"
            className="mb-6"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 text-white py-3"
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Se connecter'
            )}
          </Button>
        </Box>

        <Box className="text-center mt-6">
          <Typography variant="body2" className="text-gray-600">
            Pas encore de compte ?{' '}
            <Link
              to="/register"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              S'inscrire
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login; 