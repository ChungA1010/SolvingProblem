param([switch]$Setup, [switch]$ApiOnly, [int]$Port = 8765)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$python = Join-Path $projectRoot '.venv/Scripts/python.exe'
Set-Location -LiteralPath $projectRoot
if ($Setup) {
    if (-not (Test-Path -LiteralPath $python)) {
        & py -3.12 -m venv .venv
        if ($LASTEXITCODE -ne 0) { throw 'Python 3.12 is required.' }
    }
    & $python -m pip install torch==2.11.0 --index-url https://download.pytorch.org/whl/cpu
    if ($LASTEXITCODE -ne 0) { throw 'PyTorch installation failed.' }
    & $python -m pip install -r requirements-service.lock.txt
    if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
    & $python -m pip install -e . --no-deps
    if ($LASTEXITCODE -ne 0) { throw 'Project installation failed.' }
}
if (-not (Test-Path -LiteralPath $python)) { throw 'Run tools/start-demo.ps1 -Setup first.' }
$url = "http://127.0.0.1:$Port/api/v1/health"
$health = $null
try { $health = Invoke-RestMethod -Uri $url -TimeoutSec 2 } catch { }
if (-not ($health -and $health.api_version -eq '1.0' -and $health.data.ready)) {
    $logDir = Join-Path $projectRoot 'data/app'
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    $apiProcess = Start-Process -FilePath $python -ArgumentList @('-m','cmp_ml.api','--port',"$Port") -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDir 'server-output.log') -RedirectStandardError (Join-Path $logDir 'server-error.log') -PassThru
    $apiProcess.Id | Set-Content -LiteralPath (Join-Path $logDir 'server.pid')
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        Start-Sleep -Milliseconds 250
        try { $health = Invoke-RestMethod -Uri $url -TimeoutSec 1; if ($health.data.ready) { break } } catch { }
        if ($apiProcess.HasExited) { throw "API exited. Inspect $logDir/server-error.log" }
    }
}
if (-not ($health -and $health.data.ready -and $health.data.wafer_classification)) { throw 'API did not become ready with all models.' }
Write-Host "API ready: http://127.0.0.1:$Port/docs"
if (-not $ApiOnly) {
    $demoPath = Join-Path $projectRoot 'builds/CmpDemo/CmpDemo.exe'
    if (-not (Test-Path -LiteralPath $demoPath)) { throw 'Download the Windows demo release and extract it to builds/CmpDemo, or build unity/CmpDemo with Unity 6000.3.21f1.' }
    # The foreground process is the interactive demo the user is launching.
    Start-Process -FilePath $demoPath -WorkingDirectory $projectRoot -ArgumentList @('-force-d3d11','-cmp-port',"$Port") | Out-Null
}
