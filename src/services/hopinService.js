import express from "express";
import axios from "axios";
import cors from "cors";
import db from "../db/connection.js";
import bcrypt from "bcryptjs";
import RideDet from "../models/Ride_details.js";
import MessagesSch from "../models/message.js";
// import mongoose from "mongoose";

const hopinService = {
  createcarpool: async (body) => {
    try {
      if (
        body.uid &&
        body.start_lat &&
        body.start_long &&
        body.no_of_seats &&
        body.end_lat &&
        body.end_long
      ) {
        const newRideDetails = new RideDet({
          carpool_owner: body.uid,
          start_location: {
            type: "Point",
            coordinates: [body.start_long, body.start_lat],
          },
          end_location: {
            type: "Point",
            coordinates: [body.end_long, body.end_lat],
          },
          start_time: new Date(),
          is_active: "0",
          seat_available: body.no_of_seats,
        });
        const savedRideDetails = await newRideDetails.save();
        console.log("savedRideDetails", savedRideDetails);
        const key_message = savedRideDetails.ride_id + "_" + Date.now();
        let message_json_arr = {
          [key_message]: "Hello Commuters to your carpool, journey",
        };
        const messageNew = new MessagesSch({
          message_json: JSON.stringify(message_json_arr),
          ride_id: savedRideDetails.ride_id,
        });
        const mesaage_new_save = messageNew.save();
        return "New carpool created";
      } else {
        return "Ride can not be created";
      }
    } catch (error) {
      return error.message;
    }
  },
  joincarpoolserv: async (body) => {
    try {
      if (
        body.uid &&
        body.start_lat &&
        body.start_long &&
        body.end_lat &&
        body.end_long
      ) {
        const radiusInRadians = process.env.radiusInMiles / 3963.2;
        const findrides = await RideDet.find({
          start_location: {
            $geoWithin: {
              $centerSphere: [
                [body.start_long, body.start_lat],
                radiusInRadians,
              ],
            },
          },
          end_location: {
            $geoWithin: {
              $centerSphere: [[body.end_long, body.end_lat], radiusInRadians],
            },
          },
          is_active: 1,
          seat_available: { $gte: 1 },
        }).exec();
        let return_data = "";
        if (findrides.length >= 1) {
          let commuter_id_new = findrides[0]["commuter_id"];
          commuter_id_new.push(Number(body.uid));
          const update_ride = RideDet.updateOne(
            { ride_id: findrides[0]["ride_id"] },
            { $set: { commuter_id: commuter_id_new } }
          ).exec();
          findrides[0]["commuter_id"] = commuter_id_new;
          return_data = findrides[0];
        } else {
          return_data = "No rides found";
        }
        return return_data;
      } else {
        return "Necessary co-ordinates missing";
      }
    } catch (error) {
      return error.message;
    }
  },

  writeReview: async (body) => {
    try {
      const { ride_id, user_id, rating, description } = body;

      // Input validation
      if (!ride_id || !user_id || rating === undefined || !description) {
        return { success: false, message: "Invalid data" };
      }

      if (typeof rating !== "number" || rating < 0 || rating > 5) {
        return { success: false, message: "Rating must be between 0 and 5" };
      }
      // Check if the ride exists
      const ride = await db
        .collection("ride_details")
        .findOne({ ride_id: ride_id });
      console.log(ride);
      if (!ride) {
        return { success: false, message: "Ride not found" };
      }

      // Save the review
      const review = {
        ride_id,
        user_id,
        rating,
        description,
        created_at: new Date(),
      };

      const result = await db.collection("reviews").insertOne(review);

      if (!result.insertedId) {
        return { success: false, message: "Failed to save the review" };
      }

      return { success: true, message: "Review submitted successfully" };
    } catch (err) {
      console.error("Write review error:", err.message);
      return {
        success: false,
        message: "An error occurred while submitting the review",
      };
    }
  },

  maproutenew: async (body) => {
    try {
      const HOPIN_MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
      if (
        !body.origin_lat ||
        !body.origin_long ||
        !body.destination_lat ||
        !body.destination_long
      ) {
        return res
          .status(400)
          .json({ error: "Origin and destination are required." });
      }
      const response = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${body.origin_long},${body.origin_lat};${body.destination_long},${body.destination_lat}`,
        {
          params: {
            geometries: "geojson",
            access_token: HOPIN_MAPBOX_ACCESS_TOKEN,
          },
        }
      );
      return response.data;
    } catch (error) {
      return "Failed to fetch route data";
    }
  },
  getReviewsGiven: async (user_id) => {
    try {
      const reviews = await db
        .collection("reviews")
        .find({ user_id })
        .toArray();

      if (!reviews || reviews.length === 0) {
        return { success: false, message: "No reviews found for the user." };
      }

      return { success: true, data: reviews };
    } catch (error) {
      console.error("Error fetching reviews:", error.message);
      return {
        success: false,
        message: "An error occurred while fetching reviews.",
      };
    }
  },
  activeride: async (body) => {
    try{
        if(body.uid){
            const fetch_ride = await RideDet.findOne({is_active: "1",$or:[{carpool_owner: body.uid},{commuter_id: body.uid}]}).sort({$natural: -1}).exec();
            return fetch_ride;
        } else{
            return "Cannot fecth Ride";
        }
    } catch(error){
        console.error("Active Ride Error:", error.message);
      return {
        success: false,
        message: "An error occurred while fetching ride details",
      };
    }
  },
  updateridestatus: async (body) => {
    try{
        if(body.ride_status && body.ride_id) {
            const update_ride = RideDet.updateOne(
                { ride_id: body.ride_id },
                { $set: { is_active: ride_status } }
            ).exec();
            return "Ride updated";
        }else{
            return "Necesaary information required to upate ride"
        }
    } catch (error){
        console.error("Ride Status Error:", error.message);
      return {
        success: false,
        message: "An error occurred while updating ride status",
      };
    }
  },
  ridehistory: async (body) => {
    try {
        if(body.uid){
            const ride_history = await RideDet.find({$or:[{carpool_owner:body.uid},{commuter_id:body.uid}]}).exec();
            return ride_history;
        }else{
            return "Provide user id to get ride histpry of user"
        }
    } catch (error){
        console.error("Ride History Error:", error.message);
      return {
        success: false,
        message: "An error occurred while getting ride history",
      };
    }
  }
};

export default hopinService;
