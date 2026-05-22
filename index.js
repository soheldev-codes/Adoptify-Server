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
    // GET ALL PETS page
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
    // GET SINGLE PET  Page
    // =========================

    app.get("/pets/:id", async (req, res) => {
      const { id } = req.params;

      const result = await petsCollection.findOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    // =========================
    // FEATURED PETS Home Page
    // =========================

    app.get("/featured-pets", async (req, res) => {
      const result = await petsCollection.find().limit(6).toArray();

      res.send(result);
    });

    // =========================
    // ADD PET Dashbord verifyToken,
    // =========================

    app.post("/pets", async (req, res) => {
      const petData = req.body;

      const result = await petsCollection.insertOne({
        ...petData,
        adopted: false,
        createdAt: new Date(),
      });

      res.send(result);
    });

    // =========================
    // UPDATE PET Dashbord verifyToken,
    // =========================

    app.patch("/pets/:id", async (req, res) => {
      const { id } = req.params;

      const updatedData = req.body;

      const result = await petsCollection.updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: updatedData,
        },
      );

      res.send(result);
    });

    // =========================
    // DELETE PET Dashbord verifyToken,
    // =========================

    app.delete("/pets/:id", async (req, res) => {
      const { id } = req.params;

      const result = await petsCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    // =========================
    // MY LISTINGS Dashbord verifyToken,
    // =========================

    app.get("/my-listings/:email", async (req, res) => {
      const { email } = req.params;

      const result = await petsCollection
        .find({
          owner_email: email,
        })
        .toArray();

      res.send(result);
    });

    // =========================
    // ADOPTION REQUEST
    // =========================

    app.post("/adoptions/:petId", async (req, res) => {
      const { petId } = req.params;

      const adoptionData = req.body;
      console.log(adoptionData);

      const pet = await petsCollection.findOne({
        _id: new ObjectId(petId),
      });

      // Pet not found
      if (!pet) {
        return res.status(404).send({
          message: "Pet not found",
        });
      }

      // Owner cannot adopt own pet
      if (pet.owner_email === adoptionData.user_email) {
        return res.status(400).send({
          message: "Owner cannot adopt own pet",
        });
      }

      // // Already adopted
      // if (pet.adopted) {
      //   return res.status(400).send({
      //     message: "Already adopted",
      //   });
      // }

      const existingRequest = await adoptionsCollection.findOne({
        petId,
        user_email: adoptionData.user_email,
      });

      // Already requested
      if (existingRequest) {
        return res.status(400).send({
          message: "Already requested",
        });
      }

      const result = await adoptionsCollection.insertOne({
        ...adoptionData,
        petId,
        status: "pending",
        requestedAt: new Date(),
      });

      res.send(result);
    });

    // =========================
    // MY REQUESTS
    // =========================

    app.get("/my-requests/:email", async (req, res) => {
      const { email } = req.params;
      console.log(email);

      const result = await adoptionsCollection
        .find({ user_email: email })
        .toArray();

      res.send(result);
    });

    // =========================
    // REQUESTS FOR A PET verifyToken,
    // =========================

    app.get("/requests/:petId", async (req, res) => {
      const { petId } = req.params;

      const result = await adoptionsCollection
        .find({
          petId,
        })
        .toArray();

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
