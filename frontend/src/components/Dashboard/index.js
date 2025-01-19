import React, { useState } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Button,
} from "@material-ui/core";
import { ExitToApp as LogoutIcon } from "@material-ui/icons";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../redux/slices/authSlice";
import FileUpload from "../Files/FileUpload";
import FileList from "../Files/FileList";
import ShareDialog from "../Files/ShareDialog";
import SharedFiles from "../Files/SharedFiles";
import ShareableLinks from "../Files/ShareableLinks";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleShare = (file) => {
    setSelectedFile(file);
    setShareDialogOpen(true);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Secure File Share
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" style={{ marginTop: "2rem" }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper style={{ padding: "1rem" }}>
              <FileUpload />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper style={{ padding: "1rem" }}>
              <Typography variant="h6" gutterBottom>
                Your Files
              </Typography>
              <FileList onShare={handleShare} />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper style={{ padding: "1rem" }}>
              <Typography variant="h6" gutterBottom>
                Shared with You
              </Typography>
              <SharedFiles />
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper style={{ padding: "1rem" }}>
              <Typography variant="h6" gutterBottom>
                Your Shareable Links
              </Typography>
              <ShareableLinks
                links={shareableLinks}
                onDelete={handleDeleteLink}
              />
            </Paper>
          </Grid>
        </Grid>

        <ShareDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          file={selectedFile}
        />
      </Container>
    </>
  );
};

export default Dashboard;
