import mongoose from 'mongoose';
import Counter from './Counter.js';

const RideDetailsSchema = new mongoose.Schema({
    ride_id: { type: Number, unique: true },
    carpool_owner: { type: Number, required: true },
    start_location: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true },
    },
    end_location: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true },
    },
    start_time: { type: Date, required: true },
    is_active: { type: String, required: true },
    commuter_id: { type: [Number], default: [] },
    seat_available: { type: String, required: true },
    created: { type: Date, default: Date.now },
});

RideDetailsSchema.index({ ride_id: 1 });
RideDetailsSchema.index({ start_location: '2dsphere' });
RideDetailsSchema.index({ end_location: '2dsphere' });

RideDetailsSchema.pre('save', async function (next) {
    // if (this.isNew) {
    //     const counter = await Counter.findOneAndUpdate(
    //         { modelName: 'ride_details' },
    //         { $inc: { seq: 1 } },
    //         { new: true, upsert: true }
    //     );
    //     this.ride_id = counter.seq;
    // }
    // next();
    const new_ride = this;
    if(new_ride.isNew){
        try{
            const lastride = await mongoose.model('ride_details').findOne().sort({ ride_id: -1 }).exec();
            new_ride.ride_id = lastride ? lastride.ride_id + 1: 1;
        } catch (error){
            next(error);
        }
    }else{
        next();
    }
});

const RideDet = mongoose.model('ride_details', RideDetailsSchema);

export default RideDet;
