const express = require('express');
const User = require('../models/User');

const router = express.Router();

// helper to get user id from session (supports id and _id)
function getSessionUserId(req) {
  return req?.session?.user?.id || req?.session?.user?._id || null;
}

// @route   GET /api/profile
router.get('/', async (req, res) => {
  const uid = getSessionUserId(req);
  if (!uid) return res.status(401).json({ message: 'Please log in first' });

  try {
    const user = await User.findById(uid).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // (optional) debug
    // console.log('GET /api/profile sid=', req.sessionID, 'user=', req.session.user);

    res.status(200).json(user); // <-- your frontend expects the raw user object
  } catch (err) {
    console.error('GET /api/profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/profile
router.put('/', async (req, res) => {
  const uid = getSessionUserId(req);
  if (!uid) return res.status(401).json({ message: 'Please log in first' });

  const {
    name,
    email,
    institute,
    phone,
    address,
    preferences,
    twoFactorEnabled,
    photoUrl,
  } = req.body;

  // build update object with only defined keys
  const update = {};
  if (name !== undefined) update.name = name;
  if (email !== undefined) update.email = email;
  if (institute !== undefined) update.institute = institute;
  if (phone !== undefined) update.phone = phone;
  if (address !== undefined) update.address = address;
  if (preferences !== undefined) update.preferences = preferences;
  if (twoFactorEnabled !== undefined) update.twoFactorEnabled = twoFactorEnabled;
  if (photoUrl !== undefined) update.photoUrl = photoUrl;

  try {
    const user = await User.findByIdAndUpdate(
      uid,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    // 🔄 keep session in sync so UI shows updated info right away
    if (req.session.user) {
      req.session.user = {
        ...(req.session.user),
        id: user._id.toString(),
        _id: user._id.toString(),           // keep both for compatibility
        name: user.name,
        email: user.email,
        institute: user.institute,
      };
      // optional: save session before responding
      await new Promise((resolve, reject) =>
        req.session.save(err => (err ? reject(err) : resolve()))
      );
    }

    res.status(200).json(user);
  } catch (err) {
    console.error('PUT /api/profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
