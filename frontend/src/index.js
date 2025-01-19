import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import store from "./store";
import { setAuthErrorHandler } from "./services/api";
import { logout } from "./redux/slices/authSlice";
import "./index.css";

// Set up auth error handler
setAuthErrorHandler(() => {
  store.dispatch(logout());
  // Only redirect if we're not already on the login page
  if (!window.location.pathname.includes("/login")) {
    window.location.href = "/login?session_expired=true";
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
