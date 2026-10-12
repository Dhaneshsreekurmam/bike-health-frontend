# Bike Health Maintenance System

A beginner-friendly web application for managing motorcycle details and tracking maintenance.

## Features

* **Bike Profile:** Add and view bike information.
* **Maintenance Tracking:** Record and manage maintenance history.
* **Maintenance Reminders:** View upcoming maintenance information.
* **Bike Health Score:** Check a bike's health status based on available maintenance data.

## Technologies Used

* React
* Vite
* JavaScript
* CSS
* Axios
* Java Spring Boot (backend)
* MySQL (database)

## Project Structure

```text
frontend/
├── public/
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## How to Run

### Prerequisites

* Node.js and npm
* The Bike Health Maintenance System backend running locally

### Installation

1. Open a terminal in the `frontend` folder.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the local URL displayed in the terminal, usually `http://localhost:5173`.

## Backend

The frontend communicates with the Spring Boot backend at `http://localhost:8080`.

The backend and its database must be configured and running for API-based features to work.

## Project Purpose

This project demonstrates basic full-stack web development, REST API integration, and motorcycle maintenance management.
