const fetch = require('isomorphic-fetch');
const queryString = require('query-string')
const dotenv = require('dotenv');
const Koa = require('koa');
const mongoose = require('mongoose');
const next = require('next');
const Router = require('koa-router');
const registeredIdModel = require('./models/registeredIdModel');
const unregisteredIdModel = require('./models/unregisteredIdModel');
const bodyParser = require('koa-body');
const cors = require('@koa/cors');
const google_cal = require('./google_calendar');
const shopifyApiCalls = require('./shopifyApiCalls');
const CryptoJS = require("crypto-js"); 
const session = require('koa-session');
const logger = require('./logger');
const MongooseStore = require("koa-session-mongoose")

dotenv.config();

const allowedOrigins = [
  'https://wholesale.vsyndicate.com/',
  'https://admin.shopify.com/store/wholesale-vsyndicate/'
];

mongoose.connect(process.env.MONGO_URL, () => {
  console.log('Connected to Mongo DB');
});



const port = process.env.PORT || 5000;
const dev = process.env.NODE_ENV !== 'production';
const prod = process.env.NODE_ENV === 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = new Koa();


  server.keys = ["fdsgshse, fasdgre"];
  server.use(
    session({
      store: new MongooseStore({
        collection: 'sessions',
        expires: 864000
      })
    }, server));
    


  //logger
  server.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    logger.info(`${ctx.method} ${ctx.url} - ${ms}ms`);
  });

  const router = new Router();
  // 
  
  // server.keys = [Shopify.Context.API_SECRET_KEY];

  const handleRequest = async (ctx) => {
  
    await handle(ctx.req, ctx.res);
    ctx.respond = true;
    ctx.res.statusCode = 200;
  };

  server.use(cors({
    origin: function (origin, callback) {
      // if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg = 'The CORS policy for this site does not ' +
                  'allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    }
  }));
  

  router.get('(/_next/static/.*)', handleRequest);
  router.get('/_next/webpack-hmr', handleRequest);


  const clientId = process.env.SHOPIFY_API_KEY;
  const clientSecret = process.env.SHOPIFY_API_SECRET;
  
  //installation path
  router.get('/install', async ctx => {
    const shop = ctx.query.shop;
    const state = CryptoJS.lib.WordArray.random(128/8).toString(CryptoJS.enc.Hex);
    console.log("before", ctx.session)
    ctx.session.state = state
    await ctx.session.save();
    console.log("after", ctx.session)
    const redirectUri = 'https://syndicate-member.herokuapp.com/auth/callback';
    
    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=write_customers,read_customers&redirect_uri=${redirectUri}&state=${state}`;
    ctx.redirect(installUrl);
  });

  //install auth path
  router.get('/auth/callback', async ctx => {
    const { code, shop, state } = ctx.query;
    console.log("auth", ctx.session)
    if (await state !== ctx.session.state) {
      ctx.status = 400;
      ctx.body = { error: `${state  }   ${  ctx.session.state}`}
      return;
    }

    const accessTokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code
      })
    });
    if (accessTokenResponse.status !== 200) {
      ctx.status = accessTokenResponse.status;
      ctx.body = { error: "Failed to obtain access token." };
      return;
    }
    const accessTokenData = await accessTokenResponse.json();
    const accessToken = accessTokenData.access_token;
    console.log("token", accessToken)
    // Use the access token to make API calls
      ctx.session.accessToken = accessToken
    // Redirect the user to the appropriate page
    ctx.redirect('https://syndicate-member.herokuapp.com');
  });


  //get all unregistered cards
  router.get('/api/unregistered', async (ctx) => {
    ctx.body = await unregisteredIdModel.find();
  });

  //get one unregistered card by account number
  router.get('/api/unregistered/:memberNum', async (ctx) => {
    try {
      const card = await unregisteredIdModel.find({
        memberId: ctx.params.memberNum,
      });
      if (!card) {
        ctx.throw(404);
      }
      ctx.body = card;
    } catch (err) {
      if (err.name === 'CastError' || err.name === 'NotFoundError') {
        ctx.throw(404);
      }
      ctx.throw(500);
    }
  });
  //Mark Card Sent
  router.put('/api/send/:memberId', bodyParser(), async (ctx) => {
    const update = {
      sent: true,
      sentTo: ctx.request.body.sentTo,
    };
    try {
      const updatedId = await unregisteredIdModel.findOneAndUpdate(
        { memberId: ctx.params.memberId },
        update
      );
      console.log(updatedId);
      ctx.body = JSON.stringify(updatedId);
    } catch (err) {
      console.log(err.name);
    }
  });

  // get all members
  router.get('/api/members', async (ctx) => {
    // if (!ctx.session.accessToken) {
    //   ctx.status = 401;
    //   ctx.body = { error: "Shopify access token is required" };
    //   return;
    // }
    ctx.body = await registeredIdModel.find();
  });

  // get a single membership by email
  router.get('/api/member-email/:memberEmail', async (ctx) => {
    try {
      const memberNum = await registeredIdModel.find({
        customerEmail: ctx.params.memberEmail,
      });
      if (!memberNum) {
        ctx.throw(404);
      }
      ctx.body = memberNum;
    } catch (err) {
      if (err.name === 'CastError' || err.name === 'NotFoundError') {
        ctx.throw(404);
      }
      ctx.throw(500);
    }
  });

  // get a single membership by account number
  router.get('/api/member/:memberNum', async (ctx) => {
    try {
      const memberNum = await registeredIdModel.find({
        accountNumber: ctx.params.memberNum,
      });
      if (!memberNum) {
        ctx.throw(404);
      }
      ctx.body = memberNum;
      console.log(memberNum);
    } catch (err) {
      if (err.name === 'CastError' || err.name === 'NotFoundError') {
        ctx.throw(404);
      }
      ctx.throw(500);
    }
  });
  //update a single member
  router.put('/api/update/:memberId', bodyParser(), async (ctx) => {
    // const idNumber = await registeredIdModel.find({ accountNumber: ctx.params.memberId });
    const update = {
      cardTier: ctx.request.body.cardTier,
      notes: ctx.request.body.notes,
    };
    try {
      const updatedId = await registeredIdModel.findOneAndUpdate(
        { accountNumber: ctx.params.memberId },
        update
      );
      console.log(updatedId);
      ctx.body = JSON.stringify(updatedId);
      shopifyApiCalls.replaceCustomerTags(
        process.env.SHOPIFY_STORE,
        ctx.request.body.shopifyCustomerId,
        ctx.request.body.cardTier
      );
    } catch (err) {
      console.log(err.name);
    }
  });

  // register new membership
  router.post('/api/register/:memberId', bodyParser(), async (ctx) => {
    const idPrefix = ctx.params.memberId.substring(0, 4);
    const idNumberMatch = await unregisteredIdModel.find({
      memberId: ctx.params.memberId,
    });
    let tier = '';
    if (idNumberMatch.length > 0) {
      try {
        unregisteredIdModel.findOneAndDelete(
          { memberId: ctx.params.memberId },
          function (err, docs) {
            if (err) {
              console.log(err);
            } else {
              console.log('Deleted Unregistered ID number : ', docs);
            }
          }
        );
        if (idPrefix === '1658') {
          tier = 'Red';
        } else if (idPrefix === '2409') {
          tier = 'Blue';
        } else if (idPrefix === '3945') {
          tier = 'Gold';
        } else if (idPrefix === '4679') {
          tier = 'Black';
        } else {
          console.error();
        }

        // let thisUrl = `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2022-07/customers/${ctx.request.body.shopifyCustomerId}.json`;

        getResponse = await fetch(thisUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': process.env.ACCESS_TOKEN,
          },
        });

        const getData = await getResponse.json();
        console.log(getData.customer.tags);
        const newCustomerTags = getData.customer.tags.concat(`,${tier}`);
        console.log(newCustomerTags);

        const requestOptions = {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': process.env.ACCESS_TOKEN,
          },
          body: JSON.stringify({
            customer: {
              id: ctx.request.body.shopifyCustomerId,
              tags: newCustomerTags,
            },
          }),
        };
        const response = await fetch(thisUrl, requestOptions);
        const data = await response.json();
        console.log(data);

        const newId = await registeredIdModel.create({
          customerEmail: ctx.request.body.customerEmail,
          shopifyCustomerId: ctx.request.body.shopifyCustomerId,
          cardTier: tier,
          accountNumber: ctx.params.memberId,
        });
        console.log(newId);
        ctx.body = JSON.stringify(newId);
        google_cal
          .insertEvent(ctx.request.body.customerEmail)
          .then((res) => {
            console.log(res);
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (err) {
        error.message = 'Invalid account number';
        console.log(error.message);
      }
    } else
      try {
        error.message = 'Invalid account number';
      } catch (err) {
        console.log(error);
      }
  });

  // post a new unregistered Id
  router.post('/api/memberId', bodyParser(), async (ctx) => {
    try {
      const unregisteredId = new unregisteredIdModel(ctx.request.body).save();
      ctx.body = JSON.stringify(unregisteredId);
    } catch (err) {
      console.log(error);
    }
  });

  //keep dynos running
  function keepAwake(url) {
    setInterval(async function () {
      const response = await fetch(url);
      response;
    }, 5 * 60 * 1000);
  }
  keepAwake('https://syndicate-member.herokuapp.com');

  router.get('(.*)', handleRequest);
  server.use(router.allowedMethods());
  server.use(router.routes());

  server.listen(port, () => {
    console.log(`Ready on http://localhost:${port}`);
  });
});