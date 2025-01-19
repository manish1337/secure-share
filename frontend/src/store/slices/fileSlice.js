import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

const initialState = {
  files: [],
  sharedFiles: [],
  loading: false,
  error: null,
};

export const fetchFiles = createAsyncThunk(
  "files/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/files/");
      return response.data.results || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { error: "Failed to fetch files" }
      );
    }
  }
);

export const uploadFile = createAsyncThunk(
  "files/upload",
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);

      const response = await api.post("/api/files/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { error: "Failed to upload file" }
      );
    }
  }
);

export const deleteFile = createAsyncThunk(
  "files/delete",
  async (fileId, { rejectWithValue }) => {
    try {
      await api.delete(`/api/files/${fileId}/`);
      return fileId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { error: "Failed to delete file" }
      );
    }
  }
);

const fileSlice = createSlice({
  name: "files",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch files
      .addCase(fetchFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to fetch files";
      })
      // Upload file
      .addCase(uploadFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.loading = false;
        state.files = Array.isArray(state.files)
          ? [...state.files, action.payload]
          : [action.payload];
        state.error = null;
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to upload file";
      })
      // Delete file
      .addCase(deleteFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.loading = false;
        state.files = state.files.filter((file) => file.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to delete file";
      });
  },
});

export default fileSlice.reducer;
