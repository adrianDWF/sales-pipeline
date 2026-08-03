import assert from "node:assert/strict";
import test from "node:test";
import { auditGtmGa4Pattern } from "./lib/gtm-ga4-pattern-audit.mjs";

const eventRegex = "view_item|view_item_list|select_item|add_to_cart|remove_from_cart|view_cart|begin_checkout|add_payment_info|add_shipping_info|purchase";

function exportWith(tag) {
  return {
    containerVersion: {
      container: { name: "Example", publicId: "GTM-TEST" },
      trigger: [{
        triggerId: "10",
        name: "[dwf] Event - Ecommerce Events GA4",
        type: "CUSTOM_EVENT",
        customEventFilter: [{ parameter: [{ key: "arg1", value: eventRegex }] }],
      }],
      tag: [{
        firingTriggerId: ["10"],
        parameter: [{ key: "eventName", value: "{{Event}}" }, ...(tag.parameter ?? [])],
        ...tag,
      }],
    },
  };
}

test("recognizes the BabyNeeds server-side pattern without treating configuration as observation", () => {
  const result = auditGtmGa4Pattern(exportWith({
    name: "[dwf]GA4 - Event - Ecommerce events Server Side",
    parameter: [
      { key: "items", value: "{{[dwf] Ecommerce Items}}" },
      { key: "transaction_id", value: "{{[dwf] Ecommerce Transaction ID}}" },
      { key: "affiliation", value: "{{[dwf] Ecommerce Affiliation}}" },
      { key: "value", value: "{{[dwf] Ecommerce Value}}" },
      { key: "tax", value: "{{[dwf] Ecommerce Tax}}" },
      { key: "shipping", value: "{{[dwf] Ecommerce Shipping}}" },
      { key: "currency", value: "{{[dwf] Ecommerce Currency}}" },
      { key: "coupon", value: "{{[dwf] Ecommerce Coupon}}" },
      { key: "server_container_url", value: "{{Server_Container_URL}}" },
      { key: "unique_event_id", value: "{{[dwf] unique event id}}" },
      { key: "user_data", value: "{{eMAIL - User-Provided Data}}" },
    ],
  }));

  assert.equal(result.patterns.hasServerSide, true);
  assert.deepEqual(result.patterns.idStrategies, ["unique_event_id"]);
  assert.equal(result.tags[0].includesUserData, true);
  assert.equal(result.eventCoverage.find((row) => row.eventName === "view_item").status, "configured_unverified");
});

test("recognizes the dyfashion client-side setup and compares it with observed GA4 events", () => {
  const input = exportWith({
    name: "[dwf]GA4 - Event - Ecommerce events",
    setupTag: [{ tagName: "[dwf] GA4 Client Side" }],
    parameter: [
      { key: "items", value: "{{[dwf] Ecommerce Items}}" },
      { key: "transaction_id", value: "{{[dwf] Ecommerce Transaction ID}}" },
      { key: "affiliation", value: "{{[dwf] Ecommerce Affiliation}}" },
      { key: "value", value: "{{[dwf] Ecommerce Value}}" },
      { key: "tax", value: "{{[dwf] Ecommerce Tax}}" },
      { key: "shipping", value: "{{[dwf] Ecommerce Shipping}}" },
      { key: "currency", value: "{{[dwf] Ecommerce Currency}}" },
      { key: "coupon", value: "{{[dwf] Ecommerce Coupon}}" },
      { key: "event_id", value: "{{event_id}}" },
    ],
  });
  const result = auditGtmGa4Pattern(input, [
    { eventName: "view_item", eventCount: 120 },
    { eventName: "purchase", eventCount: 4 },
  ]);

  assert.equal(result.patterns.hasClientSide, true);
  assert.deepEqual(result.patterns.idStrategies, ["event_id"]);
  assert.equal(result.eventCoverage.find((row) => row.eventName === "view_item").status, "configured_and_observed");
  assert.equal(result.eventCoverage.find((row) => row.eventName === "add_to_cart").status, "configured_not_observed");
});
