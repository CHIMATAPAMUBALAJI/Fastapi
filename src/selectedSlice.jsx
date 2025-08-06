// selectedSlice.js
import { createSlice } from "@reduxjs/toolkit";

export const selectedSlice = createSlice({
  name: "selected",
  initialState: {
    row: null,
  },
  reducers: {
    setSelectedRow: (state, action) => {
      state.row = action.payload;
    },
  },
});

export const { setSelectedRow } = selectedSlice.actions;
export default selectedSlice.reducer;
