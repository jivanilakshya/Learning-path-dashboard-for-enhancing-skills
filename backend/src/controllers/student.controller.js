    import {asyncHandler} from "../utils/asyncHandler.js";
    import {ApiError} from "../utils/ApiError.js";
    import {student, studentdocs} from "../models/student.model.js";
    import {ApiResponse} from "../utils/ApiResponse.js";
    import nodemailer from "nodemailer";
    import { uploadOnCloudinary } from "../utils/cloudinary.js";
    import { Teacher } from "../models/teacher.model.js";
    import { Sendmail } from "../utils/Nodemailer.js";
import { log } from "console";



    const verifyEmail = async (Email, Firstname, createdStudent_id) => {
        try {
            const emailsender = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                secure: process.env.EMAIL_PORT === '465',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: Email,
                subject: "Welcome to Shiksharthee - Verify Your Email",
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            margin: 0;
                            padding: 0;
                            background-color: #f4f4f4;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #ffffff;
                            border-radius: 8px;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        }
                        .header {
                            text-align: center;
                            padding: 20px 0;
                            background-color: #3498db;
                            color: white;
                            border-radius: 8px 8px 0 0;
                        }
                        .content {
                            padding: 30px 20px;
                        }
                        .welcome-text {
                            font-size: 24px;
                            color: #2c3e50;
                            margin-bottom: 20px;
                            text-align: center;
                        }
                        .message {
                            font-size: 16px;
                            color: #34495e;
                            margin-bottom: 30px;
                            text-align: center;
                        }
                        .button-container {
                            text-align: center;
                            margin: 30px 0;
                        }
                        .verify-button {
                            display: inline-block;
                            padding: 12px 30px;
                            background-color: #3498db;
                            color: white;
                            text-decoration: none;
                            border-radius: 5px;
                            font-weight: bold;
                            transition: background-color 0.3s ease;
                        }
                        .verify-button:hover {
                            background-color: #2980b9;
                        }
                        .footer {
                            text-align: center;
                            padding: 20px;
                            color: #7f8c8d;
                            font-size: 14px;
                            border-top: 1px solid #eee;
                        }
                        .logo {
                            width: 120px;
                            height: auto;
                            margin-bottom: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to Shiksharthee!</h1>
                        </div>
                        <div class="content">
                            <div class="welcome-text">Hi ${Firstname},</div>
                            <div class="message">
                                Thank you for joining Shiksharthee! To get started with your learning journey, please verify your email address by clicking the button below.
                            </div>
                            <div class="button-container">
                                <a href="http://localhost:5173/api/student/verify?id=${createdStudent_id}" class="verify-button">
                                    Verify Email Address
                                </a>
                            </div>
                            <div class="message">
                                If the button doesn't work, you can copy and paste this link into your browser:<br>
                                <a href="http://localhost:5173/api/student/verify?id=${createdStudent_id}" style="color: #3498db; word-break: break-all;">
                                    http://localhost:5173/api/student/verify?id=${createdStudent_id}
                                </a>
                            </div>
                        </div>
                        <div class="footer">
                            <p>This is an automated message, please do not reply to this email.</p>
                            <p>© 2024 Shiksharthee. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>`
            };

            emailsender.sendMail(mailOptions, function(error) {
                if (error) {
                    console.error("Email sending error:", error);
                    throw new ApiError(400, "Sending email verification failed");
                } else {
                    console.log("Verification mail sent successfully");
                }
            });
        } catch (error) {
            console.error("Email verification error:", error);
            throw new ApiError(400, "Failed to send email verification");
        }
    };

    const generateAccessAndRefreshTokens = async (stdID) => { 
        try {
            console.log("🔍 Received stdID:", stdID);

            if (!stdID) {
                throw new ApiError(400, "Invalid Student ID");
            }

            const std = await student.findById(stdID);
            console.log("📌 Found student:", std);

            if (!std) {
                throw new ApiError(404, "Student not found");
            }

            if (typeof std.generateAccessToken !== "function" || typeof std.generateRefreshToken !== "function") {
                throw new ApiError(500, "Token generation methods missing in student model");
            }

            const Accesstoken = std.generateAccessToken();
            const Refreshtoken = std.generateRefreshToken();

            console.log("✅ Generated Tokens:", { Accesstoken, Refreshtoken });

            if (!Accesstoken || !Refreshtoken) {
                throw new ApiError(500, "Failed to generate tokens");
            }

            std.Refreshtoken = Refreshtoken;
            await std.save({ validateBeforeSave: false });

            return { Accesstoken, Refreshtoken };
        } catch (error) {
            console.error("❌ Token Generation Error:", error);
            throw new ApiError(500, "Something went wrong while generating refresh and access token");
        }
    };



    const signup = asyncHandler(async (req, res) =>{
        
        const{Firstname, Lastname, Email, Password} = req.body;

        
        if(
            [Firstname, Lastname, Email, Password].some((field)=> 
            field?.trim() === "")
        ) {
            throw new ApiError(400, "All fields are required")
        }

        
        const existedStudent = await student.findOne({ Email: req.body.Email });
        if(existedStudent){
            throw new ApiError(400, "Student already exist")
        }


        const cheakTeach=await Teacher.findOne({Email:req.body.Email});

        if(cheakTeach){
            throw new ApiError(400, "Email Belong to Teacher");
        }
        
        const newStudent = await student.create({
            Email,
            Firstname,
            Lastname,
            Password,
            Studentdetails:null,

        })

        const createdStudent = await student.findById(newStudent._id).select(
            "-Password "
        ) 
        
        if(!createdStudent){
            throw new ApiError(501, "Student registration failed")
        }
        

        await verifyEmail(Email, Firstname, newStudent._id);

        return res.status(200).json(
            new ApiResponse(200, createdStudent, "Signup successfull")
        )

    })

    const mailVerified = asyncHandler(async (req, res) => {
        try {
            const id = req.query.id;

            // 🛑 Validate ID before querying MongoDB
            if (!id) {
                throw new ApiError(400, "Invalid verification link");
            }

            // 🛠 Update Student Verification Status
            const updatedInfo = await student.updateOne(
                { _id: id },
                { $set: { Isverified: true } }
            );

            // ✅ Corrected Check for Modified Count
            if (updatedInfo.modifiedCount === 0) {
                throw new ApiError(404, "Student not found or already verified");
            }

            // 🎉 Success Response
            return res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Email Verified - Shiksharthee</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            margin: 0;
                            padding: 0;
                            background-color: #f5f5f5;
                        }
                        .container {
                            text-align: center;
                            min-height: 100vh;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            padding: 20px;
                        }
                        .success-icon {
                            width: 120px;
                            height: 120px;
                            margin-bottom: 20px;
                        }
                        .success-title {
                            font-size: 2.5rem;
                            font-weight: bold;
                            color: #2c3e50;
                            margin-bottom: 15px;
                        }
                        .success-message {
                            font-size: 1.2rem;
                            color:rgb(0, 0, 0);
                            margin-bottom: 30px;
                        }
                        .home-button {
                            padding: 12px 30px;
                            background-color: #3498db;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            font-size: 1.1rem;
                            cursor: pointer;
                            transition: background-color 0.3s ease;
                            text-decoration: none;
                            display: inline-block;
                        }
                        .home-button:hover {
                            background-color: #2980b9;
                        }
                        .footer {
                            margin-top: 40px;
                            color: #7f8c8d;
                            font-size: 0.9rem;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <img src="https://cdn-icons-png.flaticon.com/128/4436/4436481.png" alt="Success Icon" class="success-icon">
                        <h1 class="success-title">Email Verified Successfully!</h1>
                        <p class="success-message">Thank you for verifying your email address. Your account is now active.</p>
                        <a href="http://localhost:5173/login" class="home-button">Return to Homepage</a>
                        <div class="footer">
                            <p>© 2024 Shiksharthee. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `);
        } catch (error) {
            console.error("Error verifying email:", error);
            return res.status(error.statusCode || 500).json({ message: error.message });
        }
    });



    const login = asyncHandler(async(req, res) => {
        const { Email, Password } = req.body;

        if ([Email, Password].some((field) => field?.trim() === "")) {
            throw new ApiError(400, "All fields are required");
        }

        const StdLogin = await student.findOne({ Email });

        if (!StdLogin) {
            throw new ApiError(400, "Student does not exist");
        }

        if (!StdLogin.Isverified) {
            throw new ApiError(401, "Email is not verified");
        }

        const isPasswordCorrect = await StdLogin.isPasswordCorrect(Password);

        if (!isPasswordCorrect) {
            throw new ApiError(403, "Password is incorrect");
        }

        const { Accesstoken, Refreshtoken } = await generateAccessAndRefreshTokens(StdLogin._id);

        const loggedInStd = await student.findById(StdLogin._id).select("-Password -Refreshtoken");

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 24 * 60 * 60 * 1000 // 15 days
        };

        return res
            .status(200)
            .cookie("Accesstoken", Accesstoken, options)
            .cookie("Refreshtoken", Refreshtoken, options)
            .json(new ApiResponse(200, { user: loggedInStd }, "Logged in successfully"));
    });


    const logout = asyncHandler(async (req, res) => {
        try {
            console.log("🔍 Logout request received");
            console.log("👤 User in request:", req.user ? "✅ Present" : "❌ Missing");
    
            if (!req.user || !req.user._id) {
                console.error("❌ Logout Error: No user found in request.");
                throw new ApiError(401, "Unauthorized: No user found");
            }
    
            // Remove refresh token from database
            await student.findByIdAndUpdate(req.user._id, {
                $unset: { Refreshtoken: "" }, // ✅ Proper way to remove field
            });
    
            console.log("✅ Refresh token removed from database");
    
            const options = {
                httpOnly: true,
                secure: true,
                sameSite: "None",
            };
    
            return res
                .status(200)
                .clearCookie("Accesstoken", options)
                .clearCookie("Refreshtoken", options)
                .json(new ApiResponse(200, {}, "User logged out successfully"));
    
        } catch (error) {
            console.error("❌ Logout Error:", error);
            throw new ApiError(500, "Something went wrong during logout");
        }
    });
    


    const getStudent = asyncHandler(async(req,res)=>{
        const user = req.Student
        const id = req.params.id
        if(req.Student._id != id){
            throw new ApiError(400, "unauthroized access")
        }
        return res
        .status(200)
        .json(new ApiResponse(200, user, "Student is logged in"))
    })
   const addStudentDetails = asyncHandler(async (req, res) => {
  console.log("Uploaded Files:", req.files);
  console.log("testing here");
  
    console.log("Student id", req.params.id )
  try {
    const id = req.params.id;
    console.log("Received Student ID:", id);
    console.log("Request Body:", req.body);

    if (req.params.id.toString() !== id) {
      throw new ApiError(400, "Unauthorized access");
    }

    const { Phone, Address, Highesteducation, SecondarySchool, HigherSchool, SecondaryMarks, HigherMarks } = req.body;

    if ([Phone, Address, Highesteducation, SecondarySchool, HigherSchool, SecondaryMarks, HigherMarks].some((field) => !field?.trim())) {
      throw new ApiError(400, "All fields are required");
    }

    const alreadyExist = await studentdocs.findOne({ Phone });
    if (alreadyExist) {
      throw new ApiError(400, "Phone number already exists");
    }

    const AadhaarLocalPath = req.files?.Aadhaar?.[0]?.path || null;
    const SecondaryLocalPath = req.files?.Secondary?.[0]?.path || null;
    const HigherLocalPath = req.files?.Higher?.[0]?.path || null;

    if (!AadhaarLocalPath || !SecondaryLocalPath || !HigherLocalPath) {
      throw new ApiError(400, "All required documents (Aadhaar, Secondary, Higher) must be uploaded.");
    }

    let Aadhaar, Secondary, Higher;
    try {
      Aadhaar = await uploadOnCloudinary(AadhaarLocalPath);
      Secondary = await uploadOnCloudinary(SecondaryLocalPath);
      Higher = await uploadOnCloudinary(HigherLocalPath);
    } catch (uploadError) {
      console.error("❌ Cloudinary Upload Error:", uploadError);
      throw new ApiError(500, "Error uploading files to Cloudinary");
    }

    // ✅ Create studentdocs
    const studentdetails = await studentdocs.create({
      Phone,
      Address,
      Highesteducation,
      SecondarySchool,
      HigherSchool,
      SecondaryMarks,
      HigherMarks,
      Aadhaar: Aadhaar.url,
      Secondary: Secondary.url,
      Higher: Higher.url,
    });

    if (!studentdetails || !studentdetails._id) {
      throw new ApiError(500, "Failed to save student details");
    }

    console.log("✅ Student details saved:", studentdetails);

    // ✅ Find Student Before Updating
    const studentExists = await student.findById(id);
    if (!studentExists) {
      throw new ApiError(404, "Student not found");
    }
    console.log("🟢 Found Student:", studentExists);

    // ✅ Update student
    const updatedStudent = await student.findOneAndUpdate(
      { _id: id },
      { $set: { Isapproved: "pending", Studentdetails: studentdetails._id } },
      { new: true }
    ).select("-Password -Refreshtoken");

    if (!updatedStudent) {
      throw new ApiError(500, "Failed to update student with document details");
    }

    console.log("✅ Updated Student:", updatedStudent);

    // ✅ Verify that Studentdetails is populated
    const checkStudent = await student.findById(id).populate("Studentdetails");
    console.log("🔍 After Update - Studentdetails:", checkStudent.Studentdetails);

    return res.status(200).json(new ApiResponse(200, updatedStudent, "Documents uploaded successfully"));
  } catch (error) {
    console.error("❌ Error in addStudentDetails:", error);
    throw new ApiError(error.statusCode || 500, error.message || "Internal Server Error");
  }
});

    const forgetPassword=asyncHandler(async(req,res)=>{

    const { Email } =  req.body

    if(!Email){
        throw new ApiError(400, "Email is required")
        }
    
        const User=await student.findOne({Email});

        if(!User){
        throw new ApiError(404,"email not found!!");
        }

    await User.generateResetToken();

    await User.save();

    const resetToken=`http://localhost:5173/student/forgetpassword/${User.forgetPasswordToken}`
    
    const subject='RESET PASSWORD'

    const message=` <p>Dear ${User.Firstname}${User.Lastname},</p>
    <p>We have received a request to reset your password. To proceed, please click on the following link: <a href="${resetToken}" target="_blank">reset your password</a>.</p>
    <p>If the link does not work for any reason, you can copy and paste the following URL into your browser's address bar:</p>
    <p>${resetToken}</p>
    <p>Thank you for being a valued member of the Shiksharthee community. If you have any questions or need further assistance, please do not hesitate to contact our support team.</p>
    <p>Best regards,</p>
    <p>The Shiksharthee Team</p>`

    try{
        
        await Sendmail(Email,subject,message);

        res.status(200).json({

            success:true,
            message:`Reset password Email has been sent to ${Email} the email SuccessFully`
        })

        }catch(error){

            throw new ApiError(404,"operation failed!!");
        }


    })



    const  resetPassword= asyncHandler(async (req, res) => {
        const { token } = req.params;
        const { password,confirmPassword} = req.body;

        if(password != confirmPassword){
            throw new ApiError(400,"password does not match")
        }
            

        try {
            const user = await student.findOne({
                forgetPasswordToken:token,
                forgetPasswordExpiry: { $gt: Date.now() }
            });
            console.log("flag2",user);

            if (!user) {
                throw new ApiError(400, 'Token is invalid or expired. Please try again.');
            }

    

            user.Password = password; 
            user.forgetPasswordExpiry = undefined;
            user.forgetPasswordToken = undefined;

            await user.save(); 

            res.status(200).json({
                success: true,
                message: 'Password changed successfully!'
            });
        } catch (error) {
            console.error('Error resetting password:', error);
            throw new ApiError(500, 'Internal server error!!!');
        }
    });



    export{
        signup,
        mailVerified,
        login, 
        logout, 
        addStudentDetails,
        getStudent, 
        forgetPassword,
        resetPassword
    }
