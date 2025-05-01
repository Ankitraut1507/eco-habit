const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eco-habit';
    await mongoose.connect(uri);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
};

// Create a test event
const createTestEvent = async () => {
  try {
    // First find an NGO user
    const ngo = await User.findOne({ role: 'NGO' });
    
    if (!ngo) {
      console.error('No NGO user found in the database. Create an NGO user first.');
      process.exit(1);
    }
    
    console.log(`Found NGO: ${ngo.name} (${ngo._id})`);
    
    // Create a test event
    const eventData = {
      title: 'Community Beach Cleanup',
      description: 'Join us for a day of cleaning our local beaches to protect marine wildlife.',
      location: 'Sunset Beach',
      maxParticipants: 50,
      currentParticipants: 10,
      budget: {
        required: 500,
        raised: 200
      },
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      time: '9:00 AM',
      type: 'Volunteer',
      status: 'Scheduled',
      tags: ['environment', 'cleanup', 'community'],
      ngo: ngo._id
    };
    
    // Check if event with this title already exists
    const existingEvent = await Event.findOne({ title: eventData.title });
    if (existingEvent) {
      console.log('Test event already exists:', existingEvent);
      process.exit(0);
    }
    
    const event = await Event.create(eventData);
    console.log('Test event created successfully:', event);
    
    // Add the event to the NGO's events array if it has one
    if (Array.isArray(ngo.events)) {
      await User.findByIdAndUpdate(ngo._id, {
        $push: { events: event._id }
      });
      console.log('Event added to NGO\'s events array');
    }
    
    // List all events in the database
    const allEvents = await Event.find();
    console.log(`\nAll events in database (${allEvents.length}):`);
    allEvents.forEach(e => {
      console.log(`- ${e.title} (${e._id}), Status: ${e.status}, Date: ${e.date}`);
    });
    
  } catch (err) {
    console.error('Error creating test event:', err);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
connectDB()
  .then(createTestEvent)
  .catch(err => {
    console.error('Script error:', err);
    mongoose.disconnect();
  }); 