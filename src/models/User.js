import mongoose from 'mongoose';
import Counter from './Counter.js';

const userSchema = new mongoose.Schema({
    uid: {type: Number, unique: true},
    firstname: {type: String, required: true},
    lastname: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    contact_no: {type: Number, required: true},
    is_admin: {type: Boolean, required: true},
    created: {type: Date, default: Date.now}
});

userSchema.pre('save', async function (next) {
    // if (this.isNew) {
    //     const counter = await Counter.findOneAndUpdate(
    //         { modelName: 'user' },
    //         { $inc: { seq: 1 } },
    //         { new: true, upsert: true }
    //     );
    //     this.uid = counter.seq;
    // }
    // next();
    const new_user = this;
    if(new_user.isNew){
        try{
            const lastuser = await mongoose.model('users').findOne().sort({ uid: -1 }).exec();
            new_user.uid = lastuser ? lastuser.uid + 1: 1;
        } catch (error){
            next(error);
        }
    }else{
        next();
    }
});

const User = mongoose.model('users', userSchema);

export default User;