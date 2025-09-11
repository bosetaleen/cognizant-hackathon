const express = require('express');
const router = express.Router();
const pool = require('../db'); // Adjust path if needed


// Middleware to check if logged in as employee
async function ensureEmployee(req, res, next) {
  try {
    // Check if user is logged in
    if (!req.session.user || !req.session.user.id) {
      return res.redirect('/login');
    }

    // Optionally, you can verify user exists in DB
    const result = await pool.query('SELECT id FROM users WHERE id = $1', [req.session.user.id]);
    if (result.rows.length === 0) {
      // User ID not found
      return res.redirect('/login');
    }

    // User exists, allow access
    next();
  } catch (err) {
    console.error('Middleware error:', err);
    res.redirect('/login');
  }
}

// Employee Dashboard → show tickets created by employee
router.get('/dashboard', ensureEmployee, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tickets WHERE created_by = $1 ORDER BY created_at DESC',
      [req.session.user.email]   // must match 'created_by' in DB
    );

    console.log("Fetched tickets:", result.rows); // debug
    res.render('employee/dashboard', {
      title: "Employee Dashboard",
      user: req.session.user,
      tickets: result.rows
    });
  } catch (err) {
    console.error('❌ Error fetching tickets:', err);
    res.status(500).send('Error loading dashboard');
  }
});




// Form to create a new ticket
router.get('/tickets/new', ensureEmployee, (req, res) => {
  res.render('employee/new_ticket', { 
    title: "Raise Ticket", 
    user: req.session.user 
  });
});

// Handle ticket creation
router.post('/tickets', ensureEmployee, async (req, res) => {
  const { title, description, priority } = req.body;
  const userId = req.session.user.id;
  const createdBy = req.session.user.email;

  try {
  await pool.query(
  'INSERT INTO tickets (title, description, priority, created_by) VALUES ($1, $2, $3, $4)',
  [title, description, priority, createdBy]
);
    res.redirect('/employee/dashboard');
  } catch (err) {
    console.error('❌ Error creating ticket:', err);
    res.status(500).send('Error creating ticket');
  }
});


// View ticket details
router.get('/tickets/:id', ensureEmployee, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM tickets WHERE id = $1 AND created_by = $2',
      [id, req.session.user.email]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Ticket not found');
    }

    res.render('employee/ticket_detail', { 
      title: "Ticket Details", 
      user: req.session.user, 
      ticket: result.rows[0] 
    });
  } catch (err) {
    console.error('❌ Error fetching ticket:', err);
    res.status(500).send('Error loading ticket');
  }
});

//logout
// Logout route for employee
router.get('/logout', (req, res) => {
  // Destroy the session
  req.session.destroy(err => {
    if (err) {
      console.error('❌ Logout error:', err);
      return res.status(500).send('Error logging out');
    }

    // Redirect to login page
    res.redirect('/login');
  });
});

// Delete (resolve) ticket
router.post('/tickets/:id/resolve', ensureEmployee, async (req, res) => {
  const { id } = req.params;

  try {
    // Delete the ticket created by the logged-in employee
    await pool.query(
      'DELETE FROM tickets WHERE id = $1 AND created_by = $2',
      [id, req.session.user.email]
    );

    res.redirect('/employee/dashboard');
  } catch (err) {
    console.error('❌ Error deleting ticket:', err);
    res.status(500).send('Error resolving ticket');
  }
});




module.exports = router;
