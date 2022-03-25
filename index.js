const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');
const TradeOfferManager = require('steam-tradeoffer-manager');
const SteamTotp = require('steam-totp');

const cheerio = require('cheerio')
const puppeteer = require('puppeteer');

const fs = require('fs');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');
const { promises } = require('dns');
const { processItems } = require('steam-tradeoffer-manager/lib/helpers');
const { SMSCodeFailed } = require('steamcommunity/resources/EResult');

SELFID = '76561199059452718'

// How to get cookies:
// 1. pass cloudflare protection on a normal chrome browser
// 2. export cookies as array 
// 3. paste into const cookies

const BACKPACKCOOKIES = JSON.parse(fs.readFileSync('cookies.json'));
const CHROME = JSON.parse(fs.readFileSync('chrome.json'));

const chromeOptions = { 
    headless:false,
    defaultViewport: null,
    executablePath:  CHROME.path
};

const client = new SteamUser();
const community = new SteamCommunity();
const manager = new TradeOfferManager( {
    steam: client,
    community: community,
    language: 'en'
});

const credentials = JSON.parse(fs.readFileSync('credentials.json'));
const BLACKLIST = JSON.parse(fs.readFileSync('blacklist.json'));

let negotiableList = [];
let offerUrlList = [];
let idList = [];
let histUrlList = [];
let statsUrlList = [];
let commentList = [];
let hatNameList = [];
let effectNameList = [];
let partnerKeyList = [];
let selfKeyList = [];
let partnerUnusualList = [];
let selfUnusualList = [];
let strangeList = [];
let DUPED = false;
let BADBOTS = false;
let BOTPRICE = 0;
let MYBOTPRICE = 99999;
let SAMPLEINV = true;
let SETTINGS = JSON.parse(fs.readFileSync('settings.json'));
let INCBOTPRICE = 0;
let KEYINREF = "error";
let thisUnusualName = '';
let thisUnusualEffect = '';

//Declaring everything
//
//
//
//Declaring scrape functions

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
} 

async function getKeyPrice() {
    const page = await browser.newPage();

    await page.setDefaultNavigationTimeout(120000); 

    await page.setCookie(...BACKPACKCOOKIES)
    await page.goto('https://backpack.tf/classifieds?item=Mann+Co.+Supply+Crate+Key&quality=6&tradable=1&craftable=1&australium=-1&killstreak_tier=0');
    let HTML = await page.content();

    let $ = cheerio.load(await HTML);
    let newId = ''
    $('.item.q-440-5.q-440-border-5').each((i, el) => {
        let tmpEffectName = EffectName
        if ($(el).text().includes(tmpEffectName)) {
            newId = $(el).attr('data-effect_id');
        }
    });

    

    HTML = await page.content();

    $ = cheerio.load(await HTML)

    let sellerPrices = [];
    
    sellListings = $('.col-md-6').html();

    $ = cheerio.load(await sellListings);

    $('.listing-item').each((i, el) => {
        sellerPrices.push(Number($(el).children().children().next().children().text().replace(' ref', '')));
    });

    if (sellerPrices.length>0) {
        let sum = 0;
        for (i=0; i<sellerPrices.length; i++) {
            sum+=sellerPrices[i];
        }
        KEYINREF = sum/sellerPrices.length;
    } else {
        console.log('Bruh');
        process.kill(process.pid);
    }

    page.close();
    await sleep(Math.floor(Math.random() * (5000 - 1000) + 1000))
}

async function getUnusualStats(HatName, EffectName) {
    INCBOTPRICE=0;
    const page = await browser.newPage();

    await page.setDefaultNavigationTimeout(120000); 

    await page.setCookie(...BACKPACKCOOKIES)
    await page.goto('https://backpack.tf/unusual/'+ HatName)
    let HTML = await page.content();

    let $ = cheerio.load(await HTML);
    let newId = ''
    $('.item.q-440-5.q-440-border-5').each((i, el) => {
        let tmpEffectName = EffectName
        if ($(el).text().includes(tmpEffectName)) {
            newId = $(el).attr('data-effect_id');
        }
    });

    await page.goto('https://backpack.tf/stats/Unusual/' + HatName + '/Tradable/Craftable/' + newId);

    HTML = await page.content();

    $ = cheerio.load(await HTML)

    let buyerPrices = [];
    
    buyListings = $('.col-md-6').next().html();

    $ = cheerio.load(await buyListings);

    $('.listing-item').each((i, el) => {
        if (!$(el).html().includes('Strange')) {
            buyerPrices.push(Number($(el).children().children().next().children().text().replace(' keys', '')));
        }
    });

    await buyerPrices

    if (buyerPrices.length>1) {
        if (buyerPrices[0]-buyerPrices[1]>1.5) {
            INCBOTPRICE=buyerPrices[1]*KEYINREF;
        } else {
            INCBOTPRICE=buyerPrices[0]*KEYINREF;
        }
    } else {
        console.log('Received Offer Has Bad Buyers');
    }
    page.close();
    await sleep(Math.floor(Math.random() * (5000 - 1000) + 1000))
}

