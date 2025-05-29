// src/pages/Trade.tsx

import React, { useState } from 'react';

const Trade: React.FC = () => {
  const [leverage, setLeverage] = useState(3);
  const [amount, setAmount] = useState('');
  const [acceptablePrice, setAcceptablePrice] = useState('');
  const [isLong, setIsLong] = useState(true);

  const API = 'http://localhost:5000/api/bot';

  const updateSettings = async () => {
    const res = await fetch(`${API}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tradeAmountETH: parseFloat(amount),
        leverage,
      }),
    });
    const data = await res.json();
    alert(data.message);
  };

  const executeTrade = async () => {
    const res = await fetch(`${API}/trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isLong,
        acceptablePrice: parseFloat(acceptablePrice),
        amount,
      }),
    });
    const data = await res.json();
    alert(data.message);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>⚙️ Trade Configuration</h2>

      <label>Leverage: {leverage}x</label><br />
      <input
        type="range"
        min="3"
        max="50"
        value={leverage}
        onChange={(e) => setLeverage(Number(e.target.value))}
      />
      <br /><br />

      <input
        type="text"
        placeholder="Trade Amount (ETH)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      /><br /><br />

      <label>Acceptable Price:</label><br />
      <input
        type="text"
        value={acceptablePrice}
        onChange={(e) => setAcceptablePrice(e.target.value)}
      /><br /><br />

      <label>
        <input
          type="checkbox"
          checked={isLong}
          onChange={() => setIsLong(!isLong)}
        />
        Long Trade
      </label><br /><br />

      <button onClick={updateSettings}>💾 Save Settings</button>{' '}
      <button onClick={executeTrade}>🚀 Execute Trade</button>
    </div>
  );
};

export default Trade;
