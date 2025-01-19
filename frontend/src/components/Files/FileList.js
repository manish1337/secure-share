import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondary,
  IconButton,
  Typography,
  Paper,
} from "@material-ui/core";
import {
  InsertDriveFile as FileIcon,
  Share as ShareIcon,
  GetApp as DownloadIcon,
} from "@material-ui/icons";
import { fetchFiles } from "../../redux/slices/fileSlice";
import { formatBytes, formatDate } from "../../utils/formatters";
import ShareDialog from "./ShareDialog";

const FileList = () => {
  const dispatch = useDispatch();
  const [selectedFile, setSelectedFile] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { files, loading, error } = useSelector((state) => state.files);

  useEffect(() => {
    const loadFiles = async () => {
      const result = await dispatch(fetchFiles());
      console.log("Loaded files:", result.payload);
    };
    loadFiles();
  }, [dispatch]);

  const handleDownload = async (file) => {
    // Implement download logic
  };

  const handleShare = (file) => {
    console.log("Sharing file:", file);
    setSelectedFile(file);
    setShareDialogOpen(true);
  };

  const handleCloseShareDialog = () => {
    setShareDialogOpen(false);
    setSelectedFile(null);
  };

  if (loading) {
    return <Typography>Loading files...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <>
      <Paper>
        <List>
          {files.map((file) => (
            <ListItem key={file.id}>
              <ListItemIcon>
                <FileIcon />
              </ListItemIcon>
              <ListItemText
                primary={file.name}
                secondary={`${formatBytes(file.size)} • ${formatDate(
                  file.uploaded_at
                )}`}
              />
              <IconButton onClick={() => handleDownload(file)}>
                <DownloadIcon />
              </IconButton>
              <IconButton onClick={() => handleShare(file)}>
                <ShareIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </Paper>

      <ShareDialog
        open={shareDialogOpen}
        onClose={handleCloseShareDialog}
        file={selectedFile}
      />
    </>
  );
};

export default FileList;
