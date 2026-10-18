export const GET_SHOP_ID = `#graphql
  query GetShopId {
    shop {
      id
    }
  }
`;

export const GET_FUNCTIONS = `#graphql
  query GetPartyBagFunctions {
    shopifyFunctions(first: 25) {
      nodes {
        id
        title
        apiType
        app {
          title
        }
      }
    }
  }
`;

export const GET_AUTOMATIC_DISCOUNTS = `#graphql
  query GetAutomaticDiscounts {
    automaticDiscountNodes(first: 25, query: "type:app") {
      nodes {
        id
        automaticDiscount {
          ... on DiscountAutomaticApp {
            title
            status
            discountId
            appDiscountType {
              functionId
            }
          }
        }
      }
    }
  }
`;

export const GET_DISCOUNT = `#graphql
  query GetDiscount($id: ID!) {
    automaticDiscountNode(id: $id) {
      id
      automaticDiscount {
        ... on DiscountAutomaticApp {
          title
          status
          discountId
          combinesWith {
            orderDiscounts
            productDiscounts
            shippingDiscounts
          }
          startsAt
          endsAt
          appDiscountType {
            functionId
          }
        }
      }
      metafield(namespace: "$app:party-bag-discount", key: "function-configuration") {
        id
        jsonValue
      }
    }
  }
`;

export const CREATE_AUTOMATIC_DISCOUNT = `#graphql
  mutation CreateAutomaticDiscount($discount: DiscountAutomaticAppInput!) {
    discountCreate: discountAutomaticAppCreate(automaticAppDiscount: $discount) {
      automaticAppDiscount {
        discountId
      }
      userErrors {
        code
        message
        field
      }
    }
  }
`;

export const UPDATE_AUTOMATIC_DISCOUNT = `#graphql
  mutation UpdateAutomaticDiscount(
    $id: ID!
    $discount: DiscountAutomaticAppInput!
  ) {
    discountUpdate: discountAutomaticAppUpdate(
      id: $id
      automaticAppDiscount: $discount
    ) {
      automaticAppDiscount {
        discountId
      }
      userErrors {
        code
        message
        field
      }
    }
  }
`;

export const SET_SHOP_METAFIELD = `#graphql
  mutation SetShopMetafield($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        namespace
        key
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const ENSURE_SHOP_METAFIELD_DEFINITION = `#graphql
  mutation EnsureShopMetafieldDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export const GET_COLLECTION = `#graphql
  query GetCollection($id: ID!) {
    collection(id: $id) {
      id
      title
      handle
    }
  }
`;
