# R8 Deployment Runbook

1. Backup production database.
2. Deploy to staging first.
3. Apply migrations 20260924 through 20261001 in order.
4. Run financial_integrity_report; investigate every non-zero result before production cutover.
5. Deploy all R1-R7 Edge Functions plus current webhook/worker versions.
6. Configure Razorpay, Shiprocket and INTERNAL_FUNCTION_SECRET values.
7. Enable scheduled checkout cleanup, fulfillment processing and refund reconciliation.
8. Deploy frontend.
9. Execute payment/refund/return/RTO regression matrix.
10. Monitor fulfillment_jobs, order_refunds, order_returns and provider webhooks for 24 hours.
11. Only then repeat migration/function/frontend rollout in production.
12. Do not bypass R8 state-machine RPCs with direct SQL except a documented incident repair reviewed against the financial ledger.
