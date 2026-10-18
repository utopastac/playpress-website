import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Layout,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import { useCallback, useState } from "react";
import { authenticate } from "../shopify.server";
import {
  DEFAULT_TIERS,
  type PartyBagConfig,
  type PartyBagTier,
  parsePartyBagConfig,
} from "../models/party-bag-config.server";
import {
  getDiscountConfig,
  getExistingDiscountForFunction,
  getPartyBagFunction,
  savePartyBagDiscount,
} from "../services/party-bag-discount.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const partyBagFunction = await getPartyBagFunction(admin);

  if (!partyBagFunction) {
    return {
      functionId: null,
      discountNodeId: null,
      title: "Party bag volume discount",
      config: { collectionIds: [], tiers: DEFAULT_TIERS },
      collectionTitle: null,
    };
  }

  const existingDiscount = await getExistingDiscountForFunction(
    admin,
    partyBagFunction.id,
  );

  if (existingDiscount?.id) {
    const discount = await getDiscountConfig(admin, existingDiscount.id);

    return {
      functionId: partyBagFunction.id as string,
      discountNodeId: discount?.nodeId ?? null,
      title: discount?.title ?? "Party bag volume discount",
      config: discount?.config ?? {
        collectionIds: [],
        tiers: DEFAULT_TIERS,
      },
      collectionTitle: null,
    };
  }

  return {
    functionId: partyBagFunction.id as string,
    discountNodeId: null,
    title: "Party bag volume discount",
    config: { collectionIds: [], tiers: DEFAULT_TIERS },
    collectionTitle: null,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const functionId = String(formData.get("functionId") ?? "");
  const discountNodeId = String(formData.get("discountNodeId") ?? "") || undefined;
  const title = String(formData.get("title") ?? "Party bag volume discount");
  const collectionIds = String(formData.get("collectionIds") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const tiersJson = String(formData.get("tiers") ?? "[]");

  if (!functionId) {
    return {
      ok: false,
      errors: ["Discount function not found. Deploy the app extension first."],
    };
  }

  if (collectionIds.length === 0) {
    return {
      ok: false,
      errors: ["Select a party bag collection before saving."],
    };
  }

  let tiers: PartyBagTier[];

  try {
    tiers = parsePartyBagConfig({ collectionIds, tiers: JSON.parse(tiersJson) })
      .tiers;
  } catch {
    return { ok: false, errors: ["Invalid tier configuration."] };
  }

  const config: PartyBagConfig = { collectionIds, tiers };
  const result = await savePartyBagDiscount(admin, {
    functionId,
    discountNodeId,
    title,
    config,
  });

  if (!result.ok) {
    return {
      ok: false,
      errors: result.userErrors.map(
        (error: { message: string }) => error.message,
      ),
    };
  }

  return { ok: true, errors: [] as string[] };
};

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const shopify = useAppBridge();
  const isSaving = navigation.state === "submitting";

  const [title, setTitle] = useState(loaderData.title);
  const [collectionIds, setCollectionIds] = useState<string[]>(
    loaderData.config.collectionIds,
  );
  const [collectionTitle, setCollectionTitle] = useState(
    loaderData.collectionTitle ?? "",
  );
  const [tiers, setTiers] = useState<PartyBagTier[]>(
    loaderData.config.tiers.length > 0
      ? loaderData.config.tiers
      : DEFAULT_TIERS,
  );

  const openCollectionPicker = useCallback(async () => {
    const selection = await shopify.resourcePicker({
      type: "collection",
      action: "select",
      multiple: false,
      selectionIds: collectionIds.map((id) => ({ id })),
    });

    const selected = selection?.[0];

    if (selected?.id) {
      setCollectionIds([selected.id]);
      setCollectionTitle(selected.title ?? "Selected collection");
    }
  }, [shopify, collectionIds]);

  const updateTier = (
    index: number,
    field: keyof PartyBagTier,
    value: string,
  ) => {
    setTiers((current) =>
      current.map((tier, tierIndex) =>
        tierIndex === index
          ? { ...tier, [field]: Number(value) || 0 }
          : tier,
      ),
    );
  };

  return (
    <Page>
      <TitleBar title="Party bag discount" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {actionData?.ok && (
              <Banner tone="success">
                Party bag discount saved. Checkout will now apply tiered
                discounts to items in the selected collection.
              </Banner>
            )}

            {actionData?.errors?.map((message) => (
              <Banner key={message} tone="critical">
                {message}
              </Banner>
            ))}

            {!loaderData.functionId && (
              <Banner tone="warning">
                Deploy this app with `shopify app deploy` so the discount
                function is available in your store.
              </Banner>
            )}

            <Card>
              <Form method="post">
                <input
                  type="hidden"
                  name="functionId"
                  value={loaderData.functionId ?? ""}
                />
                <input
                  type="hidden"
                  name="discountNodeId"
                  value={loaderData.discountNodeId ?? ""}
                />
                <input
                  type="hidden"
                  name="collectionIds"
                  value={collectionIds.join(",")}
                />
                <input
                  type="hidden"
                  name="tiers"
                  value={JSON.stringify(tiers)}
                />

                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Automatic discount
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Choose the collection used by the party bag builder. When
                    the total quantity of collection items in the cart reaches
                    a tier threshold, that percentage is applied at checkout.
                  </Text>

                  <TextField
                    label="Discount title"
                    name="title"
                    value={title}
                    onChange={setTitle}
                    autoComplete="off"
                  />

                  <BlockStack gap="200">
                    <Text as="h3" variant="headingSm">
                      Eligible collection
                    </Text>
                    <InlineStack gap="300" blockAlign="center">
                      <Text as="p" variant="bodyMd">
                        {collectionTitle ||
                          (collectionIds[0]
                            ? collectionIds[0]
                            : "No collection selected")}
                      </Text>
                      <Button onClick={openCollectionPicker}>
                        {collectionIds.length > 0
                          ? "Change collection"
                          : "Select collection"}
                      </Button>
                    </InlineStack>
                  </BlockStack>

                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">
                      Discount tiers
                    </Text>
                    {tiers.map((tier, index) => (
                      <Box
                        key={`tier-${index}`}
                        padding="300"
                        background="bg-surface-secondary"
                        borderRadius="200"
                      >
                        <InlineStack gap="300" wrap={false}>
                          <TextField
                            label={`Tier ${index + 1} minimum quantity`}
                            type="number"
                            value={String(tier.minQty)}
                            onChange={(value) =>
                              updateTier(index, "minQty", value)
                            }
                            autoComplete="off"
                          />
                          <TextField
                            label={`Tier ${index + 1} discount (%)`}
                            type="number"
                            value={String(tier.discount)}
                            onChange={(value) =>
                              updateTier(index, "discount", value)
                            }
                            autoComplete="off"
                          />
                        </InlineStack>
                      </Box>
                    ))}
                  </BlockStack>

                  <InlineStack gap="300">
                    <Button
                      variant="primary"
                      submit
                      loading={isSaving}
                      disabled={!loaderData.functionId}
                    >
                      Save discount
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Form>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
