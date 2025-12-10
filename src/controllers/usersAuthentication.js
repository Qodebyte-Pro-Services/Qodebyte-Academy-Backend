const rateLimitMap = new Map(); 
const { uploadToCloudinary, ComplexDeleteFileFromCloudinary } = require('../utils/cloudinaryUtil');
const { Op } = require('sequelize');
const { verifyGoogleToken } = require('../services/socialServices');
const {generateToken, generateTokenMainToken } = require('../utils/jwt');
const {generateOTP} = require('../utils/otpGenerator');
const { sendOtpEmail, sendNewUserEmail } = require('../services/emailServices');
const bcrypt = require('bcryptjs');
const { User, OTP, BlacklistedToken, sequelize, Course } = require('../models');
const fetchHelper = require('../utils/fetchHelper');

function rateLimit(key, max = 5, windowMs = 60 * 1000) {
  const now = Date.now();
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, last: now });
  } else {
    const entry = rateLimitMap.get(key);
    if (now - entry.last > windowMs) {
      entry.count = 1;
      entry.last = now;
    } else {
      entry.count++;
    }
    if (entry.count > max) return false;
    rateLimitMap.set(key, entry);
  }
  return true;
}


function validateInput(fields, req, res) {
  for (const field of fields) {
    if (!req.body[field]) {
      res.status(400).json({ message: `Missing field: ${field}` });
      return false;
    }
  }
  return true;
}


exports.register = async (req, res) => {
  if (!rateLimit(req.body.email + ":register")) {
    return res.status(429).json({ message: "Too many attempts, try again later." });
  }

  const t = await sequelize.transaction();

  try {
    const { full_name, email, password, dob, is_social_media, address, country, state, learning_mode, ReferralSourceOptions, interested_course_ids } = req.body;

    if (!full_name || !email || (!is_social_media && !password)) {
      await t.rollback();
      return res.status(400).json({ message: "Missing required fields." });
    }

      if (interested_course_ids && !Array.isArray(interested_course_ids)) {
      await t.rollback();
      return res.status(400).json({ message: "interested_course_ids must be an array of UUIDs." });
    }

    let user = await User.findOne({ where: { email }, transaction: t });

    if (user) {
      if (user.isVerified) {
        await t.rollback();
        return res.status(400).json({ message: "Email already exists" });
      } else if (!is_social_media && password) {
        user.password = await bcrypt.hash(password, 10);
        await user.save({ transaction: t });
      }
    } else {
      const hashedPassword = is_social_media ? null : await bcrypt.hash(password, 10);

      user = await User.create(
        {
          full_name,
          email,
          dob,
          address,
          state,
          country,
          learning_mode,
          ReferralSourceOptions,
          password: hashedPassword,
          isVerified: false,
          is_social_media: !!is_social_media,
          interested_course_ids: interested_course_ids || null,
        },
        { transaction: t }
      );
    }

   
    const otp = generateOTP(6);

    
    await OTP.create(
      {
        entity_id: user.user_id,
        entity_type: "User",
        otp,
        purpose: "register",
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
      },
      { transaction: t }
    );

   
    const sent = await sendOtpEmail(email, otp, "register");
    if (!sent) {
      await t.rollback();
      return res.status(500).json({ message: "Failed to send OTP email" });
    }

    await t.commit();
    return res.status(201).json({
      message: "OTP sent. Please verify email.",
      user_id: user.user_id,
    });
  } catch (error) {
    await t.rollback();
    console.error("❌ Register error:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  if (!rateLimit(email + ':login'))
    return res.status(429).json({ message: 'Too many attempts, try again later.' });

  const t = await sequelize.transaction();
  try {
    const user = await User.findOne({ where: { email }, transaction: t });
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      await t.rollback();
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!user.isVerified) {
      await t.rollback();
      return res.status(403).json({ message: 'Please verify your account.' });
    }

    const otp = generateOTP(6);
    const expires_at = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.create({
      entity_id: user.user_id,
      entity_type: "User",
      otp,
      purpose: 'login',
      expires_at,
    }, { transaction: t });

    const sent = await sendOtpEmail(user.email, otp, 'login');
    if (!sent) {
      await t.rollback();
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }

    await t.commit();
    return res.status(200).json({
      message: 'OTP sent for login verification.',
      user_id: user.user_id,
      user_email: user.email,
    });

  } catch (err) {
    await t.rollback();
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

async function uploadProfilePicFromUrl(url, email) {
  if (!url) return null;

  try {
    const response = await fetchHelper(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await uploadToCloudinary(buffer, `profile_${email}`);
    return uploaded.secure_url;
  } catch (err) {
    console.error("Cloudinary upload failed:", err.message);
    return null;
  }
}

exports.googleLogin = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "Missing Google ID token." });

    const googleUser = await verifyGoogleToken(idToken);
    if (!googleUser) return res.status(401).json({ message: "Invalid Google token." });

    let user = await User.findOne({ where: { email: googleUser.email }, transaction: t });
    let isNewUser = false;

    if (!user) {
      const profilePicUrl = await uploadProfilePicFromUrl(googleUser.picture, googleUser.email);

      user = await User.create(
        {
          full_name: `${googleUser.firstName} ${googleUser.lastName}`,
          email: googleUser.email,
          profilePic: profilePicUrl,
          isVerified: true,
          is_social_media: true,
          last_login: new Date(),
          login_success_count: 1,
        },
        { transaction: t }
      );

      isNewUser = true;
      await sendNewUserEmail(user.email, user.full_name);

    } else {
      user.last_login = new Date();
      user.login_success_count = (user.login_success_count || 0) + 1;

      if (!user.profilePic && googleUser.picture) {
        user.profilePic = await uploadProfilePicFromUrl(googleUser.picture, googleUser.email);
      }

      if (!user.isVerified) user.isVerified = true;

      await user.save({ transaction: t });
    }

    const token = generateTokenMainToken({ user_id: user.user_id, email: user.email });
    await t.commit();

    return res.status(200).json({
      message: "Google login/signup successful.",
      token,
      profile_image: user.profilePic,
      isNewUser,
    });

  } catch (err) {
    await t.rollback();
    console.error("Google login error:", err);
    return res.status(500).json({ message: "Server error.", error: err.message });
  }
};

