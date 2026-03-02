const express = require('express');
const router = express.Router();

const {
    addVehicle,
    viewVehicles,
    viewCompanyVehicles,
    removeVehicle
} = require('../controllers/vehicleController');

router.post('/addVehicle', addVehicle);
router.get('/viewVehicles', viewVehicles);
router.get('/companyVehicles', viewCompanyVehicles);
router.delete('/removeVehicle/:VehicleID', removeVehicle);

module.exports = router;
