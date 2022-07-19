require('isomorphic-fetch')
const dotenv = require('dotenv')
const Koa = require('koa')
const mongoose = require('mongoose')
const next = require('next')
const {default: createShopifyAuth} = require('@shopify/koa-shopify-auth');
const {verifyRequest} = require('@shopify/koa-shopify-auth');
const { default: Shopify, ApiVersion } = require('@shopify/shopify-api');
const Router = require('koa-router');
const warrantiesRouter = require('./routes/Routes')
const registeredProductModel = require('./models/registeredProductsModel')
const serialNumberModel = require('./models/serialNumberModel')
const bodyParser = require('koa-body')
const cors = require('@koa/cors')

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

const port = (process.env.PORT || 5000);
const dev = process.env.NODE_ENV !== 'production';
const prod = process.env.NODE_ENV === 'production';
const app = next({ prod });
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
                const {shop, scope} = ctx.state.shopify;
                ACTIVE_SHOPIFY_SHOPS[shop] = scope;

                if( ACTIVE_SHOPIFY_SHOPS[shop]) {
                    ctx.redirect(`https://${shop}/admin/apps`)
                }else{
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

    // router.get('(.*)', handleRequest);

    router.get("(/_next/static/.*)", handleRequest);
    router.get("/_next/webpack-hmr", handleRequest);

   
    // get all warranties
    router.get('(.*)/warranties', async (ctx) => {
        ctx.body = await registeredProductModel.find()
    })

    // register a warranty
    router.post('(.*)/register/:serial', bodyParser(), async (ctx) => {
       const serialMatch = await serialNumberModel.find({serialNumber: ctx.params.serial});
        if(serialMatch.length > 0) {
            try { 
                serialNumberModel.findOneAndDelete({ serialNumber: ctx.params.serial }, function (err, docs) {
                    if (err){
                        console.log(err)
                    }
                    else{
                        console.log("Deleted serial number : ", docs);
                    }
                });
                const registeredproduct = new registeredProductModel(ctx.request.body).save();
                ctx.body = JSON.stringify(registeredproduct)
            } catch(err){
                error.message = "Invalid serial number"
                console.log(error.message)
            }
        } else try { 
            error.message = "Invalid serial number"
            } catch(err){
            console.log(error)
            }
    })

    // post a serial number
    router.post('(.*)/serial', bodyParser(), async (ctx) => {
        try { const serialNumber = new serialNumberModel(ctx.request.body).save();
         ctx.body = JSON.stringify(serialNumber)
        } catch(err){
          console.log(error)
        }
      })

    // get all warranties for a single customer
    router.get('(.*)/warranties/:email', async (ctx) => {
        try {
            const productreg = await registeredProductModel.find({customerEmail: ctx.params.email});
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

    // get a single warranty by id
    router.get('(.*)/warranty/:id', async (ctx) => {
           ctx.body = await registeredProductModel.findById(ctx.params.id)      
    })

    // update warranty status
    router.put('(.*)/warranty/:id', async (ctx) => {
        ctx.body = await registeredProductModel.findByIdAndUpdate(ctx.params.id, 
           { warrantyStatus: "inactive" })   
    })
    
    router.post('(.*)/warranties', bodyParser(), async (ctx) => { 
        try { const registeredproduct = new registeredProductModel(ctx.request.body).save();
       ctx.body = JSON.stringify(registeredproduct)
      } catch(err){
        console.log(error)
      }
    })
    //keep dynos running
    function keepAwake(url){
        setInterval(async function(){
          const response = await fetch(url);
          response
        }, 5*60*1000);     
      }
       keepAwake('https://v-syndicate-warranty-app.herokuapp.com')


    server.use(router.allowedMethods());
    server.use(router.routes());


    server.listen(port, () => {
        console.log(`Ready on http://localhost:${port}`)
    })
})