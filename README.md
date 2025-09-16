Model-Driven Ticket Management System
Overview
This project is a modern, scalable ticket management system enhanced with machine learning models for intelligent ticket classification. It separates concerns across three layers: a responsive frontend, a Node.js web backend, and a Python ML backend, with PostgreSQL as the central data store.

Tech Stack
Frontend
Languages: HTML, CSS, JavaScript

Framework: React

Styling: Tailwind CSS

Purpose: Clean and responsive interface to submit, track, and manage tickets.

Web Backend
Language: Node.js

Framework: Express.js

Purpose: Handles API requests, manages business logic, and communicates with the ML backend and database.

Machine Learning Backend
Language: Python

Framework: FastAPI

Libraries: Scikit-learn, Pandas, spaCy/NLTK

Purpose: Provides a model-driven API for ticket classification and automation.

Database
Technology: PostgreSQL

Purpose: Stores tickets, user data, and logs for retraining models and historical reference.

Features
Model-driven ticket classification.

User-friendly web interface for employees.

Scalable API-driven backend architecture.

Data storage and retrieval with PostgreSQL
