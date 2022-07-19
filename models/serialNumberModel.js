const mongoose = require('mongoose')

const unregisteredIdSchema = new mongoose.Schema({
    memberId: {
        type: String,
        required: true,
    }
})

const serialNumberModel = mongoose.model("serial_numbers", serialNumberSchema);

module.exports = serialNumberModel