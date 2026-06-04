import {asyncHandler} from "../utilis/asyncHandler.js";
import {ApiError} from "../utilis/ApiError.js";
import {ApiResponse} from "../utilis/ApiResponse.js";
import { Tournament } from "../models/tournament.model.js";
import {uploadOnCloudinary}  from "../utilis/cloudinary.js";
import { Host } from "../models/host.model.js";
import { Player } from "../models/player.model.js";
import { threadCpuUsage } from "process";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const player = await Player.findById(userId)
        const accessToken = Player.generateAccessToken()
        const refreshToken = Player.generateRefreshToken()

        host.refreshToken = refreshToken
        await host.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const getTournament=asyncHandler(async(req,res)=>{
    const { status, game } = req.query;

  console.log("STATUS =", status);
  console.log("GAME =", game);

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (game) {
    filter.game = game;
  }

  const tournaments = await Tournament
    .find(filter)
    .populate("hostId", "name avatar username")
    .sort({ startTime: 1 });

  if (!tournaments) {
    throw new ApiError(404, "No tournaments found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      tournaments,
      "Tournaments fetched successfully"
    )
  );
})

const sendotp = asyncHandler(async (req, res) => {

  const { phone, tournamentId } = req.body;

  const player = await Player.create({ phone });

  // 🔥 check already joined
  const alreadyJoined = player.tournamentsJoined.some(
    (t) => t.toString() === tournamentId
  );

  if (alreadyJoined) {
    throw new ApiError(400, "Already joined this tournament");
  }

  // ✅ allow join
  player.tournamentsJoined.push(tournamentId);
   const otp = Math.floor(100000 + Math.random() * 900000);

    // save otp in database
    player.otp = otp;
    player.otpExpiry = Date.now() + 5 * 60 * 1000;

    
  await player.save();

  return res.status(200).json(
    new ApiResponse(200, otp, "otp sent  successfully")
  );
});

const verify=asyncHandler(async(req,res)=>{

  const {phone,otp,tournamentId}=req.body;
  if(!phone){
    throw new ApiError(400,"phone number is required");
  }
  if(!otp){
    throw new ApiError(400,"otp is required");
  }
  if(otp.length!=6){
          throw new ApiError(409,"invalid otp");
      }
  const user=await Player.findOne({phone});
  if (!user) {
          throw new ApiError(404, "Host not found");
      }

      if(user.otp!=otp){
        throw new ApiError(400,"invalid otp");
      }
       if (user.otpExpiry < Date.now()) {
              throw new ApiError(400, "OTP expired");
          }
          const tournament=await Tournament.findById(tournamentId);

return res.status(200).json(
        new ApiResponse(200, user, "OTP verified successfully")
    );
});

