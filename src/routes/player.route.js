import { Router } from "express";
import {getTournament} from "../controllers/player.controllers.js";

const router=Router();




router.route("/tournaments").get(getTournament);





export default router