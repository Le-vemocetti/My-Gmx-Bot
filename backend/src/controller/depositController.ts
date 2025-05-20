import { Request, Response } from 'express';

export const handleDeposit = (req: Request, res: Response) => {
  const { amount, user } = req.body;

  // Replace this with your deposit logic
  console.log(`Received deposit of ${amount} from user ${user}`);

  res.status(200).json({ success: true, message: 'Deposit received' });
};
