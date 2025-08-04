import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Breadcrumbs,
  Link,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Folder,
  InsertDriveFile,
  Delete,
  Search,
  Home,
  NavigateNext,
  CloudUpload,
  CreateNewFolder,
  Visibility,
  Download,
  Edit,
  Share,
  Person,
  AdminPanelSettings,
  Settings,
  FileCopy,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { folderAPI } from '../services/api';
import { toast } from 'react-toastify';
import FileMetadataDialog from './FileMetadataDialog';
import ShareDialog from './ShareDialog';
import SharedFoldersDialog from './SharedFoldersDialog';
import FileShareDialog from './FileShareDialog';
import SharedFilesDialog from './SharedFilesDialog';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileTags, setFileTags] = useState('');
  const [fileStatus, setFileStatus] = useState('courent');
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);
  
  // Nouvelles fonctionnalités
  const [showFileMetadata, setShowFileMetadata] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSharedFolders, setShowSharedFolders] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameFolderName, setRenameFolderName] = useState('');
  const [allFiles, setAllFiles] = useState([]);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [showFileShareDialog, setShowFileShareDialog] = useState(false);
  const [showSharedFilesDialog, setShowSharedFilesDialog] = useState(false);
  const [selectedFileForSharing, setSelectedFileForSharing] = useState(null);

  useEffect(() => {
    loadMainFolders();
  }, []);

  const loadMainFolders = async () => {
    try {
      setLoading(true);
      const response = await folderAPI.getMainFolders();
      setFolders(response.data);
      setCurrentFolder(null);
      setCurrentPath([]);
    } catch (error) {
      toast.error('Erreur lors du chargement des dossiers');
    } finally {
      setLoading(false);
    }
  };

  const loadFolderContents = async (folderId) => {
    try {
      setLoading(true);
      const response = await folderAPI.getFolderContents(folderId);
      setCurrentFolder(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du dossier');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = async (folder) => {
    const newPath = [...currentPath, folder];
    setCurrentPath(newPath);
    await loadFolderContents(folder._id);
  };

  const handleBreadcrumbClick = async (index) => {
    if (index === -1) {
      await loadMainFolders();
    } else {
      const newPath = currentPath.slice(0, index + 1);
      setCurrentPath(newPath);
      await loadFolderContents(newPath[newPath.length - 1]._id);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const parentId = currentFolder?._id;
      const folderData = { name: newFolderName.trim() };

      console.log('Creating folder:', { parentId, folderData });

      if (parentId) {
        await folderAPI.createSubfolder(parentId, folderData);
      } else {
        await folderAPI.createFolder(folderData);
      }

      toast.success('Dossier créé avec succès');
      setShowCreateFolder(false);
      setNewFolderName('');
      
      if (parentId) {
        await loadFolderContents(parentId);
      } else {
        await loadMainFolders();
      }
    } catch (error) {
      console.error('Create folder error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la création du dossier';
      toast.error(errorMessage);
    }
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploading(true);
      const folderId = currentFolder?._id;
      
      if (!folderId) {
        toast.error('Veuillez sélectionner un dossier');
        return;
      }

      console.log('Uploading files to folder:', folderId);
      console.log('Files to upload:', selectedFiles.map(f => f.name));
      console.log('Tags:', fileTags);
      console.log('Status:', fileStatus);
      
      // Préparer les données avec tags et status
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      // Ajouter les métadonnées
      if (fileTags.trim()) {
        formData.append('tags', fileTags.trim());
      }
      formData.append('status', fileStatus);
      
      await folderAPI.uploadFiles(folderId, formData);
      toast.success('Fichiers uploadés avec succès');
      setShowUpload(false);
      setSelectedFiles([]);
      setFileTags('');
      setFileStatus('courent');
      await loadFolderContents(folderId);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Erreur lors de l\'upload des fichiers';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;

    try {
      const folderId = currentFolder._id;
      await folderAPI.deleteFile(folderId, fileId);
      toast.success('Fichier supprimé avec succès');
      await loadFolderContents(folderId);
    } catch (error) {
      toast.error('Erreur lors de la suppression du fichier');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce dossier ?')) return;

    try {
      await folderAPI.deleteFolder(folderId);
      toast.success('Dossier supprimé avec succès');
      await loadMainFolders();
    } catch (error) {
      toast.error('Erreur lors de la suppression du dossier');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      console.log('Searching for:', searchQuery);
      const response = await folderAPI.search(searchQuery);
      console.log('Search results:', response.data);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Erreur lors de la recherche: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleFileClick = async (file) => {
    setSelectedFile(file);
    setShowFileViewer(true);
    setLoadingFile(true);
    setFileContent(null);

    try {
      const response = await folderAPI.getFileContent(currentFolder._id, file._id);
      
      if (file.mimetype.startsWith('image/')) {
        // Pour les images, créer une URL blob
        const blob = new Blob([response.data], { type: file.mimetype });
        const imageUrl = URL.createObjectURL(blob);
        setFileContent({ type: 'image', url: imageUrl });
      } else if (file.mimetype === 'application/pdf') {
        // Pour les PDF, créer une URL blob
        const blob = new Blob([response.data], { type: file.mimetype });
        const pdfUrl = URL.createObjectURL(blob);
        setFileContent({ type: 'pdf', url: pdfUrl });
      } else if (file.mimetype.startsWith('text/') || 
                 file.mimetype.includes('javascript') || 
                 file.mimetype.includes('json') ||
                 file.mimetype.includes('xml')) {
        // Pour les fichiers texte, afficher le contenu
        const textContent = new TextDecoder().decode(response.data);
        setFileContent({ type: 'text', content: textContent });
      } else {
        // Pour les autres types, proposer le téléchargement
        setFileContent({ type: 'download', data: response.data, filename: file.name });
      }
    } catch (error) {
      console.error('Error loading file:', error);
      toast.error('Erreur lors du chargement du fichier');
    } finally {
      setLoadingFile(false);
    }
  };

  const handleDownloadFile = async (file = null) => {
    const targetFile = file || selectedFile;
    if (!targetFile) return;

    try {
      const response = await folderAPI.getFileContent(currentFolder._id, targetFile._id);
      const blob = new Blob([response.data], { type: targetFile.mimetype });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = targetFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Fichier téléchargé avec succès');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Erreur lors du téléchargement du fichier');
    }
  };

  const handleCloseFileViewer = () => {
    setShowFileViewer(false);
    setSelectedFile(null);
    setFileContent(null);
    // Nettoyer les URLs blob
    if (fileContent?.url) {
      URL.revokeObjectURL(fileContent.url);
    }
  };

  // Nouvelles fonctions pour les fonctionnalités avancées
  const handleEditFileMetadata = (file) => {
    setSelectedFile(file);
    setShowFileMetadata(true);
  };

  const handleShareFolder = (folder) => {
    setCurrentFolder(folder);
    setShowShareDialog(true);
  };

  const handleRenameFolder = (folder) => {
    setCurrentFolder(folder);
    setRenameFolderName(folder.name);
    setShowRenameDialog(true);
  };

  const handleRenameFolderSave = async () => {
    if (!renameFolderName.trim()) return;

    try {
      await folderAPI.renameFolder(currentFolder._id, renameFolderName.trim());
      toast.success('Dossier renommé avec succès');
      setShowRenameDialog(false);
      setRenameFolderName('');
      
      // Recharger les données
      if (currentFolder.parent) {
        await loadFolderContents(currentFolder.parent);
      } else {
        await loadMainFolders();
      }
    } catch (error) {
      console.error('Rename folder error:', error);
      toast.error('Erreur lors du renommage du dossier');
    }
  };

  const handleLoadAllFiles = async () => {
    try {
      setLoading(true);
      const response = await folderAPI.getAllFiles();
      setAllFiles(response.data);
      setShowAllFiles(true);
    } catch (error) {
      console.error('Error loading all files:', error);
      toast.error('Erreur lors du chargement de tous les fichiers');
    } finally {
      setLoading(false);
    }
  };

  const handleSharedFolderClick = async (folder) => {
    try {
      const response = await folderAPI.getFolderContents(folder._id);
      setCurrentFolder(response.data);
      setCurrentPath([folder]);
    } catch (error) {
      console.error('Error loading shared folder:', error);
      toast.error('Erreur lors du chargement du dossier partagé');
    }
  };

  const handleShareFile = (file) => {
    setSelectedFileForSharing(file);
    setShowFileShareDialog(true);
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📄';
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box className="min-h-screen bg-gray-50">
      {/* Header */}
      <Box className="bg-white shadow-sm border-b">
        <Container maxWidth="xl">
          <Box className="flex items-center justify-between py-4">
            <Typography variant="h5" className="font-bold text-gray-800">
              Gestionnaire de Fichiers
            </Typography>
                         <Box className="flex items-center space-x-4">
               <Typography variant="body2" className="text-gray-600">
                 Connecté en tant que: {user?.username}
                 {user?.role === 'admin' && (
                   <Chip 
                     label="Admin" 
                     color="primary" 
                     size="small" 
                     className="ml-2"
                     icon={<AdminPanelSettings />}
                   />
                 )}
               </Typography>
               
               {/* Boutons pour les fonctionnalités avancées */}
               <Button
                 variant="outlined"
                 startIcon={<Person />}
                 onClick={() => setShowSharedFolders(true)}
                 size="small"
               >
                 Dossiers partagés
               </Button>
               
               <Button
                 variant="outlined"
                 startIcon={<FileCopy />}
                 onClick={() => setShowSharedFilesDialog(true)}
                 size="small"
               >
                 Fichiers partagés
               </Button>
               
               {user?.role === 'admin' && (
                 <Button
                   variant="outlined"
                   startIcon={<Settings />}
                   onClick={handleLoadAllFiles}
                   size="small"
                 >
                   Tous les fichiers
                 </Button>
               )}
               
               <Button
                 variant="outlined"
                 color="error"
                 onClick={logout}
                 size="small"
               >
                 Déconnexion
               </Button>
             </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" className="py-6">
        {/* Search Bar */}
        <Box className="mb-6">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Rechercher des fichiers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: <Search className="text-gray-400 mr-2" />,
                }}
              />
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                onClick={handleSearch}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Rechercher
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Breadcrumbs */}
        <Box className="mb-4">
          <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
            <Link
              component="button"
              variant="body1"
              onClick={() => handleBreadcrumbClick(-1)}
              className="text-primary-600 hover:text-primary-700"
            >
              <Home className="mr-1" />
              Accueil
            </Link>
            {currentPath.map((folder, index) => (
              <Link
                key={folder._id}
                component="button"
                variant="body1"
                onClick={() => handleBreadcrumbClick(index)}
                className="text-primary-600 hover:text-primary-700"
              >
                {folder.name}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>

                 {/* Action Buttons */}
         <Box className="mb-6 flex space-x-4">
           <Button
             variant="contained"
             startIcon={<CreateNewFolder />}
             onClick={() => setShowCreateFolder(true)}
             className="bg-primary-600 hover:bg-primary-700"
           >
             {currentFolder ? 'Nouveau Sous-dossier' : 'Nouveau Dossier'}
           </Button>
           <Button
             variant="contained"
             startIcon={<CloudUpload />}
             onClick={() => setShowUpload(true)}
             disabled={!currentFolder}
             className="bg-green-600 hover:bg-green-700"
           >
             Upload Fichiers
           </Button>
         </Box>

        {/* Content */}
        {loading ? (
          <Box className="flex justify-center items-center py-12">
            <CircularProgress />
          </Box>
        ) : searchQuery && searchResults.length > 0 ? (
          // Search Results
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-4">
                Résultats de recherche pour "{searchQuery}"
              </Typography>
              <List>
                {searchResults.map((result) => (
                  <ListItem key={result._id} divider>
                    <ListItemIcon>
                      {result.type === 'folder' ? (
                        <Folder className="text-blue-500" />
                      ) : (
                        <InsertDriveFile className="text-gray-500" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={result.name}
                      secondary={`Type: ${result.type}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        ) : currentFolder ? (
          // Folder Contents
          <Grid container spacing={3}>
            {/* Subfolders */}
            {currentFolder.subfolders?.map((subfolder) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={subfolder._id}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="text-center">
                    <Folder className="text-4xl text-blue-500 mb-2" />
                    <Typography variant="h6" className="font-medium">
                      {subfolder.name}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                      Dossier
                    </Typography>
                  </CardContent>
                                     <CardActions className="justify-center">
                     <Button
                       size="small"
                       onClick={() => handleFolderClick(subfolder)}
                     >
                       Ouvrir
                     </Button>
                     <Tooltip title="Partager">
                       <IconButton
                         size="small"
                         color="primary"
                         onClick={(e) => {
                           e.stopPropagation();
                           handleShareFolder(subfolder);
                         }}
                       >
                         <Share />
                       </IconButton>
                     </Tooltip>
                     <Tooltip title="Renommer">
                       <IconButton
                         size="small"
                         color="info"
                         onClick={(e) => {
                           e.stopPropagation();
                           handleRenameFolder(subfolder);
                         }}
                       >
                         <Edit />
                       </IconButton>
                     </Tooltip>
                     <Button
                       size="small"
                       color="error"
                       onClick={() => handleDeleteFolder(subfolder._id)}
                     >
                       Supprimer
                     </Button>
                   </CardActions>
                </Card>
              </Grid>
            ))}

                         {/* Files */}
             {currentFolder.files?.map((file) => (
               <Grid item xs={12} sm={6} md={4} lg={3} key={file._id}>
                 <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleFileClick(file)}>
                   <CardContent className="text-center">
                     <Typography variant="h4" className="mb-2">
                       {getFileIcon(file.mimetype)}
                     </Typography>
                     <Typography variant="h6" className="font-medium truncate">
                       {file.name}
                     </Typography>
                     <Typography variant="body2" className="text-gray-600">
                       {formatFileSize(file.data?.length || 0)}
                     </Typography>
                     <Typography variant="caption" className="text-gray-500">
                       {formatDate(file.createdAt)}
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
                   </CardContent>
                   <CardActions className="justify-center">
                     <Tooltip title="Voir le contenu">
                       <IconButton
                         size="small"
                         color="primary"
                         onClick={(e) => {
                           e.stopPropagation();
                           handleFileClick(file);
                         }}
                       >
                         <Visibility />
                       </IconButton>
                     </Tooltip>
                     <Tooltip title="Éditer les métadonnées">
                       <IconButton
                         size="small"
                         color="info"
                         onClick={(e) => {
                           e.stopPropagation();
                           handleEditFileMetadata(file);
                         }}
                       >
                         <Edit />
                       </IconButton>
                     </Tooltip>
                     <Tooltip title="Télécharger">
                       <IconButton
                         size="small"
                         color="secondary"
                         onClick={(e) => {
                           e.stopPropagation();
                           handleDownloadFile(file);
                         }}
                       >
                         <Download />
                       </IconButton>
                     </Tooltip>
                     <Tooltip title="Partager">
                       <IconButton
                         size="small"
                         color="success"
                         onClick={(e) => {
                           e.stopPropagation();
                           handleShareFile(file);
                         }}
                       >
                         <Share />
                       </IconButton>
                     </Tooltip>
                     <Tooltip title="Supprimer">
                       <IconButton
                         size="small"
                         color="error"
                         onClick={(e) => {
                           e.stopPropagation();
                           handleDeleteFile(file._id);
                         }}
                       >
                         <Delete />
                       </IconButton>
                     </Tooltip>
                   </CardActions>
                 </Card>
               </Grid>
             ))}

            {(!currentFolder.subfolders || currentFolder.subfolders.length === 0) &&
             (!currentFolder.files || currentFolder.files.length === 0) && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Ce dossier est vide. Ajoutez des fichiers ou créez des sous-dossiers.
                </Alert>
              </Grid>
            )}
          </Grid>
        ) : (
          // Main Folders
          <Grid container spacing={3}>
            {folders.map((folder) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={folder._id}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="text-center">
                    <Folder className="text-4xl text-blue-500 mb-2" />
                    <Typography variant="h6" className="font-medium">
                      {folder.name}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                      Dossier principal
                    </Typography>
                  </CardContent>
                  <CardActions className="justify-center">
                    <Button
                      size="small"
                      onClick={() => handleFolderClick(folder)}
                    >
                      Ouvrir
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeleteFolder(folder._id)}
                    >
                      Supprimer
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}

            {folders.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Aucun dossier principal trouvé. Créez votre premier dossier.
                </Alert>
              </Grid>
            )}
          </Grid>
        )}
      </Container>

             {/* Create Folder Dialog */}
       <Dialog open={showCreateFolder} onClose={() => setShowCreateFolder(false)}>
         <DialogTitle>
           {currentFolder ? 'Créer un nouveau sous-dossier' : 'Créer un nouveau dossier'}
         </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom du dossier"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateFolder(false)}>Annuler</Button>
          <Button onClick={handleCreateFolder} variant="contained">
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Files Dialog */}
      <Dialog open={showUpload} onClose={() => setShowUpload(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload de fichiers</DialogTitle>
        <DialogContent>
          <input
            type="file"
            multiple
            onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg"
          />
          {selectedFiles.length > 0 && (
            <Box className="mt-4">
              <Typography variant="subtitle2" className="mb-2">
                Fichiers sélectionnés:
              </Typography>
              <List dense>
                {selectedFiles.map((file, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <InsertDriveFile />
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                    />
                  </ListItem>
                ))}
              </List>
              
              {/* Champs pour tags et status */}
              <Box className="mt-4 space-y-4">
                <TextField
                  fullWidth
                  label="Tags (séparés par des virgules)"
                  placeholder="ex: important, travail, projet"
                  value={fileTags}
                  onChange={(e) => setFileTags(e.target.value)}
                  helperText="Ajoutez des mots-clés pour organiser vos fichiers"
                />
                
                <TextField
                  select
                  fullWidth
                  label="Statut"
                  value={fileStatus}
                  onChange={(e) => setFileStatus(e.target.value)}
                >
                  <MenuItem value="courent">Courant</MenuItem>
                  <MenuItem value="stable">Stable</MenuItem>
                  <MenuItem value="archive">Archive</MenuItem>
                  <MenuItem value="other">Autre</MenuItem>
                </TextField>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpload(false)}>Annuler</Button>
          <Button
            onClick={handleFileUpload}
            variant="contained"
            disabled={uploading || selectedFiles.length === 0}
          >
            {uploading ? <CircularProgress size={20} /> : 'Upload'}
          </Button>
                 </DialogActions>
       </Dialog>

       {/* File Viewer Dialog */}
       <Dialog 
         open={showFileViewer} 
         onClose={handleCloseFileViewer} 
         maxWidth="lg" 
         fullWidth
         PaperProps={{
           style: { maxHeight: '90vh' }
         }}
       >
         <DialogTitle>
           <Box className="flex items-center justify-between">
             <Typography variant="h6">
               {selectedFile?.name}
             </Typography>
             <Box className="flex space-x-2">
               {fileContent?.type === 'download' && (
                 <Button
                   variant="outlined"
                   startIcon={<Download />}
                   onClick={handleDownloadFile}
                 >
                   Télécharger
                 </Button>
               )}
               <Button onClick={handleCloseFileViewer}>
                 Fermer
               </Button>
             </Box>
           </Box>
         </DialogTitle>
         <DialogContent>
           {loadingFile ? (
             <Box className="flex justify-center items-center py-8">
               <CircularProgress />
               <Typography className="ml-2">Chargement du fichier...</Typography>
             </Box>
           ) : fileContent ? (
             <Box>
               {fileContent.type === 'image' && (
                 <Box className="flex justify-center">
                   <img 
                     src={fileContent.url} 
                     alt={selectedFile?.name}
                     style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                   />
                 </Box>
               )}
               
               {fileContent.type === 'pdf' && (
                 <Box className="flex justify-center">
                   <iframe
                     src={fileContent.url}
                     width="100%"
                     height="70vh"
                     title={selectedFile?.name}
                   />
                 </Box>
               )}
               
               {fileContent.type === 'text' && (
                 <Box className="bg-gray-100 p-4 rounded-lg">
                   <Typography variant="subtitle2" className="mb-2 text-gray-600">
                     Contenu du fichier:
                   </Typography>
                   <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">
                     {fileContent.content}
                   </pre>
                 </Box>
               )}
               
               {fileContent.type === 'download' && (
                 <Box className="text-center py-8">
                   <Typography variant="h6" className="mb-4">
                     Fichier non prévisualisable
                   </Typography>
                   <Typography variant="body2" className="text-gray-600 mb-4">
                     Ce type de fichier ne peut pas être affiché directement.
                     Cliquez sur "Télécharger" pour le récupérer.
                   </Typography>
                   <Button
                     variant="contained"
                     startIcon={<Download />}
                     onClick={() => handleDownloadFile(selectedFile)}
                     className="bg-primary-600 hover:bg-primary-700"
                   >
                     Télécharger {selectedFile?.name}
                   </Button>
                 </Box>
               )}
             </Box>
           ) : (
             <Box className="text-center py-8">
               <Typography variant="h6" color="error">
                 Erreur lors du chargement du fichier
               </Typography>
             </Box>
           )}
         </DialogContent>
       </Dialog>

       {/* File Metadata Dialog */}
       <FileMetadataDialog
         open={showFileMetadata}
         onClose={() => setShowFileMetadata(false)}
         file={selectedFile}
         folderId={currentFolder?._id}
         onUpdate={() => {
           if (currentFolder?._id) {
             loadFolderContents(currentFolder._id);
           }
         }}
       />

       {/* Share Dialog */}
       <ShareDialog
         open={showShareDialog}
         onClose={() => setShowShareDialog(false)}
         folder={currentFolder}
         onUpdate={() => {
           if (currentFolder?._id) {
             loadFolderContents(currentFolder._id);
           }
         }}
       />

       {/* Shared Folders Dialog */}
       <SharedFoldersDialog
         open={showSharedFolders}
         onClose={() => setShowSharedFolders(false)}
         onFolderClick={handleSharedFolderClick}
       />

       {/* Rename Folder Dialog */}
       <Dialog open={showRenameDialog} onClose={() => setShowRenameDialog(false)}>
         <DialogTitle>Renommer le dossier</DialogTitle>
         <DialogContent>
           <TextField
             autoFocus
             margin="dense"
             label="Nouveau nom du dossier"
             fullWidth
             value={renameFolderName}
             onChange={(e) => setRenameFolderName(e.target.value)}
             onKeyPress={(e) => e.key === 'Enter' && handleRenameFolderSave()}
           />
         </DialogContent>
         <DialogActions>
           <Button onClick={() => setShowRenameDialog(false)}>Annuler</Button>
           <Button onClick={handleRenameFolderSave} variant="contained">
             Renommer
           </Button>
         </DialogActions>
       </Dialog>

       {/* All Files Dialog (Admin only) */}
       <Dialog 
         open={showAllFiles} 
         onClose={() => setShowAllFiles(false)}
         maxWidth="lg"
         fullWidth
       >
         <DialogTitle>
           <Box display="flex" alignItems="center">
             <Settings className="mr-2" />
             Tous les fichiers (Admin)
           </Box>
         </DialogTitle>
         <DialogContent>
           <Box className="space-y-4 mt-4">
             {allFiles.length === 0 ? (
               <Alert severity="info">
                 Aucun fichier trouvé.
               </Alert>
             ) : (
               <List>
                 {allFiles.map((file, index) => (
                   <ListItem key={index} divider>
                     <ListItemIcon>
                       <InsertDriveFile />
                     </ListItemIcon>
                     <ListItemText
                       primary={file.fileName}
                       secondary={
                         <Box>
                           <Typography variant="body2" color="textSecondary">
                             Dossier: {file.folderName}
                           </Typography>
                           <Typography variant="body2" color="textSecondary">
                             Propriétaire: {file.owner?.username} ({file.owner?.email})
                           </Typography>
                           <Typography variant="body2" color="textSecondary">
                             Statut: {file.status} | Tags: {file.tags?.join(', ') || 'Aucun'}
                           </Typography>
                         </Box>
                       }
                     />
                     <ListItemSecondaryAction>
                       <Chip
                         label={file.status}
                         color={file.status === 'courent' ? 'primary' : 'default'}
                         size="small"
                       />
                     </ListItemSecondaryAction>
                   </ListItem>
                 ))}
               </List>
             )}
           </Box>
         </DialogContent>
         <DialogActions>
           <Button onClick={() => setShowAllFiles(false)}>
             Fermer
           </Button>
         </DialogActions>
       </Dialog>

       {/* File Share Dialog */}
       <FileShareDialog
         open={showFileShareDialog}
         onClose={() => setShowFileShareDialog(false)}
         file={selectedFileForSharing}
         folderId={currentFolder?._id}
         onUpdate={() => {
           if (currentFolder?._id) {
             loadFolderContents(currentFolder._id);
           }
         }}
       />

       {/* Shared Files Dialog */}
       <SharedFilesDialog
         open={showSharedFilesDialog}
         onClose={() => setShowSharedFilesDialog(false)}
         onFileClick={handleSharedFolderClick} // Assuming handleSharedFolderClick can handle files too
       />
     </Box>
   );
 };

export default Dashboard; 