// utils/format.js
import { ethers } from "ethers";

export const formatrupiah = (v) => {
  try {
    if (!v) return "0";
    return ethers.formatUnits(v, 18);
  } catch (e) {
    return "0";
  }
};
export const parserupiah = (v) => ethers.parseUnits(v || "0", 18);

export const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value).replace(/\s/g, '');

/**
 * Format rupiah specifically for input fields (removes excessive decimals for IDR)
 */
export const formatrupiahInt = (v) => {
    const val = formatrupiah(v);
    return Math.floor(Number(val)).toString();
};
