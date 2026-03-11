import { ApiError } from "../utilis/ApiError.js";
import { asyncHandler } from "../utilis/asyncHandler.js";
import jwt from "jsonwebtoken"
import { Host } from "../models/host.model.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        // console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const host = await Host.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!host) {
            
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = host;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})