async function getItemStats(quality, name, craftable) {
    INCBOTPRICE=0;
    if (quality=='Decorated Weapon') {
        return;
    }
    const page = await browser.newPage();

    await page.setDefaultNavigationTimeout(120000); 

    await page.setCookie(...BACKPACKCOOKIES)
    await page.goto('https://backpack.tf/stats/'+quality+'/'+name+'/Tradable/'+craftable)
    let HTML = await page.content();

    let $ = cheerio.load(await HTML);

    await page.goto('https://backpack.tf'+$('.btn.btn-default.btn-sm.btn-circle-sm').attr('href'))

    HTML = page.content();

    $ = cheerio.load(await HTML);

    let buyerPrices = [];
    
    buyListings = $('.col-md-6').next().html();

    $ = cheerio.load(await buyListings);

    $('.listing-item').each((i, el) => {
        if (!$(el).html().includes('paint') && !$(el).next().html().includes('Parts Attached') && !$(el).html().includes('Festivized')) {
            if ($(el).children().children().next().children().text().includes('ref')) {
                buyerPrices.push(Number($(el).children().children().next().children().text().replace(' ref', '')));
            } else {
                buyerPrices.push(Number($(el).children().children().next().children().text().replace(' key', ''))*KEYINREF)
            }
        } 
    })
    buyerPrices.length=3;
    let sum = 0;

    for (i=0; i<buyerPrices.length; i++) {
        sum += Number(buyerPrices[i])
    }

    INCBOTPRICE = sum/buyerPrices.length;
    page.close()
    await sleep(Math.floor(Math.random() * (5000 - 1000) + 1000))
}

async function scrapeList(pageNo) {

    negotiableList.length = 0;
    offerUrlList.length = 0;
    idList.length = 0;
    histUrlList.length = 0;
    statsUrlList.length = 0;
    commentList.length = 0;
    hatNameList.length = 0;
    effectNameList.length = 0;
    strangeList.length = 0;

    const url='https://backpack.tf/classifieds?page=' + pageNo + '&slot=misc&quality=5&offers=1'

    const page = await browser.newPage();

    await page.setDefaultNavigationTimeout(120000); 
    await page.setCookie(...BACKPACKCOOKIES)
    await page.goto(url)
    const HTML = await page.content();

    const $ = cheerio.load(await HTML);

    $('.listing-item').each((i, el) => {
        offerUrlList.push($(el).children().attr('data-listing_offers_url'));
        histUrlList.push('https://backpack.tf/item/'+$(el).children().attr('data-original_id'));
        commentList.push($(el).children().attr('data-listing_comment'));
        if ($(el).html().includes('Strange') || $(el).children().attr('data-effect_name')+$(el).children().attr('data-base_name')==thisUnusualEffect+thisUnusualName) {
            strangeList.push(true)
        } else {
            strangeList.push(false)
        }
        if ($(el).next().children().children().next().html().includes('Click to open a Trade Offer with this user. Negotiation is allowed.')) {
            negotiableList.push(true)
        } else {
            negotiableList.push(false)
        }
        const thisEffectId = $(el).children().attr('data-effect_id')
        const thisEffectName = $(el).children().attr('data-effect_name')
        const thisHatName = $(el).children().attr('data-base_name')
        hatNameList.push(thisHatName);
        effectNameList.push(thisEffectName);
        statsUrlList.push('https://backpack.tf/stats/Unusual/' + thisHatName + '/Tradable/Craftable/' + thisEffectId)
    });
    $('.user-link').each((i, el) => {
        idList.push($(el).attr('href').replace('/u/', ''))
    })

    await Promise.all([offerUrlList], [idList], [histUrlList], [commentList], [statsUrlList], [hatNameList], [effectNameList]);
    page.close()
    await sleep(Math.floor(Math.random() * (5000 - 1000) + 1000))
}

