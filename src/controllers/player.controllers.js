import {asyncHandler} from "../utilis/asyncHandler.js";
import {ApiError} from "../utilis/ApiError.js";
import {ApiResponse} from "../utilis/ApiResponse.js";
import { Tournament } from "../models/tournament.model.js";
import {uploadOnCloudinary}  from "../utilis/cloudinary.js";
import { Host } from "../models/host.model.js";
import { Player } from "../models/player.model.js";
import { threadCpuUsage } from "process";
import jwt from "jsonwebtoken";

// const generateAccessAndRefereshTokens = async(userId) =>{
//     try {
//         const player = await Player.findById(userId)
//         const accessToken = player.generateAccessToken()
//         const refreshToken = player.generateRefreshToken()

//         player.refreshToken = refreshToken
//         await player.save({ validateBeforeSave: false })

//         return {accessToken, refreshToken}


//     } catch (error) {
//         throw new ApiError(500, "Something went wrong while generating referesh and access token")
//     }
// }

// Generate Access & Refresh Tokens
const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const player = await Player.findById(userId);

        if (!player) {
            throw new ApiError(404, "Player not found");
        }

        const accessToken = player.generateAccessToken();
        const refreshToken = player.generateRefreshToken();

        // Save refresh token in database
        player.refreshToken = refreshToken;
        await player.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        console.error("Token Generation Error:", error); // ← Yeh line add kiye debugging ke liye
        throw new ApiError(500, "Something went wrong while generating access and refresh token");
    }
};

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

  const player = await Player.findOne({ phone });

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
   

       const player = await Player.create({
               name,
               username,
               playeravatar: playeravatar?.url || "",
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


const loginplayer = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is required");
    }
    if (!password?.trim()) {
        throw new ApiError(400, "Password is required");
    }

    // Find player
    const player = await Player.findOne({ username: username.toLowerCase() });

    if (!player) {
        throw new ApiError(404, "Player not found");
    }

    // Check password
    const isPasswordValid = await player.isPasswordCorrect(password);
    console.log("Is Password Valid:", isPasswordValid);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    // Generate Tokens
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(player._id);

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Development mein false rakho
        sameSite: 'strict'
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    player: {
                        _id: player._id,
                        name: player.name,
                        username: player.username,
                        playeravatar: player.playeravatar,
                    },
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
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

    // Check if already joined
    const alreadyJoined = tournament.rounds?.[0]?.players?.some(
        p => p.members?.some(m => m.playerId.toString() === playerId.toString())
    );

    if (alreadyJoined) {
        throw new ApiError(400, "You have already joined this tournament");
    }

    // ==================== ADD TO PLAYER'S tournamentsJoined ====================
    if (!user.tournamentsJoined) {
        user.tournamentsJoined = [];
    }

    // Avoid duplicate entries
    const alreadyInPlayerArray = user.tournamentsJoined.some(
        id => id.toString() === tournamentId.toString()
    );

    if (!alreadyInPlayerArray) {
        user.tournamentsJoined.push(tournamentId);
    }
    // =====================================================================

    // Add player to Round 1 of Tournament
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

    // Save both documents
    await Promise.all([
        tournament.save(),
        user.save()
    ]);

    // ✅ Final Response
    return res.status(201).json(
        new ApiResponse(
            201,
            { 
                user,
                tournamentId: tournament._id 
            },
            "Successfully joined tournament"
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
const getMyTournaments = asyncHandler(async (req, res) => {
    const playerId = req.user._id;
    console.log("🔍 Player ID:", playerId);

    if (!playerId) {
        throw new ApiError(401, "Unauthorized");
    }

    const player = await Player.findById(playerId)
        .populate({
            path: "tournamentsJoined",
            select: "title game matchType status totalSlots entryFee prizePool rounds createdAt",
            populate: [
                {
                    path: "rounds",
                    select: "roundNumber name teamsPerMatch status players",
                    populate: [
                        {
                            path: "matches",
                            select: "matchId matchNumber status players teams roomId password approved leaderboard createdAt"
                        }
                    ]
                }
            ]
        })
        .lean();

    if (!player) {
        throw new ApiError(404, "Player not found");
    }

    const tournaments = player.tournamentsJoined || [];
    const myJoinedMatches = [];

    tournaments.forEach(tournament => {
        let hasAnyMatch = false;

        tournament.rounds?.forEach(round => {
            // Check if player is in this round
            const playerTeam = round.players?.find(team => 
                team.members?.some((member) => 
                    member.playerId?.toString() === playerId.toString()
                )
            );

            if (!playerTeam) return;

            // If matches exist, check which match the player is in
            if (round.matches && round.matches.length > 0) {
                round.matches.forEach(match => {
                    const isPlayerTeamInMatch = match.players?.some((teamId) => 
                        teamId?.toString() === playerTeam._id?.toString()
                    );

                    if (isPlayerTeamInMatch) {
                        hasAnyMatch = true;
                        myJoinedMatches.push({
                            _id: match._id || tournament._id,
                            tournamentId: tournament._id,
                            tournamentTitle: tournament.title,
                            game: tournament.game,
                            matchType: tournament.matchType,
                            roundNumber: round.roundNumber,
                            roundName: round.name,
                            matchNumber: match.matchNumber,
                            matchId: match.matchId,
                            status: match.status || round.status || tournament.status,
                            teamName: playerTeam.teamName || "My Team",
                            roomId: match.roomId,
                            roomPassword: match.password,
                            approved: match.approved,
                            joinedAt: tournament.createdAt,
                        });
                    }
                });
            } 
            // Agar match abhi generate nahi hua to bhi tournament dikhao
            else {
                hasAnyMatch = true;
                myJoinedMatches.push({
                    _id: tournament._id,
                    tournamentId: tournament._id,
                    tournamentTitle: tournament.title,
                    game: tournament.game,
                    matchType: tournament.matchType,
                    roundNumber: round.roundNumber,
                    roundName: round.name,
                    status: round.status || tournament.status,
                    teamName: playerTeam.teamName || "My Team",
                    joinedAt: tournament.createdAt,
                    message: "Match not assigned yet"
                });
            }
        });

        // Agar round mein player hai lekin koi match nahi mila to overall tournament dikhaye
        if (!hasAnyMatch && tournament.rounds?.length > 0) {
            const firstRound = tournament.rounds[0];
            const playerTeam = firstRound.players?.find(team => 
                team.members?.some((m) => m.playerId?.toString() === playerId.toString())
            );

            if (playerTeam) {
                myJoinedMatches.push({
                    _id: tournament._id,
                    tournamentId: tournament._id,
                    tournamentTitle: tournament.title,
                    game: tournament.game,
                    matchType: tournament.matchType,
                    roundNumber: firstRound.roundNumber,
                    status: tournament.status,
                    teamName: playerTeam.teamName,
                    joinedAt: tournament.createdAt,
                    message: "Waiting for match assignment"
                });
            }
        }
    });

    // Sort by latest
    myJoinedMatches.sort((a, b) => 
        new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
    );

    console.log(`✅ Total joined items found: ${myJoinedMatches.length}`);

    return res.status(200).json(
        new ApiResponse(200, myJoinedMatches, "My tournaments fetched successfully")
    );
});


const uploadLeaderboard = asyncHandler(async (req, res) => {
    
    const { matchId } = req.params;
    const { totalKills, points, rank } = req.body;
    const playerId = req.user?._id || req.user?.id;

    console.log("🔹 Player ID:", playerId);
    console.log("🔹 Match ID:", matchId);

    // Basic Validation
    if (!playerId) throw new ApiError(401, "Authentication failed");
    if (!matchId) throw new ApiError(400, "Match ID is required");
    if (!totalKills || !points) throw new ApiError(400, "Total Kills and Points are required");
    //  let screenshot = { url: "" };
    //     const screenshotLocalPath = req.file?.path;
    //      console.log("screenshotLocalpath is ",screenshotLocalPath);
    
    //     if (screenshotLocalPath) {
    //         screenshot = await uploadOnCloudinary(screenshotLocalPath);
    //         console.log("avatar is ",screenshot.url);
    //     }

    let screenshot;
    const screenshotLocalPath = req.files?.screenshot?.[0]?.path;;

    console.log("📸 Screenshot Local Path:", screenshotLocalPath);

    if(screenshotLocalPath){
        screenshot=await uploadOnCloudinary(screenshotLocalPath);
        console.log("screenshot is ",screenshot.url);
    }
    // Find Tournament
    const tournament = await Tournament.findOne({
        "rounds.matches._id": matchId
    });

    if (!tournament) {
        throw new ApiError(404, "Match not found");
    }

    // Find Specific Match
    let targetMatch = null;
    for (let round of tournament.rounds) {
        targetMatch = round.matches.find(m => 
            m._id && m._id.toString() === matchId.toString()
        );
        if (targetMatch) break;
    }

    if (!targetMatch) {
        throw new ApiError(404, "Match not found");
    }

    // ✅ Direct Leaderboard Upload (No Validation)
    if (!targetMatch.leaderboard) {
        targetMatch.leaderboard = [];
    }

    const leaderboardEntry = {
        playerId: playerId,
        totalKills: parseInt(totalKills),
        points: parseInt(points),
        rank: rank ? parseInt(rank) : null,
        screenshot: screenshot?.url || "",
        submittedAt: new Date()
    };

    // Agar pehle se entry hai to update, nahi to naya push
    const existingIndex = targetMatch.leaderboard.findIndex(
        entry => entry.playerId?.toString() === playerId.toString()
    );

    if (existingIndex !== -1) {
        targetMatch.leaderboard[existingIndex] = leaderboardEntry;
    } else {
        targetMatch.leaderboard.push(leaderboardEntry);
    }

    await tournament.save();

    console.log("✅ Leaderboard Updated Successfully for Match:", matchId);

    return res.status(200).json(
        new ApiResponse(200, null, "Leaderboard uploaded successfully")
    );
});
  // ya jo bhi export style hai
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
export {uploadLeaderboard};


