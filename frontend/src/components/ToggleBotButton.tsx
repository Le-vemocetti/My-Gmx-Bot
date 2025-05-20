import { useState } from 'react';
import { Contract } from 'ethers';

type Props = {
  contract: Contract | null;
};

export default function ToggleBotButton({ contract }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleToggle = async () => {
    if (!contract) return alert("Contract not connected");

    try {
      setIsLoading(true);
      setMessage("Toggling bot...");

      const tx = await contract.toggleBot();
      await tx.wait(); // Wait for confirmation

      setMessage("✅ Bot toggled successfully!");
    } catch (error) {
      console.error(error);
      setMessage("❌ Error toggling bot");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow mt-4">
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {isLoading ? "Processing..." : "Start/Stop Bot"}
      </button>
      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
    </div>
  );
}


