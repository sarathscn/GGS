const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
    const dbName = process.env.DB_NAME || 'ggs_database';

    await mongoose.connect(mongoUrl, {
      dbName: dbName
    });
    console.log(`MongoDB Connected: ${mongoose.connection.host}/${dbName}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
