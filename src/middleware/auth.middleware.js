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

// export const verifyPlayerJWT = asyncHandler(async (req, _, next) => {
//     try {
//         // Token extract karo
//         const token = 
//             req.cookies?.accessToken || 
//             req.header("Authorization")?.replace("Bearer ", "");

//         if (!token) {
//             throw new ApiError(401, "Unauthorized request: No token provided");
//         }

//         // Verify token
//         const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

//         // Player find karo
//         const player = await Player.findById(decodedToken?._id)
//             .select("-password -refreshToken");

//         if (!player) {
//             throw new ApiError(401, "Invalid Access Token");
//         }

//         // Attach player to request
//         req.user = player;
//         next();

//     } catch (error) {
//         if (error.name === "TokenExpiredError") {
//             throw new ApiError(401, "Token has expired. Please login again");
//         }
        
//         if (error.name === "JsonWebTokenError") {
//             throw new ApiError(401, "Invalid token");
//         }

//         throw new ApiError(401, error?.message || "Invalid access token");
//     }
// });

export const verifyPlayerJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || 
                     req.header("Authorization")?.replace("Bearer ", "");

        console.log("🔑 Received Token:", token ? "YES" : "NO");
        console.log("Token Length:", token?.length);

        if (!token) {
            throw new ApiError(401, "No token provided");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log("✅ Token Decoded Successfully");

        const player = await Player.findById(decodedToken?._id).select("-password");

        if (!player) throw new ApiError(401, "Player not found");

        req.user = player;
        next();

    } catch (error) {
        console.error("JWT Error:", error.name, error.message);
        throw new ApiError(401, error.message || "Invalid token");
    }
});