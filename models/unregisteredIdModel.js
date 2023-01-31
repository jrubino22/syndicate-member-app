const mongoose = require('mongoose');

const unregisteredIdSchema = new mongoose.Schema({
  memberId: {
    type: String,
    required: true,
  },
  sent: {
    type: Boolean,
    default: false,
  },
  sentTo: {
    type: String,
    default: '',
  },
});

const unregisteredIdModel = mongoose.model(
  'unregistered_ids',
  unregisteredIdSchema
);

module.exports = unregisteredIdModel;
