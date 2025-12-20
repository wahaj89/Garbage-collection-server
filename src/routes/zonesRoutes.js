const express = require('express');
const router = express.Router();
const zonesController = require('../controllers/zonesController');

// Zones
router.post('/addZone', zonesController.addZone);
router.get('/viewZones', zonesController.viewZones);

// Company Zones
router.get('/viewCompanyZones/:CompanyID', zonesController.viewCompanyZones);
router.get('/viewActiveCompanyZones/:CompanyID', zonesController.viewActiveCompanyZones);

// Active Zones
router.get('/viewActiveZones', zonesController.viewActiveZones);

// Remove Zone (soft delete)
router.patch('/deleteZone/:ZoneID', zonesController.removeZone);

// User ↔ Zone
router.post('/addUserToZone', zonesController.assignUserToZone);

// View users in a zone
router.get('/viewZoneUsers', zonesController.viewUsersInZone);

// View zones of a user
//router.get('/viewUserZones/:UserID', zonesController.viewUserZones);
router.get('/viewUserZones', zonesController.viewUserZones);

module.exports = router;
