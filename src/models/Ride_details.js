import mongoose from 'mongoose';
import Counter from 'Counter.js';

const RideDetailsSchema = new mongoose.Schema({
    ride_id: {type: Number, unique: true},
    carpool_owner: {type: Number, required: true},
    start_location: {type: Number, required: true,min: -90, max: 90},
    end_location: {type: Number, required: true,min: -180, max: 180},
    end_location: {type: Number, required: true},
    created: {type: Date, default: Date.now}
});

rideDetailsSchema.pre('save', async function (next) {
    if (this.isNew) {
        const counter = await Counter.findOneAndUpdate(
            { modelName: 'ride_details' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.ride_id = counter.seq;
    }
    next();
});

const RideDet = mongoose.model('ride_details', RideDeTailsSchema);

module.exports = RideDet;