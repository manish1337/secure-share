import React, { useState } from "react";
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Paper,
  Button,
  Snackbar,
} from "@material-ui/core";
import { FileCopy as CopyIcon, Delete as DeleteIcon } from "@material-ui/icons";
import { useSelector } from "react-redux";
import { formatDate } from "../../utils/formatters";

const ShareableLinks = ({ links, onDelete }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleCopy = (link) => {
    const shareUrl = `${window.location.origin}/share/${link.id}`;
    navigator.clipboard.writeText(shareUrl);
    setSnackbarOpen(true);
  };

  return (
    <>
      <Paper>
        <List>
          {links.map((link) => (
            <ListItem key={link.id}>
              <ListItemText
                primary={link.file.name}
                secondary={`Expires: ${formatDate(link.expires_at)} • ${
                  link.access_count
                } views`}
              />
              <IconButton onClick={() => handleCopy(link)}>
                <CopyIcon />
              </IconButton>
              <IconButton onClick={() => onDelete(link.id)}>
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}
          {links.length === 0 && (
            <ListItem>
              <ListItemText primary="No shareable links created yet." />
            </ListItem>
          )}
        </List>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Link copied to clipboard"
      />
    </>
  );
};

export default ShareableLinks;
