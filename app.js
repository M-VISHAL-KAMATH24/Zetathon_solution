const express = require('express');
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Replace with your Razorpay credentials
const razorpay = new Razorpay({
    key_id: 'rzp_test_BwxDSBJZbvYeJK', // Replace with your Razorpay key_id
    key_secret: '7itnMX6hflAXP4Go1f6pYUSh', // Replace with your Razorpay key_secret
});

// Function to read data from JSON file
const readData = () => {
    if (fs.existsSync('orders.json')) {
        const data = fs.readFileSync('orders.json');
        return JSON.parse(data);
    }
    return [];
};

// Function to write data to JSON file
const writeData = (data) => {
    fs.writeFileSync('orders.json', JSON.stringify(data, null, 2));
};

// Initialize orders.json if it doesn't exist
if (!fs.existsSync('orders.json')) {
    writeData([]);
}

// Route to create a Razorpay order
app.post('/create-order', async (req, res) => {
    try {
        const { amount, currency, receipt, notes } = req.body;

        const options = {
            amount: amount * 100, // Convert amount to paise
            currency,
            receipt,
            notes,
        };

        const order = await razorpay.orders.create(options);

        const orders = readData();
        orders.push({ ...order, status: 'created' });
        writeData(orders);

        res.json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).send('Error creating order');
    }
});

// Route to verify payment
app.post('/verify-payment', (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const secret = razorpay.key_secret;
    const body = razorpay_order_id + '|' + razorpay_payment_id;

    try {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            const orders = readData();
            const order = orders.find(o => o.id === razorpay_order_id);

            if (order) {
                order.status = 'paid';
                order.payment_id = razorpay_payment_id;
                writeData(orders);
            }

            res.status(200).json({ status: 'ok' });
        } else {
            res.status(400).json({ status: 'verification_failed' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).send('Error verifying payment');
    }
});

// Serve success page
app.get('/payment-success', (req, res) => {
    res.sendFile(path.join(__dirname, 'success.html'));
});

// Start the server and dynamically import the open module to launch the browser
app.listen(port, async () => {
    console.log(`Server running at http://localhost:${port}`);
    const open = await import('open'); // Dynamically import the open module
    open.default(`http://localhost:${port}`); // Use open.default for ESM modules
});