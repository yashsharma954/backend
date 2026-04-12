import {asyncHandler} from "../utilis/asyncHandler.js";
import {ApiError} from "../utilis/ApiError.js";
import {ApiResponse} from "../utilis/ApiResponse.js";
import { Tournament } from "../models/tournament.model.js";
import {uploadOnCloudinary}  from "../utilis/cloudinary.js";
import { Host } from "../models/host.model.js";
import { Player } from "../models/player.model.js";
import { threadCpuUsage } from "process";

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

const join=asyncHandler(async(req,res)=>{

  
  const {teamName,members,playerId,tournamentId}=req.body;
  if(!teamName){
    throw new ApiError(400,"teamname required");
  }

  if(!members){
    throw new ApiError(400,"members is required");
  }

  const user=await Player.findById(playerId);
  if(!playerId){
    throw new ApiError(404,"user not found");
  }

  user.teamname=teamName;
  user.teammates = members.map((m) => ({
    ingameName: m.ign,
  }));
  await user.save();
  const tournament=await Tournament.findById(tournamentId);
  tournament.currentTeams+=1;
  tournament.players.push({
    teamName,
    members: members.map((m) => ({
      playerId:user._id,
      ign: m.ign,
    })),
    payment: true,
    joinedAt: new Date(),
  });
  await tournament.save();
  return res.status(201).json(
    new ApiResponse(200,user,"tournament join succesfully")
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

export {getTournament};
export {sendotp};
export {verify};
export {resendotp};
export {tournament};
export {join};
export {search};
