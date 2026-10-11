# Organized tours

- Public listings: `/organized-tours`; authenticated publishing: `/organized-tours/publish`.
- Organizers see their own listings and registration requests at `/organized-tours/manage`.
- Administrators moderate at `/admin/organized-tours`, linked from the existing admin tours page.
- A new listing is pending until an administrator approves it. Only active, upcoming tours are listed publicly.
- Visitors submit requests without signing in. Requests do not reserve places or confirm payment. The organizer contacts the visitor, handles payment directly and confirms the request in the dashboard.
- Confirmed participant totals cannot exceed capacity. The trigger serializes confirmations using a row lock. Contact details are readable only by the relevant organizer and administrators.
- Duplicate requests with the same normalized phone and tour are blocked for one hour. Anonymous visitors cannot read or confirm requests.
- Hebrew copy is provided with English fallback for other locales. Navigation labels cover all four locales.

The additive schema is recorded in `supabase/organized-tours-schema.sql` and was applied to the Uman2go project using migrations `add_organized_tours_marketplace` and `organized_tours_photos_and_cancellation`. Do not reapply the schema file to that project. Run `supabase/tests/organized-tours.sql` as a transactional database test: every fixture rolls back and no email is sent.
