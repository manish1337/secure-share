import React from "react";
import { Outlet } from "react-router-dom";
import { Box, Container } from "@mui/material";
import Navbar from "./Navbar";

function Layout() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Outlet />
      </Container>
    </Box>
  );
}

export default Layout;
