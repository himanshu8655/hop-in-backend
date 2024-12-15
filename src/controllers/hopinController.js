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
            return res.status(200).json({success: true, data: result});
        } catch (error) {
            return res.status(500).json({success: false,message: error.message});
        }
    },
    maproute: async (req, res) => {
        try{
            const result = await hopinService.maproutenew(req.body);
            return res.status(200).json({success: true, data: result});
        } catch (error) {
            return res.status(500).json({success: false, message: error.message});
        }
    },

    writeReview: async (req, res) => {
        try {
          const result = await hopinService.writeReview(req.body);
          if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
          }
          return res.status(200).json({ success: true, message: result.message });
        } catch (error) {
          return res.status(500).json({ success: false, message: error.message });
        }
      },

      getReviewsGiven: async (req, res) => {
        try {
          const result = await hopinService.getReviewsGiven(req.body.user_id);
          if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
          }
          return res.status(200).json({ success: true, data: result.data });
        } catch (error) {
          return res.status(500).json({ success: false, message: error.message });
        }
      },

      activeride: async (req, res) => {
        try{
            const result = await hopinService.activeride(req.body);
            return res.status(200).json({success: true, data: result});
        } catch (error) {
            return res.status(500).json({success: false,message: error.message});
        }
    },
    updateridestatus: async (req, res) => {
        try{
            const result = await hopinService.updateridestatus(req.body);
            return res.status(200).json({success: true, data: result});
        } catch (error) {
            return res.status(500).json({success: false,message: error.message});
        }
    },
    ridehistory: async (req, res) => {
        try{
            const result = await hopinService.ridehistory(req.body);
            return res.status(200).json({success: true, data: result});
        } catch (error) {
            return res.status(500).json({success: false,message: error.message});
        }
    },
};

export default hopinController;