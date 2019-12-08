const axios = require('axios');
const cheerio = require('cheerio');
var model = require('../../model/Model');
var entry = model.entry;
let find = function find(keyword, url, option) {
    model.data.identifyingName = keyword;
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
let getDataTrustPilot = function (html) {
    entry["site"] = "TrustPilot";
    const $ = cheerio.load(html);
    $('head').filter(function () {
        var data = $(this);
        var string1 = data.find('script[type="application/json"][data-initial-state="business-unit-info"]').html().trim();
        var string2 = data.find('script[type="application/json"][data-initial-state="business-unit-tracking-properties"]').html().trim();
        JSON.parse(string1, (key1, val1) => {
            Object.keys(entry).forEach(function (key) {
                if (key === key1) {
                    entry[key] = val1;
                }
            })
        });
        JSON.parse(string2, (key1, val1) => {
            Object.keys(entry).forEach(function (key) {
                if (key1 === key) {
                    entry[key] = val1;
                }
            })
        });
        entry.categories = JSON.parse(string2)["categories"];
    });
    $('body > main').filter(function () {
        var data = $(this);
        entry["displayImage"] = data.find('img.business-unit-profile-summary__image').attr("src");
        entry["description"] = data.find('.badge-card__section.inviting-status span').html();
        model.data.result.push(entry);
        console.log(model.data);
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

module.exports.data = model.data;
module.exports.find = find;