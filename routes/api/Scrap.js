const axios = require('axios');
const cheerio = require('cheerio');
const rp = require('request-promise');
const model = require('../../model/Model');
let find = async (baseURL, searchURL, Host, keyword) => {
    if (Host === "TrustPilot") {
        await getTrustPilot(baseURL, searchURL, Host).then(r => model.data.result = model.data.result.concat(r));
    } else if (Host === "TrustedShops") {
        await getTrustedShops(baseURL, searchURL, Host, keyword).then(r => r => model.data.result = model.data.result.concat(r));
    } else {
        await getTrustPilot(baseURL, searchURL, Host).then(r => model.data.result = model.data.result.concat(r));
        await getTrustedShops(baseURL, searchURL, Host, keyword).then(r => r => model.data.result = model.data.result.concat(r));
    }
    return model.data;
};

const getTrustPilot = async (baseURL, searchURL, Host) => {
    const html = await rp(baseURL + searchURL);
    console.log(html);
    const entryMap = cheerio('a.search-result-heading', html).map(async (i, e) => {
        var entry = {
            "site": "",
            "businessUnitId": "",
            "displayName": "",
            "url": "",
            "claimed": "",
            "numberOfReviews": "",
            "trustScore": "",
            "numberOfStars": "",
            "categories": [],
            "displayImage": "",
            "description": ""
        };
        entry["url"] = e.attribs.href.slice(8);
        const link = baseURL + e.attribs.href;
        const innerHtml = await rp(link);
        const $ = cheerio.load(innerHtml);
        $('head').filter(function () {
            const data = $(this);
            const string1 = data.find('script[type="application/json"][data-initial-state="business-unit-info"]').html().trim();
            const string2 = data.find('script[type="application/json"][data-initial-state="business-unit-tracking-properties"]').html().trim();
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
            entry.site = Host;
        });
        $('body > main').filter(function () {
            const data = $(this);
            entry["displayImage"] = data.find('img.business-unit-profile-summary__image').attr("src");
            entry["description"] = data.find('.badge-card__section.inviting-status span').html();
            data.find('span.badge-card__title').html().trim();
        });
        return entry;
    }).get();
    return Promise.all(entryMap);
};

const getTrustedShops = async (baseURL, searchURL, Host, keyword) => {
    const url = "http://api.trustedshops.com/rest/public/v2/shops.json?url=";
    const response = await rp(url + keyword);
    var apiData = JSON.parse(response);
    for (const e of apiData.response.data.shops) {
        const link = baseURL + searchURL + e.tsId + ".html";
        const innerHtml = await rp(link);
        const entryMap = cheerio('a.shop-list-item', response).map(async (i, e) => {
            var entry = {
                "site": "",
                "businessUnitId": "",
                "displayName": "",
                "url": "",
                "validTill": "",
                "numberOfReviews": "",
                "trustScore": "",
                "numberOfStars": "",
                "categories": [],
                "displayImage": "",
                "description": ""
            };
            entry["site"]=Host;
            entry.site = Host;
            entry["url"] = valid;

            console.log(innerHtml);
            const $ = cheerio.load(innerHtml);
            $('head').filter(function () {
                const data = $(this);
                const string1 = data.find('script[type="application/json"][data-initial-state="business-unit-info"]').html().trim();
                const string2 = data.find('script[type="application/json"][data-initial-state="business-unit-tracking-properties"]').html().trim();
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
                const data = $(this);
                entry["displayImage"] = data.find('img.business-unit-profile-summary__image').attr("src");
                entry["description"] = data.find('.badge-card__section.inviting-status span').html();
                data.find('span.badge-card__title').html().trim();
            });
            return entry;
        }).get();
        return Promise.all(entryMap);
    }
};

module.exports.data = model.data;
module.exports.find = find;