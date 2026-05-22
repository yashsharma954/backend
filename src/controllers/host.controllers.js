import {asyncHandler} from "../utilis/asyncHandler.js";
import {ApiError} from "../utilis/ApiError.js";
import {ApiResponse} from "../utilis/ApiResponse.js";
import { Host } from "../models/host.model.js";
import {uploadOnCloudinary}  from "../utilis/cloudinary.js";
import { Tournament } from "../models/tournament.model.js";
import { Team } from "../models/team.model.js";

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
        console.log("ispassword is ",isPasswordValid);

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
            host,
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


const createtournament = asyncHandler(async (req, res) => {
    
    // 🔥 ROUNDS PARSING - Sabse Pehle Yeh Karo
    let rounds = req.body.rounds;

    if (typeof rounds === "string") {
        try {
            rounds = JSON.parse(rounds);
        } catch (error) {
            console.error("Rounds Parse Error:", error);
            throw new ApiError(400, "Invalid rounds data format");
        }
    }
    // Rounds mein totalMatches automatically calculate karo
   
    const {
        title,
        game,
        startTime,
        endTime,
        prizePool,
        entryFee,
        maxTeams,
        matchType,
        teamSize,
        totalRounds,
        hostId,
        map
    } = req.body;

    // ==================== Validation ====================
    if (!title) throw new ApiError(400, "title is required");
    if (!game) throw new ApiError(400, "game is required");
    if (!startTime) throw new ApiError(400, "startTime is required");
    if (!endTime) throw new ApiError(400, "endTime is required");
    if (!prizePool) throw new ApiError(400, "prizepool is required");
    if (!entryFee) throw new ApiError(400, "entryfee is required");
    if (!maxTeams) throw new ApiError(400, "maxteams is required");
    if (!matchType) throw new ApiError(400, "matchtype is required");
    if (!teamSize) throw new ApiError(400, "teamsize is required");
    if (!hostId) throw new ApiError(400, "hostId is required");

    if (!totalRounds) throw new ApiError(400, "totalRounds is required");

    // Important Check
    if (!rounds || !Array.isArray(rounds) || rounds.length === 0) {
        console.log("Received rounds:", req.body.rounds);
        throw new ApiError(400, "rounds array is required");
    }

    if (Number(totalRounds) !== rounds.length) {
        console.log("Mismatch - totalRounds:", totalRounds, " | rounds length:", rounds.length);
        throw new ApiError(400, `Total rounds (${totalRounds}) and rounds array length (${rounds.length}) must match`);
    }

    // ==================== Banner Upload ====================
    let banner = { url: "" };
    const bannerLocalPath = req.file?.path;

    if (bannerLocalPath) {
        banner = await uploadOnCloudinary(bannerLocalPath);
    }

      const processedRounds = rounds.map((round) => ({
    roundNumber: round.roundNumber,
    name: round.name,
    teamsPerMatch: Number(round.teamsPerMatch),
    qualifyingTeams: Number(round.qualifyingTeams),
    totalMatches: Math.ceil(Number(maxTeams) / Number(round.teamsPerMatch)), // Auto calculate
    status: "upcoming"
   }));


    // ==================== Create Tournament ====================
    const tournament = await Tournament.create({
        title: title.trim(),
        game: game.toUpperCase(),
        matchType,
        teamSize: Number(teamSize),
        maxTeams: Number(maxTeams),
        totalRounds: Number(totalRounds),
        rounds: processedRounds,                   // ← Parsed array
        prizePool: Number(prizePool),
        entryFee: Number(entryFee),
        startTime,
        endTime,
        hostId,
        banner: banner?.url || "",
        map: map || "",
        status: "UPCOMING"
    });

    const createdTournament = await Tournament.findById(tournament._id);

    return res.status(201).json(
        new ApiResponse(201, createdTournament, "Tournament created successfully with multi-round system")
    );
});

const getMyTournaments = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const hostId = req.user._id;

  const filter = {
    hostId: hostId
  };

  if (status) {
    filter.status = status;
  }

  const tournaments = await Tournament.find(filter)
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      tournaments,
      "Host tournaments fetched successfully"
    )
  );
});

const golive = asyncHandler(async (req, res) => {
  const { tournamentId } = req.body;

  if (!tournamentId) {
    throw new ApiError(400, "tournamentId is required");
  }

  // Find tournament and check ownership
  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    throw new ApiError(404, "Tournament not found");
  }

  // Security Check: Only host can make it live
  if (tournament.hostId.toString() !== req.user.id) {   // assuming req.user from auth middleware
    throw new ApiError(403, "You are not authorized to start this tournament");
  }

  // Check if already live
  if (tournament.status === "LIVE") {
    throw new ApiError(400, "Tournament is already LIVE");
  }

  // Update status
  tournament.status = "LIVE";
  tournament.updatedAt = new Date();   // optional

  await tournament.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      tournament,
      "Tournament is now LIVE successfully"
    )
  );
});

