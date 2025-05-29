// utils/deposit.ts
export const depositToBot = async (amount: string) => {
  try {
    const res = await fetch('/api/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Deposit failed');
    }

    return data;
  } catch (err) {
    console.error('Deposit error:', err);
    throw err;
  }
};
