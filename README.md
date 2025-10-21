# Blood Bank Management System

A simple full-stack blood bank management system using Node.js (Express), MySQL (mysql2), and EJS with Tailwind CSS via CDN.

## Features
- Donor CRUD (add, list, edit, delete with dependency check)
- Inventory listing with optional blood group filter and donor join
- Record donation with a 3-month cooldown check and 42-day expiry auto-calc
- Issue blood bags (mark as Issued)
- Dashboard showing available units per blood group

## Project Structure
```
server.js             # Main server entry
db.js                 # MySQL pool using env vars
schema.sql            # SQL to create required tables
routes/
  main.js             # Dashboard, inventory, donate, issue
  donors.js           # All donor routes
views/
  partials/header.ejs # Tailwind CDN, basic HTML head
  partials/nav.ejs    # Top navigation
  partials/footer.ejs # Footer and closing tags
  index.ejs           # Dashboard view
  donors.ejs          # Donor list
  add-donor.ejs       # Add donor form
  edit-donor.ejs      # Edit donor form
  inventory.ejs       # Inventory table + filter
  donate.ejs          # Record donation form
  issue.ejs           # Issue blood form
```

## Prerequisites
- Node.js 20.6+ (for `--env-file` support)
- MySQL server

## Setup
1. Install dependencies:

```powershell
npm install
```

Alternatively, per requirements:

```powershell
npm install express mysql2 ejs
```

2. Create a `.env` file in the project root with your database credentials:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bloodbank
PORT=3000
```

3. Create the database and tables. First, create a database (e.g., `bloodbank`) in MySQL, then run the schema:

```sql
-- Use your database first
CREATE DATABASE IF NOT EXISTS bloodbank CHARACTER SET utf8mb4;
USE bloodbank;

-- Then run the contents of schema.sql
```

You can copy-paste from `schema.sql`.

4. Start the server:

```powershell
node --env-file=.env server.js
```

Or use the package script:

```powershell
npm start
```

5. Open http://localhost:3000 in your browser.

## Notes
- Tailwind CSS is loaded from CDN in `views/partials/header.ejs`.
- Environment variables are read via Node's `--env-file` flag; no extra package is required.
- Phone has a UNIQUE constraint; duplicates will show an error on Add/Edit.
- Donor deletion is blocked if the donor has records in `blood_stock`.

## SQL Schema (for quick reference)
See `schema.sql` for the full statements.
