const CNPJ_MAX_LENGTH = 14;
const CNPJ_CHARSET = /^[A-Z0-9]+$/;
const DV1_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const DV2_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

export function normalizeCnpjInput(value: string): string {
  return value
    .replace(/[.\-/\s]+/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, CNPJ_MAX_LENGTH);
}

export function formatCnpjDisplay(value: string): string {
  const cnpj = normalizeCnpjInput(value);
  if (cnpj.length <= 2) return cnpj;
  if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
  if (cnpj.length <= 8)
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
  if (cnpj.length <= 12)
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}`;
}

export function isValidCnpj(value: string): boolean {
  const cnpj = normalizeCnpjForValidation(value);

  if (cnpj.length !== CNPJ_MAX_LENGTH) return false;
  if (!CNPJ_CHARSET.test(cnpj)) return false;
  if (new Set(cnpj).size === 1) return false;
  if (!/^\d{2}$/.test(cnpj.slice(12, 14))) return false;

  return (
    calculateCheckDigit(cnpj.slice(0, 12), DV1_WEIGHTS) === cnpj[12] &&
    calculateCheckDigit(cnpj.slice(0, 13), DV2_WEIGHTS) === cnpj[13]
  );
}

function normalizeCnpjForValidation(value: string): string {
  return value.replace(/[.\-/\s]+/g, "").toUpperCase();
}

function calculateCheckDigit(chars: string, weights: number[]): string {
  let total = 0;
  for (let index = 0; index < weights.length; index += 1) {
    total += (chars.charCodeAt(index) - 48) * weights[index];
  }

  const remainder = total % 11;
  return remainder < 2 ? "0" : String(11 - remainder);
}
