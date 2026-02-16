# 1. Set the Resend API Key (safe storage)
npx supabase secrets set RESEND_API_KEY=re_RaRqvzuq_LmuFVJXekiKoW56iELDjum2w

# 2. Deploy the Daily Reminders Function
# Note: You might be prompted to link your project if you haven't already.
npx supabase functions deploy daily-reminders --no-verify-jwt

Write-Host "✅ Email Function Deployed Successfully!"
Write-Host "👉 Next Step: Go to your Supabase Dashboard -> Edge Functions -> daily-reminders."
Write-Host "👉 Enable 'Enforce JWT Verification' is OFF (we used --no-verify-jwt)."
Write-Host "👉 To schedule it: Use pg_cron or an external scheduler (like cron-job.org) to call the function URL daily at 00:15."
