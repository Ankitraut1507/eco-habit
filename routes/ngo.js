const express = require('express');
const router = express.Router();
const {
  getNGODashboard,
  createProject,
  getProjects,
  createEvent,
  getEvents,
  getVolunteers,
  addVolunteer,
  recordDonation,
  getDonations,
  deleteProject,
  deleteEvent,
  getPublicProjects,
  getPublicEvents
} = require('../controllers/ngoController');
const { protect, authorize } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/projects/public', getPublicProjects);
router.get('/events/public', getPublicEvents);

// All routes below are protected and require NGO role
router.use(protect);
router.use(authorize('NGO'));

// Dashboard and Profile
router.get('/dashboard', getNGODashboard);
router.get('/profile', getNGODashboard);

// Projects
router.route('/projects')
  .get(getProjects)
  .post(createProject);

router.route('/projects/:id')
  .delete(deleteProject);

// Events
router.route('/events')
  .get(getEvents)
  .post(createEvent);

router.route('/events/:id')
  .delete(deleteEvent);

// Volunteers
router.route('/volunteers')
  .get(getVolunteers);

router.post('/volunteers/:volunteerId', addVolunteer);

// Donations
router.route('/donations')
  .get(getDonations)
  .post(recordDonation);

module.exports = router; 