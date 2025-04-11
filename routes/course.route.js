const router = require("express").Router();
const { body } = require("express-validator");
const courseController = require("./../controller/course.controller");
const authMiddleware = require("./../middleware/auth.middleware");
const upload = require("./../middleware/multer.middleware");
const isAdminMiddleware = require("./../middleware/isAdmin.middleware");

router.post(
  "/create-course",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("duration").notEmpty().withMessage("Duration is required"),
    body("price").notEmpty().withMessage("Price is required"),
    body("level").notEmpty().withMessage("Level is required"),
  ],
  authMiddleware.authUser,
  isAdminMiddleware.isAdmin,
  upload.single("thumbnailUrl"),
  courseController.createCourse
);

router.post(
  "/create-all-courses",
  [
    body("courses").isArray().withMessage("Courses must be an array"),
    body("courses.*.title").notEmpty().withMessage("Title is required"),
    body("courses.*.description")
    .notEmpty()
    .withMessage("Description is required"),
    body("courses.*.duration").notEmpty().withMessage("Duration is required"),
    body("courses.*.price").notEmpty().withMessage("Price is required"),
    body("courses.*.level").notEmpty().withMessage("Level is required"),
  ],
  authMiddleware.authUser,
  isAdminMiddleware.isAdmin,
  upload.array("thumbnailUrl"),
  courseController.createAllCourses
);

router.get(
  "/get-all-courses",
  authMiddleware.authUser,
  courseController.getAllCourses
);

router.get(
  "/get-courses-based-on-query",
  authMiddleware.authUser,
  courseController.getAllCoursesBasedOnQuery
);

router.get(
  "/get-all-courses-title",
  authMiddleware.authUser,
  courseController.getAllCoursesTitle
);

router.delete(
  "/delete-course/:id",
  authMiddleware.authUser,
  isAdminMiddleware.isAdmin,
  courseController.deleteCourse
);

router.put(
  "/update-course/:id",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("duration").notEmpty().withMessage("Duration is required"),
    body("price").notEmpty().withMessage("Price is required"),
    body("level").notEmpty().withMessage("Level is required"),
  ],
  authMiddleware.authUser,
  isAdminMiddleware.isAdmin,
  upload.single("thumbnailUrl"),
  courseController.updateCourse
);

router.post(
  "/create-courses-from-csv",
  authMiddleware.authUser,
  isAdminMiddleware.isAdmin,
  upload.single("file"), 
  courseController.createCoursesThroughCsvFile
);

router.get(
  "/get-all-courses-edit-delete",
  authMiddleware.authUser,
  isAdminMiddleware.isAdmin,
  courseController.getAllCoursesForEditAndDelete
);

router.get('/get-course/:id', authMiddleware.authUser, courseController.getCourseById);

module.exports = router;
