export const AREAS = ["TUT North Campus", "TUT South Campus", "Telkom Residence", "TUT Arcadia Campus", "TUT Pretoria Campus", "TUT Ga-Rankuwa Campus", "Soshanguve Mall", "Soshanguve Crossing", "Accredited Residence In Soshanguve", "Pretoria North","Other Place In Soshanguve"] as const;
export type Area = (typeof AREAS)[number];

/**
 * Fare table (ONE-WAY, same both directions)
 * - Use cents to avoid decimals: R25.00 = 2500
 * - same area = 0
 *
 * IMPORTANT:
 * Replace the example prices below with YOUR real prices.
 */
const EXAMPLE_PRICES_CENTS: Record<string, number> = {
  // Format: "From->To": cents
  "TUT North Campus->TUT South Campus": 3000,
  "TUT North Campus->Telkom Residence": 3000,
  "TUT North Campus->TUT Arcadia Campus": 12000,
  "TUT North Campus->Soshanguve Crossing": 3000,
  "TUT North Campus->Soshanguve Mall": 3000,
  "TUT North Campus->TUT Ga-Rankuwa Campus": 9000,
  "TUT North Campus->TUT Pretoria Campus": 12000,
  "TUT North Campus->Accredited Residence In Soshanguve": 3000,
  "TUT North Campus->Pretoria North": 9000,
  "TUT North Campus->Other Place In Soshanguve": 3000,

  "TUT South Campus->Telkom Residence": 3000,
  "TUT South Campus->TUT Arcadia Campus": 12000,
  "TUT South Campus->Soshanguve Crossing": 3000,
  "TUT South Campus->Soshanguve Mall": 3000,
  "TUT South Campus->TUT Ga-Rankuwa Campus": 9000,
  "TUT South Campus->TUT Pretoria Campus": 12000,
  "TUT South Campus->Accredited Residence In Soshanguve": 3000,
  "TUT South Campus->Pretoria North": 9000,
  "TUT South Campus->Other Place In Soshanguve": 3000,

  "TUT Arcadia Campus->Telkom Residence": 12000,
  "TUT Arcadia Campus->Soshanguve Crossing": 12000,
  "TUT Arcadia Campus->Soshanguve Mall": 12000,
  "TUT Arcadia Campus->TUT Ga-Rankuwa Campus": 18000,
  "TUT Arcadia Campus->Accredited Residence In Soshanguve": 12000,
  "TUT Arcadia Campus->Other Place In Soshanguve": 12000,

  "Telkom Residence->TUT Arcadia Campus": 12000,
  "Telkom Residence->Soshanguve Crossing": 3000,
  "Telkom Residence->Soshanguve Mall": 3000,
  "Telkom Residence->TUT Ga-Rankuwa Campus": 9000,
  "Telkom Residence->TUT Pretoria Campus": 12000,
  "Telkom Residence->Accredited Residence In Soshanguve": 3000,
  "Telkom Residence->Pretoria North": 9000,
  "Telkom Residence->Other Place In Soshanguve": 3000,

  "Accredited Residence In Soshanguve->Telkom Residence": 3000,
  "Accredited Residence In Soshanguve->TUT Arcadia Campus": 12000,
  "Accredited Residence In Soshanguve->Soshanguve Crossing": 3000,
  "Accredited Residence In Soshanguve->Soshanguve Mall": 3000,
  "Accredited Residence In Soshanguve->TUT Ga-Rankuwa Campus": 9000,
  "Accredited Residence In Soshanguve->TUT Pretoria Campus": 12000,
  "Accredited Residence In Soshanguve->Accredited Residence In Soshanguve": 3000,
  "Accredited Residence In Soshanguve->Pretoria North": 9000,
  "Accredited Residence In Soshanguve->Other Place In Soshanguve": 3000,
};

function key(a: Area, b: Area) {
  return `${a}->${b}`;
}

/**
 * Returns fare in cents, or null if route is not priced.
 * Symmetric pricing: if A->B missing, try B->A.
 */
export function getFareCents(from: Area, to: Area): number | null {
  if (from === to) return 0;

  const direct = EXAMPLE_PRICES_CENTS[`${from}->${to}`];
  if (typeof direct === "number") return direct;

  const reverse = EXAMPLE_PRICES_CENTS[`${to}->${from}`];
  if (typeof reverse === "number") return reverse;

  return null;
}

export function formatZAR(cents: number) {
  const rands = (cents / 100).toFixed(2);
  return `R${rands}`;
}