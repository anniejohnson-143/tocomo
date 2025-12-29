const User = require("../models/User");
const Notification = require("../models/Notification");

exports.followUser = async (req, res) => {
  const target = await User.findById(req.params.id);
  const current = await User.findById(req.user.id);

  if (target.isPrivate) {
    if (!target.followRequests.includes(current._id)) {
      target.followRequests.push(current._id);
      await Notification.create({
        receiver: target._id,
        sender: current._id,
        type: "follow_request"
      });
    }
    await target.save();
    return res.json({ message: "Follow request sent" });
  }

  target.followers.push(current._id);
  current.following.push(target._id);
  await target.save();
  await current.save();

  res.json({ message: "Followed" });
};

exports.acceptFollow = async (req, res) => {
  const current = await User.findById(req.user.id);
  const requester = await User.findById(req.params.id);

  current.followRequests =
    current.followRequests.filter(id => id.toString() !== requester._id.toString());

  current.followers.push(requester._id);
  requester.following.push(current._id);

  await Notification.create({
    receiver: requester._id,
    sender: current._id,
    type: "follow_accepted"
  });

  await current.save();
  await requester.save();
  res.json({ message: "Accepted" });
};

exports.rejectFollow = async (req, res) => {
  const current = await User.findById(req.user.id);

  current.followRequests =
    current.followRequests.filter(id => id.toString() !== req.params.id);

  await current.save();
  res.json({ message: "Rejected" });
};

exports.togglePrivacy = async (req, res) => {
  const user = await User.findById(req.user.id);
  user.isPrivate = !user.isPrivate;
  await user.save();
  res.json(user);
};
