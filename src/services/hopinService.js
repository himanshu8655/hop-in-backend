import express from 'express';
import axios from 'axios';
import cors from 'cors';
import db from '../db/connection.js';
import bcrypt from 'bcryptjs';
import RideDet from '../models/Ride_details.js';
import MessagesSch from '../models/message.js';
// import mongoose from "mongoose";

const hopinService = {
    createcarpool: async (body) => {
        try{    
            if(body.uid && body.start_lat && body.start_long && body.no_of_seats && body.end_lat && body.end_long){
                const newRideDetails = new RideDet({
                    carpool_owner: body.uid,
                    start_location: {
                        type: 'Point',
                        coordinates: [body.start_long, body.start_lat],
                    },
                    end_location: {
                        type: 'Point',
                        coordinates: [body.end_long, body.end_lat],
                    },
                    start_time: new Date(),
                    is_active: '1',
                    seat_available: body.no_of_seats,
                });
                const savedRideDetails = await newRideDetails.save();
                console.log('savedRideDetails',savedRideDetails);
                const key_message = savedRideDetails.ride_id+"_"+Date.now();
                let message_json_arr = { 
                    [key_message] : "Hello Commuters to your carpool, journey"
                };
                const messageNew = new MessagesSch({
                    message_json: JSON.stringify(message_json_arr),
                    ride_id: savedRideDetails.ride_id
                });
                const mesaage_new_save = messageNew.save();
                return "New carpool created";
            }else{
                return "Ride can not be created"; 
            }
        } catch (error){
            return error.message;
        }
    },
    joincarpoolserv: async (body) => {
        try{
            if(body.uid && body.start_lat && body.start_long && body.end_lat && body.end_long){
                const radiusInRadians = process.env.radiusInMiles / 3963.2;
                const findrides = await RideDet.find({
                    start_location: {
                        $geoWithin: {
                            $centerSphere: [[body.start_long, body.start_lat], radiusInRadians],
                        },
                    },
                    end_location: {
                        $geoWithin: {
                            $centerSphere: [[body.end_long, body.end_lat], radiusInRadians],
                        },
                    },
                    is_active: 1,
                    seat_available: { $gte: 1 }
                }).exec();
                let return_data = ""; 
                if(findrides.length >= 1){
                    let commuter_id_new = findrides[0]["commuter_id"];
                    commuter_id_new.push(Number(body.uid));
                    const update_ride = RideDet.updateOne(
                        {ride_id: findrides[0]["ride_id"]},
                        { $set: { commuter_id:  commuter_id_new} }
                    ).exec();
                    findrides[0]["commuter_id"] = commuter_id_new;
                    return_data = findrides[0];
                }else{
                    return_data = "No rides found";
                }
                return return_data;
            }else{
                return "Necessary co-ordinates missing";
            }
        } catch (error){
            return error.message;
        }
    },
    maproutenew: async (body) => {
        try {
            const HOPIN_MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
            if (!body.origin_lat || !body.origin_long || !body.destination_lat || !body.destination_long) {
                return res.status(400).json({ error: "Origin and destination are required." });
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
        } catch (error){
            return "Failed to fetch route data";
        }
    }
};

export default hopinService