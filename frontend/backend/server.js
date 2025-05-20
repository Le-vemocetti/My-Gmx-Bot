require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { addLiquidity } = require('./addLiquidity');

const express = require('express');
const app = express();
const cors = require('cors');
const botRoutes = require('./routes/botRoutes');

app.use(cors());
app.use(express.json());

// Add your bot control routes
app.use('/api', botRoutes);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

app.use(cors());
app.use(express.json());

app.post('/api/add-liquidity', async (req, res) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount)) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    await addLiquidity(amount);
    res.json({ success: true, message: `Added ${amount} USDC as liquidity.` });
  } catch (error) {
    console.error('❌ Liquidity error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API running at http://localhost:${PORT}`);
});
