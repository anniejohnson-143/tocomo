const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  const data = await Notification.find({ receiver: req.user.id })
    .populate("sender", "name")
    .sort({ createdAt: -1 });

  res.json(data);
};
