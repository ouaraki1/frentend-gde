import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Box,
} from '@mui/material';
import { 
  Folder, 
  Visibility, 
  Check, 
  Close, 
  Person,
  AccessTime,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { folderAPI } from '../services/api';
import { toast } from 'react-toastify';

const SharedFoldersDialog = ({ open, onClose, onFolderClick }) => {
  const [sharedFolders, setSharedFolders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadSharedFolders();
    }
  }, [open]);

  const loadSharedFolders = async () => {
    try {
      setLoading(true);
      const response = await folderAPI.getSharedFolders();
      setSharedFolders(response.data);
    } catch (error) {
      console.error('Error loading shared folders:', error);
      toast.error('Erreur lors du chargement des dossiers partagés');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToShare = async (folderId, response) => {
    try {
      await folderAPI.respondToShare(folderId, response);
      toast.success(`Vous avez ${response === 'accepted' ? 'accepté' : 'refusé'} le partage`);
      loadSharedFolders(); // Recharger la liste
    } catch (error) {
      console.error('Error responding to share:', error);
      toast.error('Erreur lors de la réponse au partage');
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <CheckCircle color="success" />;
      case 'pending': return <AccessTime color="warning" />;
      case 'rejected': return <Cancel color="error" />;
      default: return <AccessTime />;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Person className="mr-2" />
          Dossiers partagés avec vous
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box className="space-y-4 mt-4">
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : sharedFolders.length === 0 ? (
            <Alert severity="info">
              Aucun dossier partagé avec vous pour le moment.
            </Alert>
          ) : (
            <List>
              {sharedFolders.map((folder, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    <Folder color="primary" />
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={folder.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Propriétaire: {folder.user?.username || 'Inconnu'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Partagé le: {new Date(folder.createdAt).toLocaleDateString('fr-FR')}
                        </Typography>
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Box display="flex" alignItems="center" gap={1}>
                      {folder.sharedWith?.map((share, shareIndex) => {
                        if (share.user === localStorage.getItem('userId')) {
                          return (
                            <Box key={shareIndex} display="flex" alignItems="center" gap={1}>
                              {getStatusIcon(share.type)}
                              <Chip
                                label={getStatusLabel(share.type)}
                                color={getStatusColor(share.type)}
                                size="small"
                              />
                              
                              {share.type === 'pending' && (
                                <>
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleRespondToShare(folder._id, 'accepted')}
                                    title="Accepter"
                                  >
                                    <Check />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRespondToShare(folder._id, 'rejected')}
                                    title="Refuser"
                                  >
                                    <Close />
                                  </IconButton>
                                </>
                              )}
                            </Box>
                          );
                        }
                        return null;
                      })}
                      
                      {folder.sharedWith?.some(share => 
                        share.user === localStorage.getItem('userId') && share.type === 'accepted'
                      ) && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onFolderClick && onFolderClick(folder)}
                          title="Ouvrir le dossier"
                        >
                          <Visibility />
                        </IconButton>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
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

export default SharedFoldersDialog; 