const express = require('express');
const router = express.Router();
const pickupController = require('../controllers/pickupController');
router.post('/Scan',pickupController.scanBagAndPickup);
router.get('/viewPickup',pickupController.viewUserPickups);
module.exports=router;