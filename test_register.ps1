$auth = Invoke-RestMethod -Uri http://localhost:8081/api/auth/login -Method Post -ContentType 'application/json' -Body (@{username='admin'; password='admin123'} | ConvertTo-Json)
$h = @{ Authorization = "Bearer $($auth.access_token)" }
$users = Invoke-RestMethod -Uri http://localhost:8081/api/users -Method Get -Headers $h
Write-Host "Users retrieved: $($users.Count)"

$regBody = @{
    name = "Priya Patel"
    email = "priya.patel@novabank.com"
    phone = "9876543299"
    address = "77 Financial District, Hyderabad"
    password = "SecurePassword123!"
} | ConvertTo-Json

$reg = Invoke-RestMethod -Uri http://localhost:8081/api/auth/register -Method Post -ContentType 'application/json' -Body $regBody
Write-Host "Registered: $($reg.message) Customer ID: $($reg.customerId)"

$priyaAuth = Invoke-RestMethod -Uri http://localhost:8081/api/auth/login -Method Post -ContentType 'application/json' -Body (@{username='priya.patel@novabank.com'; password='SecurePassword123!'} | ConvertTo-Json)
Write-Host "Priya Login Success! Display: $($priyaAuth.displayName) Roles: $($priyaAuth.roles -join ', ')"
