# Notifications for passengers, drivers and admins

The Mini App now has an unread badge, a persistent alert banner, a notification inbox and an opt-in sound button. Read state is saved per account on the server. Opening the inbox does not accept a quote or approve a driver. Pending driver cards expose an admin-only approval button; the server verifies the recipient and current pending status.

Passengers see quotes and ride updates. Drivers see requests, assignment updates and cancellations, including cancellation of requests that have not yet been assigned. Admins receive action alerts for Telegram commands/callbacks and completed Mini App business actions, identifying the actor, action and relevant ride or target. The activity summaries omit message bodies and GPS coordinates. Automatic state polling and marking notifications read do not create admin alerts.

Foreground refresh runs every three seconds, resumes on returning to the app and prevents overlapping or obsolete reads from overwriting action results. This is near-real-time polling, not a guaranteed instantaneous push channel. Telegram bot messages deliver background alerts. Device/Telegram mute and notification settings still apply; browser audio requires tapping Enable sound during the session.

The inbox displays up to 50 relevant alerts from the latest 250 recipient messages. Ordinary form prompts are excluded. The existing durable outbox remains the delivery source, and Telegram retries remain in effect. Cloud delivery processes up to 25 messages with a 20-second time budget instead of stopping after five messages; unfinished messages remain queued for the existing scheduler.

Validation uses isolated databases and simulated Telegram delivery:

```powershell
$env:PYTHONPATH=(Resolve-Path bot_service).Path
python -m unittest discover -s tests -t . -q
node --check bot_service/uman2go/web/app.js
node --check bot_service/uman2go/web/notifications.js
```

92 Python tests cover the existing ride flow plus recipient isolation, admin permissions, durable read state, idempotent activity alerts, cancellation delivery, non-silent Telegram payloads and bounded delivery. The browser demo was also exercised for a request, driver quote and passenger alert. No real ride, quote acceptance or driver approval is created by these tests.
