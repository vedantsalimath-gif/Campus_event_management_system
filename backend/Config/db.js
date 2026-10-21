import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
  dbName: "campus_event_db",
});
    console.log("MongoDB connected successfully");
    console.log("Connected database:", mongoose.connection.name);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

export default connectDB;
