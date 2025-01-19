import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const SharedFileView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const downloadFile = async () => {
      try {
        window.location.href = `${API_URL}/api/links/${id}/download/`;
        // Navigate away after initiating download
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } catch (err) {
        console.error("Download error:", err.response?.data || err);
        alert(
          err.response?.data?.error ||
            "Failed to download file. The link may be expired."
        );
        navigate("/");
      }
    };

    downloadFile();
  }, [id, navigate]);

  // Return null since we don't need to render anything
  return null;
};

export default SharedFileView;
