# EventEase – Full-Stack Event Booking Platform

EventEase is a full-stack web application designed to make event booking simple and convenient. Users can explore movies, concerts, stand-up comedy shows, and restaurants, book their favourite events, and manage all their bookings in one place.

The project was developed to demonstrate frontend development, backend development, database integration, user authentication, and deployment.

## Live Application

- **Live Website:** https://eventease-frontend-a0yf.onrender.com
- **GitHub Repository:** https://github.com/anoohyasreeramdas/EventEase
  
## Features

### 1. User Authentication
- User registration and login.
- Secure password hashing.
- Session-based authentication.
- Protected booking operations.

### 2. Event Browsing
- Browse available movies.
- Explore concerts and live performances.
- Discover stand-up comedy shows.
- Browse restaurants by city.
- View event and restaurant details.

### 3. Event Booking
- Select events and booking details.
- Choose available dates and times where applicable.
- Add selected events to the cart.
- Review booking details before checkout.

### 4. Restaurant Reservations
- Browse restaurants based on city.
- View restaurant information and offers.
- Select a reservation date.
- Choose a reservation time slot.
- Save reservation details to the database.

### 5. Cart Management
- Add events to the cart.
- View selected booking details.
- Remove items from the cart.
- Calculate the total booking amount.

### 6. My Bookings
- View previous bookings in one place.
- View booking references and booking dates.
- View event names, venues, dates, and times.
- Book previously selected events again.

### 7. Checkout and Confirmation
- Review booking details.
- Validate card number format.
- Complete the demonstration checkout flow.
- View booking confirmation through the Thank You page.

**Note:** The checkout is a demonstration feature. It does not process real payments or charge actual cards.

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL, TiDB Cloud |
| Database Driver | MySQL2 |
| Authentication | Express Session, bcryptjs |
| API Communication | REST APIs, Fetch API |
| Version Control | Git, GitHub |
| Deployment | Render |

## Database

EventEase uses a MySQL-compatible database.

- MySQL was used during backend database development.
- The database was migrated to TiDB Cloud for production hosting.
- Database records are managed through backend API operations.
- Database credentials are stored securely using environment variables.

## Project Structure

```text
EventEase/
│
├── backend/
│   ├── server.js
│   └── package.json
│
├── images/
│
├── index.html
├── about.html
├── contact.html
├── faq.html
├── login.html
├── signup.html
│
├── movies.html
├── moviesData.js
├── moviesBooking.js
│
├── concerts.html
├── concertsData.js
├── concertsBooking.js
│
├── standup.html
├── standupData.js
├── standupBooking.js
│
├── restaurants.html
├── restaurantsData.js
├── restaurantsBooking.js
│
├── cart.html
├── cart.js
├── my_bookings.html
├── payment.html
├── thankyou.html
│
├── style.css
├── eventease-logo.png
└── .gitignore
```

## Installation and Setup

### Prerequisites

- Node.js and npm
- Git
- MySQL-compatible database
- Visual Studio Code or another code editor

### 1. Clone the Repository

```bash
git clone https://github.com/anoohyasreeramdas/EventEase.git
cd EventEase
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the `backend` folder.

Configure the following variables with your own database credentials:

```env
DB_HOST=your_database_host
DB_USER=your_database_username
DB_PASSWORD=your_database_password
DB_NAME=eventease
SESSION_SECRET=your_session_secret
FRONTEND_ORIGIN=http://localhost:3000
NODE_ENV=development
PORT=3000
```

Before running the application, set up the database and import the provided database backup.

**Security Note:** Keep your `.env` file private. Never commit database credentials, passwords, or secret keys to GitHub.

### 4. Start the Backend

```bash
npm start
```

Run the frontend using a local development server and configure its API URL to point to your local backend.

## Deployment

EventEase is deployed using Render and TiDB Cloud.

- **Frontend:** Hosted as a Render static site.
- **Backend:** Hosted as a Node.js and Express.js service on Render.
- **Database:** Hosted on TiDB Cloud.

The frontend communicates with the backend through REST API requests. The backend handles authentication, booking operations, session management, and database interactions.

## Future Enhancements

- Integration with a real payment gateway.
- Email confirmation for successful bookings.
- Advanced event search and filtering.
- Additional event categories.
- Enhanced booking management features.

## Author

**Anoohya Sreeramdas**
