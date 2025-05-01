const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Event = require('../models/Event');

// @desc    Get all public projects
// @route   GET /api/public/projects
// @access  Public
router.get('/projects', async (req, res) => {
  try {
    // Find active and planning projects
    const projects = await Project.find({ 
      status: { $in: ['active', 'Active', 'planning', 'Planning'] } 
    })
    .populate('ngo', 'name email')
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Error fetching public projects:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @desc    Get all public events
// @route   GET /api/public/events
// @access  Public
router.get('/events', async (req, res) => {
  try {
    console.log('Fetching public events');
    
    // Get all events without filtering
    let events = await Event.find({})
      .populate('ngo', 'name email')
      .sort({ date: 1 });
    
    console.log(`Found ${events.length} total events in database`);
    
    // Log detailed information about each event for debugging
    events.forEach(event => {
      console.log('--------------------------------------');
      console.log(`Event ID: ${event._id}`);
      console.log(`Event Title: ${event.title}`);
      console.log(`Event Status: ${event.status}`);
      console.log(`Event Date: ${event.date}`);
      console.log(`Event Time: ${event.time}`);
      console.log(`Event Type: ${event.type}`);
      console.log(`Event NGO: ${event.ngo ? event.ngo._id : 'None'}`);
      console.log('--------------------------------------');
    });
    
    // If there are no events, log it for debugging
    if (events.length === 0) {
      // Try to check if there are any events at all in the database
      const totalCount = await Event.countDocuments({});
      console.log(`Total events in database: ${totalCount}`);
      
      // Also check if there are any events with specific statuses
      const scheduledCount = await Event.countDocuments({ status: { $in: ['scheduled', 'Scheduled'] } });
      const inProgressCount = await Event.countDocuments({ status: { $in: ['in progress', 'In Progress'] } });
      
      console.log(`Status counts - Scheduled: ${scheduledCount}, In Progress: ${inProgressCount}`);
    }
    
    // Return all events without filtering
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error fetching public events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error',
      message: error.message
    });
  }
});

module.exports = router; 