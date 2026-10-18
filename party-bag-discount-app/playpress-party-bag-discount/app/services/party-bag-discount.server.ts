import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import {
  CREATE_AUTOMATIC_DISCOUNT,
  ENSURE_SHOP_METAFIELD_DEFINITION,
  GET_AUTOMATIC_DISCOUNTS,
  GET_COLLECTION,
  GET_DISCOUNT,
  GET_FUNCTIONS,
  GET_SHOP_ID,
  SET_SHOP_METAFIELD,
  UPDATE_AUTOMATIC_DISCOUNT,
} from "../graphql/discounts.server";
import {
  FUNCTION_METAFIELD_KEY,
  FUNCTION_METAFIELD_NAMESPACE,
  type PartyBagConfig,
  SHOP_METAFIELD_KEY,
  SHOP_METAFIELD_NAMESPACE,
  parsePartyBagConfig,
  serializePartyBagConfig,
} from "../models/party-bag-config.server";

type AdminGraphql = AdminApiContext["graphql"];

export async function getPartyBagFunction(admin: AdminGraphql) {
  const response = await admin(GET_FUNCTIONS);
  const payload = await response.json();
  const functions = payload.data?.shopifyFunctions?.nodes ?? [];

  return (
    functions.find(
      (fn: { title?: string }) =>
        fn.title?.toLowerCase().includes("party bag"),
    ) ??
    functions.find(
      (fn: { apiType?: string }) => fn.apiType === "discount",
    )
  );
}

export async function getExistingDiscountForFunction(
  admin: AdminGraphql,
  functionId: string,
) {
  const response = await admin(GET_AUTOMATIC_DISCOUNTS);
  const payload = await response.json();
  const nodes = payload.data?.automaticDiscountNodes?.nodes ?? [];

  return nodes.find(
    (node: {
      automaticDiscount?: {
        appDiscountType?: { functionId?: string };
      };
    }) => node.automaticDiscount?.appDiscountType?.functionId === functionId,
  );
}

export async function getDiscountConfig(
  admin: AdminGraphql,
  discountNodeId: string,
) {
  const response = await admin(GET_DISCOUNT, {
    variables: { id: discountNodeId },
  });
  const payload = await response.json();
  const node = payload.data?.automaticDiscountNode;

  if (!node) {
    return null;
  }

  const config = parsePartyBagConfig(node.metafield?.jsonValue ?? null);

  return {
    nodeId: node.id as string,
    title: node.automaticDiscount?.title as string,
    status: node.automaticDiscount?.status as string,
    config,
  };
}

async function ensureShopMetafieldDefinition(admin: AdminGraphql) {
  await admin(ENSURE_SHOP_METAFIELD_DEFINITION, {
    variables: {
      definition: {
        name: "Party bag discount config",
        namespace: SHOP_METAFIELD_NAMESPACE,
        key: SHOP_METAFIELD_KEY,
        type: "json",
        ownerType: "SHOP",
        access: {
          storefront: "PUBLIC_READ",
        },
      },
    },
  });
}

export async function syncShopMetafield(
  admin: AdminGraphql,
  config: PartyBagConfig,
) {
  await ensureShopMetafieldDefinition(admin);

  const shopResponse = await admin(GET_SHOP_ID);
  const shopPayload = await shopResponse.json();
  const shopId = shopPayload.data?.shop?.id;

  if (!shopId) {
    throw new Error("Unable to resolve shop ID for metafield sync.");
  }

  let collectionHandle = config.collectionHandle;

  if (!collectionHandle && config.collectionIds[0]) {
    const response = await admin(GET_COLLECTION, {
      variables: { id: config.collectionIds[0] },
    });
    const payload = await response.json();
    collectionHandle = payload.data?.collection?.handle;
  }

  const value = serializePartyBagConfig({
    ...config,
    collectionHandle,
  });

  const response = await admin(SET_SHOP_METAFIELD, {
    variables: {
      metafields: [
        {
          namespace: SHOP_METAFIELD_NAMESPACE,
          key: SHOP_METAFIELD_KEY,
          type: "json",
          ownerId: shopId,
          value,
        },
      ],
    },
  });

  return response.json();
}

export async function savePartyBagDiscount(
  admin: AdminGraphql,
  {
    functionId,
    discountNodeId,
    title,
    config,
  }: {
    functionId: string;
    discountNodeId?: string;
    title: string;
    config: PartyBagConfig;
  },
) {
  const metafieldValue = serializePartyBagConfig(config);
  const discountInput = {
    title,
    functionId,
    discountClasses: ["PRODUCT"],
    combinesWith: {
      orderDiscounts: true,
      productDiscounts: false,
      shippingDiscounts: true,
    },
    startsAt: new Date().toISOString(),
    metafields: [
      {
        namespace: FUNCTION_METAFIELD_NAMESPACE,
        key: FUNCTION_METAFIELD_KEY,
        type: "json",
        value: metafieldValue,
      },
    ],
  };

  const response = discountNodeId
    ? await admin(UPDATE_AUTOMATIC_DISCOUNT, {
        variables: {
          id: discountNodeId,
          discount: discountInput,
        },
      })
    : await admin(CREATE_AUTOMATIC_DISCOUNT, {
        variables: {
          discount: discountInput,
        },
      });

  const payload = await response.json();
  const userErrors =
    payload.data?.discountCreate?.userErrors ??
    payload.data?.discountUpdate?.userErrors ??
    [];

  if (userErrors.length > 0) {
    return { ok: false as const, userErrors };
  }

  await syncShopMetafield(admin, config);

  return { ok: true as const, payload };
}