exports.resendOtp = async (req, res) => {
    try {
        const { email, purpose } = req.body;
        if (!email || !purpose) {
            return res.status(400).json({ message: 'Email and purpose are required.' });
        }
      
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        const otp = generateOTP(6);
        const expires_at = new Date(Date.now() + 5 * 60 * 1000);
        
        await OTP.create({
        entity_id: user.user_id,
        entity_type: "User",
        otp,
        purpose,
        expires_at,
        });
        
        const sent = await sendOtpEmail(user.email, otp, 'resend');
        if (!sent) {
            return res.status(500).json({ message: 'Failed to send OTP email' });
        }
        return res.status(200).json({ message: 'OTP resent.', user_id: user.user_id });
    } catch (err) {
        console.error('Resend OTP error:', err);
        return res.status(500).json({ message: 'Server error.', error: err });
    }
}

exports.forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }
        
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
      if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your account head to register or sign up to verify." });
    }
        
        const otp = generateOTP(6);
        const expires_at = new Date(Date.now() + 10 * 60 * 1000); 
        await OTP.create({
        entity_id: user.user_id,
        entity_type: "User",
        otp,
        purpose: 'reset',
        expires_at,
        });
        
        const sent = await sendOtpEmail(user.email, otp, 'reset');
        if (!sent) {
            return res.status(500).json({ message: 'Failed to send OTP email' });
        }
        return res.status(200).json({ message: 'OTP sent for password reset.', user_id: user.user_id });
    } catch (err) {
        console.error('Forget password error:', err);
        return res.status(500).json({ message: 'Server error.', error: err });
    }
}

exports.verifyOtp = async (req, res) => {
   
  if (!validateInput(['user_id', 'otp', 'purpose'], req, res)) return;

 

  if (!rateLimit(req.body.user_id + ':verifyOTP')) {
    return res.status(429).json({ message: 'Too many attempts, try again later.' });
  }


  const t = await sequelize.transaction();
  try {
   
    const { user_id, otp, purpose } = req.body;
   
    const user = await User.findOne({ where: { user_id: user_id }, transaction: t });
    if (!user) { await t.rollback(); return res.status(404).json({ message: 'User not found.' }); }

    
    const record = await OTP.findOne({ where: { entity_id: user_id, purpose }, transaction: t });
    if (!record) { await t.rollback(); return res.status(400).json({ message: 'No OTP found' }); }
    if (record.attempts >= 5) { await t.rollback(); return res.status(403).json({ message: 'Too many failed attempts' }); }
    if (new Date() > record.expires_at) {
      await record.destroy({ transaction: t });
      await t.commit();
      return res.status(400).json({ message: 'OTP expired' });
    }
    if (record.otp !== otp) {
      record.attempts++;  
      await record.save({ transaction: t });
      await t.commit();
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    await record.destroy({ transaction: t });

    

    let token;
    
    if (purpose === 'register') {
       
      await user.update({ isVerified: true }, { transaction: t });
      token = generateToken({ user_id: user.user_id, email: user.email, verified: true });
          await sendNewUserEmail(user.email, user.full_name);
    } else if (purpose === 'login') {
       
      token = generateTokenMainToken({ user_id: user.user_id, email: user.email });
      await user.update({   
         login_success_count: (user.login_success_count || 0) + 1,
         last_login: new Date() 
        },{ transaction: t });
    } else if (purpose === 'reset') {
      token = generateToken({ user_id: user.user_id, email: user.email, reset: true });
    } else {
       
      await t.rollback();
      return res.status(400).json({ message: 'Invalid purpose.' });
    }

    await t.commit();
    return res.status(200).json({ message: 'OTP verified.', token  });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: err.message, error: err });
  }
};

