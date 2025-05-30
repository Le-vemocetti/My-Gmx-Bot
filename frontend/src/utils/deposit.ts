// Updated deposit utility to trigger redeploy  
export async function depositToBot(amount: string): Promise<{ txHash: string }> {
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount < 0.004) {
    throw new Error('Minimum deposit is 0.004 ETH');
  }

  const response = await fetch('http://localhost:5000/api/deposit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount: parsedAmount }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Deposit failed');
  }

  return await response.json();
}
