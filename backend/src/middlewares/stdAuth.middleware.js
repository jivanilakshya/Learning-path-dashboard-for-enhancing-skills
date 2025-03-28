import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { student } from "../models/student.model.js";
import jwt from "jsonwebtoken";

const authSTD = asyncHandler(async (req, res, next) => {
    try {
        // Get token from cookies
        const accToken = req.cookies?.Accesstoken;
        console.log("🔍 Access Token:", accToken || "❌ Missing");
        console.log("🔍 Request Headers:", req.headers);
        console.log("🔍 Request Cookies:", req.cookies);

        if (!accToken) {
            throw new ApiError(401, "Unauthorized request - No access token");
        }

        try {
            // Verify the token         
            const verifiedToken = jwt.verify(accToken, process.env.ACCESS_TOKEN_SECRET);
            console.log("✅ Token Verified Successfully");
            console.log("✅ Verified Token Payload:", verifiedToken);

            // Validate token payload structure
            if (!verifiedToken._id) {
                console.error("❌ Invalid token payload structure:", verifiedToken);
                throw new ApiError(401, "Invalid token payload");
            }

            // Find student
            const Student = await student.findById(verifiedToken._id).select("-Password -Refreshtoken");
            console.log("👤 Student Found:", Student ? "✅ Yes" : "❌ No");
            console.log("👤 Student ID:", Student?._id);

            if (!Student) {
                throw new ApiError(401, "Invalid access token - Student not found");
            }

            // Check if student is verified
            if (!Student.Isverified) {
                throw new ApiError(401, "Student email not verified");
            }

            // Attach student to request
            req.user = Student; // ✅ Fix: Use req.user instead of req.Student
            next();
        } catch (jwtError) {
            console.error("❌ JWT Verification Error:", jwtError.message);
            if (jwtError instanceof jwt.TokenExpiredError) {
                throw new ApiError(401, "Token has expired");
            } else if (jwtError instanceof jwt.JsonWebTokenError) {
                throw new ApiError(401, "Invalid token signature");
            } else if (jwtError instanceof jwt.NotBeforeError) {
                throw new ApiError(401, "Token not active");
            } else {
                throw new ApiError(401, "Invalid token");
            }
        }
    } catch (error) {
        console.error("❌ Authentication Error:", error.message);
        console.error("❌ Error Stack:", error.stack);
        throw error;
    }
});

export { authSTD };
