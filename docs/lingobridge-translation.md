# Ride translation billed to LingoBridge

The operator authorized charging UMAN2GO text translation to LingoBridge's existing general account, without charging passengers or drivers. This integration calls Google NMT using that same Google project; it does not debit a passenger subscription or a LingoBridge room balance.

Activation: set production-only secret `LINGOBRIDGE_GOOGLE_TRANSLATION_API_KEY` to the existing Cloud Translation restricted key from LingoBridge Google project `lingobridge-508312`, then redeploy. Never commit the key, send it to a browser, or create a new billing account. Without the key, only the existing offline ride phrasebook is enabled. The UI reflects the actual configuration.

LingoBridge's September 19 deployment notes record a 15,000-character project-wide daily Google quota. Verify the live quota when accessing Google Cloud; do not increase it or the existing shared translation budget as part of activation. This application's usage ledger is not an account-wide spending cap. Google billing and its project quota remain authoritative.

Only new ride text of up to 1500 Unicode characters is translated into the recipient's selected Hebrew, English, Russian or Ukrainian. Exact common phrases use the local phrasebook. URLs, email addresses, numeric values and alphanumeric identifiers containing digits are protected. The original is included. Unknown provider failures, changed placeholders or responses exceeding Telegram's 4096 UTF-16-unit limit show the original with an unavailable notice. Longer text, voice, photos and GPS payloads are not sent to Google.

Before a paid request, strip the translation job from the outbox, retain the original, record the attempt, and persist the cloud snapshot. Do not call Google if this persistence fails. Timeouts and uncertain responses never trigger automatic paid retries. A completed translation is persisted before Telegram delivery. The `translation_attempts` table records time, outbox id, protected source character count, target language and outcome, never a second copy of private text. Attempted characters are not a verified invoice amount.

Roll back full translation by removing the dedicated UMAN2GO secret and redeploying. Do not rotate or remove LingoBridge's own key, which would interrupt its existing users.
