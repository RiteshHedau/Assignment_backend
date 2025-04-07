const router= require("express").Router();
const { body } = require("express-validator")
const userController=require("./../controller/user.controller");
const authMiddleware=require("./../middleware/auth.middleware");
const upload=require("./../middleware/multer.middleware");
const isAdminMiddleware = require("./../middleware/isAdmin.middleware")




router.post("/register",[
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Email is required"),
    body("password").isLength({min:6}).withMessage("Password must be at least 6 characters"),
],userController.registerUser)


router.post("/login",[
    body("email").isEmail().withMessage("Email is required"),
    body("password").notEmpty().withMessage("Password is required"),
],userController.loginUser)

router.get("/logout",authMiddleware.authUser,userController.logoutUser)

router.get("/refresh-token",userController.refreshAccessToken)

router.post("/update-user",upload.single("profilePic"),
    authMiddleware.authUser,isAdminMiddleware.isAdmin,
    userController.updateUser)


router.post("forget-paassword",authMiddleware.authUser,userController.forgetPassword)

router.get("/get-all-users",authMiddleware.authUser,userController.getAllUsers)

router.get("/get-logged-user",authMiddleware.authUser,userController.getUser)

module.exports=router;