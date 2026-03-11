import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
{
  phone: {
    type: String,
    required: true,
  },

  avatar: {
    type: String,
    default: "",
  },

  // OTP verification
  isVerified: {
    type: Boolean,
    default: false,
  },

  otp: {
    type: String,
  },

  otpExpiry: {
    type: Date,
  },

  // optional tracking
  tournamentsJoined: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
    },
  ],
},
{
  timestamps: true,
});

export const Player = mongoose.model("Player", playerSchema);