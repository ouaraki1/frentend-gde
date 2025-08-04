import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
} from '@mui/material';
import { Share, PersonAdd, Close, Visibility } from '@mui/icons-material';
import { folderAPI } from '../services/api';
import { toast } from 'react-toastify';

const ShareDialog = ({ open, onClose, folder, onUpdate }) => {
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
    try {
      setLoadingUsers(true);
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
    if (!selectedUser || !password.trim()) {
      toast.error('Veuillez sélectionner un utilisateur et entrer votre mot de passe');
      return;
    }

    try {
      setLoading(true);
      await folderAPI.shareFolder(folder._id, selectedUser, password);
      toast.success('Demande de partage envoyée avec succès');
      setSelectedUser('');
      setPassword('');
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Error sharing folder:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors du partage';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'accepted': return 'Accepté';
      case 'pending': return 'En attente';
      case 'rejected': return 'Refusé';
      default: return 'Inconnu';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Share className="mr-2" />
          Partager le dossier: {folder?.name}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box className="space-y-4 mt-4">
          {/* Informations du dossier */}
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Dossier:</strong> {folder?.name}<br/>
              <strong>Propriétaire:</strong> {folder?.user?.username || 'Vous'}
            </Typography>
          </Alert>

          {/* Partager avec un nouvel utilisateur */}
          <Box>
            <Typography variant="h6" className="mb-3">
              Partager avec un utilisateur
            </Typography>
            
            <Box display="flex" gap={2} alignItems="flex-end">
              <FormControl fullWidth>
                <InputLabel>Utilisateur</InputLabel>
                <Select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  label="Utilisateur"
                  disabled={loadingUsers}
                >
                  {users.map(user => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.username} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                type="password"
                label="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="outlined"
                size="small"
                style={{ minWidth: 200 }}
              />
              
              <Button
                variant="contained"
                onClick={handleShare}
                disabled={loading || !selectedUser || !password.trim()}
                startIcon={loading ? <CircularProgress size={20} /> : <PersonAdd />}
              >
                {loading ? 'Partage...' : 'Partager'}
              </Button>
            </Box>
          </Box>

          {/* Utilisateurs avec qui le dossier est partagé */}
          {folder?.sharedWith && folder.sharedWith.length > 0 && (
            <Box>
              <Typography variant="h6" className="mb-3">
                Utilisateurs avec accès
              </Typography>
              
              <List>
                {folder.sharedWith.map((share, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={share.user?.username || 'Utilisateur inconnu'}
                      secondary={share.user?.email}
                    />
                    <ListItemSecondaryAction>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={getStatusLabel(share.type)}
                          color={getStatusColor(share.type)}
                          size="small"
                        />
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {loadingUsers && (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress />
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} startIcon={<Close />}>
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDialog; 