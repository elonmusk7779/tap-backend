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

// receive taps from frontend
app.post("/tap", (req, res) => {
  const { user, count } = req.body;

  if (!user) return res.status(400).send("no user");

  // default = 1, but frontend will send 10
  const tapCount = Number(count || 1);

  taps[user] = (taps[user] || 0) + tapCount;

  res.send("ok");
});

// send to blockchain every 5 sec
setInterval(async () => {
  for (let user in taps) {
    const count = taps[user];

    if (count >= 10) {
      try {
        // send only multiples of 10
        const sendCount = Math.floor(count / 10) * 10;

        await contract.recordTap(user, sendCount);

        console.log(`sent ${sendCount} taps for ${user}`);

        taps[user] -= sendCount; // keep leftover taps
      } catch (e) {
        console.log("error:", e.message);
      }
    }
  }
}, 5000);

app.listen(3000, () => console.log("running on 3000"));