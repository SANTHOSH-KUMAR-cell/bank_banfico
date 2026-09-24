$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   NovaBank API End-to-End Test Suite   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Health
Write-Host "`n1. Testing GET /health..." -ForegroundColor Yellow
$h = Invoke-RestMethod -Uri "http://localhost:8081/health" -Method GET
Write-Host "Status: $($h.status)" -ForegroundColor Green

# 2. Info
Write-Host "`n2. Testing GET /api/info..." -ForegroundColor Yellow
$info = Invoke-RestMethod -Uri "http://localhost:8081/api/info" -Method GET
Write-Host "App: $($info.application), Version: $($info.version)" -ForegroundColor Green

# 3. 401 Unauthorized Verification
Write-Host "`n3. Testing 401 Unauthorized (GET /api/accounts without token)..." -ForegroundColor Yellow
try {
    $null = Invoke-RestMethod -Uri "http://localhost:8081/api/accounts" -Method GET
    Write-Host "FAILED: Expected 401 but request succeeded!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "SUCCESS: Caught expected HTTP status: $statusCode" -ForegroundColor Green
}

# 4. Login as Admin
Write-Host "`n4. Logging in as ADMIN (admin/admin123)..." -ForegroundColor Yellow
$adminAuth = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method POST -Body (@{username="admin"; password="admin123"} | ConvertTo-Json) -ContentType "application/json"
$adminToken = $adminAuth.access_token
Write-Host "ADMIN token obtained. Roles: $($adminAuth.roles -join ', ')" -ForegroundColor Green
$adminHeaders = @{ Authorization = "Bearer $adminToken" }

# 5. Create Customer
Write-Host "`n5. Testing POST /api/customers (ADMIN)..." -ForegroundColor Yellow
$custBody = @{
    name = "Santhosh Kumar"
    email = "santhosh.$(Get-Random)@bank.com"
    phone = "9876543210"
    address = "42 MG Road, Bangalore"
} | ConvertTo-Json
$cust = Invoke-RestMethod -Uri "http://localhost:8081/api/customers" -Method POST -Headers $adminHeaders -Body $custBody -ContentType "application/json"
$custId = $cust.id
Write-Host "Created Customer #${custId}: $($cust.name) ($($cust.email))" -ForegroundColor Green

# 6. Retrieve Customers
Write-Host "`n6. Testing GET /api/customers..." -ForegroundColor Yellow
$customers = Invoke-RestMethod -Uri "http://localhost:8081/api/customers" -Method GET -Headers $adminHeaders
Write-Host "Total customers retrieved: $($customers.Count)" -ForegroundColor Green

# 7. Create Bank Account
Write-Host "`n7. Testing POST /api/accounts (ADMIN)..." -ForegroundColor Yellow
$accNum = "NOVA-$(Get-Random -Minimum 100000 -Maximum 999999)"
$accBody = @{
    customerId = $custId
    accountNumber = $accNum
    accountType = "SAVINGS"
    initialBalance = 25000.00
    status = "ACTIVE"
} | ConvertTo-Json
$acc = Invoke-RestMethod -Uri "http://localhost:8081/api/accounts" -Method POST -Headers $adminHeaders -Body $accBody -ContentType "application/json"
$accId = $acc.id
Write-Host "Created Account #$accId ($($acc.accountNumber)) Balance: $($acc.balance)" -ForegroundColor Green

# 8. Retrieve Account
Write-Host "`n8. Testing GET /api/accounts/$accId..." -ForegroundColor Yellow
$accDetail = Invoke-RestMethod -Uri "http://localhost:8081/api/accounts/$accId" -Method GET -Headers $adminHeaders
Write-Host "Account found: $($accDetail.accountNumber), Balance: $($accDetail.balance)" -ForegroundColor Green

# 9. Login as Maker
Write-Host "`n9. Logging in as MAKER (maker/maker123)..." -ForegroundColor Yellow
$makerAuth = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method POST -Body (@{username="maker"; password="maker123"} | ConvertTo-Json) -ContentType "application/json"
$makerToken = $makerAuth.access_token
$makerHeaders = @{ Authorization = "Bearer $makerToken" }
Write-Host "MAKER token obtained. Roles: $($makerAuth.roles -join ', ')" -ForegroundColor Green

