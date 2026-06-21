import { Router} from "express";
import { registerhost } from "../controllers/host.controllers.js";
import { upload } from "../middleware/multer.middleware.js";
import {loginhost} from "../controllers/host.controllers.js";
import {logouthost} from "../controllers/host.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {sendotpbyphone} from "../controllers/host.controllers.js";
import { verifyotp } from "../controllers/host.controllers.js";
import {resendotp} from "../controllers/host.controllers.js"
import {resetpassword} from "../controllers/host.controllers.js";
import {updateusername} from "../controllers/host.controllers.js";
import {updateprofile} from "../controllers/host.controllers.js";
import {createtournament} from "../controllers/host.controllers.js";
import {getMyTournaments} from "../controllers/host.controllers.js";
import {golive} from "../controllers/host.controllers.js";
import {endlive} from "../controllers/host.controllers.js";
import { liveroom } from "../controllers/host.controllers.js";
import {uploadleaderboard} from "../controllers/host.controllers.js";
import {result} from "../controllers/host.controllers.js";
import { getRoundDetails } from "../controllers/host.controllers.js";
import { getMatchDetails } from "../controllers/host.controllers.js";
import { startMatch } from "../controllers/host.controllers.js";
import { updateMatchRoomDetails } from "../controllers/host.controllers.js";
import { getMatchLeaderboard } from "../controllers/host.controllers.js";
import { advanceTeams } from "../controllers/host.controllers.js";
import { getQualifiedTeams } from "../controllers/host.controllers.js";
import { endRound } from "../controllers/host.controllers.js";


const router=Router();
router.route("/register").post(
     upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
    ]),
    registerhost);

router.route("/login").post(loginhost);
router.route("/logout").post(verifyJWT,logouthost);
router.route("/sendotp").post(sendotpbyphone);
router.route("/verifyotp").post(verifyotp);
router.route("/resendotp").post(resendotp);
router.route("/resetpassword").post(resetpassword);
router.route("/updateusername").put(verifyJWT,updateusername);
router.route("/updateprofile").put(upload.single("avatar"),verifyJWT,updateprofile);
router.route("/tournaments").post(upload.single("banner"),createtournament);
router.route("/tournaments/my").get(verifyJWT, getMyTournaments);
router.route("/tournaments/golive").post(golive);
router.route("/tournaments/end").post(endlive);
router.route("/tournaments/liveroom/:id").get(liveroom);
router.route("/uploadleaderboard").post( upload.fields([
        {
            name: "leaderboard",
            maxCount: 1
        }, 
    ]),
    uploadleaderboard);

router.route("/result/:id").get(result);
// Existing routes ke saath add kar do
router.route("/tournaments/:tournamentId/round/:roundNumber").get(getRoundDetails);
// Match Routes
router.route("/tournaments/:tournamentId/round/:roundNumber/match/:matchId")
    .get( getMatchDetails);

    // Match Room ID/Password Route
router.route("/tournaments/:tournamentId/round/:roundNumber/match/:matchId/start")
     .post( startMatch); 
         // ya bina verifyJWT ke test ke liye

router.route(
  '/tournaments/:tournamentId/round/:roundNumber/match/:matchId/room')
            .patch(updateMatchRoomDetails);
router.route('/match/:matchId/leaderboard').get(getMatchLeaderboard);
router.route('/match/:matchId/advance').post(advanceTeams);
router.route('/match/:matchId/leaderboard').get(getQualifiedTeams);
router.route('/tournaments/:tournamentId/round/:roundNumber/end');






export default router;
