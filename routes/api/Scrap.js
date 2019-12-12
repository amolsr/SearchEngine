const cheerio = require('cheerio');
const rp = require('request-promise');
const model = require('../../model/Model');
const puppeteer = require('puppeteer');

let find = async (baseURL, searchURL, Host, keyword) => {
    if (!(typeof baseURL === "object")) {
        if (Host === "TrustPilot") {
            await getTrustPilot(baseURL, searchURL + keyword).then(r => model.data.result = r);
        } else if (Host === "TrustedShops") {
            await getTrustedShops(baseURL, searchURL, keyword).then(r => model.data.result = r);
        }
    } else {
        await getTrustPilot(baseURL[0], searchURL[0] + keyword).then(r => model.data.result = r);
        await getTrustedShops(baseURL[1], searchURL[1], keyword).then(r => model.data.result = model.data.result.concat(r));
    }
    return model.data;
};

let fetchTill = (async (url, componentSelector) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url); // Add the URL you want to fetch
    await page.waitForSelector(componentSelector, {
        timeout: 5000,
    });
    let bodyHTML = await page.evaluate(() => document.head.innerHTML + document.body.innerHTML);
    await browser.close();
    return bodyHTML;
});

const getTrustPilot = async (baseURL, searchURL) => {
    try {
        const html = await fetchTill(baseURL + searchURL, 'aside.company-info');
        const url = searchURL.slice(searchURL.lastIndexOf("=") + 1,);
        console.log(html);
        const entry = parseTrustPilot(html, url);
        return Promise.all([entry]);
    } catch (e) {
        const html = await rp(baseURL + searchURL);
        const entryMap = cheerio('a.search-result-heading', html).map(async (i, e) => {
            const url = e.attribs.href.slice(8);
            const link = baseURL + e.attribs.href;
            const innerHtml = await fetchTill(link, 'aside.company-info');
            return parseTrustPilot(innerHtml, url);
        }).get();
        return Promise.all(entryMap);
    }
};

const getTrustedShops = async (baseURL, searchURL, keyword) => {
    const url = "http://api.trustedshops.com/rest/public/v2/shops.json?url=";
    const response = await rp(url + keyword);
    var apiData = JSON.parse(response);
    const entryMap = apiData.response.data.shops.map(async (i) => {
        const link = baseURL + searchURL + i.tsId + ".html";
        const innerHtml = await rp(link);
        const $ = cheerio.load(innerHtml);
        var entry = {
            "site": "TrustedShops",
            "displayName": "",
            "url": "",
            "validTill": "",
            "numberOfReviews": "",
            "numberOfStars": "",
            "categories": [],
            "displayImage": "",
            "description": ""
        };
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
                    entry.categories.push(escape($(element).html()));
            });
            entry.description = escape(data.find('shop-details > div > div.col-12.fw-light.mt-1').html());
            entry.validTill = data.find('div.col.certificate-details > div:nth-child(3) > div > span:nth-child(3)').html();
        });
        return entry;
    });
    return Promise.all(entryMap);
};

let parseTrustPilot = (html, url) => {
    var entry = {
        "site": "TrustPilot",
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
    entry.url = url;
    const $ = cheerio.load(html);
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
        entry.categories = JSON.parse(string2)["categories"].map((e) => {
            return escape(e)
        });
    });
    $('body > main').filter(function () {
        const data = $(this);
        entry.displayImage = data.find('img.business-unit-profile-summary__image').attr("src");
        entry.claimed = data.find('.badge-card__section.inviting-status span').html().trim();
        entry.description = escape(data.find('div.company-description__text').text());
    });
    return entry;
};

module.exports.data = model.data;
module.exports.find = find;