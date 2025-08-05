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
  Collapse,
  CircularProgress,
} from '@mui/material';
import {
  Check as AcceptIcon,
  Close as RejectIcon,
  Folder as FolderIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { folderAPI } from '../services/api';

const PendingFolderSharesDialog = ({ open, onClose, onUpdate }) => {
  const [pendingFolders, setPendingFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [respondingFolders, setRespondingFolders] = useState(new Set());
  const [removingFolders, setRemovingFolders] = useState(new Set());

  useEffect(() => {
    if (open) {
      loadPendingFolders();
    }
  }, [open]);

  const loadPendingFolders = async () => {
    setLoading(true);
    try {
      const response = await folderAPI.getPendingFolders();
      setPendingFolders(response.data);
    } catch (error) {
      console.error('Error loading pending folders:', error);
      toast.error('Erreur lors du chargement des demandes de partage de dossiers');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (folder, response) => {
    const folderKey = folder._id;

    if (respondingFolders.has(folderKey)) {
      return;
    }

    try {
      setRespondingFolders(prev => new Set(prev).add(folderKey));

      await folderAPI.respondToShare(folder._id, response);

      toast.success(`Dossier ${response === 'accepted' ? 'accepté' : 'rejeté'} avec succès`);

      // Marquer le dossier pour l'animation de suppression
      setRemovingFolders(prev => new Set(prev).add(folderKey));

      // Supprimer immédiatement de la liste locale pour mettre à jour le compteur
      setPendingFolders(prevFolders =>
        prevFolders.filter(f => f._id !== folder._id)
      );

      // Appeler onUpdate immédiatement pour mettre à jour le compteur
      if (onUpdate) {
        onUpdate();
      }

      // Attendre un peu pour l'animation, puis nettoyer l'état de suppression
      setTimeout(() => {
        setRemovingFolders(prev => {
          const newSet = new Set(prev);
          newSet.delete(folderKey);
          return newSet;
        });
      }, 300);

    } catch (error) {
      console.error('Error responding to folder share:', error);
      toast.error('Erreur lors de la réponse au partage de dossier');
    } finally {
      setRespondingFolders(prev => {
        const newSet = new Set(prev);
        newSet.delete(folderKey);
        return newSet;
      });
    }
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Demandes de partage de dossiers en attente</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : pendingFolders.length === 0 ? (
          <Alert severity="info">
            Aucune demande de partage de dossier en attente.
          </Alert>
        ) : (
          <Box sx={{ mt: 2 }}>
            {pendingFolders.map((folder) => {
              const isRemoving = removingFolders.has(folder._id);
              const isResponding = respondingFolders.has(folder._id);

              return (
                <Collapse key={folder._id} in={!isRemoving} timeout={300}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" component="div">
                          {folder.name}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          <PersonIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          Propriétaire: {folder.user?.username} ({folder.user?.email})
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Demandé le: {formatDate(folder.sharedWith?.[0]?.sharedAt || folder.createdAt)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Accepter">
                          <IconButton
                            onClick={() => handleRespond(folder, 'accepted')}
                            size="small"
                            color="success"
                            disabled={isResponding}
                          >
                            {isResponding ? <CircularProgress size={16} /> : <AcceptIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Rejeter">
                          <IconButton
                            onClick={() => handleRespond(folder, 'rejected')}
                            size="small"
                            color="error"
                            disabled={isResponding}
                          >
                            {isResponding ? <CircularProgress size={16} /> : <RejectIcon />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Collapse>
              );
            })}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PendingFolderSharesDialog; 