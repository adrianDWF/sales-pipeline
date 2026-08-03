import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { mapFramerFormToLead, verifyFramerSignature } from "./framer-webhook.js";

describe("verifyFramerSignature", () => {
  it("accepts a valid Framer signature", () => {
    const secret = "test-secret-minimum-32-characters-long";
    const submissionId = "0fbbb90e-564b-4870-ac8b-78f9bc4e44a6";
    const payload = Buffer.from(JSON.stringify({ name: "Jane", email: "jane@example.com" }));

    const hmac = createHmac("sha256", secret);
    hmac.update(payload);
    hmac.update(submissionId);
    const signature = `sha256=${hmac.digest("hex")}`;

    expect(verifyFramerSignature(secret, submissionId, payload, signature)).toBe(true);
  });
});

describe("mapFramerFormToLead", () => {
  it("maps common Framer field names", () => {
    const lead = mapFramerFormToLead(
      {
        Name: "Jane Doe",
        Email: "jane@example.com",
        Phone: "+40123456789",
        Website: "https://acme.ro",
        Message: "Hello",
      },
      "submission-123",
    );

    expect(lead).toEqual({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "+40123456789",
      company: "https://acme.ro",
      message: "Hello",
      source: "framer",
      external_id: "submission-123",
      form_payload: {
        Name: "Jane Doe",
        Email: "jane@example.com",
        Phone: "+40123456789",
        Website: "https://acme.ro",
        Message: "Hello",
      },
    });
  });
});
