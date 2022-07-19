const mongoose = require('mongoose')

const unregisteredIdSchema = new mongoose.Schema({
    memberId: {
        type: String,
        required: true,
    }
})

const unregisteredIdModel = mongoose.model("unregistered_ids", unregisteredIdSchema);

module.exports = unregisteredIdModel