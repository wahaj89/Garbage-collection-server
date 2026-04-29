const express = require('express');
const router = express.Router();

const {
    addVehicle,
    viewVehicles,
    viewCompanyVehicles,
    removeVehicle
} = require('../controllers/vehicleController');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/addVehicle', addVehicle);
router.get('/viewVehicles', viewVehicles);
router.get('/companyVehicles', viewCompanyVehicles);
router.delete('/removeVehicle/:VehicleID', removeVehicle);

module.exports = router;
