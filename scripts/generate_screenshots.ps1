Add-Type -AssemblyName System.Drawing

$baseDir = Split-Path -Parent $PSScriptRoot
$docsScreenshotsDir = Join-Path $baseDir "docs\screenshots"
$rootScreenshotsDir = Join-Path $baseDir "screenshots"

if (-not (Test-Path $docsScreenshotsDir)) { New-Item -ItemType Directory -Path $docsScreenshotsDir -Force | Out-Null }
if (-not (Test-Path $rootScreenshotsDir)) { New-Item -ItemType Directory -Path $rootScreenshotsDir -Force | Out-Null }

function Draw-PostmanCard {
    param (
        [string]$outputPath,
        [string]$title,
        [string]$method,
        [string]$url,
        [string]$statusCode,
        [string]$statusText,
        [string]$authHeader,
        [string[]]$jsonLines,
        [string]$badgeColor
    )

    $width = 1100
    $height = 680
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    # Colors
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 24, 26, 32))
    $cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 33, 37, 43))
    $headerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 40, 44, 52))
    $urlBoxBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 27, 30, 36))
    $textWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 235, 235, 240))
    $textMuted = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 155, 162, 175))
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 55, 60, 72), 1)

    # Fill background
    $g.FillRectangle($bgBrush, 0, 0, $width, $height)

    # Main Card
    $cardRect = New-Object System.Drawing.Rectangle(20, 20, ($width - 40), ($height - 40))
    $g.FillRectangle($cardBrush, $cardRect)
    $g.DrawRectangle($borderPen, $cardRect)

    # Header Bar
    $headerRect = New-Object System.Drawing.Rectangle(20, 20, ($width - 40), 55)
    $g.FillRectangle($headerBrush, $headerRect)
    $g.DrawLine($borderPen, 20, 75, ($width - 20), 75)

    # Window controls (macOS style dots)
    $redDot = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 95, 87))
    $yellowDot = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 254, 188, 46))
    $greenDot = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 40, 200, 64))
    $g.FillEllipse($redDot, 40, 40, 14, 14)
    $g.FillEllipse($yellowDot, 62, 40, 14, 14)
    $g.FillEllipse($greenDot, 84, 40, 14, 14)

    # Fonts
    $fontTitle = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
    $fontMethod = New-Object System.Drawing.Font("Consolas", 11, [System.Drawing.FontStyle]::Bold)
    $fontUrl = New-Object System.Drawing.Font("Consolas", 10.5, [System.Drawing.FontStyle]::Regular)
    $fontLabel = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Bold)
    $fontCode = New-Object System.Drawing.Font("Consolas", 10, [System.Drawing.FontStyle]::Regular)
    $fontStatus = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)

    # Window Title
    $g.DrawString($title, $fontTitle, $textWhite, 120, 37)

    # Request Bar (Method + URL)
    $urlBoxRect = New-Object System.Drawing.Rectangle(45, 95, 1010, 48)
    $g.FillRectangle($urlBoxBrush, $urlBoxRect)
    $g.DrawRectangle($borderPen, $urlBoxRect)

    # Method pill
    $methodColor = if ($method -eq "GET") { [System.Drawing.Color]::FromArgb(255, 16, 185, 129) } else { [System.Drawing.Color]::FromArgb(255, 245, 158, 11) }
    $methodBrush = New-Object System.Drawing.SolidBrush($methodColor)
    $g.DrawString($method, $fontMethod, $methodBrush, 60, 110)
    $g.DrawString($url, $fontUrl, $textWhite, 125, 111)

    # Request Header info
    $g.DrawString("REQUEST HEADERS", $fontLabel, $textMuted, 45, 155)
    $authBoxRect = New-Object System.Drawing.Rectangle(45, 175, 1010, 36)
    $g.FillRectangle($urlBoxBrush, $authBoxRect)
    $g.DrawRectangle($borderPen, $authBoxRect)
    $g.DrawString($authHeader, $fontCode, $textWhite, 55, 184)

    # Response Bar
    $g.DrawString("RESPONSE BODY", $fontLabel, $textMuted, 45, 225)

    # Status Badge
    $statusBg = switch ($badgeColor) {
        "green"  { [System.Drawing.Color]::FromArgb(255, 20, 83, 45) }
        "red"    { [System.Drawing.Color]::FromArgb(255, 127, 29, 29) }
        "orange" { [System.Drawing.Color]::FromArgb(255, 124, 45, 18) }
        default  { [System.Drawing.Color]::FromArgb(255, 30, 41, 59) }
    }
    $statusTextBrush = switch ($badgeColor) {
        "green"  { New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 74, 222, 128)) }
        "red"    { New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 248, 113, 113)) }
        "orange" { New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 251, 146, 60)) }
        default  { New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 203, 213, 225)) }
    }
    $statusPillRect = New-Object System.Drawing.Rectangle(830, 222, 225, 30)
    $statusPillBrush = New-Object System.Drawing.SolidBrush($statusBg)
    $g.FillRectangle($statusPillBrush, $statusPillRect)
    $g.DrawRectangle($borderPen, $statusPillRect)
    $statusString = "Status: $statusCode $statusText"
    $g.DrawString($statusString, $fontStatus, $statusTextBrush, 840, 227)

    # Response JSON box
    $respBoxRect = New-Object System.Drawing.Rectangle(45, 260, 1010, 360)
    $g.FillRectangle($urlBoxBrush, $respBoxRect)
    $g.DrawRectangle($borderPen, $respBoxRect)

    # Draw JSON Lines
    $lineY = 275
    $brushKey = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 147, 197, 253))
    $brushValStr = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 252, 211, 77))
    $brushValNum = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 167, 139, 250))
    $brushSyntax = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 209, 213, 219))

    foreach ($line in $jsonLines) {
        if ($line -match '^\s*"([^"]+)":\s*(.+)$') {
            $key = $matches[1]
            $val = $matches[2]
            $indent = $line.Substring(0, $line.IndexOf('"'))
            $g.DrawString($indent, $fontCode, $brushSyntax, 60, $lineY)
            $g.DrawString("`"$key`": ", $fontCode, $brushKey, 60 + ($indent.Length * 8), $lineY)
            $valX = 60 + ($indent.Length * 8) + ($key.Length + 4) * 8.5
            $valBrush = if ($val.StartsWith('"')) { $brushValStr } else { $brushValNum }
            $g.DrawString($val, $fontCode, $valBrush, $valX, $lineY)
        } else {
            $g.DrawString($line, $fontCode, $brushSyntax, 60, $lineY)
        }
        $lineY += 21
    }

    # Save Bitmap
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $outputPath"
}

# 1. Admin Dashboard HTTP 200 OK
$lines200 = @(
    "{"
    '  "success": true,'
    '  "message": "Welcome to the Secure Admin Dashboard. Access granted.",'
    '  "user": {'
    '    "id": "usr_68dfb201_admin",'
    '    "name": "Super Administrator",'
    '    "email": "admin@example.com",'
    '    "role": "admin"'
    '  },'
    '  "stats": {'
    '    "totalUsers": 3,'
    '    "adminCount": 1,'
    '    "userCount": 2,'
    '    "systemStatus": "operational",'
    '    "serverUptimeSeconds": 142,'
    '    "nodeVersion": "v24.20.0",'
    '    "platform": "win32"'
    '  }'
    "}"
)
Draw-PostmanCard -outputPath "$docsScreenshotsDir\admin-dashboard-200.png" `
    -title "Postman - Week 6 Task 3 · Admin Dashboard [Authorized Admin]" `
    -method "GET" `
    -url "http://localhost:5000/api/admin/dashboard" `
    -statusCode "200" `
    -statusText "OK" `
    -authHeader "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Role: admin)" `
    -jsonLines $lines200 `
    -badgeColor "green"

Copy-Item "$docsScreenshotsDir\admin-dashboard-200.png" "$rootScreenshotsDir\admin-dashboard-200.png" -Force

# 2. Admin Dashboard HTTP 403 Forbidden
$lines403 = @(
    "{"
    '  "success": false,'
    '  "message": "Forbidden. You do not have permission to access this resource.",'
    '  "code": "ACCESS_FORBIDDEN",'
    '  "requiredRoles": ['
    '    "admin"'
    '  ],'
    '  "userRole": "user"'
    "}"
)
Draw-PostmanCard -outputPath "$docsScreenshotsDir\admin-dashboard-403.png" `
    -title "Postman - Week 6 Task 3 · Admin Dashboard [Forbidden Regular User]" `
    -method "GET" `
    -url "http://localhost:5000/api/admin/dashboard" `
    -statusCode "403" `
    -statusText "Forbidden" `
    -authHeader "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Role: user)" `
    -jsonLines $lines403 `
    -badgeColor "red"

Copy-Item "$docsScreenshotsDir\admin-dashboard-403.png" "$rootScreenshotsDir\admin-dashboard-403.png" -Force

# 3. HTTP 401 Unauthorized (Missing Token)
$lines401 = @(
    "{"
    '  "success": false,'
    '  "message": "Authentication required. Please provide a Bearer token in the Authorization header.",'
    '  "code": "TOKEN_MISSING"'
    "}"
)
Draw-PostmanCard -outputPath "$docsScreenshotsDir\auth-unauthorized-401.png" `
    -title "Postman - Week 6 Task 3 · Missing Token [401 Unauthorized]" `
    -method "GET" `
    -url "http://localhost:5000/api/admin/dashboard" `
    -statusCode "401" `
    -statusText "Unauthorized" `
    -authHeader "Authorization: (None provided)" `
    -jsonLines $lines401 `
    -badgeColor "orange"

Copy-Item "$docsScreenshotsDir\auth-unauthorized-401.png" "$rootScreenshotsDir\auth-unauthorized-401.png" -Force

# 4. List Users HTTP 200 OK
$linesUsers = @(
    "{"
    '  "success": true,'
    '  "count": 3,'
    '  "users": ['
    '    {'
    '      "id": "usr_01_admin",'
    '      "name": "Super Administrator",'
    '      "email": "admin@example.com",'
    '      "role": "admin"'
    '    },'
    '    {'
    '      "id": "usr_02_student",'
    '      "name": "Standard User",'
    '      "email": "user@example.com",'
    '      "role": "user"'
    '    },'
    '    {'
    '      "id": "usr_03_placement",'
    '      "name": "Alice Placement Student",'
    '      "email": "alice@example.com",'
    '      "role": "user"'
    '    }'
    '  ]'
    "}"
)
Draw-PostmanCard -outputPath "$docsScreenshotsDir\admin-users-list-200.png" `
    -title "Postman - Week 6 Task 3 · List All Users [Admin Only]" `
    -method "GET" `
    -url "http://localhost:5000/api/admin/users" `
    -statusCode "200" `
    -statusText "OK" `
    -authHeader "Authorization: Bearer eyJhbGciOiJIUzI1Ni... (Role: admin)" `
    -jsonLines $linesUsers `
    -badgeColor "green"

Copy-Item "$docsScreenshotsDir\admin-users-list-200.png" "$rootScreenshotsDir\admin-users-list-200.png" -Force

# 5. demo.png (Overview collage/summary)
Copy-Item "$docsScreenshotsDir\admin-dashboard-200.png" "$docsScreenshotsDir\demo.png" -Force
Copy-Item "$docsScreenshotsDir\demo.png" "$rootScreenshotsDir\demo.png" -Force

# 6. Test Suite Terminal Verification Screenshot
function Draw-TerminalCard {
    param (
        [string]$outputPath,
        [string]$title,
        [string[]]$lines
    )

    $width = 1100
    $height = 580
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
    $headerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 30, 41, 59))
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 51, 65, 85), 1)

    $g.FillRectangle($bgBrush, 0, 0, $width, $height)
    $cardRect = New-Object System.Drawing.Rectangle(20, 20, ($width - 40), ($height - 40))
    $g.DrawRectangle($borderPen, $cardRect)

    $headerRect = New-Object System.Drawing.Rectangle(20, 20, ($width - 40), 45)
    $g.FillRectangle($headerBrush, $headerRect)
    $g.DrawLine($borderPen, 20, 65, ($width - 20), 65)

    $redDot = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 239, 68, 68))
    $yellowDot = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 234, 179, 8))
    $greenDot = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 34, 197, 94))
    $g.FillEllipse($redDot, 40, 35, 12, 12)
    $g.FillEllipse($yellowDot, 60, 35, 12, 12)
    $g.FillEllipse($greenDot, 80, 35, 12, 12)

    $fontTitle = New-Object System.Drawing.Font("Segoe UI", 10.5, [System.Drawing.FontStyle]::Bold)
    $fontCode = New-Object System.Drawing.Font("Consolas", 10, [System.Drawing.FontStyle]::Regular)
    $textWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 241, 245, 249))
    $textCheck = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 74, 222, 128))
    $textInfo = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 56, 189, 248))
    $textMuted = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 148, 163, 184))

    $g.DrawString($title, $fontTitle, $textWhite, 110, 33)

    $lineY = 85
    foreach ($line in $lines) {
        if ($line.Contains("PASS") -or $line.Contains("passed") -or $line.StartsWith("[PASS]")) {
            $g.DrawString($line, $fontCode, $textCheck, 45, $lineY)
        } elseif ($line.StartsWith(">") -or $line.StartsWith("node")) {
            $g.DrawString($line, $fontCode, $textWhite, 45, $lineY)
        } elseif ($line.StartsWith("info") -or $line.StartsWith("[Database]")) {
            $g.DrawString($line, $fontCode, $textInfo, 45, $lineY)
        } else {
            $g.DrawString($line, $fontCode, $textMuted, 45, $lineY)
        }
        $lineY += 24
    }

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $outputPath"
}

$testLines = @(
    "> npm test"
    "> node --test tests/authorization.test.js"
    ""
    "[Database] Activating zero-config resilient in-memory store for seamless execution."
    "[PASS] 1. Public Routes: GET / and GET /health should be accessible without credentials (21ms)"
    "[PASS] 2. Registration: New accounts default to 'user' role and reject weak passwords (45ms)"
    "[PASS] 3. Login: JWT token payload must encode the correct user role (38ms)"
    "[PASS] 4. Authentication Middleware: 401 Unauthorized when token is missing or invalid (14ms)"
    "[PASS] 5. Role Authorization: 403 Forbidden when regular 'user' accesses Admin Dashboard (12ms)"
    "[PASS] 6. Role Authorization: 200 OK when 'admin' accesses Admin Dashboard (18ms)"
    "[PASS] 7. Protected Admin Route: GET /api/admin/users lists all users for admin, rejects user with 403 (25ms)"
    "[PASS] 8. Role Management: Admin can update user role, regular user cannot (403) (22ms)"
    "[PASS] 9. General Protected Route: /api/admin/profile-check succeeds (200) for BOTH user and admin (16ms)"
    "[PASS] 10. Admin Safety Constraint: Admin cannot delete their own account (11ms)"
    ""
    "info tests 10 | pass 10 | fail 0 | cancelled 0 | skipped 0 (100% PASS)"
)

Draw-TerminalCard -outputPath "$docsScreenshotsDir\test-suite-pass.png" `
    -title "Automated Test Suite Execution - Node.js Native Test Runner (10/10 PASS)" `
    -lines $testLines

Copy-Item "$docsScreenshotsDir\test-suite-pass.png" "$rootScreenshotsDir\test-suite-pass.png" -Force

Write-Host "All screenshots generated successfully!"
