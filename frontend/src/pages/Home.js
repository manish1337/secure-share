import React from "react";
import { Typography, Button, Box } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

function Home() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        mt: 8,
      }}
    >
      <Typography variant="h2" component="h1" gutterBottom>
        Welcome to Secure Share
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom>
        Share your files securely with end-to-end encryption
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          component={RouterLink}
          to="/register"
          sx={{ mr: 2 }}
        >
          Get Started
        </Button>
        <Button
          variant="outlined"
          color="primary"
          component={RouterLink}
          to="/login"
        >
          Sign In
        </Button>
      </Box>
    </Box>
  );
}

export default Home;
