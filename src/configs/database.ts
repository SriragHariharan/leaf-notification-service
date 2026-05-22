const mongoose = require("mongoose");

async function connectToDatabase() {
  const databaseURL = process.env.DATABASE_URL;

  try {
    await mongoose.connect(databaseURL);

    console.log("Connected to database...");
  } catch (error) {
    console.error("Error connecting to MongoDB Atlas:", error);
  }
}

export default connectToDatabase;
