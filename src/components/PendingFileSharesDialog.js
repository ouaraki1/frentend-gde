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
} from '@mui/material';
import {
  Check as AcceptIcon,
  Close as RejectIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { folderAPI } from '../services/api';

const PendingFileSharesDialog = ({ open, onClose, onUpdate }) => {
  const [pendingFiles, setPendingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [respondingFiles, setRespondingFiles] = useState(new Set());
  const [removingFiles, setRemovingFiles] = useState(new Set());

  useEffect(() => {
    if (open) {
      loadPendingFiles();
    }
  }, [open]);

  const loadPendingFiles = async () => {
    setLoading(true);
    try {
      const response = await folderAPI.getPendingFileShares();
      setPendingFiles(response.data);
    } catch (error) {
      console.error('Error loading pending file shares:', error);
      toast.error('Erreur lors du chargement des demandes de partage');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (file, response) => {
    const fileKey = `${file.folderId}-${file.fileId}`;
    
    // Éviter les clics multiples
    if (respondingFiles.has(fileKey)) {
      return;
    }

    try {
      // Marquer le fichier comme en cours de traitement
      setRespondingFiles(prev => new Set(prev).add(fileKey));
      
      console.log('🔍 Responding to file share:', { file, response });
      console.log('📋 File details:', {
        folderId: file.folderId,
        fileId: file.fileId,
        fileName: file.fileName
      });

      const result = await folderAPI.respondToFileShare(file.folderId, file.fileId, response);
      console.log('✅ Response result:', result);
      
      toast.success(`Fichier ${response === 'accepted' ? 'accepté' : 'rejeté'} avec succès`);
      
      // Marquer le fichier pour l'animation de suppression
      setRemovingFiles(prev => new Set(prev).add(fileKey));
      
      // Supprimer immédiatement de la liste locale pour mettre à jour le compteur
      setPendingFiles(prevFiles => 
        prevFiles.filter(f => !(f.folderId === file.folderId && f.fileId === file.fileId))
      );
      
      // Notifier le parent immédiatement pour mettre à jour le compteur
      if (onUpdate) {
        console.log('🔄 Calling onUpdate callback');
        onUpdate();
      }
      
      // Attendre un peu pour l'animation, puis nettoyer l'état de suppression
      setTimeout(() => {
        setRemovingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileKey);
          return newSet;
        });
      }, 300);
    } catch (error) {
      console.error('❌ Error responding to file share:', error);
      console.error('❌ Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
      toast.error(`Erreur lors de la réponse: ${errorMessage}`);
    } finally {
      // Retirer le fichier de la liste des fichiers en cours de traitement
      setRespondingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileKey);
        return newSet;
      });
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Demandes de partage de fichiers en attente
        <Typography variant="body2" color="text.secondary">
          {pendingFiles.length} demande(s) en attente
        </Typography>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Typography>Chargement...</Typography>
        ) : pendingFiles.length === 0 ? (
          <Alert severity="info">
            Aucune demande de partage de fichier en attente.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {pendingFiles.map((file) => {
              const fileKey = `${file.folderId}-${file.fileId}`;
              const isRemoving = removingFiles.has(fileKey);
              
              return (
                <Collapse key={file.fileId} in={!isRemoving} timeout={300}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" component="div">
                            {file.fileName}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <PersonIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              Partagé par: {file.owner.username} ({file.owner.email})
                            </Typography>
                          </Box>

                          <Typography variant="body2" color="text.secondary">
                            Dossier: {file.folderName} | Taille: {formatFileSize(file.size)} | 
                            Type: {file.mimetype} | Ajouté le: {formatDate(file.uploadedAt)}
                          </Typography>

                          {/* Affichage des tags */}
                          {file.tags && file.tags.length > 0 && (
                            <Box className="mt-2 flex flex-wrap gap-1">
                              {file.tags.map((tag, index) => (
                                <Chip
                                  key={index}
                                  label={tag}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          )}

                          {/* Affichage du statut */}
                          {file.status && (
                            <Box className="mt-1">
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
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {(() => {
                            const fileKey = `${file.folderId}-${file.fileId}`;
                            const isResponding = respondingFiles.has(fileKey);
                            
                            return (
                              <>
                                <Tooltip title="Accepter">
                                  <IconButton 
                                    onClick={() => handleRespond(file, 'accepted')}
                                    size="small"
                                    color="success"
                                    disabled={isResponding}
                                  >
                                    {isResponding ? <CircularProgress size={16} /> : <AcceptIcon />}
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Rejeter">
                                  <IconButton 
                                    onClick={() => handleRespond(file, 'rejected')}
                                    size="small"
                                    color="error"
                                    disabled={isResponding}
                                  >
                                    {isResponding ? <CircularProgress size={16} /> : <RejectIcon />}
                                  </IconButton>
                                </Tooltip>
                              </>
                            );
                          })()}
                        </Box>
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
        <Button onClick={onClose}>
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PendingFileSharesDialog; 