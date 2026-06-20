import { Router } from "express";
import {getTournament} from "../controllers/player.controllers.js";
import { sendotp } from "../controllers/player.controllers.js";
import {verify} from "../controllers/player.controllers.js";
import {resendotp} from "../controllers/player.controllers.js";
import { tournament } from "../controllers/player.controllers.js";
import {join} from "../controllers/player.controllers.js";
import { search } from "../controllers/player.controllers.js";
import { getMyTournaments } from "../controllers/player.controllers.js";
import { verifyPlayerJWT } from "../middleware/auth.middleware.js";
import { registerplayer} from "../controllers/player.controllers.js";
import { loginplayer } from "../controllers/player.controllers.js";
import { logoutplayer } from "../controllers/player.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { uploadLeaderboard } from "../controllers/player.controllers.js";


const router=Router();




router.route("/tournaments").get(getTournament);
router.route("/sendotp").post(sendotp);
router.route("/verifyotp").post(verify);
router.route("/resendotp").post(resendotp);
router.route("/tournament/:id").get(tournament);
router.route("/join").post(join);
router.route("/search").post(search);
router.route("/mytournaments").get(verifyPlayerJWT, getMyTournaments);


router.route("/registerplayer").post(
     upload.fields([
        {
            name: "playeravatar",
            maxCount: 1
        }, 
    ]),
    registerplayer);
   router.route("/loginplayer").post(loginplayer); 
   router.route("/logoutplayer").post(verifyJWT,logoutplayer);
   router.route("/match/:matchId/leaderboard").post(
    upload.fields([
        {
            name:"screenshot",
            maxCount:1
        },
    ]),
    verifyPlayerJWT,
 uploadLeaderboard
   );







export default router;