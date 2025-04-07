const router= require("express").Router();
const { body } = require("express-validator")
const courseController=require("./../controller/course.controller");
const authMiddleware=require("./../middleware/auth.middleware");
const upload=require("./../middleware/multer.middleware");
const isAdminMiddleware=require("./../middleware/isAdmin.middleware")


router.post("/create-course",upload.single("thumbnailUrl"),[
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("duration").notEmpty().withMessage("Duration is required"),
    body("price").notEmpty().withMessage("Price is required"),
    body("level").notEmpty().withMessage("Level is required"),
],
authMiddleware.authUser,isAdminMiddleware.isAdmin ,courseController.createCourse)


router.post("/create-all-courses",upload.fields("thumbnailUrl"),[
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("duration").notEmpty().withMessage("Duration is required"),
    body("price").notEmpty().withMessage("Price is required"),
    body("level").notEmpty().withMessage("Level is required"),
],
authMiddleware.authUser,isAdminMiddleware.isAdmin,courseController.createAllCourses)


router.get("/get-all-courses",authMiddleware.authUser,courseController.getAllCourses)

router.get("/get-courses-based-on-query",authMiddleware.authUser,courseController.getAllCoursesBasedOnQuery)

router.get("/get-all-courses-title",authMiddleware.authUser,courseController.getAllCoursesTitle)

module.exports=router;