const endlive=asyncHandler(async(req,res)=>{

    const{tournamentId}=req.body;
    if(!tournamentId){
        throw new ApiError(400,"tournamentid is required");
    }
    console.log("tournament id is ",tournamentId)

    const tournament=await Tournament.findById(tournamentId);
    if(!tournament){
        throw new ApiError(404,"tournament not found");
    }
    tournament.status="COMPLETED";
    await tournament.save();
    return res.status(201).json(
        new ApiResponse(
            200,
            tournament,
            "tournament is completed"
        )
    )
        
});

const liveroom=asyncHandler(async(req,res)=>{
  const {id}=req.params;

  if(!id){
    throw new ApiError(400,"id is required");
  }
  const tournament = await Tournament.findById(id);

  if (!tournament) {
    throw new ApiError(404, "Tournament not found");
  }

  // ✅ response
  return res.status(200).json(
    new ApiResponse(
      200,
      tournament,
      "Tournament fetched successfully"
    )
  );

});

// const uploadleaderboard=asyncHandler(async(req,res)=>{

//     const {tournamentId,leaderboardData}=req.body;
//     if(!tournamentId){
//         throw new ApiError(400,"id is required");
//     }
//     const tournament= await Tournament.findById(tournamentId);

//      let leaderboardparsed= [];
//   if (req.body.leaderboardData) {
//     leaderboardparsed = JSON.parse(req.body.leaderboardData);
//   }

//     let leaderboard;
//     const uploadleaderboardLocalPath = req.files?.leaderboard?.[0]?.path;
//     console.log("avatarLocalpath is ",uploadleaderboard);

//        if (uploadleaderboard) {
//           leaderboard = await uploadOnCloudinary(uploadleaderboardLocalPath)
//           console.log("avatar is ",leaderboard.url);
//        }

//        tournament.leaderboard=leaderboard?.url || "";

//         const createdTeams = [];

//   for (let team of leaderboardparsed) {
//     const newTeam = await Team.create({
//       name: team.teamName,
//       rank: team.rank,
//       prize: team.prize,
//          tournamentId: tournamentId,
//          });

//         createdTeams.push(newTeam._id);
//          }

//          tournament.leaderboardtable=createdTeams;

      
//        await tournament.save();

//         return res.status(200).json(
//         new ApiResponse(
//             200,
//             {
//                 tournament  // ⚠️ development ke liye
//             },
//             "leaderboard upload succesfully"
//         )
//     );
   

// });

const uploadleaderboard = asyncHandler(async (req, res) => {
  const { tournamentId, leaderboardData } = req.body;

  if (!tournamentId) {
    throw new ApiError(400, "tournamentId is required");
  }

  const parsed = JSON.parse(leaderboardData);

  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    throw new ApiError(404, "Tournament not found");
  }

  let leaderboard;
    const leaderboardLocalPath = req.files?.leaderboard?.[0]?.path;
    console.log("leaderboardLocalpath is ",leaderboardLocalPath);

       if (leaderboardLocalPath) {
          leaderboard= await uploadOnCloudinary(leaderboardLocalPath)
          console.log("avatar is ",leaderboard.url);
       }
  const leaderboardtable = [];

  for (let team of parsed) {
    // 🔍 match team from tournament.players
    console.log("🔍 Searching for:", team.teamName);
    const matchedTeam = tournament.players.find(
      (t) =>
        t.teamName?.toLowerCase().trim() ===
        team.teamName.toLowerCase().trim()
    );

    if (!matchedTeam) {
        throw new ApiError(404,"team not found");
      console.log("❌ Team not found:", team.teamName);
      continue; // skip invalid team
    
    }

    // 🧠 teamId kya hoga?
    // 👉 agar team ka _id hai to use karo
    // 👉 warna first member ka playerId use kar sakte ho (temporary solution)

   const teamId = matchedTeam._id;
    console.log("team id is ",teamId);

    leaderboardtable.push({
      teamId,
      teamName:(team.teamName),
      rank: Number(team.rank),
      prize: Number(team.prize),
    });
  }

  // 💾 save leaderboard
  tournament.leaderboardtable = leaderboardtable;
  tournament.leaderboard = leaderboard?.url || "";

  await tournament.save();

  return res.status(200).json({
    success: true,
    message: "Leaderboard saved successfully",
    tournament,
  });
});

const result=asyncHandler(async(req,res)=>{

     const {id}=req.params;

  if(!id){
    throw new ApiError(400,"id is required");
  }
  const tournament = await Tournament.findById(id);

  if (!tournament) {
    throw new ApiError(404, "Tournament not found");
  }

  // ✅ response
  return res.status(200).json(
    new ApiResponse(
      200,
      tournament,
      "Tournament fetched successfully"
    )
  );
})




export {logouthost};
export {loginhost};
export {registerhost};
export {sendotpbyphone};
export {verifyotp};
export {resendotp};
export {resetpassword};
export {updateusername};
export {updateprofile};
export {createtournament};
export {getMyTournaments};
export {golive};
export {endlive};
export {liveroom};
export {uploadleaderboard};
export {result};