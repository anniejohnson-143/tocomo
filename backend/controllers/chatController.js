const Message = require("../models/Message");

exports.getMessages = async (req, res) => {
  const messages = await Message.find({
    $or: [
      { sender: req.user.id, receiver: req.params.id },
      { sender: req.params.id, receiver: req.user.id },
    ],
  }).sort("createdAt");

  res.json(messages);
};
