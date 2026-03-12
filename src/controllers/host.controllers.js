import {asyncHandler} from "../utilis/asyncHandler.js";
import {ApiError} from "../utilis/ApiError.js";
import {ApiResponse} from "../utilis/ApiResponse.js";
import { Host } from "../models/host.model.js";
import {uploadOnCloudinary}  from "../utilis/cloudinary.js";

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const host = await Host.findById(userId)
        const accessToken = host.generateAccessToken()
        const refreshToken = host.generateRefreshToken()

        host.refreshToken = refreshToken
        await host.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}




const registerhost=asyncHandler(async(req,res)=>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const{name,phone,password,username}=req.body;


    if(name==""){
        throw new ApiError(400,"username is required");
        
    }

    if (!username) {
  throw new ApiError(400, "Username is required");
}
    
    if(phone==""){
        throw new ApiError(400,"phone number  is required");
        
    }
    if(password==""){
        throw new ApiError(400,"password is required");
        
    }


    

    const existedUser = await Host.findOne({
        $or: [{ username }, { phone }]
    })

     if (existedUser) {
        throw new ApiError(409, "User with name or phone already exists")
    }

    let avatar;
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    console.log("avatarLocalpath is ",avatarLocalPath);

       if (avatarLocalPath) {
          avatar = await uploadOnCloudinary(avatarLocalPath)
          console.log("avatar is ",avatar.url);
       }
   
    
     const host = await Host.create({
        name,
        username,
        avatar: avatar?.url || "",
        phone, 
        password,
        
    })
//  jis bhi field ko hatana ho wo iss syntax se hata skta ha 
    const createdHost = await Host.findById(host._id).select(
        "-password -refreshToken"
    )

    if (!createdHost) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdHost, "Host registered Successfully")
    )

} )

const loginhost=asyncHandler(async(req,res)=>{
    const {username,password}=req.body;
    if (!username ) {
  throw new ApiError(400, "Username required");
    }

    if(!password){
        throw new ApiError(400,"password required");
    }

     const host = await Host.findOne({username });
       
       if (!host) {
      throw new ApiError(404, "Host not found");
       }

        const isPasswordValid = await host.isPasswordCorrect(password);

      if (!isPasswordValid) {
      throw new ApiError(401, "Invalid password");
          }
            const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(host._id);

       const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                host, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    );



});

const logouthost=asyncHandler(async(req,res)=>{
   
    await Host.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Host logged Out"))

});


const sendotpbyphone = asyncHandler(async (req, res) => {

    const { phone } = req.body;

    if (!phone) {
        throw new ApiError(400, "Phone number is required");

    }
    if(phone.length !== 10){
    throw new ApiError(400,"Invalid phone number")
   }

    const host = await Host.findOne({ phone });

    if (!host) {
        throw new ApiError(404, "Host not found");
    }

    // generate otp
    const otp = Math.floor(100000 + Math.random() * 900000);

    // save otp in database
    host.otp = otp;
    host.otpExpiry = Date.now() + 5 * 60 * 1000;

    await host.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                otp   // ⚠️ development ke liye
            },
            "OTP sent successfully"
        )
    );
});

const verifyotp=asyncHandler(async(req,res)=>{
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        throw new ApiError(400, "Phone and OTP are required");
    }

    if(otp.length!=6){
        throw new ApiError(409,"invalid otp");
    }

    const host = await Host.findOne({ phone });

    if (!host) {
        throw new ApiError(404, "Host not found");
    }


    // OTP match check
    if (host.otp != otp) {
        throw new ApiError(400, "Invalid OTP");
    }

    // expiry check
    if (host.otpExpiry < Date.now()) {
        throw new ApiError(400, "OTP expired");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "OTP verified successfully")
    );
});

const resendotp=asyncHandler(async(req,res)=>{
    const{phone}=req.body;
    if(!phone){
        new ApiError(400,"phone number is required");
    }

        const host = await Host.findOne({ phone });

    if (!host) {
        throw new ApiError(404, "Host not found");
    }

     const otp = Math.floor(100000 + Math.random() * 900000);

    // save otp in database
    host.otp = otp;
    host.otpExpiry = Date.now() + 5 * 60 * 1000;
    await host.save();

      return res.status(200).json(
        new ApiResponse(
            200,
            {
                otp   // ⚠️ development ke liye
            },
            "OTP sent successfully"
        )
    );

    

});

const resetpassword=asyncHandler(async(req,res)=>{
    const{phone,password,confirm}=req.body;
    if(!phone){
        throw new ApiError(400,"phone number is required");
    }
    if(!password){
        throw new ApiError(400,"password is required");
    }
    if(!confirm){
        throw new ApiError(400,"confirm password is required");
    }
if(password !== confirm){
    throw new ApiError(400,"password and confirm password do not match");
}
    const host =await Host.findOne({phone});
    if(!host){
        throw new ApiError(404,"host not found");
    }
    host.password=password;
    host.otp = null;
    host.otpExpiry = null;
    await host.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "password change succesfully"
        )
    )


})


const updateusername=asyncHandler(async(req,res)=>{
    
    const {username}=req.body;

    if(!username){
        throw new ApiError(400,"username required");
    }
    const host=await Host.findById(req.user._id);
    if(!host){
        throw new ApiError(404,"user not found");
    }

    host.username=username;
    await host.save();
    return res.status(200).json(
        new ApiResponse(200,host,"username edit succesfully"));
    



});

const updateprofile=asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // cloudinary upload function
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  // user find from token
  const host = await Host.findById(req.user._id);

  if (!host) {
    throw new ApiError(404, "Host not found");
  }

  // avatar update
  host.avatar = avatar.url;

  await host.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      host,
      "Profile picture updated successfully"
    )
  );
});
export {logouthost};
export {loginhost};
export {registerhost};
export {sendotpbyphone};
export {verifyotp};
export {resendotp};
export {resetpassword};
export {updateusername};
export {updateprofile};