import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { useDispatch } from "react-redux";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import { validateToken } from "./redux/slices/authSlice";
import SharedFileView from "./components/Share/SharedFileView";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Only validate token if we're not on a public route
    if (!window.location.pathname.startsWith("/share/")) {
      const token = localStorage.getItem("token");
      if (token) {
        dispatch(validateToken());
      }
    }
  }, [dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Public share route outside of Layout */}
        <Route path="/share/:id" element={<SharedFileView />} />

        {/* App routes with Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route
            path="dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
