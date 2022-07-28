require('isomorphic-fetch')
const dotenv = require('dotenv')
const Koa = require('koa')
const mongoose = require('mongoose')
const next = require('next')
const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth');
const { verifyRequest } = require('@shopify/koa-shopify-auth');
const { default: Shopify, ApiVersion } = require('@shopify/shopify-api');
const Router = require('koa-router');
const warrantiesRouter = require('./routes/Routes')
const registeredIdModel = require('./models/registeredIdModel')
const unregisteredIdModel = require('./models/unregisteredIdModel')
const bodyParser = require('koa-body')
const cors = require('@koa/cors')
const google_cal = require('./google_calendar')

dotenv.config();

mongoose.connect(process.env.MONGO_URL, () => {
    console.log('Connected to Mongo DB')
})

Shopify.Context.initialize({
    API_KEY: process.env.SHOPIFY_API_KEY,
    API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
    SCOPES: process.env.SHOPIFY_API_SCOPES.split(","),
    HOST_NAME: process.env.SHOPIFY_APP_URL.replace(/https:\/\//, ""),
    API_VERSION: ApiVersion.June16,
    IS_EMBEDDED_APP: true,
    SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),

});

const shopifyStore = "joeyskillsharedemo"
const port = (process.env.PORT || 5000);
const dev = process.env.NODE_ENV !== 'production';
const prod = process.env.NODE_ENV === 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const ACTIVE_SHOPIFY_SHOPS = {};

app.prepare().then(() => {
    const server = new Koa();
    server.use(cors())
    const router = new Router();
    server.keys = [Shopify.Context.API_SECRET_KEY];

    server.use(
        createShopifyAuth({
            afterAuth(ctx) {
                const { shop, scope } = ctx.state.shopify;
                ACTIVE_SHOPIFY_SHOPS[shop] = scope;

                if (ACTIVE_SHOPIFY_SHOPS[shop]) {
                    ctx.redirect(`https://${shop}/admin/apps`)
                } else {
                    ctx.redirect(`/?shop=${shop}`);
                }
            },
        }),
    );


    const handleRequest = async (ctx) => {
        await handle(ctx.req, ctx.res);
        ctx.respond = true;
        ctx.res.statusCode = 200;
    };

    router.get("/", async (ctx) => {
        const shop = ctx.query.shop;

        await handleRequest(ctx);
    })

    

    router.get("(/_next/static/.*)", handleRequest);
    router.get("/_next/webpack-hmr", handleRequest);


    // get all members
    router.get('/api/members', async (ctx) => {
        ctx.body = await registeredIdModel.find()
    })

    // get a single membership by account number
    router.get('/api/member/:memberNum', async (ctx) => {
        try {
            const memberNum = await registeredIdModel.find({ accountNumber: ctx.params.memberNum });
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
    })

    // register new membership
    router.post('api/register/:memberId', bodyParser(), async (ctx) => {
        const idPrefix = ctx.params.memberId.substring(0, 4)
        const idNumberMatch = await unregisteredIdModel.find({ memberId: ctx.params.memberId });
        let tier = ""
        if (idNumberMatch.length > 0) {
            try {
                unregisteredIdModel.findOneAndDelete({ memberId: ctx.params.memberId }, function (err, docs) {
                    if (err) {
                        console.log(err)
                    }
                    else {
                        console.log("Deleted Unregistered ID number : ", docs);
                    }
                });
                if (idPrefix === "1658") {
                    tier = "blue"
                } else if (idPrefix === "2409") {
                    tier = "green"
                } else if (idPrefix === "3945") {
                    tier = "Gold"
                } else if (idPrefix === "4679") {
                    tier = "Black"
                } else {
                    console.error()
                }

                let thisUrl = `https://${shopifyStore}.myshopify.com/admin/api/2022-07/customers/${ctx.request.body.shopifyCustomerId}.json`

                getResponse = await fetch(thisUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Shopify-Access-Token': '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'
                    }
                }
                );
                const getData = await getResponse.json();
                console.log(getData.customer.tags)
                const newCustomerTags = getData.customer.tags.concat(`, ${tier}`);
                console.log(newCustomerTags)
                
                const requestOptions = {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Shopify-Access-Token': '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'
                    },
                    body: JSON.stringify({
                        "customer":
                        {
                            "id": ctx.request.body.shopifyCustomerId,
                            "tags": newCustomerTags
                        }
                    })
                };
                const response = await fetch(thisUrl, requestOptions);
                const data = await response.json();
                console.log(data)

                const newId = await registeredIdModel.create({
                    customerEmail: ctx.request.body.customerEmail,
                    shopifyCustomerId: ctx.request.body.shopifyCustomerId,
                    cardTier: tier,
                    accountNumber: ctx.params.memberId
                })
                console.log(newId)
                ctx.body = JSON.stringify(newId)
                        google_cal.insertEvent(ctx.request.body.customerEmail)
                            .then((res) => {
                                console.log(res);
                            })
                            .catch((err) => {
                                console.log(err);
                            });
            } catch (err) {
                error.message = "Invalid account number"
                console.log(error.message)
            }
        } else try {
            error.message = "Invalid account number"
        } catch (err) {
            console.log(error)
        }
    })

    // post a new unregistered Id
    router.post('api/memberId', bodyParser(), async (ctx) => {
        try {
            const unregisteredId = new unregisteredIdModel(ctx.request.body).save();
            ctx.body = JSON.stringify(unregisteredId)
        } catch (err) {
            console.log(error)
        }
    })

    // get all warranties for a single customer
    router.get('(.*)/warranties/:email', async (ctx) => {
        try {
            const productreg = await registeredProductModel.find({ customerEmail: ctx.params.email });
            if (!productreg) {
                ctx.throw(404);
            }
            ctx.body = productreg;
        } catch (err) {
            if (err.name === 'CastError' || err.name === 'NotFoundError') {
                ctx.throw(404);
            }
            ctx.throw(500);
        }
    })


    // update warranty status
    router.put('(.*)/warranty/:id', async (ctx) => {
        ctx.body = await registeredProductModel.findByIdAndUpdate(ctx.params.id,
            { warrantyStatus: "inactive" })
    })

    router.post('(.*)/warranties', bodyParser(), async (ctx) => {
        try {
            const registeredproduct = new registeredProductModel(ctx.request.body).save();
            ctx.body = JSON.stringify(registeredproduct)
        } catch (err) {
            console.log(error)
        }
    })
    //keep dynos running
    function keepAwake(url) {
        setInterval(async function () {
            const response = await fetch(url);
            response
        }, 5 * 60 * 1000);
    }

    router.get('(.*)', handleRequest);
    server.use(router.allowedMethods());
    server.use(router.routes());


    server.listen(port, () => {
        console.log(`Ready on http://localhost:${port}`)
    })
})