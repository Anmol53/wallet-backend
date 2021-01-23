const mongoose = require("mongoose");

const mongoURI = "mongodb://localhost:27017/wallet";

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connection established with mongodb server 🤗");
  })
  .catch((err) => {
    console.log("Error while connection 😑", err);
  });

const userSchema = new mongoose.Schema({
  user_id: String,
  user_name: String,
  phone: String,
  balance: Number,
});

const transactionSchema = new mongoose.Schema({
  user_id: String,
  transaction_type: String,
  transaction_Time: Date,
  initial_balance: Number,
  amount: Number,
  final_balance: Number,
  remarks: String,
});

const User = mongoose.model("User", userSchema);
const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports.User = User;
module.exports.Transaction = Transaction;
