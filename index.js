const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
dotenv.config();
const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = process.env.MONGODB_URI;

// Mongo Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Database
    const db = client.db("adoptifyDB");

    // Collections
    const petsCollection = db.collection("pets");

    const adoptionsCollection = db.collection("adoptions");

    // =========================
    // GET ALL PETS
    // =========================

    app.get("/pets", logger, async (req, res) => {
      const { search, species } = req.query;

      let query = {};

      // Search
      if (search) {
        query.pet_name = {
          $regex: search,
          $options: "i",
        };
      }

      // Filter
      if (species) {
        query.species = {
          $in: [species],
        };
      }

      const result = await petsCollection.find(query).toArray();

      res.send(result);
    });

    // =========================
    // FEATURED PETS
    // =========================

    app.get("/featured-pets", async (req, res) => {
      const result = await petsCollection.find().limit(6).toArray();

      res.send(result);
    });

    // =========================
    // End
    // =========================
  } finally {
  }
}

run().catch(console.dir);

// Root Route
app.get("/", (req, res) => {
  res.send("Pet Adoption Server Running");
});

// Server Listen
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
