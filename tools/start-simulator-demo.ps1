param([string]$PythonExecutable = 'python', [int]$Port = 8765)
$ErrorActionPreference = 'Stop'
$taskRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskExe = Join-Path $taskRoot 'builds/CmpSimulatorDemo/CmpSimulatorDemo.exe'
$taskReport = Get-Content -LiteralPath (Join-Path $taskRoot 'artifacts/education-ridge-v1/report.json') -Raw | ConvertFrom-Json
if (-not (Test-Path -LiteralPath $taskExe)) { throw 'Unity Editor에서 CmpSimulatorBuild.Build를 실행해 데모를 먼저 빌드하세요.' }
$taskHealth = $null
try { $taskHealth = Invoke-RestMethod "http://127.0.0.1:$Port/api/v1/health" -TimeoutSec 2 } catch {}
$taskServer = $null
if ($null -eq $taskHealth) {
    $taskResolvedPython = (Get-Command $PythonExecutable -ErrorAction Stop).Source
    $taskServer = Start-Process -FilePath $taskResolvedPython -ArgumentList @('-m','src.simulator.server','--artifact','artifacts/education-ridge-v1/model.json','--sha256',$taskReport.model_sha256,'--port',"$Port") -WorkingDirectory $taskRoot -WindowStyle Hidden -PassThru
    for ($taskIndex=0; $taskIndex -lt 30; $taskIndex++) {
        try { $taskHealth=Invoke-RestMethod "http://127.0.0.1:$Port/api/v1/health" -TimeoutSec 1; break } catch {}
        if ($taskServer.HasExited) { throw 'API를 시작하지 못했습니다. start-simulator-api.ps1로 오류를 확인하세요.' }
        Start-Sleep -Milliseconds 200
    }
}
try {
    if ($null -eq $taskHealth -or -not $taskHealth.ready -or $taskHealth.artifact_sha256 -ne $taskReport.model_sha256) {
        throw '해당 포트의 API가 이 데모의 모델 SHA256과 일치하지 않습니다.'
    }
    # This launcher is for the user's interactive demo window.
    $taskPlayer = Start-Process -FilePath $taskExe -ArgumentList @('-cmp-port',"$Port") -WorkingDirectory $taskRoot -PassThru
    $taskPlayer.WaitForExit()
} finally {
    # Shut down only the API process created by this invocation.
    if ($null -ne $taskServer -and -not $taskServer.HasExited) { $taskServer.Kill(); $taskServer.WaitForExit() }
}
