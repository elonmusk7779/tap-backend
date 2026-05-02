require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();
app.use(cors());
app.use(express.json());

// rpc + wallet
const provider = new ethers.JsonRpcProvider("https://rpc.ritualfoundation.org");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// contract
const contract = new ethers.Contract(
  "0xd82C1C37FEBD9C6995a91d888bFaf3a57Fb0aa55",
  ["function recordTap(address user, uint256 count) external"],
  wallet
);

// ✅ IMPORTANT: define taps BEFORE using it
let taps = {};

// health check
app.get("/", (req, res) => {
  res.send("Ritual Tap backend live");
});

// receive taps
app.post("/tap", (req, res) => {
  const { user, count } = req.body;

  if (!user) return res.status(400).send("no user");

  const tapCount = Number(count || 1);
  taps[user] = (taps[user] || 0) + tapCount;

  console.log(`received ${tapCount} taps from ${user}`);

  res.send("ok");
});

// batching logic
setInterval(async () => {
  for (let user in taps) {
    const count = taps[user];

    if (!count || count < 10) continue;

    try {
      const sendCount = Math.floor(count / 10) * 10;

      if (sendCount === 0) continue;

      const tx = await contract.recordTap(user, sendCount);

      console.log(`sent ${sendCount} taps for ${user}: ${tx.hash}`);

      await tx.wait();

      taps[user] = count - sendCount;
    } catch (e) {
      console.log("error:", e.message);
    }
  }
}, 5000);

// render port fix
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`running on ${PORT}`));