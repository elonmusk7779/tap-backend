setInterval(async () => {
  for (let user in taps) {
    const count = taps[user];

    // skip if less than 10
    if (!count || count < 10) continue;

    try {
      // only multiples of 10
      const sendCount = Math.floor(count / 10) * 10;

      if (sendCount === 0) continue;

      const tx = await contract.recordTap(user, sendCount);

      console.log(`sent ${sendCount} taps for ${user}: ${tx.hash}`);

      await tx.wait();

      // subtract only what was sent
      taps[user] = count - sendCount;

    } catch (e) {
      console.log("error:", e.message);
    }
  }
}, 5000);
