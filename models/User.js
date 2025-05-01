const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'NGO', 'Admin'],
    default: 'user'
  },
  profileImage: {
    type: String
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  // NGO specific fields
  organization: {
    name: {
      type: String,
      required: function() {
        return this.role === 'NGO';
      }
    },
    type: {
      type: String,
      required: function() {
        return this.role === 'NGO';
      }
    },
    address: {
      type: String,
      required: function() {
        return this.role === 'NGO';
      }
    },
    phone: {
      type: String,
      required: function() {
        return this.role === 'NGO';
      }
    },
    website: {
      type: String
    },
    logo: {
      type: String
    }
  },
  volunteers: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  projects: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Project'
  }],
  events: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Event'
  }],
  totalDonations: {
    type: Number,
    default: 0
  },
  donations: [{
    amount: {
      type: Number,
      required: true
    },
    donorName: {
      type: String,
      required: true
    },
    donorEmail: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  // For Admin: Statistics tracking
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add a post to user's posts array
UserSchema.methods.addPost = async function(postId) {
  // Check if post already exists in the user's posts
  if (!this.posts.includes(postId)) {
    this.posts.push(postId);
    await this.save();
  }
  return this;
};

// Add a volunteer to NGO's volunteers array
UserSchema.methods.addVolunteer = async function(volunteerId) {
  if (this.role === 'NGO' && !this.organization.volunteers.includes(volunteerId)) {
    this.organization.volunteers.push(volunteerId);
    await this.save();
  }
  return this;
};

// Add a donation to NGO's donations array
UserSchema.methods.addDonation = async function(donationData) {
  if (this.role === 'NGO') {
    this.organization.donations.push(donationData);
    await this.save();
  }
  return this;
};

module.exports = mongoose.model('User', UserSchema); 