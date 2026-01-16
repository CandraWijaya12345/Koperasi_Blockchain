// utils/format.js
import { ethers } from "ethers";

export const formatToken = (v) => v ? ethers.formatUnits(v, 18) : "0";
export const parseToken = (v) => ethers.parseUnits(v || "0", 18);

export const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value);
