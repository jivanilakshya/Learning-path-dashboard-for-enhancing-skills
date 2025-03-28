import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

//console.log("MongoDB URI:", process.env.MONGODB_URI); // Debug log

const db = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Mongodb connection error", error);
  }
};

export default db;
