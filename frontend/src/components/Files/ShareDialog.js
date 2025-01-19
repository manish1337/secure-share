import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Tabs,
  Tab,
  Box,
  Snackbar,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  createShareableLink,
  createFileShare,
} from "../../redux/slices/shareSlice";

const ShareDialog = ({ open, onClose, file }) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("view");
  const [expiryDays, setExpiryDays] = useState(7);
  const { loading, error } = useSelector((state) => state.shares);
  const [generatedLink, setGeneratedLink] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleShareWithUser = async () => {
    if (!email) return;

    console.log("Attempting to share file:", {
      file,
      fileId: file?.id,
      email,
      permission,
    });

    if (!file || !file.id) {
      console.error("No file ID available");
      return;
    }

    const result = await dispatch(
      createFileShare({
        fileId: file.id,
        shared_with_username: email,
        permission,
      })
    );

    console.log("Share result:", result);

    if (!result.error) {
      onClose();
    }
  };

  const handleCreateLink = async () => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    const expiryString = expiryDate.toISOString().split(".")[0];

    console.log("Creating link with expiry:", expiryString);

    const result = await dispatch(
      createShareableLink({
        fileId: file.id,
        expiresAt: expiryString,
        permission,
      })
    );

    console.log("Create link result:", result);

    if (!result.error && result.payload) {
      console.log("Setting generated link from payload:", result.payload);
      // Assuming the API returns an 'id' or 'token' field for the link
      const shareUrl = `${window.location.origin}/share/${
        result.payload.id || result.payload.token
      }`;
      console.log("Generated share URL:", shareUrl);
      setGeneratedLink(shareUrl);
    } else {
      console.error("Failed to create link:", result.error);
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setSnackbarOpen(true);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share File</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          {file?.name}
        </Typography>

        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Share with User" />
          <Tab label="Create Link" />
        </Tabs>

        <Box mt={2}>
          {activeTab === 0 ? (
            <>
              <TextField
                fullWidth
                margin="normal"
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter recipient's email address"
                helperText="Enter the email address of the person you want to share with"
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>Permission</InputLabel>
                <Select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                >
                  <MenuItem value="view">View Only</MenuItem>
                  <MenuItem value="download">Download</MenuItem>
                </Select>
              </FormControl>
            </>
          ) : (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel>Link Expiry</InputLabel>
                <Select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                >
                  <MenuItem value={1}>1 day</MenuItem>
                  <MenuItem value={7}>7 days</MenuItem>
                  <MenuItem value={30}>30 days</MenuItem>
                </Select>
              </FormControl>

              {generatedLink && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Shareable Link Generated:
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <TextField
                      fullWidth
                      value={generatedLink}
                      variant="outlined"
                      size="small"
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleCopyLink}
                    >
                      Copy
                    </Button>
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {(!generatedLink || activeTab === 0) && (
          <Button
            onClick={activeTab === 0 ? handleShareWithUser : handleCreateLink}
            variant="contained"
            disabled={loading || (activeTab === 0 && !email)}
          >
            {loading ? "Sharing..." : activeTab === 0 ? "Share" : "Create Link"}
          </Button>
        )}
      </DialogActions>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Link copied to clipboard"
      />
    </Dialog>
  );
};

export default ShareDialog;
