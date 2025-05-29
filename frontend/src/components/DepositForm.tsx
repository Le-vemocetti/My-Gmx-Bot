import { useState } from 'react';
import { depositToBot } from '@/utils/deposit';

function DepositForm() {
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');

  const handleDeposit = async () => {
    try {
      setStatus('Processing...');
      const res = await depositToBot(amount);
      setStatus(`✅ Success: ${res.txHash}`);
    } catch (err: any) {
      setStatus(`❌ Failed: ${err.message}`);
    }
  };

  return (
    <div>
      <input
        type="number"
        placeholder="Enter ETH amount (min 0.004)"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />
      <button onClick={handleDeposit}>Deposit</button>
      <p>{status}</p>
    </div>
  );
}
