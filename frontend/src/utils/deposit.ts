export const handleDeposit = async (amount: string): Promise<{ txHash: string }> => {
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount)) {
    throw new Error('Invalid amount format');
  }
  if (parsedAmount < 0.004) {
    throw new Error('Minimum deposit is 0.004 ETH');
  }

  const API_URL =
    import.meta.env.VITE_API_URL ||
    import.meta.env.BASE_URL ||
    'http://localhost:5000';

  try {
    const response = await fetch(`${API_URL}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parsedAmount }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Deposit failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Deposit error:', error);
    throw new Error('Network error. Please try again later.');
  }
};
