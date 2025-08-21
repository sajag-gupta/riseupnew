
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.MONGODB_URI) {
  console.warn("MONGODB_URI not found in environment variables. Using default connection string for development.");
}

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/riseup-creators';
    
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    console.log('Continuing without database connection for development...');
    // Don't exit in development to allow the server to start
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export { connectDB };
export default mongoose;
