const axios = require('axios');
const cheerio = require('cheerio');
const json = require('../../model/Model');

let find = function find(keyword, url, option) {
    if (option === 1) {
        axios.get(url + keyword).then(res => {
            getDataTrustPilot(res.data);
        }).catch(error => {
            console.log(error);
        })
    } else if (option === 2) {
        axios.get(url + keyword).then(res => {
            // getDataTrustShops(res.data);
        }).catch(error => {
            console.log(error);
        })
    }
};
let getDataTrustPilot = html => {
    const $ = cheerio.load(html);
    $('head').filter(function () {
        var data = $(this);
        var string1 = data.find('script[type="application/json"][data-initial-state="business-unit-info"]').html().trim();
        var string2 = data.find('script[type="application/json"][data-initial-state="business-unit-tracking-properties"]').html().trim();
        json = Object.assign(JSON.parse(string1), JSON.parse(string2));
    });
    $('body > main').filter(function () {
        var data = $(this);
        json["displayImage"] = data.find('img.business-unit-profile-summary__image').attr("src");
        json["description"] = data.find('.badge-card__section.inviting-status span').html();
        // console.log(json);
    });
};

// let getDataTrustShops = html => {
//     var json;
//     const $ = cheerio.load(html);
//     $('head').filter(function () {
//         var data = $(this);
//         var string1 = data.find('script[type="application/json"][data-initial-state="business-unit-info"]').html().trim();
//         var string2 = data.find('script[type="application/json"][data-initial-state="business-unit-tracking-properties"]').html().trim();
//         json = Object.assign(JSON.parse(string1), JSON.parse(string2));
//     });
//     $('body > main').filter(function () {
//         var data = $(this);
//         json["displayImage"] = data.find('img.business-unit-profile-summary__image').attr("src");
//         json["description"] = data.find('.badge-card__section.inviting-status span').html();
//         console.log(json);
//     });
// };
module.exports.find = find;