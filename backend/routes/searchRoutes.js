const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// POST http://localhost:3000/api/search/visual
router.post('/visual', searchController.searchByImage);

module.exports = router;