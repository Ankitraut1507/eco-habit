const User = require('../models/User');
const Project = require('../models/Project');
const Event = require('../models/Event');
const ErrorResponse = require('../utils/errorResponse');
const mongoose = require('mongoose');

// @desc    Get NGO dashboard data
// @route   GET /api/ngo/dashboard
// @access  Private (NGO only)
exports.getNGODashboard = async (req, res, next) => {
  try {
    const ngo = await User.findById(req.user.id).select('-password');
    if (!ngo) {
      return next(new ErrorResponse('NGO not found', 404));
    }

    // Get statistics
    const stats = {
      totalVolunteers: ngo.volunteers.length,
      activeProjects: await Project.countDocuments({ ngo: ngo._id, status: 'active' }),
      totalDonations: ngo.totalDonations || 0,
      upcomingEvents: await Event.countDocuments({ ngo: ngo._id, date: { $gte: new Date() } })
    };

    res.status(200).json({
      success: true,
      data: {
        organization: ngo,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public projects from all NGOs
// @route   GET /api/ngo/projects/public
// @access  Public
exports.getPublicProjects = async (req, res, next) => {
  try {
    // Find active projects from all NGOs
    const projects = await Project.find({ status: { $in: ['active', 'Active', 'planning', 'Planning'] } })
      .populate('ngo', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Error fetching public projects:', error);
    next(error);
  }
};

// @desc    Get public events from all NGOs
// @route   GET /api/ngo/events/public
// @access  Public
exports.getPublicEvents = async (req, res, next) => {
  try {
    // Find scheduled or upcoming events
    const events = await Event.find({ 
      status: { $in: ['scheduled', 'Scheduled', 'in progress', 'In Progress'] },
      date: { $gte: new Date() } // Only future events
    })
      .populate('ngo', 'name email')
      .sort({ date: 1 }); // Sort by nearest date first
    
    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error fetching public events:', error);
    next(error);
  }
};

// @desc    Create a new project
// @route   POST /api/ngo/projects
// @access  Private (NGO only)
exports.createProject = async (req, res, next) => {
  try {
    req.body.ngo = req.user.id;
    const project = await Project.create(req.body);
    
    // Add project to NGO's projects array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { projects: project._id }
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects for the NGO
// @route   GET /api/ngo/projects
// @access  Private (NGO only)
exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ ngo: req.user.id });
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new event
// @route   POST /api/ngo/events
// @access  Private (NGO only)
exports.createEvent = async (req, res, next) => {
  try {
    req.body.ngo = req.user.id;
    const event = await Event.create(req.body);
    
    // Add event to NGO's events array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { events: event._id }
    });

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all events for the NGO
// @route   GET /api/ngo/events
// @access  Private (NGO only)
exports.getEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ ngo: req.user.id });
    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all volunteers for the NGO
// @route   GET /api/ngo/volunteers
// @access  Private (NGO only)
exports.getVolunteers = async (req, res, next) => {
  try {
    const ngo = await User.findById(req.user.id).populate('volunteers');
    res.status(200).json({
      success: true,
      count: ngo.volunteers.length,
      data: ngo.volunteers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a volunteer to the NGO
// @route   POST /api/ngo/volunteers/:volunteerId
// @access  Private (NGO only)
exports.addVolunteer = async (req, res, next) => {
  try {
    const volunteer = await User.findById(req.params.volunteerId);
    if (!volunteer) {
      return next(new ErrorResponse('Volunteer not found', 404));
    }

    const ngo = await User.findById(req.user.id);
    if (ngo.volunteers.includes(volunteer._id)) {
      return next(new ErrorResponse('Volunteer already added', 400));
    }

    ngo.volunteers.push(volunteer._id);
    await ngo.save();

    res.status(200).json({
      success: true,
      data: volunteer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a donation
// @route   POST /api/ngo/donations
// @access  Private (NGO only)
exports.recordDonation = async (req, res, next) => {
  try {
    const { amount, donorName, donorEmail } = req.body;
    
    const ngo = await User.findById(req.user.id);
    ngo.totalDonations = (ngo.totalDonations || 0) + amount;
    
    // Add donation to donations array
    ngo.donations.push({
      amount,
      donorName,
      donorEmail,
      date: new Date()
    });
    
    await ngo.save();

    res.status(201).json({
      success: true,
      data: ngo.donations[ngo.donations.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all donations for the NGO
// @route   GET /api/ngo/donations
// @access  Private (NGO only)
exports.getDonations = async (req, res, next) => {
  try {
    const ngo = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      count: ngo.donations.length,
      data: ngo.donations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a project
// @route   DELETE /api/ngo/projects/:id
// @access  Private (NGO only)
exports.deleteProject = async (req, res, next) => {
  try {
    console.log(`Deleting project with ID: ${req.params.id}`);

    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new ErrorResponse(`Invalid project ID format: ${req.params.id}`, 400));
    }
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }
    
    // Make sure user is the project owner
    if (project.ngo.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to delete this project', 401));
    }
    
    // Remove project from NGO's projects array
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { projects: project._id }
    });
    
    // Use findByIdAndDelete instead of remove for modern mongoose
    await Project.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Project deletion error:', error);
    next(error);
  }
};

// @desc    Delete an event
// @route   DELETE /api/ngo/events/:id
// @access  Private (NGO only)
exports.deleteEvent = async (req, res, next) => {
  try {
    console.log(`Deleting event with ID: ${req.params.id}`);

    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new ErrorResponse(`Invalid event ID format: ${req.params.id}`, 400));
    }
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }
    
    // Make sure user is the event owner
    if (event.ngo.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to delete this event', 401));
    }
    
    // Remove event from NGO's events array
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { events: event._id }
    });
    
    // Use findByIdAndDelete instead of remove for modern mongoose
    await Event.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Event deletion error:', error);
    next(error);
  }
}; 