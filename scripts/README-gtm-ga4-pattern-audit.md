# GTM / GA4 pattern auditor

This standalone, read-only utility inspects a Google Tag Manager container export without changing the application's existing synchronization or audit logic.

It recognizes both common implementations shown in the BabyNeeds and dyfashion examples:

- server-side forwarding with `server_container_url`, `unique_event_id`, and optional `user_data`;
- client-side GA4 tags with a setup tag and `event_id`;
- dynamic `{{Event}}` names backed by a custom-event regex;
- ecommerce parameters and consent checks;
- configured GTM events versus events actually observed by GA4.

Run it with a GTM container export:

```sh
node scripts/gtm-ga4-pattern-audit.mjs --gtm ./container.json
```

Optionally compare the configuration with GA4 event rows:

```sh
node scripts/gtm-ga4-pattern-audit.mjs \
  --gtm ./container.json \
  --ga4-events ./ga4-events.json
```

The GA4 input can be an array of event names, an array containing `eventName` and `eventCount`, or rows returned by the GA4 Data API. A configured tag is reported as `configured_unverified` until observed GA4 data is supplied; configuration alone never proves that an event fired or was collected.
