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
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Collapse,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Check as AcceptedIcon,
  Close as RejectedIcon,
  Schedule as PendingIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { folderAPI } from '../services/api';

const MySharedFilesDialog = ({ open, onClose }) => {
  const [sharedFiles, setSharedFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadMySharedFiles();
    }
  }, [open]);

  const loadMySharedFiles = async () => {
    setLoading(true);
    try {
      const response = await folderAPI.getMySharedFiles();
      setSharedFiles(response.data);
    } catch (error) {
      console.error('Error loading my shared files:', error);
      toast.error('Erreur lors du chargement de vos fichiers partagés');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <AcceptedIcon color="success" fontSize="small" />;
      case 'rejected':
        return <RejectedIcon color="error" fontSize="small" />;
      case 'pending':
        return <PendingIcon color="warning" fontSize="small" />;
      default:
        return <PendingIcon color="action" fontSize="small" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'accepted':
        return 'Accepté';
      case 'rejected':
        return 'Rejeté';
      case 'pending':
        return 'En attente';
      default:
        return 'Inconnu';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Mes fichiers partagés
        <Typography variant="body2" color="text.secondary">
          {sharedFiles.length} fichier(s) partagé(s)
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : sharedFiles.length === 0 ? (
          <Alert severity="info">
            Vous n'avez pas encore partagé de fichiers.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sharedFiles.map((file) => (
              <Card key={`${file.folderId}-${file.fileId}`} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" component="div">
                        {file.fileName}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Dossier: {file.folderName} | Taille: {formatFileSize(file.size)} | 
                        Type: {file.mimetype} | Partagé le: {formatDate(file.sharedAt)}
                      </Typography>

                      {/* Affichage des tags */}
                      {file.tags && file.tags.length > 0 && (
                        <Box sx={{ mb: 1 }}>
                          {file.tags.map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      )}

                      {/* Affichage du statut */}
                      {file.status && (
                        <Box sx={{ mb: 2 }}>
                          <Chip
                            label={file.status}
                            size="small"
                            color={
                              file.status === 'archive' ? 'default' :
                              file.status === 'courent' ? 'primary' :
                              file.status === 'stable' ? 'success' :
                              'secondary'
                            }
                            variant="filled"
                          />
                        </Box>
                      )}

                      {/* Destinataires */}
                      {file.sharedWith && file.sharedWith.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Destinataires ({file.sharedWith.length}):
                          </Typography>
                          <List dense sx={{ py: 0 }}>
                            {file.sharedWith.map((share, index) => (
                              <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                                <ListItemText
                                  primary={
                                    <Box display="flex" alignItems="center" gap={1}>
                                      <PersonIcon fontSize="small" color="action" />
                                      <Typography variant="body2">
                                        {share.user?.username || 'Utilisateur inconnu'} ({share.user?.email})
                                      </Typography>
                                    </Box>
                                  }
                                />
                                <ListItemSecondaryAction>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    {getStatusIcon(share.type)}
                                    <Chip
                                      label={getStatusLabel(share.type)}
                                      color={getStatusColor(share.type)}
                                      size="small"
                                      variant="outlined"
                                    />
                                  </Box>
                                </ListItemSecondaryAction>
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MySharedFilesDialog; 