async function scrapeHist(itemNo) {
    DUPED = true

    // const browser = await puppeteer.launch(chromeOptions);
    const page = await browser.newPage();

    await page.setDefaultNavigationTimeout(120000); 

    await page.setCookie(...BACKPACKCOOKIES);
    await page.goto(histUrlList[itemNo]);
    const HTML = await page.content();
    
    if (!HTML.includes('Dup')) {
        DUPED=false
    }
    await DUPED;
    page.close()
    await sleep(Math.floor(Math.random() * (5000 - 1000) + 1000))
}

async function scrapePrice(itemNo) {

    BADBOTS = true
    BOTPRICE = 0

    // const browser = await puppeteer.launch(chromeOptions);
    const page = await browser.newPage();

    await page.setDefaultNavigationTimeout(120000); 

    await page.setCookie(...BACKPACKCOOKIES);
    await page.goto(statsUrlList[itemNo]);
    const HTML = await page.content();

    let $ = cheerio.load(await HTML);

    buyListings = $('.col-md-6').next().html();

    let priceChange = false;
    let noPrice = true;

    $('.gutter').each((i, el) => {
        if (!$(el).html().includes('disabled')) {
            priceChange = true;
        }
    });

    $('.value').each((i, el) => {
        if ($(el).text().includes('key')) {
            noPrice = false;
        }
    })

    $ = cheerio.load(buyListings);

    buyerPrices = [];

    $('.listing-item').each((i, el) => {
        if (!$(el).html().includes('Strange')) {
            buyerPrices.push(Number($(el).children().children().next().children().text().replace(' keys', '')));
        }
    });
    
    if (buyerPrices.length>2 && priceChange==false && noPrice==false) {
        if (buyerPrices[0]-buyerPrices[1]<0.3) {
            BADBOTS=false
            BOTPRICE=Math.round(buyerPrices[0])
        }
    }

    await Promise.all([BADBOTS], [BOTPRICE])
    page.close()
    await sleep(Math.floor(Math.random() * (5000 - 1000) + 1000))
}
//Declaring scrape functions
//
//
//
//Declaring trade functions

//looks a bit like:

async function readSelfInventory() {
    selfKeyList.length = 0;
    selfUnusualList.length = 0;
    
    const inventory = await new Promise((resolve, reject) => {
        manager.getUserInventoryContents(SELFID, 440, 2, true, (err, inventory) => {
          return resolve(inventory);
        });
    });
    SAMPLEINV = inventory
    for (let i = 0; i < inventory.length; i++) {
        if (inventory[i].market_hash_name=='Mann Co. Supply Crate Key') {
            selfKeyList.push(inventory[i]);
        } else if (inventory[i].market_hash_name.includes('Unusual')) {
            selfUnusualList.push(inventory[i]);
            thisUnusualName=inventory[i].market_hash_name.replace('Unusual ', '');
            for (let j=0; j<inventory[i].descriptions.length; j++) {
                if (inventory[i].descriptions[j].value.includes('★')) {
                    thisUnusualEffect=inventory[i].descriptions[j].value.replace('★ Unusual Effect: ', '');
                    break // < -- super important, don't fuck this up
                }
            }
        }
    }
    
    // const browser = await puppeteer.launch(chromeOptions);
    const page = await browser.newPage();

    await page.setDefaultNavigationTimeout(120000); 

    await page.setCookie(...BACKPACKCOOKIES)
    await page.goto('https://backpack.tf/unusual/'+ thisUnusualName)
    let HTML = await page.content();

    let $ = cheerio.load(await HTML);

    let newId = ''
    await $('.item.q-440-5.q-440-border-5').each((i, el) => {
        if ($(el).text().includes(thisUnusualEffect)) {
            newId = $(el).attr('data-effect_id');
        }
    });

    await page.goto('https://backpack.tf/stats/Unusual/' + thisUnusualName + '/Tradable/Craftable/' + newId);

    HTML = await page.content();

    $ = cheerio.load(await HTML)

    buyListings = $('.col-md-6').next().html();

    $ = cheerio.load(await buyListings);

    buyerPrices = [];

    $('.listing-item').each((i, el) => {
        if (i<2) {
            buyerPrices.push(Number($(el).children().children().next().children().text().replace(' keys', '')));
        }
    });

    await buyerPrices

    if (buyerPrices.length>0) {
        MYBOTPRICE=Math.round(buyerPrices[0])
    } else {
        console.log('WARNING : NO BUYERS');
        process.kill(process.pid);
    }

    await MYBOTPRICE;

    let sampleunusual = thisUnusualEffect+' '+thisUnusualName;
    if (SETTINGS.unusual!=sampleunusual) {
        SETTINGS = {
            "blacklist": [],
            "pageNo": 1,
            "unusual": thisUnusualEffect+' '+thisUnusualName,
            "waited" : false
        }
        fs.writeFileSync('settings.json', JSON.stringify(SETTINGS));
    } 
    
    page.close()
    await sleep(Math.floor(Math.random() * (5000 - 1000) + 1000))
}

