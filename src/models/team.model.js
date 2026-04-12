import mongoose from "mongoose";
const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
  },

  members: [
    {
      playerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
      },
       ign: String,
    },
  ],
}, { timestamps: true });

export const Team=mongoose.model("Team", teamSchema);