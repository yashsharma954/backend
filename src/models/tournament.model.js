import mongoose  from "mongoose";

const tournamentSchema=new mongoose.Schema({
     title: { type: String, required: true },
     game: {type: String, required: true },

  // 🔥 NEW
     matchType: {
      type: String,
      enum: ["SOLO", "DUO", "SQUAD"],
      required: true,
      },

       maxTeams: {
      type: Number,
      required: true,
      },

      teamSize:{
      type: Number,
      required: true,
      },
      currentTeams: {
       type: Number,
       default: 0,
        },

         players: [
            {
              teamName: String,
        
              members: [
                {
                  playerId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Player",
                  },
                  ign: String,
                },
              ],
        
              payment: Boolean,
              joinedAt: Date,
            },
          ],

          prizePool:{ 
            type:Number,
            required:true
          },

         entryFee:{ 
            type:Number,
            required:true
        },

        startTime: { type: Date, required: true },

     endTime: {
            type: Date,
        required: true,
           },

           hostId: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "Host",
             },
           banner: {
             type: String,
             default: ""
               },
             status: {
               type: String,
               enum: ["UPCOMING", "LIVE", "COMPLETED"],
               default: "UPCOMING",
             },

             streamLink: {
           type: String,
          default: ""
               }






},{
    timestamps:true
});

export const Tournament=mongoose.model("Tournament",tournamentSchema);