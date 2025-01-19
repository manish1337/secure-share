import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import { CloudUpload, Share, Delete } from "@mui/icons-material";
import { fetchFiles, uploadFile, deleteFile } from "../store/slices/fileSlice";
import ShareDialog from "../components/Files/ShareDialog";

function Dashboard() {
  const dispatch = useDispatch();
  const { files, loading, error } = useSelector((state) => state.files);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    dispatch(fetchFiles());
  }, [dispatch]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      await dispatch(uploadFile(file));
      // Refresh the file list after upload
      dispatch(fetchFiles());
    }
  };

  const handleShare = (file) => {
    setSelectedFile(file);
    setShareDialogOpen(true);
  };

  const handleCloseShareDialog = () => {
    setShareDialogOpen(false);
    setSelectedFile(null);
  };

  const handleDelete = async (fileId) => {
    await dispatch(deleteFile(fileId));
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" component="h1">
          My Files
        </Typography>
        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUpload />}
          disabled={loading}
        >
          Upload File
          <input type="file" hidden onChange={handleFileUpload} />
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2}>
        <List>
          {files.length === 0 ? (
            <ListItem>
              <ListItemText primary="No files uploaded yet" />
            </ListItem>
          ) : (
            files.map((file) => (
              <ListItem key={file.id}>
                <ListItemText
                  primary={file.name}
                  secondary={
                    file.uploaded_at
                      ? `Uploaded on ${new Date(
                          file.uploaded_at
                        ).toLocaleDateString()}`
                      : ""
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="share"
                    onClick={() => handleShare(file)}
                    sx={{ mr: 1 }}
                  >
                    <Share />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(file.id)}
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))
          )}
        </List>
      </Paper>

      <ShareDialog
        open={shareDialogOpen}
        onClose={handleCloseShareDialog}
        file={selectedFile}
      />
    </Box>
  );
}

export default Dashboard;
