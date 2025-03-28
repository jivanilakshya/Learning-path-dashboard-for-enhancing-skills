import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// ✅ Load environment variables
dotenv.config();

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 120000, // ⏳ Set timeout to 2 minutes (120000 ms)
});

/**
 * 📌 Upload file to Cloudinary
 * @param {string} localFilePath - Path to the file on local system
 * @returns {Promise<object>} - Uploaded file info
 */
const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) {
    console.error("❌ No file path provided for upload.");
    return null;
  }

  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        localFilePath,
        {
          folder: "StudentDocs", // 🔹 Upload to a specific folder in Cloudinary
          resource_type: "auto", // 🔹 Support images, PDFs, videos
        },
        (error, response) => {
          if (error) {
            console.error("❌ Cloudinary Upload Failed:", error.message);
            reject(error);
          } else {
            console.log("✅ Cloudinary Upload Success:", response.url);
            resolve(response);
          }
        }
      );
    });

    return result;
  } catch (error) {
    console.error("❌ Cloudinary Upload Error:", error);
    throw new Error("Cloudinary Upload Failed");
  }
};

// ✅ Test Cloudinary connection
const testCloudinaryConnection = async () => {
  try {
    const response = await cloudinary.api.ping();
    console.log("✅ Cloudinary Connection Successful:", response);
  } catch (error) {
    console.error("❌ Cloudinary Connection Failed:", error);
  }
};

// 🔹 Export functions
export { uploadOnCloudinary, testCloudinaryConnection };
