//required to serve request to endpoint
var router = require('express').Router();

//required to get to page and extract data
var puppeteer = require('puppeteer');

//case in which a sell order is requested
router.route('/ask/:ticker').get(async (req, res) => {
    //saves the ticker that was given by user
    let ticker = req.ticker;

    //creates a browser that can view pages on internet
    const browser = await puppeteer.launch({
        headless:true,
        args: ['--no-sandbox', 'disable-setuid-sandbox']
    });
    
    //creates new page in said browser
    const page = await browser.newPage();
    
    //url that is to be scraped
    let url = `https://finance.yahoo.com/quote/${ticker}?p=${ticker}&.tsrc=fin-srch`;

    //opens page with timeout constraints
    await page.goto(url);
    await page.waitForTimeout('#quote-market-notice', {timeout: 1000});

    //gets price on the page
    let price = await page.evaluate(() => document.querySelector('#quote-summary > div.D\\(ib\\).W\\(1\\/2\\).Bxz\\(bb\\).Pend\\(12px\\).Va\\(t\\).ie-7_D\\(i\\).smartphone_D\\(b\\).smartphone_W\\(100\\%\\).smartphone_Pend\\(0px\\).smartphone_BdY.smartphone_Bdc\\(\\$seperatorColor\\) > table > tbody > tr:nth-child(4) > td.Ta\\(end\\).Fw\\(600\\).Lh\\(14px\\) > span').textContent);
    if(!page){
        console.log(`Not working for ID:`);
    }
    await browser.close();

    res.send({ticker, price});

})

//case in which a buy order is requested
router.route('/bid/:ticker').get(async (req, res) => {
    let ticker = req.ticker;

    const browser = await puppeteer.launch({
        headless:true,
        args: ['--no-sandbox', 'disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    let url = `https://finance.yahoo.com/quote/${ticker}?p=${ticker}&.tsrc=fin-srch`;
    await page.goto(url);
    await page.waitForTimeout('#quote-market-notice', {timeout: 1000});
    let price = await page.evaluate(() => {
        const val = document.querySelector('#quote-summary > div.D\\(ib\\).W\\(1\\/2\\).Bxz\\(bb\\).Pend\\(12px\\).Va\\(t\\).ie-7_D\\(i\\).smartphone_D\\(b\\).smartphone_W\\(100\\%\\).smartphone_Pend\\(0px\\).smartphone_BdY.smartphone_Bdc\\(\\$seperatorColor\\) > table > tbody > tr:nth-child(3) > td.Ta\\(end\\).Fw\\(600\\).Lh\\(14px\\) > span');
        if(val != null){
            return val.textContent;
        }
        else{
            return null;
        }
    })
    if(price === null){
        console.log('error');
        res.send(null);
        return;
    }
    await browser.close();

    res.send({ticker, price});

})

router.param('ticker', (req, res, next, ticker) => {
    req.ticker = ticker.toUpperCase();
    next();
})



module.exports = router;