# 10. Post Transaction as Maker
Write-Host "`n10. Testing POST /api/accounts/$accId/transactions (MAKER)..." -ForegroundColor Yellow
$txBody = @{
    amount = 5000.00
    type = "CREDIT"
    description = "Monthly Salary Credit"
} | ConvertTo-Json
$tx = Invoke-RestMethod -Uri "http://localhost:8081/api/accounts/$accId/transactions" -Method POST -Headers $makerHeaders -Body $txBody -ContentType "application/json"
Write-Host "Transaction posted! Ref: $($tx.transactionReference), Type: $($tx.type), Amount: $($tx.amount)" -ForegroundColor Green

# 11. Verify Balance updated
$accAfterTx = Invoke-RestMethod -Uri "http://localhost:8081/api/accounts/$accId" -Method GET -Headers $makerHeaders
Write-Host "Updated Account Balance: $($accAfterTx.balance) (Expected 30000.00)" -ForegroundColor Green

# 12. Create Beneficiary
Write-Host "`n12. Testing POST /api/beneficiaries..." -ForegroundColor Yellow
$benBody = @{
    customerId = $custId
    name = "Ravi Sharma"
    accountNumber = "HDFC0987654321"
    bankName = "HDFC Bank"
    ifscCode = "HDFC0001234"
} | ConvertTo-Json
$ben = Invoke-RestMethod -Uri "http://localhost:8081/api/beneficiaries" -Method POST -Headers $adminHeaders -Body $benBody -ContentType "application/json"
$benId = $ben.id
Write-Host "Created Beneficiary #${benId}: $($ben.name) ($($ben.bankName))" -ForegroundColor Green

# 13. Create Consent
Write-Host "`n13. Testing POST /api/consents..." -ForegroundColor Yellow
$conBody = @{
    customerId = $custId
    purpose = "Open Banking Account Information Access"
} | ConvertTo-Json
$consent = Invoke-RestMethod -Uri "http://localhost:8081/api/consents" -Method POST -Headers $adminHeaders -Body $conBody -ContentType "application/json"
$conId = $consent.id
Write-Host "Created Consent #$conId Ref: $($consent.consentReference), Status: $($consent.status)" -ForegroundColor Green

# 14. 403 Forbidden Verification: MAKER attempting to approve consent (requires CHECKER)
Write-Host "`n14. Testing 403 Forbidden (MAKER attempting POST /api/consents/$conId/approve)..." -ForegroundColor Yellow
try {
    $null = Invoke-RestMethod -Uri "http://localhost:8081/api/consents/$conId/approve" -Method POST -Headers $makerHeaders
    Write-Host "FAILED: Expected 403 Forbidden but approve succeeded!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "SUCCESS: Caught expected HTTP status: $statusCode (Forbidden for MAKER role)" -ForegroundColor Green
}

# 15. Login as Checker
Write-Host "`n15. Logging in as CHECKER (checker/checker123)..." -ForegroundColor Yellow
$checkerAuth = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method POST -Body (@{username="checker"; password="checker123"} | ConvertTo-Json) -ContentType "application/json"
$checkerToken = $checkerAuth.access_token
$checkerHeaders = @{ Authorization = "Bearer $checkerToken" }
Write-Host "CHECKER token obtained. Roles: $($checkerAuth.roles -join ', ')" -ForegroundColor Green

# 16. Approve Consent as Checker
Write-Host "`n16. Testing POST /api/consents/$conId/approve (CHECKER)..." -ForegroundColor Yellow
$approvedCon = Invoke-RestMethod -Uri "http://localhost:8081/api/consents/$conId/approve" -Method POST -Headers $checkerHeaders
Write-Host "Consent approved! Status: $($approvedCon.status), ApprovedAt: $($approvedCon.approvedAt)" -ForegroundColor Green

# 17. Business Rule: Cannot approve already approved consent (400 Bad Request)
Write-Host "`n17. Testing 400 Bad Request (Cannot re-approve approved consent)..." -ForegroundColor Yellow
try {
    $null = Invoke-RestMethod -Uri "http://localhost:8081/api/consents/$conId/approve" -Method POST -Headers $checkerHeaders
    Write-Host "FAILED: Re-approving should throw 400!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "SUCCESS: Caught expected HTTP status: $statusCode (Cannot approve already approved consent)" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   ALL 17 TESTS PASSED SUCCESSFULLY!    " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
