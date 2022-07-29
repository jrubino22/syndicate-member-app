const mongoose = require('mongoose')

const registeredIdSchema = new mongoose.Schema({
    customerEmail: {
        type: String,
        required: true,
    },
    shopifyCustomerId:{
        type: String,
        required: true
    },
    cardTier: {
        type: String,
        required: true,
    },
    accountNumber: {
        type: String,
        required: true,
    },
    notes: {
        type: String,
        required: false,
    }
})

const registeredIdModel = mongoose.model("registered_ids", registeredIdSchema);

module.exports = registeredIdModel