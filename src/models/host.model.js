import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const hostSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
   username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  phone: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  avatar: {
    type: String,
    default: "",
  },
   refreshToken: {
            type: String
        },
        
otp: {
    type: String,
  },

  otpExpiry: {
    type: Date,
  },

  role: {
    type: String,
    default: "host",
  },
},{
timestamps: true
});

hostSchema.pre("save", async function () {
    if(!this.isModified("password")) return ;

    this.password = await bcrypt.hash(this.password, 10)
    
})

hostSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}


hostSchema.methods.generateAccessToken = function(){
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
hostSchema.methods.generateRefreshToken = function(){
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



export const Host = mongoose.model("Host", hostSchema);