import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import { encryptFile } from "../../utils/encryption";

const initialState = {
  files: [],
  sharedFiles: [],
  loading: false,
  error: null,
};

export const uploadFile = createAsyncThunk(
  "files/upload",
  async (file, { rejectWithValue }) => {
    try {
      const encryptedFile = await encryptFile(file);
      const formData = new FormData();
      formData.append("file", encryptedFile);
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

export const fetchFiles = createAsyncThunk(
  "files/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/files/");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { error: "Failed to fetch files" }
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
        state.error = action.payload?.error || "Upload failed";
      })
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
      });
  },
});

export default fileSlice.reducer;
