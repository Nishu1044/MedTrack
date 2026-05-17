const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendEmail } = require('../services/reminderService');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

function publicUser(u) {
  return {
    id: u._id,
    email: u.email,
    name: u.name,
    timezone: u.timezone,
    notificationsEnabled: u.notificationsEnabled,
  };
}

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').trim().notEmpty(),
    body('timezone').optional().isString(),
    validateRequest,
  ],
  async (req, res) => {
    try {
      const { email, password, name, timezone } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = new User({
        email,
        password,
        name,
        timezone: timezone || 'UTC',
      });
      await user.save();

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({ token, user: publicUser(user) });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').exists(), validateRequest],
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });

      const isMatch = await user.comparePassword(password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.json({ token, user: publicUser(user) });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Current user info (used by frontend on app load)
router.get('/me', auth, async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// Update profile (timezone, notificationsEnabled, name)
router.patch(
  '/me',
  [
    auth,
    body('name').optional().trim().notEmpty(),
    body('timezone').optional().isString(),
    body('notificationsEnabled').optional().isBoolean(),
    validateRequest,
  ],
  async (req, res) => {
    try {
      const allowed = ['name', 'timezone', 'notificationsEnabled'];
      for (const key of allowed) {
        if (req.body[key] !== undefined) req.user[key] = req.body[key];
      }
      await req.user.save();
      res.json({ user: publicUser(req.user) });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// --- Password reset ---

// Always returns 200, even if the email doesn't exist (avoid user enumeration).
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail(), validateRequest],
  async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (user) {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
        user.resetPasswordToken = hashed;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        const frontendBase = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
        const link = `${frontendBase}/reset-password?token=${rawToken}`;

        if (frontendBase) {
          try {
            await sendEmail({
              to: user.email,
              subject: 'Reset your MedTrack password',
              text: `Hi ${user.name},\n\nWe got a request to reset your MedTrack password. Click below within 1 hour:\n\n${link}\n\nIf you didn't request this, ignore this email.\n\n— MedTrack`,
              html: `<p>Hi ${user.name},</p><p>We got a request to reset your MedTrack password. Click below within 1 hour:</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, ignore this email.</p><p>— MedTrack</p>`,
            });
          } catch (mailErr) {
            console.error('Reset email send failed:', mailErr.message);
          }
        } else {
          console.warn('Password reset requested but FRONTEND_URL not configured.');
        }
      }
      res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.post(
  '/reset-password',
  [
    body('token').isString().notEmpty(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    validateRequest,
  ],
  async (req, res) => {
    try {
      const { token, password } = req.body;
      const hashed = crypto.createHash('sha256').update(token).digest('hex');

      const user = await User.findOne({
        resetPasswordToken: hashed,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset link' });
      }

      user.password = password;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      res.json({ message: 'Password reset successful. You can log in now.' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
