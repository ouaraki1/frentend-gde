import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { Edit, Save, Cancel } from '@mui/icons-material';
import { folderAPI } from '../services/api';
import { toast } from 'react-toastify';

const FileMetadataDialog = ({ open, onClose, file, folderId, onUpdate }) => {
  const [name, setName] = useState('');
  const [tags, setTags] = useState([]);
  const [status, setStatus] = useState('courent');
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (file) {
      setName(file.name || '');
      setTags(file.tags || []);
      setStatus(file.status || 'courent');
    }
  }, [file]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Le nom du fichier est requis');
      return;
    }

    try {
      setLoading(true);
      await folderAPI.updateFileMetadata(folderId, file._id, {
        name: name.trim(),
        tags,
        status
      });
      
      toast.success('Métadonnées mises à jour avec succès');
      onUpdate && onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating file metadata:', error);
      toast.error('Erreur lors de la mise à jour des métadonnées');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'courent', label: 'Courant' },
    { value: 'archive', label: 'Archivé' },
    { value: 'stable', label: 'Stable' },
    { value: 'other', label: 'Autre' }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Edit className="mr-2" />
          Modifier les métadonnées du fichier
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box className="space-y-4 mt-4">
          {/* Nom du fichier */}
          <TextField
            fullWidth
            label="Nom du fichier"
            value={name}
            onChange={(e) => setName(e.target.value)}
            variant="outlined"
          />

          {/* Statut */}
          <FormControl fullWidth>
            <InputLabel>Statut</InputLabel>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              label="Statut"
            >
              {statusOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Tags */}
          <Box>
            <Typography variant="subtitle2" className="mb-2">
              Tags
            </Typography>
            
            {/* Ajouter un nouveau tag */}
            <Box display="flex" gap={1} className="mb-2">
              <TextField
                size="small"
                placeholder="Nouveau tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                fullWidth
              />
              <Button
                variant="outlined"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                size="small"
              >
                Ajouter
              </Button>
            </Box>

            {/* Tags existants */}
            <Box display="flex" flexWrap="wrap" gap={1}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>

          {/* Informations du fichier */}
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Type:</strong> {file?.mimetype}<br/>
              <strong>Taille:</strong> {file?.data?.length ? `${(file.data.length / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} startIcon={<Cancel />}>
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<Save />}
          disabled={loading || !name.trim()}
        >
          {loading ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileMetadataDialog; 