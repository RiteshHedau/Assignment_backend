const Course = require("./../models/course.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("./../utils/ApiResponse");
const uploadOnCloudinary = require("../utils/cloudinary.js");
const { Op } = require("sequelize");
const csv = require("csv-parser");
const fs = require("fs");

const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      level,
      language,
      duration,
      price,
      author,
      category,
      type,
    } = req.body;
    const thumbnailLocalPath = req.file?.path;

    let thumbnailUrl = "";
    if (thumbnailLocalPath) {
      const uploadResponse = await uploadOnCloudinary(thumbnailLocalPath);
      thumbnailUrl = uploadResponse.url;
    }

    const newCourse = await Course.create({
      title,
      description,
      level,
      language,
      duration,
      price,
      author,
      category,
      type,
      thumbnailUrl,
    });

    // Emit socket event with more detailed information
    const io = req.app.get("io");
    io.emit("newCourse", {
      message: `New course "${newCourse.title}" has been added!`,
      course: {
        id: newCourse.id,
        title: newCourse.title,
        description: newCourse.description,
        level: newCourse.level,
        thumbnailUrl: newCourse.thumbnailUrl,
      },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, { newCourse }, "Course created successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

const getAllCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const offset = (page - 1) * limit; // cleaner calculation

    const total = await Course.count();

    // Avoid unnecessary DB hit if page is out of range
    if (offset >= total && total !== 0) {
      return res
        .status(400)
        .json(new ApiResponse(400, [], "Requested page exceeds total pages"));
    }

    const courses = await Course.findAll({
      limit,
      offset,
      order: [["created_at", "DESC"]], // optional: sort by newest first
    });

    const baseUrl = `${req.protocol}://${req.get("host")}${req.path}`;
    const totalPages = Math.ceil(total / limit);

    const pagination = {
      total,
      page,
      limit,
      totalPages,
      nextPage:
        page < totalPages ? `${baseUrl}?page=${page + 1}&limit=${limit}` : null,
      prevPage: page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}` : null,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { courses, pagination },
          "Courses fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

const getAllCoursesBasedOnQuery = async (req, res) => {
  try {
    const { title, level } = req.query;
    console.log("title", title);
    const whereClause = {};

    if (title) {
      whereClause.title = { [Op.like]: `%${title}%` };
    }

    if (level) {
      whereClause.level = level;
    }

    const courses = await Course.findAll({ where: whereClause });

    return res
      .status(200)
      .json(new ApiResponse(200, courses, "Courses fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

const createAllCourses = async (req, res) => {
  try {
    const coursesData = req.body;
    const courses = await Course.bulkCreate(coursesData, {
      ignoreDuplicates: true,
    });
    return res
      .status(201)
      .json(new ApiResponse(201, courses, "Courses created successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

const getAllCoursesTitle = async (req, res) => {
  try {
    const courses = await Course.findAll({
      attributes: ["title"],
      raw: true,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, courses, "Courses fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

const deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findByPk(courseId);

    if (!course) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Course not found"));
    }

    await course.destroy();

    return res
      .status(200)
      .json(new ApiResponse(200, course, "Course deleted successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

const updateCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const {
      title,
      description,
      level,
      language,
      duration,
      price,
      author,
      category,
    } = req.body;
    const thumbnailLocalPath = req.file?.path;

    const course = await Course.findByPk(courseId);

    if (!course) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Course not found"));
    }

    let thumbnailUrl = course.thumbnailUrl;
    if (thumbnailLocalPath) {
      const uploadResponse = await uploadOnCloudinary(thumbnailLocalPath);
      thumbnailUrl = uploadResponse.url;
    }

    await course.update({
      title,
      description,
      level,
      language,
      duration,
      price,
      author,
      category,
      thumbnailUrl,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, course, "Course updated successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

const createCoursesThroughCsvFile = async (req, res) => {
  try {
    const csvFilePath = req.file?.path;

    if (!csvFilePath) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "CSV file is required"));
    }

    const coursesData = [];

    // Read and parse the CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on("data", (row) => {
          coursesData.push(row);
        })
        .on("end", resolve)
        .on("error", reject);
    });

    try {
      // Handle thumbnail upload for each course
      await Promise.all(
        coursesData.map(async (course) => {
          if (course.thumbnailLocalPath) {
            const uploadResponse = await uploadOnCloudinary(
              course.thumbnailLocalPath
            );
            course.thumbnailUrl = uploadResponse;
            delete course.thumbnailLocalPath; // Remove local path after upload
          }
        })
      );

      const courses = await Course.bulkCreate(coursesData, {
        ignoreDuplicates: true,
      });

      return res
        .status(201)
        .json(new ApiResponse(201, courses, "Courses created successfully"));
    } catch (error) {
      console.error("Error during bulk creation:", error.message);
      return res
        .status(500)
        .json(new ApiResponse(500, null, "Failed to create courses"));
    }
  } catch (error) {
    console.error("Error processing CSV file:", error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Failed to process CSV file"));
  }
};

const getAllCoursesForEditAndDelete = async (req, res) => {
  try {
    const courses = await Course.findAll();

    return res
      .status(200)
      .json(new ApiResponse(200, courses, "Courses fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

const getCourseById=async(req,res)=>{
  try {
    const courseId = req.params.id;
    const course = await Course.findByPk(courseId);

    if (!course) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Course not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, course, "Course fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}

module.exports = {
  createCourse,
  getAllCourses,
  createAllCourses,
  getAllCoursesBasedOnQuery,
  getAllCoursesTitle,
  deleteCourse,
  updateCourse,
  createCoursesThroughCsvFile,
  getAllCoursesForEditAndDelete,
  getCourseById
};
