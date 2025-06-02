import { useState } from 'react';
import { handleDeposit } from '@/utils/deposit';  // Use alias now that config is fixed

function DepositForm() {
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async () => {  // Renamed to avoid conflict
    if (!amount) {
      setStatus('❌ Please enter an amount');
      return;
    }

    try {
      setStatus('Processing...');
      const res = await handleDeposit(amount);  // Using imported function
      setStatus(`✅ Success! TX Hash: ${res.txHash}`);
    } catch (err: any) {
      setStatus(`❌ Failed: ${err.message}`);
    }
  };

  return (
    <div className="deposit-form">
      <input
        type="number"
        step="0.001"
        min="0.004"
        placeholder="Enter ETH amount (min 0.004)"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        className="deposit-input"
      />
      <button 
        onClick={handleSubmit} 
        disabled={!amount || parseFloat(amount) < 0.004}
        className="deposit-button"
      >
        Deposit
      </button>
      {status && <p className="status-message">{status}</p>}
    </div>
  );
}

export default DepositForm;