const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

const adminController = require('../controllers/adminController');

router.get(
    '/pendingCompanies', authMiddleware,adminMiddleware, adminController.viewPendingCompanies
);

router.post(
    '/approveCompany',
    authMiddleware,
    adminMiddleware,
    adminController.approveCompany
);

router.post(
    '/rejectCompany',
    authMiddleware,
    adminMiddleware,
    adminController.rejectCompany
);

module.exports = router;
