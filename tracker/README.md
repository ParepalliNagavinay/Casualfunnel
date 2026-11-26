# InsightFlow browser tracker

Add this script to any HTTP/HTTPS webpage. The API URL must be reachable by visitors' browsers:

```html
<script src="https://your-api.example/tracker/insightflow.js"
        data-api-url="https://your-api.example/api/events"
        data-site-id="your-account-tracker-id" defer></script>
```

Get the account-specific `data-site-id` from **Account settings → Website tracking**. It routes events into that account and is a public project identifier, not a secret.

It emits one page view and document-level clicks with viewport coordinates, URL, ISO timestamp, and a 30-minute inactivity session. Storage and network failures are ignored so they cannot break the host site. To exclude an element, add `data-insightflow-ignore`. Events use a JSON POST with keepalive and sendBeacon on page hide. If storage is unavailable, the SDK uses a transient ID for the page lifetime. If no `data-site-id` is supplied, events are stored as unassigned and do not appear in an account's dashboard.
