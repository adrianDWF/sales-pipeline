# Website form → Sales Pipeline webhook

Connect your public website contact form to the production API so submissions appear in **Leads**.

## Framer form (DWF website)

In Framer → Form → **Send To → Webhook**:

| Field | Value |
|-------|--------|
| **API** | `https://sales-pipeline-api-one.vercel.app/webhooks/framer` |
| **Secret** | Copy `LEAD_WEBHOOK_SECRET` from `apps/api/.env` (or Vercel → sales-pipeline-api → Environment Variables). Must be at least 32 characters. |
| **Fallback** | Your email (e.g. `stefan@dwf.ro`) — Framer notifies you if the webhook fails |

**Important:** In Framer, set each input's **name** (not the label) to something we can map:

- Name field → `name`
- Email → `email`
- Phone → `phone`
- Website URL → `website`
- Message → `message`

Framer signs requests with `Framer-Signature` — do **not** use the generic `/webhooks/leads` URL (that one expects `Authorization: Bearer`).

---

## Generic webhook (curl, custom backend)

## Production endpoint

```
POST https://sales-pipeline-api-one.vercel.app/webhooks/leads
Authorization: Bearer <LEAD_WEBHOOK_SECRET>
Content-Type: application/json
```

Get `LEAD_WEBHOOK_SECRET` from `apps/api/.env` locally or Vercel → **sales-pipeline-api** → Settings → Environment Variables.

> **Note:** `sales-pipeline-api.vercel.app` is owned by another Vercel team. Use `sales-pipeline-api-one.vercel.app` (assigned to this project).

## JSON body

Required: `name`, `email`

Optional: `phone`, `company`, `message`, `source`, `external_id`, `form_payload`

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+40 712 345 678",
  "company": "Acme SRL",
  "message": "Interested in a quote",
  "source": "website",
  "external_id": "form-submission-12345"
}
```

Success response:

```json
{ "ok": true, "id": "uuid", "duplicate": false }
```

If `external_id` was already submitted, you get `{ "duplicate": true }` and the existing lead id.

## Test from terminal

```bash
source apps/api/.env
curl -X POST https://sales-pipeline-api-one.vercel.app/webhooks/leads \
  -H "Authorization: Bearer $LEAD_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"name":"Site Test","email":"test@example.com","message":"Hello","external_id":"site-test-001"}'
```

Then open https://sales-pipeline-web.vercel.app/leads

## Example: Node / Next.js API route

```typescript
export async function POST(request: Request) {
  const form = await request.formData(); // or request.json()

  const res = await fetch("https://sales-pipeline-api-one.vercel.app/webhooks/leads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LEAD_WEBHOOK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: form.get("phone") ? String(form.get("phone")) : undefined,
      message: form.get("message") ? String(form.get("message")) : undefined,
      source: "website",
      external_id: crypto.randomUUID(),
    }),
  });

  if (!res.ok) {
    return Response.json({ error: "Failed to save lead" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
```

Store `LEAD_WEBHOOK_SECRET` in your website host’s env vars — **never** expose it in client-side JavaScript.

## Example: PHP (WordPress / custom form handler)

```php
$payload = json_encode([
  'name' => $_POST['name'],
  'email' => $_POST['email'],
  'message' => $_POST['message'] ?? null,
  'source' => 'website',
  'external_id' => uniqid('form-', true),
]);

$ch = curl_init('https://sales-pipeline-api-one.vercel.app/webhooks/leads');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'Content-Type: application/json',
    'Authorization: Bearer ' . getenv('LEAD_WEBHOOK_SECRET'),
  ],
  CURLOPT_POSTFIELDS => $payload,
  CURLOPT_RETURNTRANSFER => true,
]);
$response = curl_exec($ch);
curl_close($ch);
```

## Security

- Always call the webhook **server-side** (API route, PHP handler, serverless function).
- Use the Bearer secret; do not rely on obscurity.
- Rate limit is 60 requests/minute per IP on the API.
