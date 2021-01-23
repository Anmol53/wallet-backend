const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(express.json());

app.use(cors());

const { User, Transaction } = db;

const isNullOrUndefined = (inp) => inp === null || inp === undefined;

// Create
app.post("/user", async (req, res) => {
  const { user_id, user_name, phone, balance } = req.body;
  if (
    isNullOrUndefined(user_id) ||
    user_id.length < 1 ||
    isNullOrUndefined(phone) ||
    phone.length != 10 ||
    isNullOrUndefined(balance) ||
    balance.length < 1 ||
    isNullOrUndefined(user_name) ||
    user_name.length < 1
  ) {
    res.status(400).send({
      status: "Bad Request",
      message: `All fields are required & Phone should be of 10 digits`,
    });
    return;
  }
  let existingUser = await User.findOne({ user_id });
  if (existingUser) {
    res.status(400).send({
      status: "Bad Request",
      message: `User with user id ${user_id} already exist`,
    });
    return;
  }
  existingUser = await User.findOne({ phone });
  if (existingUser) {
    res.status(400).send({
      status: "Bad Request",
      message: `User with phone ${phone} already exist`,
    });
    return;
  }
  const newUser = new User({
    user_id,
    user_name,
    phone,
    balance: Number(balance * 100),
  });
  const newTransaction = new Transaction({
    user_id,
    transaction_type: "add_funds",
    transaction_Time: new Date(),
    initial_balance: 0,
    amount: balance * 100,
    final_balance: balance * 100,
    remarks: "Wallet Created",
  });
  try {
    await newUser.save();
    await newTransaction.save();
    res.status(200).send({
      status: "ok",
      message: "User created",
      user: { ...newUser._doc, balance: newUser.balance / 100 },
    });
  } catch (e) {
    res.status(500).send({
      status: "Internal Server Error",
      message: "The server has encountered an error.",
    });
  }
});

// Update

app.put("/addFunds", async (req, res) => {
  const { user_id, amount } = req.body;
  try {
    const user = await User.findOne({ user_id });
    if (isNullOrUndefined(user)) {
      res.status(404).send({
        status: "Not Found",
        message: `User Not Found`,
      });
      return;
    }
    const final_balance = user.balance + amount * 100;
    const newTransaction = new Transaction({
      user_id,
      transaction_type: "add_funds",
      transaction_Time: new Date(),
      initial_balance: user.balance,
      amount: amount * 100,
      final_balance,
      remarks: "",
    });
    user.balance = final_balance;
    await user.save();
    await newTransaction.save();
    res.status(200).send({
      status: "ok",
      message: `Fund Successfully Added`,
      user: { ...user._doc, balance: user.balance / 100 },
    });
  } catch (e) {
    res.status(500).send({
      status: "Internal Server Error",
      message: `The server has encountered an error.`,
    });
  }
});

app.put("/spendFunds", async (req, res) => {
  const { user_id, amount } = req.body;
  try {
    const user = await User.findOne({ user_id });
    if (isNullOrUndefined(user)) {
      res.status(404).send({
        status: "Not Found",
        message: `User Not Found`,
      });
      return;
    }
    if (user.balance >= amount * 100) {
      const final_balance = user.balance - amount * 100;
      const newTransaction = new Transaction({
        user_id,
        transaction_type: "spend_funds",
        transaction_Time: new Date(),
        initial_balance: user.balance,
        amount: amount * 100,
        final_balance,
        remarks: "",
      });
      user.balance = final_balance;
      await user.save();
      await newTransaction.save();
      res.status(200).send({
        status: "ok",
        message: `Fund Successfully Spend`,
        user: { ...user._doc, balance: user.balance / 100 },
      });
    } else {
      res.status(406).send({
        status: "Not Acceptable",
        message: `Insufficient Balance`,
        user: { ...user._doc, balance: user.balance / 100 },
      });
    }
  } catch (e) {
    res.status(500).send({
      status: "Internal Server Error",
      message: `The server has encountered an error.`,
    });
  }
});

app.get("/balance/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  try {
    const user = await User.findOne({ user_id });
    if (isNullOrUndefined(user)) {
      res.status(404).send({
        status: "Not Found",
        message: `User Not Found`,
      });
      return;
    }
    res.status(200).send({
      status: "ok",
      message: `Balance fetched successfully`,
      balance: user.balance / 100,
    });
  } catch (e) {
    res.status(500).send({
      status: "Internal Server Error",
      message: "The server has encountered an error.",
    });
  }
});

app.get("/wallets", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).send({
      status: "ok",
      message: `${users.length} wallets fetched`,
      wallets: users.map((user) => {
        return { ...user._doc, balance: user.balance / 100 };
      }),
    });
  } catch (e) {
    res.status(500).send({
      status: "Internal Server Error",
      message: "The server has encountered an error.",
    });
  }
});

app.get("/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find();
    const users = await User.find();
    const detailedTransactions = transactions.map((transaction) => {
      const user = users.filter((u) => u.user_id === transaction.user_id)[0];
      return {
        user_id: user.user_id,
        user_name: user.user_name,
        phone: user.phone,
        transaction_type: transaction.transaction_type,
        transaction_Time: transaction.transaction_Time,
        initial_balance: transaction.initial_balance / 100,
        amount: transaction.amount / 100,
        final_balance: transaction.final_balance / 100,
        remarks: transaction.remarks,
      };
    });
    console.log(detailedTransactions);
    res.status(200).send({
      status: "ok",
      message: `${transactions.length} transactions fetched`,
      transactions: detailedTransactions,
    });
  } catch (e) {
    res.status(500).send({
      status: "Internal Server Error",
      message: "The server has encountered an error.",
    });
  }
});

app.get("/transactions/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  try {
    const user = await User.findOne({ user_id });
    if (isNullOrUndefined(user)) {
      res.status(404).send({
        status: "Not Found",
        message: `User Not Found`,
      });
      return;
    }
    const transactions = await Transaction.find({ user_id });
    const detailedTransactions = transactions.map((transaction) => {
      return {
        user_id: user.user_id,
        user_name: user.user_name,
        phone: user.phone,
        transaction_type: transaction.transaction_type,
        transaction_Time: transaction.transaction_Time,
        initial_balance: transaction.initial_balance / 100,
        amount: transaction.amount / 100,
        final_balance: transaction.final_balance / 100,
        remarks: transaction.remarks,
      };
    });
    res.status(200).send({
      status: "ok",
      message: `${transactions.length} transactions fetched`,
      transactions: detailedTransactions,
    });
  } catch (e) {
    res.status(500).send({
      status: "Internal Server Error",
      message: "The server has encountered an error.",
    });
  }
});

app.get("/", (req, res) => {
  res.send("Server Running");
});

app.listen(9999, () => console.log(`Server is running at port 9999`));
