const model = require('../../model/Model');
const scrap = require('./Scrap');
const express = require('express');
const router = express.Router();

router.get('/data', (req, res) => {
    res.json(model.data);
});
router.get('/', (req, res) => {
    scrap.data.result = [];
    var query = req.query.query;
    var TrustPilot = req.query.TrustPilot;
    var TrustedShops = req.query.TrustedShops;
    model.data.identifyingName = query;
    if (req.query.TrustPilot === 'on' && req.query.TrustedShops === undefined) {
        Search("TrustPilot", 'https://www.trustpilot.com/', 'search?query=', query)
            .then((result) => res.render('index', {data: result}));
    } else if (req.query.TrustedShops === 'on' && req.query.TrustPilot === undefined) {
        Search("TrustedShops", 'https://www.trustedshops.de/', 'bewertung/info_', query)
            .then((result) => res.render('index', {data: result}));
    } else {
        res.send(query + "  " + TrustPilot + "  " + TrustedShops);
        const url1 = 'https://www.trustpilot.com/search?query=';
        const url2 = 'https://www.trustedshops.de/shops/?q=';
        scrap.find(query, url1, url2);
    }

});

async function Search(site, baseURL, searchURL, keyword) {
    const subURL = searchURL + keyword;
    await scrap.find(baseURL, subURL, site, keyword);
    return scrap.data;
}

module.exports = router;