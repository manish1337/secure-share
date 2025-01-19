import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Paper,
  Chip,
} from "@material-ui/core";
import {
  InsertDriveFile as FileIcon,
  GetApp as DownloadIcon,
} from "@material-ui/icons";
import { getSharedFiles } from "../../redux/slices/shareSlice";
import { formatBytes, formatDate } from "../../utils/formatters";
import { downloadFile } from "../../utils/fileHandling";

const SharedFiles = () => {
  const dispatch = useDispatch();
  const { sharedFiles, loading, error } = useSelector((state) => state.shares);

  useEffect(() => {
    dispatch(getSharedFiles());
  }, [dispatch]);

  const handleDownload = async (file) => {
    try {
      await downloadFile(file);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (loading) {
    return <Typography>Loading shared files...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Paper>
      <List>
        {sharedFiles.map((share) => (
          <ListItem key={share.id}>
            <ListItemIcon>
              <FileIcon />
            </ListItemIcon>
            <ListItemText
              primary={share.file.name}
              secondary={`${formatBytes(share.file.size)} • ${formatDate(
                share.created_at
              )}`}
            />
            <Chip
              label={share.permission}
              color={share.permission === "download" ? "primary" : "default"}
              style={{ marginRight: "1rem" }}
            />
            {share.permission === "download" && (
              <IconButton onClick={() => handleDownload(share.file)}>
                <DownloadIcon />
              </IconButton>
            )}
          </ListItem>
        ))}
        {sharedFiles.length === 0 && (
          <ListItem>
            <ListItemText primary="No files have been shared with you yet." />
          </ListItem>
        )}
      </List>
    </Paper>
  );
};

export default SharedFiles;
