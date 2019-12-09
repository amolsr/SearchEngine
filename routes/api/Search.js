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
    if (req.query.TrustPilot === 'on' && req.query.TrustedShops === undefined) {
        async function f() {
            const url = 'https://www.trustpilot.com/search?query=';
            scrap.find(query, url, 1);
            await sleep(246);
            console.log(scrap.data);
        }
        f().then(() => res.render('index', {data: scrap.data}));
    } else if (req.query.TrustedShops === 'on' && req.query.TrustPilot === undefined) {
        res.send(query + "  " + TrustPilot + "  " + TrustedShops);
        const url = 'https://www.trustedshops.eu/finder/?q=';
        scrap.find(query, url, 2);
    } else {
        res.send(query + "  " + TrustPilot + "  " + TrustedShops);
        const url1 = 'https://www.trustpilot.com/search?query=';
        const url2 = 'https://www.trustedshops.de/shops/?q=';
        scrap.find(query, url1, url2);
    }

});

function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

module.exports = router;