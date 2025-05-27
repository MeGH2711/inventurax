const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();
const session = require('express-session');

const PORT = 3000;

app.use(express.static(path.join(__dirname), {
    index: false // don't serve index.html automatically
}));

app.use(session({
    secret: '8a20bbb812f34b47a54ddc535d3a927b229991a061e1b1911e42b876c40eef57',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/inventura', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Create New User
app.get('/create-user', async (req, res) => {
    try {
        const username = 'Megh';
        const plainPassword = 'Megh123';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = new User({
            username,
            password: hashedPassword
        });

        await newUser.save();

        res.json({
            message: 'User created successfully',
            username,
            password: plainPassword
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.redirect('/?error=1');
        }

        // Set session
        req.session.user = { id: user._id, username: user.username };
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.redirect('/?error=1');
    }
});

function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.redirect('/');
    }
}

app.get('/session-check', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Could not log out.');
        }
        res.clearCookie('connect.sid'); // Optional: clear session cookie
        res.redirect('/');
    });
});

// Routes
app.get('/', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
