export type PartyBagTier = {
  minQty: number;
  discount: number;
};

export type PartyBagConfig = {
  collectionIds: string[];
  collectionHandle?: string;
  tiers: PartyBagTier[];
};

export const DEFAULT_TIERS: PartyBagTier[] = [
  { minQty: 5, discount: 5 },
  { minQty: 10, discount: 10 },
  { minQty: 15, discount: 15 },
  { minQty: 20, discount: 20 },
];

export const FUNCTION_METAFIELD_NAMESPACE = "$app:party-bag-discount";
export const FUNCTION_METAFIELD_KEY = "function-configuration";
export const SHOP_METAFIELD_NAMESPACE = "party_bag";
export const SHOP_METAFIELD_KEY = "config";

export function parsePartyBagConfig(value: unknown): PartyBagConfig {
  if (!value || typeof value !== "object") {
    return { collectionIds: [], tiers: DEFAULT_TIERS };
  }

  const config = value as Partial<PartyBagConfig>;

  return {
    collectionIds: Array.isArray(config.collectionIds)
      ? config.collectionIds.filter(Boolean)
      : [],
    collectionHandle:
      typeof config.collectionHandle === "string"
        ? config.collectionHandle
        : undefined,
    tiers:
      Array.isArray(config.tiers) && config.tiers.length > 0
        ? config.tiers
            .map((tier) => ({
              minQty: Number(tier.minQty) || 0,
              discount: Number(tier.discount) || 0,
            }))
            .filter((tier) => tier.minQty > 0)
            .sort((a, b) => a.minQty - b.minQty)
        : DEFAULT_TIERS,
  };
}

export function serializePartyBagConfig(config: PartyBagConfig): string {
  return JSON.stringify({
    collectionIds: config.collectionIds,
    collectionHandle: config.collectionHandle,
    tiers: config.tiers.filter((tier) => tier.minQty > 0),
  });
}
