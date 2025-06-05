const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();
const session = require('express-session');
const MongoStore = require('connect-mongo');

const PORT = 3000;

app.use(express.static(path.join(__dirname), {
    index: false
}));

app.use(session({
    secret: '8a20bbb812f34b47a54ddc535d3a927b229991a061e1b1911e42b876c40eef57',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/inventura',
        collectionName: 'sessions',
        ttl: 24 * 60 * 60
    }),
    cookie: {
        maxAge: 24 * 60 * 60 * 1000
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
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Login Check

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.redirect('/?error=1');
        }

        req.session.user = { id: user._id, username: user.username };
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.redirect('/?error=1');
    }
});

// Authentication Check

function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.redirect('/');
    }
}

// Session Check

app.get('/session-check', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ loggedIn: true, username: req.session.user.username });
    } else {
        res.json({ loggedIn: false });
    }
});

// Logout

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

// Product Category

const productCategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }
});

const ProductCategory = mongoose.model('ProductCategory', productCategorySchema);

// Create Product Category

app.post('/add-product-category', async (req, res) => {
    const { name } = req.body;

    try {
        const existing = await ProductCategory.findOne({ name });
        if (existing) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const newCategory = new ProductCategory({ name });
        await newCategory.save();

        res.status(200).json({ message: 'Category added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Fetch Product Category

app.get('/get-product-categories', async (req, res) => {
    try {
        const categories = await ProductCategory.find().sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete Product Category

app.delete('/delete-product-category/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await ProductCategory.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Product

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    weight: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true }
});

const Product = mongoose.model('Product', productSchema);

// Create Product

app.post('/add-product', async (req, res) => {
    const { name, weight, category, price } = req.body;

    try {
        const newProduct = new Product({ name, weight, category, price });
        await newProduct.save();
        res.status(200).json({ message: 'Product added successfully', product: newProduct });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Fetch Products

app.get('/get-products', async (req, res) => {
    try {
        const products = await Product.find().populate('category', 'name');
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Search Products by Name
app.get('/search-products', async (req, res) => {
    const query = req.query.q;
    try {
        const products = await Product.find({ name: { $regex: query, $options: 'i' } }).limit(10);
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Product

app.put('/update-product/:id', async (req, res) => {
    const { id } = req.params;
    const { name, weight, category, price } = req.body;

    try {
        const updated = await Product.findByIdAndUpdate(id, { name, weight, category, price }, { new: true });
        if (!updated) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete Product

app.delete('/delete-product/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await Product.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Bill

const billSchema = new mongoose.Schema({
    customerName: String,
    customerNumber: String,
    billingDate: String,
    billingTime: String,
    modeOfDelivery: String,
    modeOfPayment: String,
    customerAddress: String,
    products: [{
        name: String,
        quantity: Number,
        unitPrice: Number,
        originalTotal: Number,
        discount: Number,
        discountedTotal: Number
    }],
    overallTotal: Number,
    overallDiscount: Number,
    finalTotal: Number,
    createdAt: { type: Date, default: Date.now }
});

const Bill = mongoose.model('Bill', billSchema);

app.post('/save-bill', async (req, res) => {
    try {
        const newBill = new Bill(req.body);
        await newBill.save();
        res.status(200).json({ message: 'Bill saved successfully', billId: newBill._id });
    } catch (err) {
        console.error('Error saving bill:', err);
        res.status(500).json({ message: 'Error saving bill' });
    }
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

app.get('/productlisting', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'productlisting.html'));
});

app.get('/billing', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'billing.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
