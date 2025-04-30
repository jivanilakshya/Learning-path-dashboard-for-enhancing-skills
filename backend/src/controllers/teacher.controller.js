import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Teacher, Teacherdocs } from "../models/teacher.model.js"; 
import { ApiResponse } from "../utils/ApiResponse.js";
import { Sendmail } from "../utils/Nodemailer.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { student } from "../models/student.model.js";
import nodemailer from "nodemailer";

const verifyEmail = async (Email, Firstname, createdTeacherId) => {
    try {
        const emailSender = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: Email,
            subject: "Verify your E-mail",
            html: `<div style="text-align: center;">
            <p style="margin: 20px;"> Hi ${Firstname}, Please click the button below to verify your E-mail. </p>
            <img src="https://img.freepik.com/free-vector/illustration-e-mail-protection-concept-e-mail-envelope-with-file-document-attach-file-system-security-approved_1150-41788.jpg?size=626&ext=jpg&uid=R140292450&ga=GA1.1.553867909.1706200225&semt=ais" alt="Verification Image" style="width: 100%; height: auto;">
            <br>
            <a href="http://localhost:5173/api/teacher/verify?id=${createdTeacherId}">
                <button style="background-color: black; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 10px 0; cursor: pointer;">Verify Email</button>
            </a>
            <p style="margin: 20px;">If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: blue;">http://localhost:5173/api/teacher/verify?id=${createdTeacherId}</p>
        </div>`
        };
        emailSender.sendMail(mailOptions, function(error) {
            if (error) {
                throw new ApiError(400, "Sending email verification failed");
            } else {
                console.log("Verification mail sent successfully");
            }
        });
    } catch (error) {
        console.log("kadyan",error);
        throw new ApiError(400, "Failed to send email verification");
    }
};

