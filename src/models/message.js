import mongoose from 'mongoose';

const messageSchema = mongoose.Schema({
    message_id : {type: Number, unique: true},
    message_json: {type: Object, required: true},
    ride_id: {type: Number, required:true}
});

messageSchema.pre('save', async function (next) {
    const new_message = this;
    if(new_message.isNew){
        try{
            const lastmessage = await mongoose.model('messages').findOne().sort({ message_id: -1 }).exec();
            new_message.message_id = lastmessage ? lastmessage.message_id + 1: 1;
        } catch(error){
            next(error);
        }
    }else{
        next();
    }
});

const MessagesSch = mongoose.model('messages', messageSchema);

export default MessagesSch;