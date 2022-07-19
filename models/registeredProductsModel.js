const mongoose = require('mongoose')

const registeredProductSchema = new mongoose.Schema({
    customerEmail: {
        type: String,
        required: true,
    },
    serialNumber: {
        type: String,
        required: true,
    },
    product: {
        type: String,
        required: true,
    },
    purchaseLocation: {
        type: String,
        required: true,
    },
    purchaseAddress: {
        type: String,
        required: true,
    },
    warrantyStatus: {
        type: String,
        required: true,
    }
})

const registeredProductModel = mongoose.model("Registered Products", registeredProductSchema);

module.exports = registeredProductModel