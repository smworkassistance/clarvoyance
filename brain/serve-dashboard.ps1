# Local-only server for brain/dashboard.html.
# Serves the page at http://127.0.0.1:8765/ and lets the owner save the four owner-written sections
# (Vision, Mission, Success, First user) into brain/project-brain.md. Nothing else is writable.
# Run it in a PowerShell window and leave it open: powershell -File brain\serve-dashboard.ps1
# Stop with Ctrl+C.

$ErrorActionPreference = 'Stop'
$brain = $PSScriptRoot
$projectBrain = Join-Path $brain 'project-brain.md'
$dashboard = Join-Path $brain 'dashboard.html'
$historyDir = Join-Path $brain 'history'
$port = 8765

# Only these markers can be written. Anything else is refused.
$allowed = @{
    'VISION'    = 'OWNER:VISION'
    'MISSION'   = 'OWNER:MISSION'
    'SUCCESS'   = 'OWNER:SUCCESS'
    'FIRSTUSER' = 'OWNER:FIRSTUSER'
}
$maxChars = 4000

function Save-OwnerSection($section, $text) {
    $marker = $allowed[$section]
    $content = Get-Content -Raw -Encoding UTF8 $projectBrain
    $pattern = "(?s)(<!-- $marker`:START -->\r?\n)(.*?)(\r?\n<!-- $marker`:END -->)"
    if (-not [regex]::IsMatch($content, $pattern)) { throw "Markers for $section not found in project-brain.md" }

    # Keep a backup before every change, so nothing the owner wrote is lost.
    New-Item -ItemType Directory -Force -Path $historyDir | Out-Null
    $stamp = Get-Date -Format 'yyyy-MM-dd_HHmmss'
    Copy-Item $projectBrain (Join-Path $historyDir "project-brain_$stamp.md")

    $body = $text.Trim()
    $new = [regex]::Replace($content, $pattern, { param($m) $m.Groups[1].Value + $body + $m.Groups[3].Value })
    Set-Content -Path $projectBrain -Value $new -Encoding UTF8

    Add-Content -Encoding UTF8 $projectBrain ("- $(Get-Date -Format 'yyyy-MM-dd'): owner edited $section through the dashboard (backup in brain/history/).")
    return "Saved $section."
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Start()
"Dashboard server running at http://127.0.0.1:$port/  (Ctrl+C to stop)"

try {
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $res = $ctx.Response
        try {
            if ($req.HttpMethod -eq 'GET' -and ($req.Url.AbsolutePath -eq '/' -or $req.Url.AbsolutePath -eq '/dashboard.html')) {
                $bytes = [System.IO.File]::ReadAllBytes($dashboard)
                $res.StatusCode = 200
                $res.ContentType = 'text/html; charset=utf-8'
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            elseif ($req.HttpMethod -eq 'POST' -and $req.Url.AbsolutePath -eq '/save-owner') {
                $reader = New-Object System.IO.StreamReader($req.InputStream, $req.ContentEncoding)
                $payload = $reader.ReadToEnd() | ConvertFrom-Json
                $section = [string]$payload.section
                $text = [string]$payload.text
                if (-not $allowed.ContainsKey($section)) { throw "Section not allowed." }
                if ($text.Length -gt $maxChars) { throw "Text is longer than $maxChars characters." }
                $msg = Save-OwnerSection $section $text
                $bytes = [System.Text.Encoding]::UTF8.GetBytes((@{ ok = $true; message = $msg } | ConvertTo-Json -Compress))
                $res.StatusCode = 200
                $res.ContentType = 'application/json; charset=utf-8'
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            else {
                $res.StatusCode = 404
            }
        } catch {
            $bytes = [System.Text.Encoding]::UTF8.GetBytes((@{ ok = $false; message = $_.Exception.Message } | ConvertTo-Json -Compress))
            $res.StatusCode = 400
            $res.ContentType = 'application/json; charset=utf-8'
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } finally {
            $res.Close()
        }
    }
} finally {
    $listener.Stop()
}
