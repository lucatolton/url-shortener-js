const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const db = require('quick.db');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
var findRemoveSync = require('find-remove');

const app = express();

app.engine('ejs', ejs.renderFile);
app.set('view engine', 'ejs');

app.use('/assets', express.static('assets'));
app.use('/screenshots', express.static('screenshots'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/', async (req, res) => {
    const baseurl = req.protocol + "://" + req.get('host');
    console.log(baseurl);

    if (typeof req.body.url == 'undefined' || req.body.url === '') return res.redirect('/');

    const short = Math.random().toString(36).substr(2, 6);
    await db.set(short, { url: req.body.url } );

    const data = await db.get(short);
    
    res.render('index', { short_url: `${baseurl}/${short}` } );
});

app.get('/:url', async (req, res) => {
    const data = await db.get(req.params.url);
    if (data !== null) {
        const browser = await puppeteer.launch({ headless: true, args: ['--use-gl=egl'] });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        await page.goto(data.url);
        await page.screenshot({ path: `screenshots/${req.params.url}.png` });
        await browser.close();

        res.render('redirect', { url: data.url, screenshot: `/screenshots/${req.params.url}.png` });
    } else {
        res.render('invalid');
    }
});

app.listen(3000, () => {
    console.log('[Shortener] (Ready) :: Listening on port 3000');
});