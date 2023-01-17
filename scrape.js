const axios = require("axios");
const cheerio = require("cheerio");
const { Client } = require('pg');
require('dotenv').config();
const moment = require('moment-timezone');
const table2json = require('html-table-to-json');

/**
 * TCEQ Class for scraping air quality data.
 */
class TCEQ {
    // Setting local TZ because all TCEQ monitors are in Texas.
    local_tz = moment.tz.zone("America/Chicago");
    url = "https://www.tceq.texas.gov/cgi-bin/compliance/monops/daily_summary.pl";
    site = 56  // Denton Airport South

    removeAttrs(soup) {
        for (let tag of soup.findAll(true)) {
            tag.attrs = null;
        }
        return soup;
    }

    daterange(start_date, end_date) {
        let range = [];
        for (let i = 0; i <= end_date.diff(start_date, 'days'); i++) {
            range.push(moment(start_date).add(i, 'days'));
        }
        return range;
    }

    async getOptions(format = null) {
        let opts = [];
        let resp = await axios.get(this.url);
        let soup = cheerio.load(resp.data);
        let options = soup("select[name='select_site']")[0];
        for (let option of options.children) {
            let value = option.attribs.value;
            if (value.startsWith('site')) {
                opts.push(value);
            }
        }

        if (format === 'json') {
            let tmp = [];
            for (let val of opts) {
                let obj = { desc: "", aqs: "", cas: "" };
                for (let i = 0; i < val.split('|').length; i++) {
                    if (i === 1) {
                        obj.desc = val.split('|')[i];
                    }
                    if (i === 2) {
                        obj.aqs = val.split('|')[i];
                    }
                    if (i === 3) {
                        obj.cas = val.split('|')[i];
                    }
                }
                tmp.push(obj);
            }
            return tmp;
        }

        // Else, return strings.
        return opts;
    }

    async getHtml(timestamp = null) {
        // Give default timestamp
        if (!timestamp) {
            timestamp = moment().tz("America/Chicago").format();
        }

        // Generate date
        let date = moment.tz(timestamp, "America/Chicago");

        // Prepare JSON
        let params = {
            select_date: "user",
            user_month: date.month() + 1,  // TCEQ has a weird offset.
            user_day: date.date() - 1,
            user_year: date.year(),
            select_site: "|||" + this.site,
            'time_format': "24hr"
        }

        const searchParams = new URLSearchParams(params).toString();
        const url = new URL(this.url + '?' + searchParams);
        return await axios.get(url);
    }

    async getTable() {
        let resp = await this.getHtml();
        const $ = cheerio.load(resp.data);
        console.log($("table:last").contents());
        // $("table:last").each((index, element) => {
        //     console.log($(element).text());
        // });
    }
}

(async () => {
    const tceq = new TCEQ();
    tceq.getTable()
})();


