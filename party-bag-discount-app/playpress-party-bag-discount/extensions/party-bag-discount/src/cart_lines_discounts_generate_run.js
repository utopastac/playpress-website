import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
} from "../generated/api";

/**
 * @param {import("../generated/api").CartInput} input
 */
export function cartLinesDiscountsGenerateRun(input) {
  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );

  if (!hasProductDiscountClass || input.cart.lines.length === 0) {
    return { operations: [] };
  }

  const config = input.discount.metafield?.jsonValue ?? {};
  const tiers = (config.tiers ?? [])
    .filter((tier) => tier.minQty > 0 && tier.discount > 0)
    .sort((a, b) => a.minQty - b.minQty);

  if (tiers.length === 0) {
    return { operations: [] };
  }

  const eligibleLines = input.cart.lines.filter((line) => {
    return (
      line.merchandise.__typename === "ProductVariant" &&
      line.merchandise.product?.inAnyCollection === true
    );
  });

  if (eligibleLines.length === 0) {
    return { operations: [] };
  }

  const totalQuantity = eligibleLines.reduce(
    (sum, line) => sum + line.quantity,
    0,
  );

  let currentTier = null;

  for (const tier of tiers) {
    if (totalQuantity >= tier.minQty) {
      currentTier = tier;
    }
  }

  if (!currentTier) {
    return { operations: [] };
  }

  return {
    operations: [
      {
        productDiscountsAdd: {
          selectionStrategy: ProductDiscountSelectionStrategy.All,
          candidates: [
            {
              message: `Party bag: ${currentTier.discount}% off (${totalQuantity} items)`,
              targets: eligibleLines.map((line) => ({
                cartLine: { id: line.id },
              })),
              value: {
                percentage: {
                  value: currentTier.discount,
                },
              },
            },
          ],
        },
      },
    ],
  };
}
