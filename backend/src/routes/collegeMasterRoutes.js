const express = require('express');
const router = express.Router();
const {
  TAMIL_NADU_DISTRICTS,
  TAMIL_NADU_ENGINEERING_COLLEGES,
  getMasterColleges,
  getMasterDistricts,
  getMasterCollegesByDistrict,
  searchMasterColleges,
  getMasterCollegeByCodeOrId
} = require('../db/tamilNaduEngineeringColleges');

/**
 * GET /api/college-master/districts
 * Returns list of all 38 districts of Tamil Nadu with counts of master colleges.
 */
router.get('/districts', (req, res) => {
  try {
    const counts = {};
    TAMIL_NADU_DISTRICTS.forEach(d => {
      counts[d] = 0;
    });

    TAMIL_NADU_ENGINEERING_COLLEGES.forEach(c => {
      if (counts[c.district] !== undefined) {
        counts[c.district]++;
      } else {
        counts[c.district] = 1;
      }
    });

    const districtList = TAMIL_NADU_DISTRICTS.map(district => ({
      name: district,
      collegesCount: counts[district] || 0
    }));

    return res.json({
      success: true,
      totalDistricts: TAMIL_NADU_DISTRICTS.length,
      districts: districtList
    });
  } catch (error) {
    console.error('Error fetching districts:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve districts' });
  }
});

/**
 * GET /api/college-master/search
 * Search colleges by keyword, code, city, district.
 * Query params: q (query string), district (optional district filter)
 */
router.get('/search', (req, res) => {
  try {
    const { q = '', district = '' } = req.query;
    const results = searchMasterColleges(q, district);
    return res.json({
      success: true,
      count: results.length,
      colleges: results
    });
  } catch (error) {
    console.error('Error searching colleges:', error);
    return res.status(500).json({ success: false, message: 'Failed to search colleges' });
  }
});

/**
 * GET /api/college-master/district/:district
 * Returns colleges in a specific district.
 */
router.get('/district/:district', (req, res) => {
  try {
    const { district } = req.params;
    const colleges = getMasterCollegesByDistrict(district);
    return res.json({
      success: true,
      district,
      count: colleges.length,
      colleges
    });
  } catch (error) {
    console.error(`Error fetching colleges for district ${req.params.district}:`, error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve district colleges' });
  }
});

/**
 * GET /api/college-master/:idOrCode
 * Returns a single college by TNEA code or ID.
 */
router.get('/:idOrCode', (req, res) => {
  try {
    const { idOrCode } = req.params;
    const college = getMasterCollegeByCodeOrId(idOrCode);
    if (!college) {
      return res.status(404).json({
        success: false,
        message: `College with code or ID "${idOrCode}" not found in Tamil Nadu master database.`
      });
    }
    return res.json({
      success: true,
      college
    });
  } catch (error) {
    console.error('Error fetching college by id/code:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve college details' });
  }
});

/**
 * GET /api/college-master
 * Returns all colleges, with optional query filters (district, type, limit).
 */
router.get('/', (req, res) => {
  try {
    const { district, type, limit } = req.query;
    let colleges = getMasterColleges();

    if (district) {
      const dLower = String(district).trim().toLowerCase();
      colleges = colleges.filter(c => c.district.toLowerCase() === dLower);
    }

    if (type) {
      const tLower = String(type).trim().toLowerCase();
      colleges = colleges.filter(c => c.collegeType.toLowerCase().includes(tLower));
    }

    const total = colleges.length;
    if (limit && !isNaN(parseInt(limit, 10))) {
      colleges = colleges.slice(0, parseInt(limit, 10));
    }

    return res.json({
      success: true,
      total,
      count: colleges.length,
      colleges
    });
  } catch (error) {
    console.error('Error listing colleges:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve colleges' });
  }
});

module.exports = router;
