const User = require("../models/User");
const Notification = require("../models/Notification");

/* =====================
   GET CURRENT USER
===================== */
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id)
    .select("-password")
    .populate("followers following", "username name avatar");

  res.json(user);
};

/* =====================
   UPDATE PROFILE
===================== */
exports.updateMe = async (req, res) => {
  const allowedFields = [
    "name",
    "username",
    "bio",
    "website",
    "location",
    "phone",
    "gender",
    "avatar",
    "coverPhoto",
    "dateOfBirth"
  ];

  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) updates[key] = req.body[key];
  });

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true
  });

  res.json(user);
};

/* =====================
   DELETE (DEACTIVATE) ACCOUNT
===================== */
exports.deleteMe = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.json({ message: "Account deactivated" });
};

/* =====================
   FOLLOW / UNFOLLOW USER
===================== */
exports.followUser = async (req, res) => {
  const target = await User.findById(req.params.id);
  const current = await User.findById(req.user.id);

  if (!target) return res.status(404).json({ message: "User not found" });
  if (target._id.equals(current._id))
    return res.status(400).json({ message: "You cannot follow yourself" });

  /* PRIVATE ACCOUNT */
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

  /* PUBLIC ACCOUNT */
  const alreadyFollowing = target.followers.some(
    id => id.toString() === current._id.toString()
  );

  if (alreadyFollowing) {
    // UNFOLLOW
    target.followers = target.followers.filter(
      id => id.toString() !== current._id.toString()
    );
    current.following = current.following.filter(
      id => id.toString() !== target._id.toString()
    );
  } else {
    // FOLLOW
    target.followers.push(current._id);
    current.following.push(target._id);

    await Notification.create({
      receiver: target._id,
      sender: current._id,
      type: "follow"
    });
  }

  await target.save();
  await current.save();

  res.json({ following: !alreadyFollowing });
};

/* =====================
   ACCEPT FOLLOW REQUEST
===================== */
exports.acceptFollow = async (req, res) => {
  const user = await User.findById(req.user.id);
  const requester = await User.findById(req.params.id);

  if (!requester)
    return res.status(404).json({ message: "User not found" });

  user.followRequests = user.followRequests.filter(
    id => id.toString() !== requester._id.toString()
  );

  user.followers.push(requester._id);
  requester.following.push(user._id);

  await Notification.create({
    receiver: requester._id,
    sender: user._id,
    type: "follow_accepted"
  });

  await user.save();
  await requester.save();

  res.json({ message: "Follow request accepted" });
};

/* =====================
   REJECT FOLLOW REQUEST
===================== */
exports.rejectFollow = async (req, res) => {
  const user = await User.findById(req.user.id);

  user.followRequests = user.followRequests.filter(
    id => id.toString() !== req.params.id
  );

  await user.save();
  res.json({ message: "Follow request rejected" });
};

/* =====================
   TOGGLE PRIVACY
===================== */
exports.togglePrivacy = async (req, res) => {
  const user = await User.findById(req.user.id);
  user.isPrivate = !user.isPrivate;
  await user.save();
  res.json({ isPrivate: user.isPrivate });
};

/* =====================
   ADMIN: GET ALL USERS
===================== */
exports.getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

/* =====================
   ADMIN: DELETE USER
===================== */
exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
};
