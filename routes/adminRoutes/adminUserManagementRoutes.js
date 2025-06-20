// Admin User Management Routes 

const express = require('express');
const router = express.Router();

const { getAllUser , toggleBlockUser, editUser} = require('../../controllers/adminController/adminUserManagementController');
const verifyToken = require("../../middlewares/verifyTokenMiddleware");
const adminOnly = require("../../middlewares/authorizedRoleMiddlewares/wrappers/adminOnly");

router.route('/userList').get(verifyToken, adminOnly, getAllUser);

router.route("/users/block/:userId").put(verifyToken, adminOnly, toggleBlockUser );

router.route("/users/edit").put(verifyToken, adminOnly, editUser );


module.exports = router;