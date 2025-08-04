import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { toast } from 'react-toastify';
import { folderAPI } from '../services/api';

const FileShareDialog = ({ open, onClose, file, folderId }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    try {
      const response = await folderAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    }
  };

  const handleShare = async () => {
    if (!selectedUser || !password) {
      toast.error('Veuillez sélectionner un utilisateur et entrer votre mot de passe');
      return;
    }

    setLoading(true);
    try {
      await folderAPI.shareFile(folderId, file._id, selectedUser, password);
      toast.success('Fichier partagé avec succès');
      onClose();
      setSelectedUser('');
      setPassword('');
    } catch (error) {
      console.error('Error sharing file:', error);
      if (error.response?.status === 401) {
        toast.error('Mot de passe incorrect');
      } else if (error.response?.status === 400) {
        toast.error('Fichier déjà partagé avec cet utilisateur');
      } else {
        toast.error('Erreur lors du partage du fichier');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Partager le fichier "{file?.name}"</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Sélectionnez un utilisateur avec qui partager ce fichier. 
            Vous devrez entrer votre mot de passe pour confirmer l'action.
          </Typography>
        </Box>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Utilisateur</InputLabel>
          <Select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            label="Utilisateur"
          >
            {users.map((user) => (
              <MenuItem key={user._id} value={user._id}>
                {user.username} ({user.email})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          type="password"
          label="Votre mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Entrez votre mot de passe pour confirmer"
          sx={{ mb: 2 }}
        />

        <Alert severity="info" sx={{ mb: 2 }}>
          L'utilisateur recevra une demande de partage qu'il devra accepter.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button 
          onClick={handleShare} 
          variant="contained" 
          disabled={loading || !selectedUser || !password}
        >
          {loading ? 'Partage...' : 'Partager'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileShareDialog; 