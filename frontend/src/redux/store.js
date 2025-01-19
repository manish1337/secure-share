import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import fileReducer from "./slices/fileSlice";
import shareReducer from "./slices/shareSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    files: fileReducer,
    shares: shareReducer,
  },
});
