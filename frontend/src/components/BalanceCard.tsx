type BalanceProps = {
  address: string;
  balance: string;
};

export default function BalanceCard({ address, balance }: BalanceProps) {
  return (
    <div className="text-gray-700 mb-4">
      <p><strong>Wallet:</strong> {address}</p>
      <p><strong>ETH:</strong> {balance}</p>
    </div>
  );
}
