import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../redux/slices/authSlice";
import fileReducer from "./slices/fileSlice";
import shareReducer from "../redux/slices/shareSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    files: fileReducer,
    shares: shareReducer,
  },
});

export default store;
