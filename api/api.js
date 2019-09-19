const express = require('express');

const router = express.Router();

const price = require('./prices');

router.use(function(req, res, next) {
    next();
});

router.route('/product/:ean').get(price.lowestPrice);

module.exports = router;