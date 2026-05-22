import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  profilePic: {
    type: String,
    required: false,
  },
});

export const User = mongoose.model("User", userSchema);
