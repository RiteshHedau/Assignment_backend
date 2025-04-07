const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const fs = require("fs");

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            throw new Error("Local file path is not provided");
        }
        
        // Check if the file exists
        if (!fs.existsSync(localFilePath)) {
            throw new Error("File does not exist at the given path");
        }

        // Upload the file on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        // File has been uploaded successfully
        console.log("File is uploaded on Cloudinary:", response.url);
        
        // Remove the locally saved temporary file
        fs.unlinkSync(localFilePath);
        
        return response;

    } catch (error) {
        console.error("Error uploading file to Cloudinary:", error.message);
        
        // Remove the locally saved temporary file if it exists
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return { error: error.message };
    }
};

module.exports =  uploadOnCloudinary ;