const { DataTypes } = require('sequelize');
const { sequelize } = require('./../dbConfig/dbConnection');


const Course = sequelize.define(
  "Course",
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    level: {
      type: DataTypes.ENUM("Beginner", "Intermediate", "Advanced"),
      defaultValue: "Beginner",
    },
    language: {
      type: DataTypes.STRING,
      defaultValue: "English",
    },
    duration: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      defaultValue: "Programming",
    },
    type: {
      type: DataTypes.ENUM(
        "Python",
        "Java",
        "JavaScript",
        "C++",
        "PHP",
        "Ruby",
        "Go"
      ),
      allowNull: false,
    },
    thumbnailUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    tableName: "courses",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Course;