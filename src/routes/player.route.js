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

const router=Router();




router.route("/tournaments").get(getTournament);
router.route("/sendotp").post(sendotp);
router.route("/verifyotp").post(verify);
router.route("/resendotp").post(resendotp);
router.route("/tournament/:id").get(tournament);
router.route("/join").post(join);
router.route("/search").post(search);
router.route("/mytournaments").get(verifyPlayerJWT, getMyTournaments);





export default router;