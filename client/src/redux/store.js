import { configureStore } from "@reduxjs/toolkit";
import blogReducer from "./slice/blog";

export const store = configureStore({
  reducer: {
    blog: blogReducer,
  },
});
