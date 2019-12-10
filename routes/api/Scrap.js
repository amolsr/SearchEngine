const cheerio = require('cheerio');
const rp = require('request-promise');
const model = require('../../model/Model');
let find = async (baseURL, searchURL, Host, keyword) => {
    if (Host === "TrustPilot") {
        await getTrustPilot(baseURL, searchURL + keyword, Host).then(r => model.data.result = r);
    } else if (Host === "TrustedShops") {
        await getTrustedShops(baseURL, searchURL, Host, keyword).then(r => r => model.data.result = r);
    } else {
        await getTrustPilot(baseURL, searchURL + keyword, Host).then(r => model.data.result = r);
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
    const entryMap = apiData.response.data.shops.map(async (i) => {
        const link = baseURL + searchURL + i.tsId + ".html";
        const innerHtml = await rp(link);
        const $ = cheerio.load(innerHtml);
        var entry = {
            "site": "",
            "displayName": "",
            "url": "",
            "validTill": "",
            "numberOfReviews": "",
            "numberOfStars": "",
            "categories": [],
            "displayImage": "",
            "description": ""
        };
        entry["site"] = Host;
        entry.site = Host;
        entry["url"] = i.url;
        $('head').filter(function () {
            const data = $(this);
            const string1 = data.find('script[type="application/ld+json"]').html().trim();
            var string1JSON = JSON.parse(string1);
            entry.displayName = string1JSON.name;
            entry.numberOfReviews = string1JSON.aggregateRating.reviewCount;
            entry.numberOfStars = string1JSON.aggregateRating.ratingValue;
            entry.displayImage = string1JSON.image;
        });
        $('body').filter(function () {
            const data = $(this);
            data.find('span.category > span').each((index, element) => {
                if (!entry.categories.includes($(element).html()))
                    entry.categories.push($(element).html());
            });
            entry.description = data.find('shop-details > div > div.col-12.fw-light.mt-1').html();
            entry.validTill = data.find('div.col.certificate-details > div:nth-child(3) > div > span:nth-child(3)').html();
        });
        console.log(entry);
        return entry;
    });
    return Promise.all(entryMap);
};

module.exports.data = model.data;
module.exports.find = find;