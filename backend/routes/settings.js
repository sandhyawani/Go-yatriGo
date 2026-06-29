const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { verifyToken, protect } = require('../middleware/verifyToken');


router.use(verifyToken);

router.get('/', settingsController.getSettings);
router.patch('/', settingsController.updateSettings);
router.patch('/2fa', settingsController.update2FA);
router.get('/login-activity', settingsController.getLoginActivity);
router.post('/logout-other-devices', settingsController.logoutOtherDevices);
router.post('/delete-account', settingsController.deleteAccount);
router.post('/deactivate-account', settingsController.deactivateAccount);

module.exports = router;
