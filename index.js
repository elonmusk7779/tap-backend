require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();
app.use(cors());
app.use(express.json());

const provider = new ethers.JsonRpcProvider("https://rpc.ritualfoundation.org");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contract = new ethers.Contract(
  "0xd82C1C37FEBD9C6995a91d888bFaf3a57Fb0aa55",
  ["function recordTap(address user, uint256 count) external"],
  wallet
);

let taps = {};

app.post("/tap", (req, res) => {
  const { user } = req.body;

  if (!user) return res.status(400).send("no user");

  taps[user] = (taps[user] || 0) + 1;

  res.send("ok");
});

setInterval(async () => {
  for (let user in taps) {
    if (taps[user] > 0) {
      try {
        await contract.recordTap(user, taps[user]);
        console.log("sent", taps[user], "taps");
        taps[user] = 0;
      } catch (e) {
        console.log("error", e.message);
      }
    }
  }
}, 5000);

app.listen(3000, () => console.log("running on 3000"));