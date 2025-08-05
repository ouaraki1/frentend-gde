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
  CircularProgress,
} from '@mui/material';
import { toast } from 'react-toastify';
import { folderAPI } from '../services/api';

const FolderShareDialog = ({ open, onClose, folder, onUpdate }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await folderAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleShare = async () => {
    if (!selectedUser || !password) {
      toast.error('Veuillez sélectionner un utilisateur et saisir votre mot de passe');
      return;
    }

    setLoading(true);
    try {
      await folderAPI.shareFolder(folder._id, selectedUser, password);
      toast.success('Demande de partage envoyée avec succès');
      
      // Reset form
      setSelectedUser('');
      setPassword('');
      
      if (onUpdate) {
        onUpdate();
      }
      
      onClose();
    } catch (error) {
      console.error('Error sharing folder:', error);
      if (error.response?.status === 401) {
        toast.error('Mot de passe incorrect');
      } else if (error.response?.status === 400) {
        toast.error('Demande de partage déjà en attente');
      } else {
        toast.error('Erreur lors du partage du dossier');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUser('');
    setPassword('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Partager le dossier "{folder?.name}"</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Sélectionnez un utilisateur avec qui partager ce dossier et saisissez votre mot de passe pour confirmer.
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Utilisateur</InputLabel>
            <Select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              disabled={loadingUsers}
              label="Utilisateur"
            >
              {loadingUsers ? (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Chargement des utilisateurs...
                </MenuItem>
              ) : (
                users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.username} ({user.email})
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            type="password"
            label="Votre mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            sx={{ mb: 2 }}
          />

          <Alert severity="info" sx={{ mb: 2 }}>
            Une demande de partage sera envoyée à l'utilisateur sélectionné. 
            Il devra accepter ou rejeter la demande.
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={handleShare}
          variant="contained"
          disabled={!selectedUser || !password || loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Partager'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FolderShareDialog; 