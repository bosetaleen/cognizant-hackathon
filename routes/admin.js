
const express = require('express');
const router = express.Router();
const pool = require('../db'); // adjust path if needed
const bcrypt = require('bcrypt');
 


// Middleware to ensure admin
function ensureAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/login');
  }
  next();
}

// GET form to create employee
router.get('/employees/new', ensureAdmin, (req, res) => {
  res.render('admin/new_employee', { title: "Create Employee", user: req.session.user });
});

// POST to create employee
router.post('/employees', ensureAdmin, async (req, res) => {
  const { name, email, password,role, date_of_joining } = req.body;
  console.log('Received:', req.body);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (name, email, password, role, date_of_joining) VALUES ($1, $2, $3, $4, $5)';
    await pool.query(query, [name, email, hashedPassword, role, date_of_joining]);
    console.log('✅ Employee created:', email);
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('❌ Error creating employee:', err);
    res.status(500).send('Error creating employee');
  }
});

// Admin Dashboard → Show all tickets
router.get('/dashboard', ensureAdmin, async (req, res) => {
  try {
    // Fetch all employees
    const result = await pool.query(
      "SELECT id, name, email, role, date_of_joining FROM users ORDER BY id ASC"

    );
     const ticketsResult = await pool.query('SELECT * FROM tickets ORDER BY created_at DESC');

    res.render('admin/dashboard', {
      title: "Admin Dashboard",
      user: req.session.user,
      employees: result.rows,
       tickets: ticketsResult.rows,
        unassignedCount: 0  ,
        activeTab: "dashboard"
    });
  } catch (err) {
    console.error('❌ Error fetching employees:', err);
    res.status(500).send('Error loading dashboard');
  }
});

// Priority mapping for display & sorting
const PRIORITY_MAP = {
  1: "Critical",
  2: "Major",
  3: "Minor",
  4: "Trivial",
  5: "Blocker",
  6: "Normal", // fallback
};

const PRIORITY_ORDER_MAP = {
  Critical: 1,
  Major: 2,
  Minor: 3,
  Trivial: 4,
  Blocker: 5,
  Normal: 6,
};

// View unassigned tickets (status = 'open')
router.get('/tickets/unassigned', ensureAdmin, async (req, res) => {
  try {
    // Fetch unassigned tickets from DB
    const result = await pool.query(
      'SELECT * FROM tickets WHERE status = $1',
      ['open']
    );

    let tickets = result.rows;

    const fetch = (await import('node-fetch')).default;

    // Call FastAPI for each ticket
    for (let ticket of tickets) {
      try {
      // Example inside your route
const response = await fetch("http://127.0.0.1:8000/predict", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    description: ticket.description,
    priority: ticket.priority || ""
  })
});

const prediction = await response.json();


        ticket.team = prediction.developer_team;
        ticket.priority_order = prediction.priority_order;
        ticket.priority = PRIORITY_MAP[prediction.priority_order] || "Normal";
      } catch (err) {
        console.error(`❌ Error predicting ticket ${ticket.id}:`, err);
        ticket.team = "Unassigned";
        ticket.priority_order = 6;
        ticket.priority = "Normal";
      }
    }

    // Sort tickets by priority_order
    tickets.sort((a, b) => b.priority_order - a.priority_order);


       const updatedTickets = await pool.query(
      "SELECT * FROM tickets WHERE status = $1 ORDER BY priority_order ASC",
      ["assigned"]
    );




    const empresult = await pool.query(
      "SELECT id, name, email, role, date_of_joining FROM users ORDER BY id ASC"

    );

   res.render("admin/dashboard", {
      user: req.session.user,
      tickets: updatedTickets.rows,
       employees: empresult.rows,
        activeTab: "unassigned" ,
    });


  } catch (err) {
    console.error('❌ Error fetching unassigned tickets:', err);
    res.status(500).send('Error loading tickets');
  }
});

// Auto-assign ALL unassigned tickets using FastAPI
router.post('/tickets/auto-assign-all', ensureAdmin, async (req, res) => {
  try {
    // Fetch only unassigned tickets
    const ticketsResult = await pool.query(
      "SELECT * FROM tickets WHERE status = $1",
      ["open"]
    );
    const tickets = ticketsResult.rows;
    

    for (let ticket of tickets) {
      try {
        // Call FastAPI /predict
        const response = await fetch("http://127.0.0.1:8000/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: ticket.title, // or ticket.description if that’s your main field
            priority: ticket.priority || ""
          })
        });

        if (!response.ok) {
          console.error(`Failed to predict ticket ${ticket.id}: ${response.status}`);
          continue;
        }

        const prediction = await response.json();

        // Update ticket in DB with assigned team and priority order
        await pool.query(
          "UPDATE tickets SET assigned_to = $1, priority_order = $2, status = $3 WHERE id = $4",
          [prediction.developer_team, prediction.priority_order, "assigned", ticket.id]
        );
      } catch (err) {
        console.error(`Error assigning ticket ${ticket.id}:`, err);
      }
    }
    // Redirect back to unassigned tickets view

  
 res.redirect('/admin/tickets/unassigned#unassigned-tickets');

  } catch (err) {
    console.error("❌ Error auto-assigning tickets:", err);
    res.status(500).send("Error auto-assigning tickets");
  }
});


//delete employee
router.post('/employees/:id/delete', ensureAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    console.log('Deleting employee with id:', id);
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );
    console.log('Rows deleted:', result.rowCount);

    res.redirect('/admin/dashboard'); // Refresh dashboard
  } catch (err) {
    console.error('❌ Error deleting employee:', err);
    res.status(500).send('Error removing employee');
  }
});


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



module.exports = router;
