const express = require('express');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Fake Database (JSON File)
const DB_FILE = 'fake_transactions.json';

// Ensure Fake Database Exists
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// Storage for Face Images
const storage = multer.diskStorage({
    destination: './faces',
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Load Transactions from Fake Database
const loadTransactions = () => {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Error reading transactions file:", error);
        return [];
    }
};

// Save Transactions to Fake Database
const saveTransaction = (transaction) => {
    let transactions = loadTransactions();
    transactions.push(transaction);
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(transactions, null, 2));
    } catch (error) {
        console.error("Error saving transaction:", error);
    }
};

// Register Face (Fake)
app.post('/api/register_face', upload.single('face_image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: "No face image uploaded" });
    }
    console.log("Face registered:", req.file.path);
    res.json({ success: true, message: "Face registered successfully!", faceId: req.file.filename });
});

// Simulate Payment Processing
app.post('/api/pay', (req, res) => {
    const { amount, userId } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, error: "Invalid amount" });
    }
    if (!userId) {
        return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const transactionId = "FAKE_TXN_" + Date.now();
    const fakePaymentLink = `https://fake-upi-payment.com/pay/${transactionId}`;

    const transaction = {
        transactionId,
        userId,
        amount,
        status: "Copmleted",
        paymentUrl: fakePaymentLink
    };

    saveTransaction(transaction);
    console.log(`Payment Created: ${transactionId}, Amount: ₹${amount}`);

    res.json({ success: true, paymentUrl: fakePaymentLink, transactionId });
});

// Check Payment Status
app.get('/api/payment-status/:transactionId', (req, res) => {
    const { transactionId } = req.params;
    const transactions = loadTransactions();

    const transaction = transactions.find(txn => txn.transactionId === transactionId);
    if (!transaction) {
        return res.status(404).json({ success: false, error: "Transaction not found" });
    }

    console.log(`Payment Status Checked: ${transactionId}, Status: ${transaction.status}`);
    res.json({ success: true, transaction });
});

// Mark Payment as Complete (For Testing)
app.post('/api/confirm-payment', (req, res) => {
    const { transactionId } = req.body;
    let transactions = loadTransactions();

    const transaction = transactions.find(txn => txn.transactionId === transactionId);
    if (!transaction) {
        return res.status(404).json({ success: false, error: "Transaction not found" });
    }

    transaction.status = "COMPLETED";
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(transactions, null, 2));
    } catch (error) {
        console.error("Error updating transaction:", error);
        return res.status(500).json({ success: false, error: "Failed to update transaction" });
    }

    console.log(`Payment Confirmed: ${transactionId}`);
    res.json({ success: true, message: "Payment confirmed!" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
