import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slices/authSlice";

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to={isAuthenticated ? "/dashboard" : "/"}
          sx={{ flexGrow: 1, textDecoration: "none", color: "inherit" }}
        >
          Secure Share
        </Typography>
        <Box>
          {isAuthenticated ? (
            <>
              {user && (
                <Typography variant="body1" sx={{ mr: 2, display: "inline" }}>
                  {user.email}
                </Typography>
              )}
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
