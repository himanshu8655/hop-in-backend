import express from 'express';
import hopinService from '../services/hopinService.js';
import app from '../app.js';

const hopinController = {
    carpool: async (req, res) => {
        try{
            const result = await hopinService.createcarpool(req.body);
            return res.status(200).json({ success: true,message: result});
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    joincarpool: async (req, res) => {
        try{
            const result = await hopinService.joincarpoolserv(req.body);
            return res.status(200).json({success: true, message: result});
            // return "true";
        } catch (error) {
            return res.status(500).json({status: false,message: error.message});
            // return "false";
        }
    },
};

export default hopinController;