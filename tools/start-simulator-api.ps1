param([string]$PythonExecutable = 'python', [int]$Port = 8765)
$ErrorActionPreference = 'Stop'
$taskRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskModel = Join-Path $taskRoot 'artifacts/education-ridge-v1/model.json'
$taskReport = Get-Content -LiteralPath (Join-Path $taskRoot 'artifacts/education-ridge-v1/report.json') -Raw | ConvertFrom-Json
Push-Location -LiteralPath $taskRoot
try {
    & $PythonExecutable -m src.simulator.server --artifact $taskModel --sha256 $taskReport.model_sha256 --port $Port
    if ($LASTEXITCODE -ne 0) { throw "API exited with code $LASTEXITCODE" }
} finally { Pop-Location }
