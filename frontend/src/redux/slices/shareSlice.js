import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api from "../../services/api";

const API_URL = process.env.REACT_APP_API_URL;

export const createShareableLink = createAsyncThunk(
  "shares/createLink",
  async (
    { fileId, expiresAt, permission, email },
    { getState, rejectWithValue }
  ) => {
    try {
      const {
        auth: { token },
      } = getState();

      console.log("Creating shareable link with:", {
        file_id: fileId,
        expires_at: expiresAt,
        permission,
        email,
      });

      const response = await axios.post(
        `${API_URL}/api/links/`,
        {
          file_id: fileId,
          expires_at: expiresAt,
          permission,
          email,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Shareable link created successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Create link failed:", error.response?.data);
      return rejectWithValue(
        error.response?.data || { error: "Failed to create shareable link" }
      );
    }
  }
);

export const getSharedFiles = createAsyncThunk(
  "shares/getShared",
  async (_, { getState, rejectWithValue }) => {
    try {
      const {
        auth: { token },
      } = getState();
      const response = await axios.get(`${API_URL}/api/shares/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createFileShare = createAsyncThunk(
  "shares/createShare",
  async ({ fileId, shared_with_username, permission }, { rejectWithValue }) => {
    try {
      console.log("Sending share request with:", {
        file_id: fileId,
        shared_with_username,
        permission,
      });

      const response = await api.post("/api/shares/", {
        file_id: fileId,
        shared_with_username,
        permission,
      });
      return response.data;
    } catch (error) {
      console.error("Share request failed:", error.response?.data);
      return rejectWithValue(
        error.response?.data || { error: "Failed to share file" }
      );
    }
  }
);

const shareSlice = createSlice({
  name: "shares",
  initialState: {
    sharedFiles: [],
    shareableLinks: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createShareableLink.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createShareableLink.fulfilled, (state, action) => {
        state.loading = false;
        state.shareableLinks.push(action.payload);
      })
      .addCase(createShareableLink.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.error || "Failed to create shareable link";
      })
      .addCase(getSharedFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.sharedFiles = action.payload;
      })
      .addCase(createFileShare.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFileShare.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(createFileShare.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to share file";
      });
  },
});

export default shareSlice.reducer;
