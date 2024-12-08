import express from 'express';
import db from '../db/connection.js';
import bcrypt from 'bcryptjs';
import RideDet from '../models/Ride_details.js';
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
                console.log("Foundone",findrides);
                // if (findrides. >=  1){
                //     // console.log("Foundone",findrides.toArray());
                //     // console.log("Hi");
                //     // return "true";
                // }
                return "true";
            }else{
                return "Necessary co-ordinates missing";
            }
        } catch (error){
            return error.message;
        }
    },
};

export default hopinService