const model = require('../../model/Model');
const scrap = require('./Scrap');
const express = require('express');
const router = express.Router();

router.get('/data', (req, res) => {
    res.json(model.data);
});

router.get('/', (req, res) => {
    scrap.data.result = [];
    const query = req.query.query;
    model.data.identifyingName = query;
    if (req.query.TrustPilot === 'on' && req.query.TrustedShops === undefined) {
        scrap.find('https://www.trustpilot.com/', 'search?query=', "TrustPilot", query)
            .then((result) => {
                console.log(result);
                res.render('index', {data: result})
            });
    } else if (req.query.TrustedShops === 'on' && req.query.TrustPilot === undefined) {
        scrap.find('https://www.trustedshops.de/', 'bewertung/info_', "TrustedShops", query)
            .then((result) => {
                console.log(result);
                res.render('index', {data: result})
            });
    } else {
        scrap.find(['https://www.trustpilot.com/', 'https://www.trustedshops.de/'], ['search?query=', 'bewertung/info_'], ["TrustPilot", "TrustedShops"], query)
            .then((result) => {
                console.log(result);
                res.render('index', {data: result})
            });
    }

});

module.exports = router;