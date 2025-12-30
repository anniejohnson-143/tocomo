const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  const data = await Notification.find({
    receiver: req.user.id,
  })
    .populate("sender", "username")
    .sort("-createdAt");

  res.json(data);
};
