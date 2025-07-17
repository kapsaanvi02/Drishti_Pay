const express = require('express');
const fs = require('fs');

const router = express.Router();

// Fake Database (JSON File)
const DB_FILE = 'fake_transactions.json';
const FACE_DB_FILE = 'registered_faces.json';

// Ensure Fake Databases Exist
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));
if (!fs.existsSync(FACE_DB_FILE)) fs.writeFileSync(FACE_DB_FILE, JSON.stringify([]));

// Load Transactions
const loadTransactions = () => {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Error reading transactions file:", error);
        return [];
    }
};

// Save Transactions
const saveTransaction = (transaction) => {
    let transactions = loadTransactions();
    transactions.push(transaction);
    fs.writeFileSync(DB_FILE, JSON.stringify(transactions, null, 2));
};

// Load Registered Faces
const loadRegisteredFaces = () => {
    try {
        const data = fs.readFileSync(FACE_DB_FILE, 'utf-8');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Error reading face database:", error);
        return [];
    }
};

// Verify Face Before Payment
const isFaceRegistered = (userId) => {
    const faces = loadRegisteredFaces();
    return faces.some(face => face.userId === userId);
};

// ** Simulate Payment Processing **
router.post('/pay', (req, res) => {
    const { amount, userId } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, error: "Invalid amount" });
    }
    if (!userId || !isFaceRegistered(userId)) {
        return res.status(400).json({ success: false, error: "Face not registered" });
    }

    const transactionId = "FAKE_TXN_" + Date.now();
    const fakePaymentLink = `https://fake-upi-payment.com/pay/${transactionId}`;

    const transaction = {
        transactionId,
        userId,
        amount,
        status: "PENDING",
        paymentUrl: fakePaymentLink
    };

    saveTransaction(transaction);
    console.log(`✅ Payment Created: ${transactionId}, User: ${userId}, Amount: ₹${amount}`);

    res.json({ success: true, paymentUrl: fakePaymentLink, transactionId });
});

// ** Check Payment Status **
router.get('/payment-status/:transactionId', (req, res) => {
    const { transactionId } = req.params;
    const transactions = loadTransactions();

    const transaction = transactions.find(txn => txn.transactionId === transactionId);
    if (!transaction) {
        return res.status(404).json({ success: false, error: "Transaction not found" });
    }

    res.json({ success: true, transaction });
});

// ** Confirm Payment (For Testing) **
router.post('/confirm-payment', (req, res) => {
    const { transactionId } = req.body;
    let transactions = loadTransactions();

    const transaction = transactions.find(txn => txn.transactionId === transactionId);
    if (!transaction) {
        return res.status(404).json({ success: false, error: "Transaction not found" });
    }

    transaction.status = "COMPLETED";
    fs.writeFileSync(DB_FILE, JSON.stringify(transactions, null, 2));

    res.json({ success: true, message: "Payment confirmed!" });
});

module.exports = router;
