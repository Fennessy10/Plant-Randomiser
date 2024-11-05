const puppeteer = require('puppeteer')
const minCeiled = 100;
const maxFloored = 57999;
const randomID = getRandomInt(minCeiled, maxFloored);

//{headless: false}

async function scrapeProduct(url) {
    // launch the browser but wait for puppeteer
    const browser = await puppeteer.launch()

    // launch the new tab of browser when ready
    const page = await browser.newPage();

    // go to the url mentioned at the bottom of the file
    await page.goto(url, {waitUntil: 'networkidle0'})

    // "$x" allows an item from a page via xpath (format that works well for web scrapers) 
    // this "await page.$x('/html/body/p[1]/img');" returns an array 
    // const el pulls out the first item from the array into a variable called el
    // this process is called destructuring
    // the reason we do this is so that we can convert the item from an array into a simple variable
    const [el] = await page.$$('xpath/./html/body/p[1]/img');

    // pull the source attribute from the item/element
    const src = await el.getProperty('src');

    // pull out the string from the source
    const srcTxt = await src.jsonValue();

    const [el2] = await page.$$('xpath/./html/body/h2');

    // pull the source attribute from the item/element
    const txt = await el2.getProperty('textContent');

    // pull out the string from the source
    const rawTxt = await txt.jsonValue();

    console.log(srcTxt, rawTxt);

    await browser.close();
}

function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
  }

scrapeProduct("https://www.anbg.gov.au/photo/apii/id/dig/" + randomID);