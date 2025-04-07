const Course = require('./../models/course.model');
const ApiError = require("../utils/ApiError");
const ApiResponse = require("./../utils/ApiResponse");
const uploadOnCloudinary = require( "../utils/cloudinary.js");
const { Op } = require("sequelize");


const createCourse = async (req, res) => {
  try {
    const { title, description, level, language, duration, price, author, category, type } = req.body;
    const thumbnailLocalPath = req.file?.path;

    let thumbnailUrl = '';
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

    return res.status(201).json(new ApiResponse(201,{newCourse},
      'Course created successfully',
      
    ));
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
        return res.status(400).json(
          new ApiResponse(400, [], "Requested page exceeds total pages")
        );
      }
  
      const courses = await Course.findAll({
        limit,
        offset,
        order: [['created_at', 'DESC']] // optional: sort by newest first
      });
  
      const baseUrl = `${req.protocol}://${req.get('host')}${req.path}`;
      const totalPages = Math.ceil(total / limit);
  
      const pagination = {
        total,
        page,
        limit,
        totalPages,
        nextPage: page < totalPages ? `${baseUrl}?page=${page + 1}&limit=${limit}` : null,
        prevPage: page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}` : null,
      };
  
      return res.status(200).json(
        new ApiResponse(200, { courses, pagination }, "Courses fetched successfully")
      );
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  };
  
const getAllCoursesBasedOnQuery = async (req, res) => {
  try {
    const { title, level } = req.query;
    console.log("title",title);
    const whereClause = {};

    if (title) {
      whereClause.title = { [Op.like]: `%${title}%` };
    }

    if (level) {
      whereClause.level = level;
    }

    const courses = await Course.findAll({ where: whereClause });

    return res.status(200).json(new ApiResponse(200, courses, "Courses fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}

const createAllCourses = async (req, res) => {
  try {
    const courses = await Course.bulkCreate(req.body);

    return res.status(201).json(new ApiResponse(201, courses, "Courses created successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

const getAllCoursesTitle = async (req, res) => {
  try {
    const courses = await Course.findAll({
      attributes: ['title'],
      raw: true,
    });

    return res.status(200).json(new ApiResponse(200, courses, "Courses fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}

module.exports = {
  createCourse,
  getAllCourses,
  createAllCourses,
  getAllCoursesBasedOnQuery,
  getAllCoursesTitle
};