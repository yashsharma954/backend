import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
{
  phone: {
    type: String,
    required: true,
  },

  teamname:{
    type: String,
   
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

  
  tournamentsJoined: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
    },
  ],
 
  teamimage:{
    type : String,
    default:""
  },

  teammates: [
    {
      ingameName: {
      type: String,
      },
    }
  ],
},
{
  timestamps: true,
});

export const Player = mongoose.model("Player", playerSchema);