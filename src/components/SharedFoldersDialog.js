import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Folder as FolderIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  CalendarToday as DateIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { folderAPI } from '../services/api';

const SharedFoldersDialog = ({ open, onClose, onFolderClick }) => {
  const [sharedFolders, setSharedFolders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadSharedFolders();
    }
  }, [open]);

  const loadSharedFolders = async () => {
    setLoading(true);
    try {
      const response = await folderAPI.getSharedFolders();
      setSharedFolders(response.data);
    } catch (error) {
      console.error('Error loading shared folders:', error);
      toast.error('Erreur lors du chargement des dossiers partagés');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folder) => {
    if (onFolderClick) {
      onFolderClick(folder);
    }
    onClose();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSharedDate = (folder) => {
    const sharedEntry = folder.sharedWith?.find(share => share.type === 'accepted');
    return sharedEntry?.sharedAt || folder.createdAt;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Dossiers partagés avec moi</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : sharedFolders.length === 0 ? (
          <Alert severity="info">
            Aucun dossier partagé avec vous.
          </Alert>
        ) : (
          <Box sx={{ mt: 2 }}>
            {sharedFolders.map((folder) => (
              <Card key={folder._id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" component="div">
                        {folder.name}
                      </Typography>
                    </Box>
                    <Chip
                      label="Partagé"
                      color="success"
                      size="small"
                      icon={<PersonIcon />}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      <PersonIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      Propriétaire: {folder.user?.username} ({folder.user?.email})
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      <DateIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      Partagé le: {formatDate(getSharedDate(folder))}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Créé le: {formatDate(folder.createdAt)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Tooltip title="Ouvrir le dossier">
                      <IconButton
                        onClick={() => handleFolderClick(folder)}
                        color="primary"
                        size="small"
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SharedFoldersDialog; 