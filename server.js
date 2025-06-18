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
    console.log('Session user:', req.session.user); // DEBUG LINE
    if (req.session && req.session.user) {
        return next();
    } else {
        console.log('User not authenticated, redirecting to /');
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
    billNumber: { type: Number, required: true, unique: true },
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
        const { customerName, customerNumber, customerAddress } = req.body;

        // Get next bill number
        const latestBill = await Bill.findOne().sort({ billNumber: -1 });
        const nextBillNumber = latestBill ? latestBill.billNumber + 1 : 1;

        // Save bill
        const newBill = new Bill({
            ...req.body,
            billNumber: nextBillNumber
        });
        await newBill.save();

        res.status(200).json({ message: 'Bill saved successfully', billNumber: nextBillNumber });
    } catch (err) {
        console.error('Error saving bill:', err);
        res.status(500).json({ message: 'Error saving bill' });
    }
});

// Fetch All Bills

app.get('/get-bills', isAuthenticated, async (req, res) => {
    try {
        const {
            billNumber,
            customerName,
            customerNumber,
            startDate,
            endDate,
            modeOfPayment,
            modeOfDelivery
        } = req.query;

        const query = {};

        if (billNumber) {
            query.billNumber = billNumber;
        }

        if (customerName) {
            query.customerName = { $regex: customerName, $options: 'i' }; // case-insensitive
        }

        if (customerNumber) {
            query.customerNumber = { $regex: customerNumber, $options: 'i' };
        }

        if (startDate && endDate) {
            query.billingDate = { $gte: startDate, $lte: endDate };
        }

        if (modeOfPayment) {
            query.modeOfPayment = modeOfPayment;
        }

        if (modeOfDelivery) {
            query.modeOfDelivery = modeOfDelivery;
        }

        const bills = await Bill.find(query).sort({ billingDate: -1, billingTime: -1 });
        res.json(bills);
    } catch (err) {
        console.error('Error fetching bills:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/get-bill/:id', isAuthenticated, async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id);
        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }
        res.json(bill);
    } catch (err) {
        console.error('Error fetching bill:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/next-bill-number', isAuthenticated, async (req, res) => {
    try {
        const latestBill = await Bill.findOne().sort({ billNumber: -1 });
        const nextBillNumber = latestBill ? latestBill.billNumber + 1 : 1;
        res.json({ nextBillNumber });
    } catch (err) {
        console.error('Error fetching bill number:', err);
        res.status(500).json({ message: 'Error fetching bill number' });
    }
});

app.get('/search-customers', isAuthenticated, async (req, res) => {
    const query = req.query.q?.toLowerCase() || "";

    try {
        const bills = await Bill.aggregate([
            {
                $match: {
                    $or: [
                        { customerName: { $regex: query, $options: 'i' } },
                        { customerNumber: { $regex: query } }
                    ]
                }
            },
            {
                $group: {
                    _id: { name: "$customerName", number: "$customerNumber" },
                    address: { $last: "$customerAddress" }
                }
            },
            {
                $limit: 10
            }
        ]);

        const suggestions = bills.map(b => ({
            name: b._id.name,
            number: b._id.number,
            address: b.address
        }));

        res.json(suggestions);
    } catch (err) {
        console.error('Error fetching customer data from bills:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Fetch Total Sales Amount

app.get('/total-sales-amount', async (req, res) => {
    try {
        const result = await Bill.aggregate([
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$finalTotal" }
                }
            }
        ]);
        const total = result[0]?.totalSales || 0;
        res.json({ totalSales: total });
    } catch (err) {
        console.error('Error calculating total sales:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Fetch Unique Customer Count
app.get('/unique-customers-count', async (req, res) => {
    try {
        const result = await Bill.aggregate([
            {
                $match: {
                    customerName: { $ne: "Unknown" }
                }
            },
            {
                $group: {
                    _id: {
                        name: "$customerName",
                        number: "$customerNumber"
                    }
                }
            },
            {
                $count: "uniqueCount"
            }
        ]);

        const count = result[0]?.uniqueCount || 0;
        res.json({ count });
    } catch (err) {
        console.error('Error fetching unique customers count from bills:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/get-unique-customers', isAuthenticated, async (req, res) => {
    try {
        const result = await Bill.aggregate([
            {
                $group: {
                    _id: {
                        name: "$customerName",
                        number: "$customerNumber"
                    },
                    totalSpent: { $sum: "$finalTotal" },
                    latestBillDate: { $max: "$createdAt" }
                }
            },
            {
                $lookup: {
                    from: "bills",
                    let: { cname: "$_id.name", cnum: "$_id.number", latestDate: "$latestBillDate" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$customerName", "$$cname"] },
                                        { $eq: ["$customerNumber", "$$cnum"] },
                                        { $eq: ["$createdAt", "$$latestDate"] }
                                    ]
                                }
                            }
                        },
                        { $project: { customerAddress: 1, _id: 0 } }
                    ],
                    as: "latestAddressData"
                }
            },
            {
                $project: {
                    name: "$_id.name",
                    number: "$_id.number",
                    totalSpent: 1,
                    address: { $arrayElemAt: ["$latestAddressData.customerAddress", 0] }
                }
            },
            { $sort: { totalSpent: -1 } }
        ]);

        res.json(result);
    } catch (err) {
        console.error("Error fetching unique customers with totals:", err);
        res.status(500).json({ message: "Server error" });
    }
});

app.get('/customer-purchases', isAuthenticated, async (req, res) => {
    const { name, number } = req.query;

    try {
        const purchases = await Bill.find({
            customerName: name,
            customerNumber: number
        }).sort({ createdAt: -1 });

        res.json(purchases);
    } catch (err) {
        console.error('Error fetching customer purchases:', err);
        res.status(500).json({ message: 'Server error' });
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

app.get('/billlogs', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'billlogs.html'));
});

app.get('/analytics', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'analytics.html'));
});

app.get('/customers', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'customers.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
