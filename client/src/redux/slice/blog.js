import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Action
export const fetchData = createAsyncThunk("fetchData", async () => {
  const response = await axios.get("/post");
  return response;
});

const blogSlice = createSlice({
  name: "blog",
  initialState: {
    isLoading: false,
    data: null,
    isError: false,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchData.pending, (state, action) => {
      state.isLoading = true;
    });
    builder.addCase(fetchData.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload;
    });
    builder.addCase(fetchData.rejected, (state, action) => {
      console.log("Error", action.payload);
      state.isError = true;
    });
  },
});

export default blogSlice.reducer;
