$ErrorActionPreference = "Stop"

$projectRef = "laridrbrppkvcexopyaa"
$required = @("SUPABASE_ACCESS_TOKEN", "RESEND_API_KEY", "EMAIL_FROM")
$envFile = Join-Path $PSScriptRoot "..\.env.deploy.local"

if (Test-Path -LiteralPath $envFile) {
  Get-Content -LiteralPath $envFile | ForEach-Object {
    if ($_ -match "^\s*([^#=]+)=(.*)$") {
      $name = $matches[1].Trim()
      $value = $matches[2].Trim().Trim('"')
      [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
  }
}

foreach ($name in $required) {
  if (-not [Environment]::GetEnvironmentVariable($name)) {
    throw "Missing environment variable: $name"
  }
}

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  throw "Supabase CLI is not installed or is not available on PATH."
}

supabase secrets set `
  "RESEND_API_KEY=$env:RESEND_API_KEY" `
  "EMAIL_FROM=$env:EMAIL_FROM" `
  --project-ref $projectRef

supabase functions deploy send-booking-email `
  --project-ref $projectRef

Write-Host "send-booking-email deployed to project $projectRef"
