// import mongoose  from "mongoose";

// const tournamentSchema=new mongoose.Schema({
//      title: { type: String, required: true },
//      game: {type: String, required: true },

//   // 🔥 NEW
//      matchType: {
//       type: String,
//       enum: ["SOLO", "DUO", "SQUAD"],
//       required: true,
//       },

//        maxTeams: {
//       type: Number,
//       required: true,
//       },

//       teamSize:{
//       type: Number,
//       required: true,
//       },
//       currentTeams: {
//        type: Number,
//        default: 0,
//         },

//          players: [
//             {
//               teamName: String,
        
//               members: [
//                 {
//                   playerId: {
//                     type: mongoose.Schema.Types.ObjectId,
//                     ref: "Player",
//                   },
//                   ign: String,
//                 },
//               ],
        
//               payment: Boolean,
//               joinedAt: Date,
//             },
//           ],

//           prizePool:{ 
//             type:Number,
//             required:true
//           },

//          entryFee:{ 
//             type:Number,
//             required:true
//         },

//         startTime: { type: Date, required: true },

//         endTime: {
//             type: Date,
//           required: true,
//            },

//            hostId: {
//                type: mongoose.Schema.Types.ObjectId,
//                ref: "Host",
//              },
//            banner: {
//              type: String,
//              default: ""
//                },
//                leaderboard:{
//                type : String,
//                default: ""
//                },
//              leaderboardtable: [
//                       {
//                        teamId:{
//                        type:String,
//                         } ,
//                        teamName:{
//                          type: String,
//                           },
//                       rank: {
//                        type:Number
//                            },
//                         prize:
//                        {
//                          type:Number,
//                            },
//                         }
//                 ],
               

//              status: {
//                type: String,
//                enum: ["UPCOMING", "LIVE", "COMPLETED"],
//                default: "UPCOMING",
//              },
//             roomId:{
//                type: String,
//                default:""
//             },
//             roompassword:{
//               type: String,
//               default:""
//             },
//              streamLink: {
//            type: String,
//           default: ""
//                }

// },{
//     timestamps:true
// });

// export const Tournament=mongoose.model("Tournament",tournamentSchema);


import mongoose from "mongoose";

const tournamentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  game: { type: String, required: true },
  matchType: {
    type: String,
    enum: ["SOLO", "DUO", "SQUAD"],
    required: true,
  },

  maxTeams: { type: Number, required: true },
  teamSize: { type: Number, required: true },
  currentTeams: { type: Number, default: 0 },

  // 🔥 Multi-Round System
  totalRounds: { type: Number, required: true, default: 1 },
  
  rounds: [
    {
      roundNumber: { type: Number, required: true },
      name: { type: String, required: true }, // "Round 1", "Quarter Final", "Semi Final", "Grand Final"
      
      teamsPerMatch: { type: Number, required: true },     // 5 for BGMI
      totalMatches: { type: Number, required: true },      // e.g. 20
      qualifyingTeams: { type: Number, required: true },   // Top 40 qualify to next round
      
      status: {
        type: String,
        enum: ["upcoming", "ongoing", "completed"],
        default: "upcoming"
      },
      startedAt: Date,
      completedAt: Date,

      
      players: [
    {
      teamId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "TournamentTeam"   // Better to make separate model
      },
      teamName: String,
      members: [
        {
          playerId: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
          ign: String,
        }
      ],
      payment: { type: Boolean, default: false },
      joinedAt: { type: Date, default: Date.now },
      currentRound: { type: Number, default: 1 },
      status: {
        type: String,
        enum: ["active", "qualified", "eliminated"],
        default: "active"
      },
      totalPoints: { type: Number, default: 0 }
    }
  ],

    }
    
  ],

  prizePool: { type: Number, required: true },
  entryFee: { type: Number, required: true },

  startTime: { type: Date, required: true },
  endTime: { type: Date },

  hostId: { type: mongoose.Schema.Types.ObjectId, ref: "Host", required: true },
  banner: { type: String, default: "" },
  streamLink: { type: String, default: "" },

  status: {
    type: String,
    enum: ["UPCOMING", "LIVE", "COMPLETED"],
    default: "UPCOMING",
  },

}, {
  timestamps: true
});

export const Tournament = mongoose.model("Tournament", tournamentSchema);