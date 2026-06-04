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
   refreshToken: {
            type: String
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

playerSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
playerSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const Player = mongoose.model("Player", playerSchema);