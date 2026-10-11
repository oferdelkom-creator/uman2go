# Sales assistant infrastructure

Customer page: `/assistant` (localized like the rest of the site). Admin inbox: `/admin/ai-conversations`. No floating chat or automatic invitations are added; the foundation can be reached by its direct URL.

Uses the existing server-side `ANTHROPIC_API_KEY`, with AI SDK 7 and `@ai-sdk/anthropic`. Default model is the current documented `claude-haiku-5-5`; set `SALES_ASSISTANT_MODEL` to another valid Anthropic model if required. Set `SALES_ASSISTANT_ENABLED=false` to disable session creation and generation. Missing credentials fail closed. `SUPABASE_SERVICE_ROLE_KEY` stays on the server; preview environments without it do not process customer conversations.

Name and phone OR email, plus explicit consent, are stored before chatting. Contact data is not sent to the model. Conversation content is sent to Anthropic as disclosed in the form. Only a random HttpOnly, Secure-in-production, SameSite Strict cookie is retained in the browser. Its SHA-256 digest identifies the conversation server-side. No customer details are put into localStorage or application logs. Resume is limited to the same browser and 30-day session lifetime. A shared browser can expose its own resumed conversation; use "start a new conversation" before another customer uses it.

The model receives bounded public active listings for accommodation, transport, guides and upcoming organized tours. It cannot change bookings, take payments, contact suppliers or send customer messages. Published terms govern each tour; payment goes directly to the organizer. Missing data and custom quotes require a human representative. Replies are rendered as text, with links restricted to site routes and the official WhatsApp contact.

User messages persist before provider calls, so interrupted or failed generations leave the enquiry available to the admin. The admin overview is an extract of the customer's recent messages, not an AI interpretation. Full transcripts are available. Only administrators can read contacts or messages; browser roles cannot write these tables or read session-token hashes.

Atomic daily quotas: 8 starts/IP, 150 starts/site, 60 calls/IP, 300 calls/site, 40 turns/session. One generation per session is allowed, with a 90-second lock recovery window. Model history uses the last 12 messages, each user input is capped at 2,000 characters, output at 700 tokens, retries disabled and generation time capped at 40 seconds. IP values are stored only as keyed digests. These are usage limits rather than a monetary budget.

Schema reference: `supabase/sales-assistant-schema.sql`. Live migrations are applied through Supabase; do not replay them on the existing database. Security and quota verification: `supabase/tests/sales-assistant.sql`, transactional with no retained fixtures.

Expired conversations cannot be resumed or read through the admin page. The `uman-sales-retention` database job deletes expired conversations and their messages hourly; physical deletion happens within one hour after the 30-day expiry, even without visitor traffic. Old quota counters are deleted too. The session creation route also removes expired records.
