const jwt = require('jsonwebtoken');
const dns = require('dns').promises;
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        rollOrFacultyId: user.rollOrFacultyId,
      },
    });
};

// Strict email regex pattern
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// @desc    Register a new user with strict syntax and DNS MX domain validation
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department, rollOrFacultyId } = req.body;

    if (!name || !email || !password || !rollOrFacultyId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, and rollOrFacultyId',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // 1. Strict Email Regex Syntax Validation
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email syntax format. Please enter a valid email address.',
      });
    }

    // 2. Extract Domain for DNS MX Check
    const parts = trimmedEmail.split('@');
    const domain = parts[1];

    if (!domain || domain.indexOf('.') === -1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or non-existent email domain. Please enter a valid email address.',
      });
    }

    // 3. Strict Real-Email DNS MX Verification using dns.promises.resolveMx
    try {
      const mxRecords = await dns.resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or non-existent email domain. Please enter a valid email address.',
        });
      }
    } catch (dnsError) {
      // DNS lookup failure (ENOTFOUND, ENODATA, ESERVFAIL, etc.)
      return res.status(400).json({
        success: false,
        message: 'Invalid or non-existent email domain. Please enter a valid email address.',
      });
    }

    // 4. Duplicate Check
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // 5. Create User
    const user = await User.create({
      name: name.trim(),
      email: trimmedEmail,
      password,
      role: role || 'student',
      department: department?.trim() || 'Computer Science',
      rollOrFacultyId: rollOrFacultyId.trim(),
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Registration processing error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error encountered during registration',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching profile',
    });
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
exports.logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully',
  });
};

// @desc    Get all users (for administrative roster / enrollment)
// @route   GET /api/auth/users
// @access  Private (Admin / Faculty)
exports.getUsers = async (req, res) => {
  try {
    const { role, department } = req.query;
    const query = {};
    if (role) query.role = role;
    if (department) query.department = department;

    const users = await User.find(query).select('-password').sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
