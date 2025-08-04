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
} from '@mui/material';
import {
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { folderAPI } from '../services/api';

const SharedFilesDialog = ({ open, onClose }) => {
  const [sharedFiles, setSharedFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadSharedFiles();
    }
  }, [open]);

  const loadSharedFiles = async () => {
    setLoading(true);
    try {
      const response = await folderAPI.getSharedFiles();
      setSharedFiles(response.data);
    } catch (error) {
      console.error('Error loading shared files:', error);
      toast.error('Erreur lors du chargement des fichiers partagés');
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = async (file) => {
    try {
      const response = await folderAPI.getFileContent(file.folderId, file.fileId);
      
      if (file.mimetype.startsWith('image/')) {
        // Afficher l'image
        const blob = new Blob([response.data], { type: file.mimetype });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else if (file.mimetype === 'application/pdf') {
        // Afficher le PDF
        const blob = new Blob([response.data], { type: file.mimetype });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else if (file.mimetype.startsWith('text/')) {
        // Afficher le texte
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(response.data);
        alert(`Contenu du fichier:\n\n${text}`);
      } else {
        // Télécharger le fichier
        handleDownloadFile(file);
      }
    } catch (error) {
      console.error('Error viewing file:', error);
      toast.error('Erreur lors de l\'affichage du fichier');
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      const response = await folderAPI.getFileContent(file.folderId, file.fileId);
      const blob = new Blob([response.data], { type: file.mimetype });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Fichier téléchargé avec succès');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Erreur lors du téléchargement');
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
        Fichiers partagés avec moi
        <Typography variant="body2" color="text.secondary">
          {sharedFiles.length} fichier(s) partagé(s)
        </Typography>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Typography>Chargement...</Typography>
        ) : sharedFiles.length === 0 ? (
          <Typography color="text.secondary">
            Aucun fichier partagé avec vous pour le moment.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sharedFiles.map((file) => (
              <Card key={file.fileId} variant="outlined">
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
                      <Tooltip title="Voir le fichier">
                        <IconButton 
                          onClick={() => handleViewFile(file)}
                          size="small"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Télécharger">
                        <IconButton 
                          onClick={() => handleDownloadFile(file)}
                          size="small"
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
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

export default SharedFilesDialog; 