async function readInventory(itemNo) {
    partnerKeyList.length = 0;
    partnerUnusualList.length = 0;
    const inventory = await new Promise((resolve, reject) => {
        manager.getUserInventoryContents(idList[itemNo], 440, 2, true, (err, inventory) => {
          return resolve(inventory);
        });
    });
    for (let i =0; i<inventory.length; i++) {
        if (inventory[i].market_hash_name=='Mann Co. Supply Crate Key') {
            partnerKeyList.push(inventory[i]);
        } else if (inventory[i].market_hash_name.includes('Unusual') && inventory[i].market_hash_name.includes(hatNameList[itemNo])) {
            for (let j=0; j<inventory[i].descriptions.length; j++) {
                if (inventory[i].descriptions[j].value.includes('★') && inventory[i].descriptions[j].value.includes(effectNameList[itemNo])) {
                    partnerUnusualList.push(inventory[i])
                    break // < -- super important, don't fuck this up
                }
            }
        }
    }
}

async function sendTrade(itemNo) {

    const inventory = await new Promise((resolve, reject) => {
        manager.getUserInventoryContents(SELFID, 440, 2, true, (err, inventory) => {
          return resolve(inventory);
        });
    });
    if (typeof inventory == 'undefined') {
        return;
    }
    for (let i=0; i<inventory.length; i++) {
        if (inventory[i].market_hash_name!=SAMPLEINV[i].market_hash_name) {
            console.log('WARNING : INVENTORY CHANGED')
            process.kill(process.pid);
        }
    }
    const offer = manager.createOffer(offerUrlList[itemNo]);

    if (MYBOTPRICE+1>BOTPRICE) {
        if (MYBOTPRICE+1-BOTPRICE>partnerKeyList.length) {
            return;
        } 
        for (let i=0; i<MYBOTPRICE+1-BOTPRICE; i++) {
            offer.addTheirItem(partnerKeyList[i]);
        }
        //add their keys
    } else if (MYBOTPRICE+1<BOTPRICE) {
        if (BOTPRICE-(MYBOTPRICE+1)>selfKeyList.length) {
            return;
        }
        for (let i=0; i<BOTPRICE-(MYBOTPRICE+1); i++) {
            offer.addMyItem(selfKeyList[i]);
        }
        //add my keys
    }

    if (partnerUnusualList.length<1 || selfUnusualList.length<1) {
        return;
    }

    offer.addTheirItem(partnerUnusualList[0]);
    offer.addMyItem(selfUnusualList[0]);

    finaloffer = await new Promise((resolve, reject) => {
        finaloffer=offer
        finaloffer.send((err, status) => {
            if (err) {
              console.log('Error sending trade: ' + err.cause);
              if (err.cause=='OfferLimitExceeded') {
                  process.kill(process.pid);
              } else if (err.cause=='TargetCannotTrade') {
                    SETTINGS.blacklist.push(idList[itemNo]);
                    fs.writeFileSync('settings.json', JSON.stringify(SETTINGS));
              } else if (typeof err.cause == 'undefined') {
                console.log(err);
                console.log("undefined error")
              }
            } else {
              console.log('Sent offer');
              SETTINGS.blacklist.push(idList[itemNo]);
              fs.writeFileSync('settings.json', JSON.stringify(SETTINGS));
            }
            return resolve(finaloffer)
        });
    });
}

//Declaring trade functions




client.on('loggedOn', () => {
    console.log('successfully logged in');
});

client.on('sessionExpired', () => {
    client.logOn(credentials2);
});