exports.resetPassword = async (req, res) => {
    try {
        const { user_id, new_password } = req.body;
        if (!user_id || !new_password) {
            return res.status(400).json({ message: 'user_id and new_password are required.' });
        }
       
        const user = await User.findOne({ where: { user_id: user_id } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
       
        const hashedPassword = await bcrypt.hash(new_password, 10);
        await user.update({ password: hashedPassword });
        return res.status(200).json({ message: 'Password reset successful.' });
    } catch (err) {
        console.error('Reset password error:', err);
        return res.status(500).json({ message: 'Server error.', error: err });
    }
};

exports.getUsers = async (req, res) => {
  try {
      const users = await User.findAll({
          attributes: { exclude: ['password'] }
      });
      return res.status(200).json({ users });
  } catch (err) {
      console.error('Get users error:', err);
      return res.status(500).json({ message: 'Server error.', error: err });
  }
};

exports.getUserById = async (req, res) => {
  try {
      const { user_id } = req.params; 
      const user = await User.findOne({
          where: { user_id },
          attributes: { exclude: ['password'] }
      });
      if (!user) {
          return res.status(404).json({ message: 'User not found.' });
      }

      let interested_courses = [];
      if (user.interested_course_ids && Array.isArray(user.interested_course_ids) && user.interested_course_ids.length) {
        interested_courses = await Course.findAll({
          where: { course_id: user.interested_course_ids },
          attributes: ['course_id', 'title', 'price']
        });
      }

      return res.status(200).json({ user, interested_courses });
  } catch (err) {
      console.error('Get user by ID error:', err);
      return res.status(500).json({ message: 'Server error.', error: err });
  } 
};

exports.updateUserProfile = async (req, res) => {
    const t = await sequelize.transaction();
  try {
    const user_id = req.user.user_id;
    const { full_name, phone, state, country, removeProfilePic, email, address} = req.body;
    const user = await User.findOne({ where: { user_id }, transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: 'User not found.' });
    }
    let profilePicUrl = user.profilePic;

    if (req.file) {
       if (user.profilePic) {
        const publicId = user.profilePic.split("/").pop().split(".")[0]; 
        await ComplexDeleteFileFromCloudinary(publicId);
      }
      const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      user.profilePic = uploadResult.secure_url;
    } else if (removeProfilePic === "true" || removeProfilePic === true) {
  
      if (user.profilePic) {
        const publicId = user.profilePic.split("/").pop().split(".")[0];
        await ComplexDeleteFileFromCloudinary(publicId);
        user.profilePic = null;
      }
    }

    if (full_name) user.full_name = full_name;
    if (address) user.address= address
    if (country) user.country = country;
    if (state) user.state = state
    if (phone) user.phone = phone;
       if (email) {
     const existingUser = await User.findOne({
        where: { email, user_id: { [Op.ne]: user_id } },
        transaction: t
      });

    if (existingUser) {
      await t.rollback();
      return res.status(400).json({ message: "Email already exists." });
    }


      user.email = email;
    }
    
    await user.save({ transaction: t });
    await t.commit();

    return res.status(200).json({ message: 'User profile updated successfully.', user });
  } catch (error) {
    await t.rollback();
    console.error('Update user profile error:', error);
    return res.status(500).json({ message: 'Server error.', error });
  }
};

exports.changeUserPassword = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const user_id = req.user.user_id;
     const { oldPassword, newPassword } = req.body;

     if (!oldPassword || !newPassword) {
      await t.rollback();
      return res.status(400).json({ message: 'Old and new passwords are required.' });
     }


    const user = await User.findOne({ where: { user_id }, transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: 'User not found.' });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      await t.rollback();
      return res.status(401).json({ message: 'Old password is incorrect.' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save({ transaction: t });
    await t.commit();
    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    await t.rollback();
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error.', error });
  }
}


exports.deleteUser = async (req, res) => {
  try {
      const { user_id } = req.params;
      const user = await User.findOne({ where: { user_id } });
      if (!user) {
          return res.status(404).json({ message: 'User not found.' });
      }
      await user.destroy();
      return res.status(200).json({ message: 'User deleted successfully.' });
  }
  catch (err) {
      console.error('Delete user error:', err);
      return res.status(500).json({ message: 'Server error.', error: err });
  } 
}

exports.logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(400).json({ message: "No token provided." });
    }

    const token = authHeader.split(" ")[1];

    
    const decoded = jwt.decode(token);

    await BlacklistedToken.create({
      token,
      expiresAt: new Date(decoded.exp * 1000)
    });

    return res.status(200).json({ message: "Logout successful." });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
