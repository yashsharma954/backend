import {asyncHandler} from "../utilis/asyncHandler.js";
import {ApiError} from "../utilis/ApiError.js";
import {ApiResponse} from "../utilis/ApiResponse.js";
import { Tournament } from "../models/tournament.model.js";
import {uploadOnCloudinary}  from "../utilis/cloudinary.js";
import { Host } from "../models/host.model.js";

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


export {getTournament};
