import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  CircularProgress,
  Typography,
  Box,
  LinearProgress,
} from "@material-ui/core";
import { CloudUpload as CloudUploadIcon } from "@material-ui/icons";
import { uploadFile } from "../../redux/slices/fileSlice";

const FileUpload = () => {
  const dispatch = useDispatch();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { error } = useSelector((state) => state.files);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      await dispatch(uploadFile(file));
      setProgress(100);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box my={3}>
      <input
        accept="*/*"
        style={{ display: "none" }}
        id="file-upload"
        type="file"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      <label htmlFor="file-upload">
        <Button
          variant="contained"
          color="primary"
          component="span"
          disabled={uploading}
          startIcon={<CloudUploadIcon />}
        >
          Upload File
        </Button>
      </label>

      {uploading && (
        <Box mt={2}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" color="textSecondary">
            Uploading... {progress}%
          </Typography>
        </Box>
      )}

      {error && (
        <Typography color="error" style={{ marginTop: "1rem" }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default FileUpload;