const generateAccessAndRefreshTokens = async (teacherId) => { 
    try {
        const teacher = await Teacher.findById(teacherId);
        const Accesstoken = teacher.generateAccessToken();
        const Refreshtoken = teacher.generateRefreshToken();

        teacher.Refreshtoken = Refreshtoken;
        await teacher.save({ validateBeforeSave: false });

        return { Accesstoken, Refreshtoken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
};

const signup = asyncHandler(async (req, res) => {
    const { Firstname, Lastname, Email, Password } = req.body;

    if ([Firstname, Lastname, Email, Password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedTeacher = await Teacher.findOne({ Email });

    if (existedTeacher) {
        throw new ApiError(400, "Teacher already exists");
    }
    const existedStudent = await student.findOne({ Email: req.body.Email });
    if(existedStudent){
        throw new ApiError(400, "Email Belong to Student")
    }

    const newTeacher = await Teacher.create({
        Email,
        Firstname,
        Lastname,
        Password,
        Teacherdetails:null,
    });

    const createdTeacher = await Teacher.findById(newTeacher._id).select("-Password");

    if (!createdTeacher) {
        throw new ApiError(501, "Teacher registration failed");
    }

    await verifyEmail(Email, Firstname, newTeacher._id);

    return res.status(200).json(
        new ApiResponse(200, createdTeacher, "Signup successful")
    );
});

const mailVerified = asyncHandler(async (req, res) => {
    try {
        const id = req.query.id;
    
        const updatedInfo = await Teacher.updateOne({ _id: id }, { $set: { Isverified: true } });
    
        if (updatedInfo.nModified === 0) {
            throw new ApiError(404, "Teacher not found or already verified");
        }
    
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
                            color: #34495e;
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
                </html>`
        );
    } catch (error) {
        throw new ApiError(509, "something went wrong while verifying User")
    }
});

const login = asyncHandler(async (req, res) => {
    const { Email, Password } = req.body; // 🔥 Fix: Get email & password from req.body

    if (!Email) {
        throw new ApiError(400, "E-mail is required");
    }
    if (!Password) {
        throw new ApiError(400, "Password is required");
    }

    const teacher = await Teacher.findOne({ Email });

    if (!teacher) {
        throw new ApiError(403, "Teacher does not exist");
    }

    if (!teacher.Isverified) {
        throw new ApiError(401, "Email is not verified");
    }

    const isPasswordCorrect = await teacher.isPasswordCorrect(Password); // 🔥 Ensure this method exists

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Password is incorrect");
    }

    try {
        // 🔥 Debugging Step: Check if token generation works properly
        console.log("Generating tokens for teacher ID:", teacher._id);

        const { Accesstoken, Refreshtoken } = await generateAccessAndRefreshTokens(teacher._id);

        if (!Accesstoken || !Refreshtoken) {
            throw new ApiError(500, "Token generation failed");
        }

        console.log("Tokens generated successfully");

        const loggedInTeacher = await Teacher.findById(teacher._id).select("-Password -Refreshtoken");

        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("Accesstoken", Accesstoken, options)
            .cookie("Refreshtoken", Refreshtoken, options)
            .json(new ApiResponse(200, { user: loggedInTeacher }, "Logged in"));
    } catch (error) {
        console.error("Token generation error:", error);
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
});


const logout = asyncHandler(async(req, res)=>{
    await Teacher.findByIdAndUpdate(req.teacher?._id,
        {
            $set:{
                Refreshtoken:undefined,
            }
        },
        {
            new:true
        }
    )

    const options ={
        httpOnly:true,
        secure:true,
    }

    return res
    .status(200)
    .clearCookie("Accesstoken", options)
    .clearCookie("Refreshtoken",  options)
    .json(new ApiResponse(200, {}, "User logged out"))
})

const getTeacher = asyncHandler(async(req,res) =>{
    const user = req.teacher

    const id = req.params.id
    if(req.teacher._id != id){
        throw new ApiError(400, "unauthroized access")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Teacher is logged in"))
})

const addTeacherDetails = asyncHandler(async(req,res)=>{

    const id = req.params.id
    if(req.teacher._id != id){
        throw new ApiError(400, "unauthroized access")
    }

    const{Phone, Address, Experience, UGcollege, PGcollege, UGmarks, PGmarks} = req.body

    if([Phone, Address, Experience, UGcollege, PGcollege, UGmarks, PGmarks].some((field)=> field?.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }

    const alreadyExist = await Teacherdocs.findOne({Phone})

    if(alreadyExist){
        throw new ApiError(400, "Phone number already exist")
    }

    const AadhaarLocalPath = req.files?.Aadhaar?.[0]?.path;
    const UGLocalPath = req.files?.UG?.[0]?.path
    const PGLocalPath = req.files?.PG?.[0]?.path

    if(!AadhaarLocalPath){
        throw new ApiError(400, "Aadhaar is required")
    }
    if(!UGLocalPath){
        throw new ApiError(400, "UG marksheet is required")
    }
    if(!PGLocalPath){
        throw new ApiError(400, "PG marksheet is required")
    }

    const Aadhaar = await uploadOnCloudinary(AadhaarLocalPath)
    const UG = await uploadOnCloudinary(UGLocalPath)
    const PG = await uploadOnCloudinary(PGLocalPath)

    const teacherdetails = await Teacherdocs.create({
        Phone,
        Address,
        Experience,
        UGcollege,
        PGcollege,
        UGmarks,
        PGmarks,
        Aadhaar: Aadhaar.url,
        UG:UG.url,
        PG:PG.url,
    })

    const theTeacher = await Teacher.findOneAndUpdate({_id: id}, {$set: {Isapproved:"pending", Teacherdetails: teacherdetails._id}},  { new: true }).select("-Password -Refreshtoken")
    
    if(!theTeacher){
        throw new ApiError(400,"faild to approve or reject || student not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {teacher:theTeacher}, "documents uploaded successfully"))
})

const teacherdocuments = asyncHandler(async(req, res)=>{
    const teacherID = req.body.teacherID;

    const teacherDocs = await Teacherdocs.findById(teacherID);

    if(!teacherDocs){
        throw new ApiError(400, 'no teacher found');
    }

    return res 
    .status(200)
    .json(new ApiResponse(200, teacherDocs, "teacher documents fetched"))
})

const ForgetPassword=asyncHandler(async(req,res)=>{

    const { Email } =  req.body
 
    if(!Email){
     throw new ApiError(400, "Email is required")
     }
    
     const User=await Teacher.findOne({Email});
 
     if(!User){
        throw new ApiError(404,"email not found!!");
     }
 
    await User.generateResetToken();
 
    await User.save();
 
    const resetToken=`${process.env.FRONTEND_URL}/teacher/forgetpassword/${User.forgetPasswordToken}`
   
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
 
 
 
 const  ResetPassword= asyncHandler(async (req, res) => {
     const { token } = req.params;
     const { password,confirmPassword} = req.body;

     if(password != confirmPassword){
         throw new ApiError(400,"password does not match")
     }
         
     console.log("flag",token,password);
 
     try {
         const user = await Teacher.findOne({
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

export { signup, mailVerified, login, logout, addTeacherDetails, getTeacher, teacherdocuments,ForgetPassword,ResetPassword};
