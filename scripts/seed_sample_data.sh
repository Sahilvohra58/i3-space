#!/usr/bin/env bash
# Seed every snapshot tracker with 4 months of realistic, trending sample data.
# Use this purely for demo / Board visualisation. Re-running appends duplicate rows.
#
# Usage:
#   ./scripts/seed_sample_data.sh                # uses http://localhost:8000
#   API_BASE=https://my.api ./scripts/seed_sample_data.sh

set -euo pipefail

API="${API_BASE:-http://localhost:8000}"
SLEEP="${SEED_SLEEP:-1.0}"   # pause between requests to stay under Sheets 60/min cap

post() {
  local path="$1"; local body="$2"
  echo "POST ${path}"
  curl -sS -X POST "${API}${path}" \
    -H "Content-Type: application/json" \
    -d "${body}" \
    -w " (HTTP %{http_code})\n" \
    -o /dev/null
  sleep "${SLEEP}"
}

# ─── Volunteers / Human Resources ──────────────────────────────────────────────
# (Apr-01/May-01/May-16 already exist from earlier; just add older history)
post /volunteers/snapshots '{"date":"2026-02-01","active_volunteers":12,"avg_time_to_fill_days":28,"churn_count":4,"nps_score":32.0,"training_participation_rate":58.0,"roles_with_kpis_rate":45.0,"performance_review_completion_rate":62.0,"mentorship_participation_rate":28.0}'
post /volunteers/snapshots '{"date":"2026-03-01","active_volunteers":15,"avg_time_to_fill_days":24,"churn_count":3,"nps_score":38.5,"training_participation_rate":64.0,"roles_with_kpis_rate":52.0,"performance_review_completion_rate":68.0,"mentorship_participation_rate":34.0}'

# ─── Loyalty & Partnership ─────────────────────────────────────────────────────
post /loyalty/snapshots '{"date":"2026-02-01","customer_retention_rate":72.0,"repeat_purchase_rate":48.5,"avg_clv":820.0,"partnership_renewal_rate":65.0,"referral_rate":6.2}'
post /loyalty/snapshots '{"date":"2026-03-01","customer_retention_rate":76.5,"repeat_purchase_rate":53.0,"avg_clv":940.0,"partnership_renewal_rate":70.0,"referral_rate":8.1}'
post /loyalty/snapshots '{"date":"2026-04-01","customer_retention_rate":81.0,"repeat_purchase_rate":58.4,"avg_clv":1080.0,"partnership_renewal_rate":74.0,"referral_rate":10.4}'
post /loyalty/snapshots '{"date":"2026-05-01","customer_retention_rate":83.2,"repeat_purchase_rate":60.0,"avg_clv":1180.0,"partnership_renewal_rate":76.0,"referral_rate":11.8}'

# ─── Business Outreach ─────────────────────────────────────────────────────────
post /outreach/snapshots '{"date":"2026-02-01","outreach_contacts_made":120,"conversion_rate":4.5,"response_rate":18.0,"meetings_scheduled":8,"followup_rate":42.0}'
post /outreach/snapshots '{"date":"2026-03-01","outreach_contacts_made":165,"conversion_rate":5.8,"response_rate":21.5,"meetings_scheduled":12,"followup_rate":48.0}'
post /outreach/snapshots '{"date":"2026-04-01","outreach_contacts_made":210,"conversion_rate":7.0,"response_rate":24.0,"meetings_scheduled":17,"followup_rate":54.0}'
post /outreach/snapshots '{"date":"2026-05-01","outreach_contacts_made":255,"conversion_rate":8.4,"response_rate":26.8,"meetings_scheduled":22,"followup_rate":60.0}'

# ─── Business Enrolled (time_to_close_days + churn_rate are down-is-good) ─────
post /business/snapshots '{"date":"2026-02-01","active_business_clients":18,"revenue_per_client":2400.0,"time_to_close_days":42,"churn_rate":6.5}'
post /business/snapshots '{"date":"2026-03-01","active_business_clients":24,"revenue_per_client":2750.0,"time_to_close_days":36,"churn_rate":5.8}'
post /business/snapshots '{"date":"2026-04-01","active_business_clients":31,"revenue_per_client":3100.0,"time_to_close_days":31,"churn_rate":4.7}'
post /business/snapshots '{"date":"2026-05-01","active_business_clients":38,"revenue_per_client":3450.0,"time_to_close_days":27,"churn_rate":3.9}'

# ─── Sponsorships ──────────────────────────────────────────────────────────────
post /sponsorships/snapshots '{"date":"2026-02-01","new_deals_closed":3,"revenue_growth_rate":12.0,"avg_deal_value":8500.0,"engagement_rate":54.0,"retention_rate":68.0}'
post /sponsorships/snapshots '{"date":"2026-03-01","new_deals_closed":5,"revenue_growth_rate":18.5,"avg_deal_value":10200.0,"engagement_rate":61.0,"retention_rate":72.0}'
post /sponsorships/snapshots '{"date":"2026-04-01","new_deals_closed":7,"revenue_growth_rate":24.0,"avg_deal_value":12500.0,"engagement_rate":67.0,"retention_rate":76.0}'
post /sponsorships/snapshots '{"date":"2026-05-01","new_deals_closed":9,"revenue_growth_rate":29.5,"avg_deal_value":14800.0,"engagement_rate":72.0,"retention_rate":80.0}'

# ─── Media Sales ───────────────────────────────────────────────────────────────
post /media-sales/snapshots '{"date":"2026-02-01","channel_sponsors":4,"ad_revenue_per_sponsor":1800.0}'
post /media-sales/snapshots '{"date":"2026-03-01","channel_sponsors":6,"ad_revenue_per_sponsor":2150.0}'
post /media-sales/snapshots '{"date":"2026-04-01","channel_sponsors":8,"ad_revenue_per_sponsor":2500.0}'
post /media-sales/snapshots '{"date":"2026-05-01","channel_sponsors":11,"ad_revenue_per_sponsor":2920.0}'

# ─── Team (sales_cycle_length_days is down-is-good) ────────────────────────────
post /team/snapshots '{"date":"2026-02-01","sales_recruited":2,"training_hours_per_salesperson":6.0,"sales_cycle_length_days":34}'
post /team/snapshots '{"date":"2026-03-01","sales_recruited":3,"training_hours_per_salesperson":7.5,"sales_cycle_length_days":30}'
post /team/snapshots '{"date":"2026-04-01","sales_recruited":4,"training_hours_per_salesperson":9.0,"sales_cycle_length_days":26}'
post /team/snapshots '{"date":"2026-05-01","sales_recruited":6,"training_hours_per_salesperson":10.5,"sales_cycle_length_days":22}'

echo
echo "Done. Refresh the Board to see populated KPIs and trend charts."
