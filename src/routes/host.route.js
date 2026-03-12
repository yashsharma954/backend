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




export default router;
