require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Check required environment variables.
if (
    !process.env.DB_USER ||
    !process.env.DB_PASSWORD ||
    !process.env.SESSION_SECRET
) {
    throw new Error(
        'Missing DB_USER, DB_PASSWORD, or SESSION_SECRET in .env'
    );
}

// Database connection.
const dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'eventease',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true
});

const db = dbPool.promise();

// Middleware.
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5500',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration.
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

const sessionStore = new MySQLStore({}, dbPool);

app.use(session({
    key: 'eventease_session_cookie',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// Protect routes that require a logged-in user.
function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({
            message: 'Please log in to continue.'
        });
    }

    next();
}

// Check login status.
app.get('/check-session', (req, res) => {
    if (req.session.userId) {
        return res.status(200).json({
            isLoggedIn: true,
            user: {
                id: req.session.userId,
                username: req.session.username
            }
        });
    }

    res.status(401).json({
        isLoggedIn: false
    });
});

// Register a new user.
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: 'Username and password are required.'
        });
    }

    try {
        const [existingUsers] = await db.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: 'Username already taken.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );

        res.status(201).json({
            message: 'User registered successfully!'
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Username already taken.'
            });
        }

        console.error('Registration error:', error);

        res.status(500).json({
            message: 'An internal server error occurred.'
        });
    }
});

// Log in an existing user.
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: 'Please enter both username and password.'
        });
    }

    try {
        const [users] = await db.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Invalid username or password.'
            });
        }

        const user = users[0];

        const isPasswordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordMatch) {
            return res.status(401).json({
                message: 'Invalid username or password.'
            });
        }

        // Regenerate the session after successful authentication.
        req.session.regenerate((error) => {
            if (error) {
                console.error('Session regeneration error:', error);

                return res.status(500).json({
                    message: 'An internal server error occurred.'
                });
            }

            req.session.userId = user.id;
            req.session.username = user.username;

            req.session.save((saveError) => {
                if (saveError) {
                    console.error('Session save error:', saveError);

                    return res.status(500).json({
                        message: 'An internal server error occurred.'
                    });
                }

                res.status(200).json({
                    message: 'Login successful!',
                    user: {
                        username: user.username
                    }
                });
            });
        });
    } catch (error) {
        console.error('Database error during login:', error);

        res.status(500).json({
            message: 'An internal server error occurred.'
        });
    }
});

// Log out the current user.
app.get('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error('Logout error:', error);

            return res.status(500).json({
                message: 'Could not log out, please try again.'
            });
        }

        res.clearCookie('eventease_session_cookie');

        res.status(200).json({
            message: 'Logged out successfully.'
        });
    });
});

// Retrieve cart items.
app.get('/cart', requireLogin, async (req, res) => {
    try {
        const [cartItems] = await db.query(
            'SELECT * FROM cart_items WHERE user_id = ?',
            [req.session.userId]
        );

        res.status(200).json(cartItems);
    } catch (error) {
        console.error('Error fetching cart items:', error);

        res.status(500).json({
            message: 'Failed to fetch cart.'
        });
    }
});

// Add an item to the cart.
app.post('/cart', requireLogin, async (req, res) => {
    const { title, poster, place, time, price, date } = req.body;

    try {
        const sqlQuery = `
            INSERT INTO cart_items
            (user_id, event_title, event_poster, event_place,
             event_time, event_price, event_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            req.session.userId,
            title || null,
            poster || null,
            place || null,
            time || null,
            price === undefined ? null : price,
            date || null
        ];

        await db.query(sqlQuery, values);

        res.status(201).json({
            message: 'Item added to cart successfully!'
        });
    } catch (error) {
        console.error('Add to cart error:', error);

        res.status(500).json({
            message: 'Failed to add item to cart.'
        });
    }
});

// Remove an item from the cart.
app.delete('/cart/:itemId', requireLogin, async (req, res) => {
    const { itemId } = req.params;

    try {
        await db.query(
            'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
            [itemId, req.session.userId]
        );

        res.status(200).json({
            message: 'Item removed from cart.'
        });
    } catch (error) {
        console.error('Error removing cart item:', error);

        res.status(500).json({
            message: 'Failed to remove item.'
        });
    }
});

// Complete checkout and save the booking.
app.post('/bookings', requireLogin, async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        connection = await db.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        const userId = req.session.userId;

        // Lock the user's cart rows during checkout.
        const [cartItems] = await connection.query(
            'SELECT * FROM cart_items WHERE user_id = ? FOR UPDATE',
            [userId]
        );

        if (cartItems.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                message: 'Your cart is empty.'
            });
        }

        const totalPrice = cartItems.reduce(
            (sum, item) => sum + parseFloat(item.event_price || 0),
            0
        );

        if (!Number.isFinite(totalPrice) || totalPrice < 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                message: 'Invalid booking total.'
            });
        }

        const bookingDetails = JSON.stringify(cartItems);

        await connection.query(
            `INSERT INTO bookings
            (user_id, booking_details, total_price)
            VALUES (?, ?, ?)`,
            [userId, bookingDetails, totalPrice]
        );

        await connection.query(
            'DELETE FROM cart_items WHERE user_id = ?',
            [userId]
        );

        await connection.commit();
        transactionStarted = false;

        res.status(201).json({
            message: 'Booking successful!'
        });
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Booking rollback error:', rollbackError);
            }
        }

        console.error('Error processing booking:', error);

        res.status(500).json({
            message: 'An internal server error occurred during booking.'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Retrieve booking history for the logged-in user.
app.get('/my-bookings', requireLogin, async (req, res) => {
    try {
        const userId = req.session.userId;

        const [bookings] = await db.query(
            `SELECT id, booking_details, total_price, booking_date
             FROM bookings
             WHERE user_id = ?
             ORDER BY booking_date DESC`,
            [userId]
        );

        res.status(200).json(bookings);
    } catch (error) {
        console.error('Error fetching booking history:', error);

        res.status(500).json({
            message: 'Could not retrieve your booking history.'
        });
    }
});

// Save a restaurant reservation.
app.post('/reservations', requireLogin, async (req, res) => {
    const userId = req.session.userId;
    const { title, poster, place, time, date } = req.body;

    try {
        const bookingDetails = JSON.stringify([{
            event_title: title,
            event_poster: poster,
            event_place: place,
            event_time: time,
            event_price: 0,
            event_date: date
        }]);

        await db.query(
            `INSERT INTO bookings
            (user_id, booking_details, total_price)
            VALUES (?, ?, ?)`,
            [userId, bookingDetails, 0]
        );

        res.status(201).json({
            message: 'Reservation successful!'
        });
    } catch (error) {
        console.error('Error processing reservation:', error);

        res.status(500).json({
            message: 'An internal server error occurred during reservation.'
        });
    }
});

// Serve the frontend.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'login.html'));
});

// Prevent access to backend files through static hosting.
app.use('/backend', (req, res) => {
    res.sendStatus(404);
});

app.use(express.static(path.join(__dirname, '..')));

// Start the server.
app.listen(port, () => {
    console.log(`EventEase server is running on port ${port}`);
});
