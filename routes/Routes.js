const Router = require('koa-router')
const Koa = require('koa');
const registeredProducts = require('../models/registeredProductsModel')

const warrantiesRouter = new Router()

// function {
//     router.get('(.*)/warranties', async (ctx) => {
//         ctx.body = await registeredProductModel.find()
//     })
  
//     router.post('(.*)/warranties', bodyParser(), async (ctx) => {
//       try { const registeredproduct = new registeredProductModel(ctx.request.body).save();
//        ctx.body = JSON.stringify(registeredproduct)
//       } catch(err){
//         console.log(error)
//       }
//     })
// }
