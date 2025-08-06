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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { PersonAddOutlined, AdminPanelSettings, Person } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin', // Forcé à admin
    adminCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error || validationError) {
      clearError();
      setValidationError('');
    }
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Les mots de passe ne correspondent pas');
      return false;
    }
    if (formData.password.length < 6) {
      setValidationError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    // Toujours vérifier le code admin
    if (formData.adminCode !== '1234societerx') {
      setValidationError('Code admin incorrect. Le code correct est: 1234societerx');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    const { confirmPassword, adminCode, ...userData } = formData;
    const result = await register(userData);
    
    if (result.success) {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm" className="min-h-screen flex items-center justify-center">
      <Paper elevation={8} className="p-8 w-full">
        <Box className="text-center mb-6">
          <PersonAddOutlined className="text-4xl text-primary-600 mb-4" />
          <Typography variant="h4" component="h1" className="font-bold text-gray-800">
            Inscription
          </Typography>
          <Typography variant="body2" className="text-gray-600 mt-2">
            Créez votre compte utilisateur
          </Typography>
        </Box>

        {(error || validationError) && (
          <Alert severity="error" className="mb-4">
            {error || validationError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} className="space-y-4">
          <TextField
            fullWidth
            label="Nom d'utilisateur"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            variant="outlined"
            className="mb-4"
          />

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
            className="mb-4"
            helperText="Au moins 6 caractères"
          />

          <TextField
            fullWidth
            label="Confirmer le mot de passe"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            variant="outlined"
            className="mb-4"
          />

          {/* Champ code admin obligatoire */}
          <Box className="mb-4">
            <TextField
              fullWidth
              label="Code Admin"
              name="adminCode"
              type="password"
              value={formData.adminCode}
              onChange={handleChange}
              required
              variant="outlined"
              helperText="Code requis pour devenir administrateur"
              className="mb-2"
            />
            {/* <Alert severity="info" className="mb-2">
              <Typography variant="body2">
                <strong>Code admin:</strong> 1234societerx
              </Typography>
            </Alert> */}
          </Box>
          {/* Affichage du rôle admin */}
          <Box className="mb-4">
            <Chip
              label={'Administrateur'}
              color={'primary'}
              icon={<AdminPanelSettings />}
              variant="outlined"
            />
          </Box>

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
              'S\'inscrire'
            )}
          </Button>
        </Box>

        <Box className="text-center mt-6">
          <Typography variant="body2" className="text-gray-600">
            Déjà un compte ?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Se connecter
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register; 