client.on('webSession', (sessionid, cookies) => {
    manager.setCookies(cookies);
    community.setCookies(cookies);
    community.startConfirmationChecker(10000, 'Q9fPv3+I5v6F2Jrz20U3iFVrJ00=');
});


let browser = 1;




(async () => {

    const offset = await new Promise((resolve, reject) => {
        SteamTotp.getTimeOffset(function(error, offset, latency){
            return resolve(offset);
        });
    });
    

    const credentials2 = {
        accountName : credentials.accountName,
        password: credentials.password,
        twoFactorCode: SteamTotp.getAuthCode(credentials.twoFactorCode, offset)
    };

    client.logOn(credentials2);

    browser = await puppeteer.launch(chromeOptions);

    try {
        await readSelfInventory();
    } catch (e) {
        console.log(e)
        process.kill(process.pid);
    }

    if (SETTINGS.pageNo>=600) {

    } else if (SETTINGS.pageNo<4) {
        SETTINGS.pageNo=1;
    } else {
        SETTINGS.pageNo-=3;
    }
    while (true) {
        
        if (SETTINGS.pageNo>600) {

            if (SETTINGS.waited == false) {
                for (hour=0; hour<10; hour++) {
                    await sleep(3600000);
                }
            }
            SETTINGS.waited = true;
            fs.writeFileSync('settings.json', JSON.stringify(SETTINGS));

            try {
                await getKeyPrice();
            } catch (e) {
                console.log(e)
                process.kill(process.pid);
            }

            const offers = await new Promise((resolve, reject) => {
                manager.getOffers(1, (err, sent, received) => {
                  return resolve(received);
                });
            });

            let unusualBoth = [];
            let netGain = [];

            for (let i=0; i<offers.length; i++) {


                let unusualTheirs = false;
                let unusualMine = false;
                let theirTotal = 0;
                let myTotal = 0;
                for (j=0; j<offers[i].itemsToGive.length; j++) {
                    if (offers[i].itemsToGive[j].market_hash_name.includes('Unusual')) {
                        unusualMine=true;
                        for (let k=0; k<offers[i].itemsToGive[j].descriptions.length; k++) {
                            if (offers[i].itemsToGive[j].descriptions[k].value.includes('★')) {
                                try {
                                    await getUnusualStats(offers[i].itemsToGive[j].market_hash_name.replace('Unusual ', ''), offers[i].itemsToGive[j].descriptions[k].value.replace('★ Unusual Effect: ', ''))
                                } catch (e) {
                                    console.log(e)
                                    process.kill(process.pid);
                                }
                                
                                myTotal+=INCBOTPRICE;
                                break // < -- super important, don't fuck this up
                            }
                        }
                    } else if (offers[i].itemsToGive[j].market_hash_name=='Mann Co. Supply Crate Key') {
                        myTotal+=KEYINREF;
                    } else if (offers[i].itemsToGive[j].market_hash_name=='Refined Metal') {
                        myTotal+=1;
                    } else if (offers[i].itemsToGive[j].market_hash_name=='Reclaimed Metal') {
                        myTotal+=1/3;
                    } else if (offers[i].itemsToGive[j].market_hash_name=='Scrap Metal') {
                        myTotal+=1/9;
                    } else {
                        let craftable = 'Craftable';
                        for (let k=0; k<offers[i].itemsToGive[j].descriptions.length; k++) {
                            if (offers[i].itemsToGive[j].descriptions[k].value.includes('Not Usable in Crafting') && !offers[i].itemsToGive.descriptions[k].value.includes('"')) {
                                craftable = 'Non-Craftable'
                                console.log(offers[i].itemsToGive[j].market_hash_name+' Is not craftable');
                                break
                            }
                        }
                        let quality = offers[i].itemsToGive[j].tags[0].name;
                        
                        let name = offers[i].itemsToGive[j].market_hash_name.replace(quality+' ', '').replace('The ', '');

                        try {
                            await getItemStats(quality, name, craftable);
                        } catch (e) {
                            console.log(e)
                            process.kill(process.pid);
                        }
                        myTotal+=INCBOTPRICE;
                    }
                }
                for (j=0; j<offers[i].itemsToReceive.length; j++) {
                    if (offers[i].itemsToReceive[j].market_hash_name.includes('Unusual')) {
                        unusualTheirs=true;
                        for (let k=0; k<offers[i].itemsToReceive[j].descriptions.length; k++) {
                            if (offers[i].itemsToReceive[j].descriptions[k].value.includes('★')) {
                                try {
                                    await getUnusualStats(offers[i].itemsToReceive[j].market_hash_name.replace('Unusual ', ''), offers[i].itemsToReceive[j].descriptions[k].value.replace('★ Unusual Effect: ', ''))
                                } catch (e) {
                                    console.log(e)
                                    process.kill(process.pid);
                                }
                                
                                theirTotal+=INCBOTPRICE;
                                break // < -- super important, don't fuck this up
                            }
                        }
                    } else if (offers[i].itemsToReceive[j].market_hash_name=='Mann Co. Supply Crate Key') {
                        theirTotal+=KEYINREF;
                    } else if (offers[i].itemsToReceive[j].market_hash_name=='Refined Metal') {
                        theirTotal+=1;
                    } else if (offers[i].itemsToReceive[j].market_hash_name=='Reclaimed Metal') {
                        theirTotal+=1/3;
                    } else if (offers[i].itemsToReceive[j].market_hash_name=='Scrap Metal') {
                        theirTotal+=1/9;
                    } else {
                        let craftable = 'Craftable';
                        for (let k=0; k<offers[i].itemsToReceive[j].descriptions.length; k++) {
                            try {
                                if (offers[i].itemsToReceive[j].descriptions[k].value.includes('Not Usable in Crafting') && !offers[i].itemsToReceive.descriptions[k].value.includes('"')) {
                                    craftable = 'Non-Craftable'
                                    console.log(offers[i].itemsToReceive[j].market_hash_name+' Is not craftable');
                                    break
                                }
                            } catch {
                                console.log(offers[i].itemsToReceive[j].descriptions.value);
                            }
                        }
                        let quality = offers[i].itemsToReceive[j].tags[0].name;
                        
                        let name = offers[i].itemsToReceive[j].market_hash_name.replace(quality+' ', '').replace('The ', '');

                        try {
                            await getItemStats(quality, name, craftable);
                        } catch (e) {
                            console.log(e)
                            process.kill(process.pid);
                        }

                        theirTotal+=INCBOTPRICE;
                    }
                }
                netGain.push(theirTotal-myTotal);
                if (unusualMine && unusualTheirs) {
                    unusualBoth.push(true);
                } else {
                    unusualBoth.push(false);
                }
            }

            let bestGain;
            let bestGainPos;

            for (let i=0; i<netGain.length; i++) {
                if (netGain[i]>bestGain && unusualBoth[i] || typeof bestGain == 'undefined' && unusualBoth[i]) {
                    bestGain = netGain[i];
                    bestGainPos = i;
                }
            }

            if (bestGain>-5) { // < --------------What amount of profit is considered "acceptable"--------------------------------------------------------------------------------------------------------------
                offers[bestGainPos].accept();
                console.log(offers[bestGainPos]);
                console.log(bestGain)
                console.log(bestGainPos)
            } else {
                console.log('WARNING : ONLY BAD OFFERS RECEIVED')
                console.log(offers[bestGainPos]);
                console.log(bestGain);
                console.log(bestGainPos);
            }

            process.kill(process.pid);
        } else {
        
        try {
            await scrapeList(SETTINGS.pageNo);
        } catch (e) {
            console.log(e)
            process.kill(process.pid);
        }
        for (let i=0; i<10; i++) {

            if (negotiableList[i] && !strangeList[i] && !SETTINGS.blacklist.includes(idList[i]) && !BLACKLIST.blacklist.includes(idList[i])) {
                let goodtotrade = false;
                
                if (typeof commentList[i] == 'undefined') {
                    goodtotrade = true;
                } else if (!commentList[i].toLowerCase().includes('spell')) {
                    goodtotrade = true;
                }
                
                if (goodtotrade) {
                    readInventory(i);

                    try {
                        await scrapeHist(i);
                    } catch (e) {
                        console.log(e)
                        process.kill(process.pid);
                    }
                    await Promise.all([readInventory], [scrapeHist])
                    if (!DUPED) {

                        try {
                            await scrapePrice(i);
                        } catch (e) {
                            console.log(e)
                            process.kill(process.pid);
                        }
                        
                        if (!BADBOTS) {
                            await sendTrade(i);
                        }
                    }
                }
                
            }
        }
        SETTINGS.pageNo++;
        fs.writeFileSync('settings.json', JSON.stringify(SETTINGS));
    }
}
})();


