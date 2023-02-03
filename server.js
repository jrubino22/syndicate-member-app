require('isomorphic-fetch');
const dotenv = require('dotenv');
const Koa = require('koa');
const mongoose = require('mongoose');
const next = require('next');
const { default: Shopify, ApiVersion } = require('@shopify/shopify-api');
const Router = require('koa-router');
const registeredIdModel = require('./models/registeredIdModel');
const unregisteredIdModel = require('./models/unregisteredIdModel');
const bodyParser = require('koa-body');
const cors = require('@koa/cors');
const google_cal = require('./google_calendar');
const shopifyApiCalls = require('./shopifyApiCalls');
const { createShopifyAuth, verifyRequest } = require('simple-koa-shopify-auth');

dotenv.config();

mongoose.connect(process.env.MONGO_URL, () => {
  console.log('Connected to Mongo DB');
});

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SHOPIFY_API_SCOPES.split(','),
  HOST_NAME: process.env.SHOPIFY_APP_URL.replace(/https:\/\//, ''),
  API_VERSION: ApiVersion.June16,
  IS_EMBEDDED_APP: true,
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

const handleRequest = async (ctx) => {
  verifyRequest();
  await handle(ctx.req, ctx.res);
  ctx.respond = true;
  ctx.res.statusCode = 200;
};

const port = process.env.PORT || 5000;
const dev = process.env.NODE_ENV !== 'production';
const prod = process.env.NODE_ENV === 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const ACTIVE_SHOPIFY_SHOPS = {};

app.prepare().then(() => {
  const server = new Koa();

  const router = new Router();
  server.keys = [Shopify.Context.API_SECRET_KEY];

  router.get('(/_next/static/.*)', handleRequest);
  router.get('/_next/webpack-hmr', handleRequest);

  router.get('/install', verifyRequest(), async (ctx) => {
    console.log('checkpoint1');
    server.use(
      createShopifyAuth({
        accessMode: 'offline',
        authPath: '/auth',
        async afterAuth(ctx) {
          const { shop, accessToken } = ctx.state.shopify;
          console.log('shop', shop, accessToken);
          const { host } = ctx.query;
          if (!accessToken) {
            // This can happen if the browser interferes with the auth flow
            ctx.response.status = 500;
            ctx.response.body = 'Failed to get access token! Please try again.';
            return;
          }
          // Redirect to user auth endpoint, to get user's online token
          ctx.response.body = 'found';
          ctx.redirect(`/auth?shop=${shop}&host=${host}`);
        },
      })
    );
  });

  router.get('(/auth)', verifyRequest(), async (ctx) => {
    server.use(
      createShopifyAuth({
        accessMode: 'online',
        authPath: '/',
        async afterAuth(ctx) {
          const { shop } = ctx.state.shopify;
          const { host } = ctx.query;
          // Check if the app is installed
          // NOTE: You can replace with your own function to check if the shop is installed, or you can just remove it, but this is an extra check that can help prevent auth issues
          if (isShopActive(shop)) {
            // Redirect to app
            ctx.redirect(`/?shop=${shop}&host=${host}`);
          } else {
            // Redirect to installation endpoint to get permanent access token
            ctx.redirect(`/install/auth/?shop=${shop}&host=${host}`);
          }
        },
      })
    );
  });

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

        let thisUrl = `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2022-07/customers/${ctx.request.body.shopifyCustomerId}.json`;

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
