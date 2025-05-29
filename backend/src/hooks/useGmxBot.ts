// src/hooks/useGmxBot.ts
import { useMemo } from "react";
import { ethers } from "ethers";
import GmxBotAbi from "../abi/GmxBotAbi.json";

const BOT_CONTRACT_ADDRESS = "0xYourDeployedBotAddress"; // Replace this

export function useGmxBot() {
  const getContract = () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(BOT_CONTRACT_ADDRESS, GmxBotAbi, signer);
  };

  return useMemo(() => ({ getContract }), []);
}
