const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database di memori
const accounts = {
  "1234567890": { name: "Budi Santoso", balance: 5000000, pin: "123456" },
  "0987654321": { name: "Siti Rahma", balance: 2500000, pin: "654321" }
};

const transactions = {
  "1234567890": [
    { id: "TX101", type: "Kredit", amount: 5000000, note: "Setoran Awal", date: new Date().toLocaleDateString() }
  ],
  "0987654321": [
    { id: "TX102", type: "Kredit", amount: 2500000, note: "Setoran Awal", date: new Date().toLocaleDateString() }
  ]
};

app.post('/api/login', (req, res) => {
  const { accountNumber, pin } = req.body;
  const user = accounts[accountNumber];

  if (!user || user.pin !== pin) {
    return res.status(401).json({ success: false, message: "Nomor Rekening atau PIN salah!" });
  }

  res.json({ success: true, accountNumber, name: user.name, balance: user.balance });
});

app.get('/api/account/:accNo', (req, res) => {
  const accNo = req.params.accNo;
  const user = accounts[accNo];

  if (!user) {
    return res.status(404).json({ success: false, message: "Rekening tidak ditemukan!" });
  }

  res.json({ success: true, name: user.name, balance: user.balance, transactions: transactions[accNo] || [] });
});

app.post('/api/transfer', (req, res) => {
  const { senderAcc, receiverAcc, amount, pin, note } = req.body;
  const sender = accounts[senderAcc];
  const receiver = accounts[receiverAcc];
  const transferAmount = Number(amount);

  if (!sender) return res.status(400).json({ success: false, message: "Pengirim tidak valid!" });
  if (sender.pin !== pin) return res.status(401).json({ success: false, message: "PIN Transaksi salah!" });
  if (!receiver) return res.status(404).json({ success: false, message: "Rekening tujuan tidak ditemukan!" });
  if (senderAcc === receiverAcc) return res.status(400).json({ success: false, message: "Tidak dapat transfer ke rekening sendiri!" });
  if (transferAmount <= 0 || isNaN(transferAmount)) return res.status(400).json({ success: false, message: "Nominal tidak valid!" });
  if (sender.balance < transferAmount) return res.status(400).json({ success: false, message: "Saldo tidak mencukupi!" });

  sender.balance -= transferAmount;
  receiver.balance += transferAmount;

  const date = new Date().toLocaleDateString();
  const txId = "TX" + Math.floor(100000 + Math.random() * 900000);

  transactions[senderAcc].unshift({ id: txId, type: "Debit", amount: transferAmount, note: `Trf ke ${receiver.name} (${note || 'Transfer'})`, date });
  if (!transactions[receiverAcc]) transactions[receiverAcc] = [];
  transactions[receiverAcc].unshift({ id: txId, type: "Kredit", amount: transferAmount, note: `Trf dari ${sender.name} (${note || 'Transfer'})`, date });

  res.json({ success: true, message: "Transfer berhasil!", currentBalance: sender.balance });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server M-Banking berjalan di http://localhost:${PORT}`);
});