const resendotp=asyncHandler(async(req,res)=>{
    const{phone}=req.body;
        if(!phone){
            new ApiError(400,"phone number is required");
        }
    
            const user = await Player.findOne({ phone });
    
        if (!user) {
            throw new ApiError(404, "Host not found");
        }
    
         const otp = Math.floor(100000 + Math.random() * 900000);
    
        // save otp in database
        user.otp = otp;
        user.otpExpiry = Date.now() + 5 * 60 * 1000;
        await user.save();
    
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
// payment screen per jana ka liya ha ye
const tournament=asyncHandler(async(req,res)=>{
  const { id } = req.params;

  // 🔥 validation
  if (!id) {
    throw new ApiError(400, "Tournament ID is required");
  }

  // 🔍 find tournament
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

const registerplayer=asyncHandler(async(req,res)=>{
  const {name,username,phone,password}=req.body;

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

      const existedUser = await Player.findOne({
              $or: [{ username }, { phone }]
          })
      
           if (existedUser) {
              throw new ApiError(409, "User with name or phone already exists")
          }

          let playeravatar;
    const avatarLocalPath = req.files?.playeravatar?.[0]?.path;
    console.log("avatarLocalpath is ",avatarLocalPath);

       if (avatarLocalPath) {
          playeravatar = await uploadOnCloudinary(avatarLocalPath)
          console.log("avatar is ",playeravatar.url);
       }
   

       const Player = await Player.create({
               name,
               username,
               avatar: avatar?.url || "",
               phone, 
               password,
               
           })
           const createdplayer = await Player.findById(player._id).select(
        "-password -refreshToken"
    )

    if (!createdplayer) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdplayer, "Host registered Successfully")
    )

})

const loginplayer=asyncHandler(async(req,res)=>{
    const {username,password}=req.body;
    if (!username ) {
  throw new ApiError(400, "Username required");
    }

    if(!password){
        throw new ApiError(400,"password required");
    }

     const player = await Player.findOne({username });
       
       if (!player) {
      throw new ApiError(404, "Host not found");
       }

        const isPasswordValid = await player.isPasswordCorrect(password);
        console.log("ispassword is ",isPasswordValid);

      if (!isPasswordValid) {
      throw new ApiError(401, "Invalid password");
          }
            const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(player._id);

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
                player, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    );



});

const logoutplayer=asyncHandler(async(req,res)=>{
   
    await Player.findByIdAndUpdate(
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



const join = asyncHandler(async (req, res) => {
    const { teamName, members, playerId, tournamentId } = req.body;

    if (!teamName) throw new ApiError(400, "teamName is required");
    if (!members || !Array.isArray(members) || members.length === 0) {
        throw new ApiError(400, "members array is required");
    }
    if (!playerId) throw new ApiError(400, "playerId is required");
    if (!tournamentId) throw new ApiError(400, "tournamentId is required");

    // Find Player
    const user = await Player.findById(playerId);
    if (!user) throw new ApiError(404, "Player not found");

    // Find Tournament
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) throw new ApiError(404, "Tournament not found");

    // Generate JWT Token
    let accessToken;

    // Agar pehle se token nahi hai tabhi naya banao
    if (!req.body.existingToken) {   // ya kisi aur condition se check karo
        accessToken = jwt.sign(
            { _id: user._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '7d' }
        );
    } else {
        accessToken = req.body.existingToken; // purana wapas bhej do
    }

    // Check if already joined
    const alreadyJoined = tournament.rounds[0]?.players?.some(
        p => p.members?.some(m => m.playerId.toString() === playerId.toString())
    );

    if (alreadyJoined) {
        throw new ApiError(400, "You have already joined this tournament");
    }

    // Add player to Round 1
    const playerData = {
        teamName,
        members: members.map((m) => ({
            playerId: user._id,
            ign: m.ign,
        })),
        payment: true,
        joinedAt: new Date(),
        currentRound: 1,
        status: "active",
        totalPoints: 0
    };

    if (!tournament.rounds || tournament.rounds.length === 0) {
        throw new ApiError(400, "No rounds found in tournament");
    }

    tournament.rounds[0].players.push(playerData);
    tournament.currentTeams += 1;

    await tournament.save();

    // Update player document
    user.teamname = teamName;
    user.teammates = members.map((m) => ({ ingameName: m.ign }));
    await user.save();

    // ✅ Correct Response
    return res.status(201).json(
        new ApiResponse(
            201,
            {
                user,
                accessToken          // ← Yeh frontend ko chahiye
            },
            "Successfully joined tournament in Round 1"
        )
    );
});

const search = asyncHandler(async (req, res) => {
  const { username, game, status } = req.body;

  if (!username) {
    throw new ApiError(400, "username is required");
  }

  const hosts = await Host.find({
    username: { $regex: username, $options: "i" },
  });

  if (hosts.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, [], "No host found")
    );
  }

  const hostIds = hosts.map(h => h._id);

  const tournaments = await Tournament.find({
    hostId: { $in: hostIds },
    game: game,
    status: status,
  }).populate("hostId");

  return res.status(200).json(
    new ApiResponse(200, tournaments, "Filtered tournaments")
  );
});

// ====================== GET MY TOURNAMENTS ======================
const getMyTournaments = asyncHandler(async (req, res) => {
    const playerId = req.user._id;   // JWT se aayega

    const tournaments = await Tournament.find({
        "rounds.players.members.playerId": playerId
    }).select("title game matchType status rounds").lean();

    const myTournaments = [];

    tournaments.forEach(tournament => {
        tournament.rounds.forEach(round => {
            const playerEntry = round.players.find(p => 
                p.members.some(m => m.playerId.toString() === playerId.toString())
            );

            if (playerEntry) {
                myTournaments.push({
                    _id: tournament._id,
                    title: tournament.title,
                    game: tournament.game,
                    matchType: tournament.matchType,
                    status: tournament.status,
                    currentRound: round.roundNumber,
                    teamName: playerEntry.teamName,
                    // Room details agar live match hai
                    roomId: round.matches?.[0]?.roomId || null,
                    roomPassword: round.matches?.[0]?.roomPassword || null,
                    joinedAt: playerEntry.joinedAt
                });
            }
        });
    });

    return res.status(200).json(
        new ApiResponse(200, myTournaments, "My tournaments fetched successfully")
    );
});

export {getTournament};
export {sendotp};
export {verify};
export {resendotp};
export {tournament};
export {join};
export {search};
export {getMyTournaments};
export {registerplayer};
export {loginplayer};
export {logoutplayer};


