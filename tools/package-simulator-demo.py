"""Bundle an already built Windows player, portable model and stdlib API."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
README = '''# CMP 교육용 Ridge + Unity 데모

Windows, Python 3.10 이상이 필요합니다. Unity Editor 및 sklearn 설치 없이 실행합니다.
압축을 해제한 폴더에서 PowerShell을 열어 다음을 실행하세요.

    powershell -ExecutionPolicy Bypass -File tools/start-simulator-demo.ps1 -PythonExecutable python

Python 경로를 지정할 수도 있습니다. 데모 창을 닫으면 이 실행 도구가 시작한 API도 종료됩니다.
기본 포트는 8765이며 -Port로 바꿀 수 있습니다.

모델은 실제 PHM 자료의 fold 1~4로 학습한 고정 Ridge입니다. 초기 화면 이력은
교육용 합성 예시이며, 측정 MRR을 추가하거나 외부 요청 JSON을 불러올 수 있습니다.
이 모델은 개발 자료 기반 교육용이고 독립 최종 시험은 없습니다. 압력 보정은 0,
물리 단위 미확정으로 권장 연마 시간은 비활성입니다. 실제 장비 제어 용도가 아닙니다.

소스·검증·재현:
https://github.com/ChungA1010/SolvingProblem/tree/feat/4-simulator-core-codex
docs/simulator-integration-checkpoints.md를 확인하세요.
'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "builds/CMP-Ridge-Unity-Demo-v1.zip")
    args = parser.parse_args()
    if args.output.exists():
        parser.error("output already exists; choose a different version name")
    build = ROOT / "builds/CmpSimulatorDemo"
    if not (build / "CmpSimulatorDemo.exe").is_file():
        parser.error("build the Windows Unity player first")
    report = json.loads((ROOT / "artifacts/education-ridge-v1/report.json").read_text(encoding="utf-8"))
    model = ROOT / "artifacts/education-ridge-v1/model.json"
    if hashlib.sha256(model.read_bytes()).hexdigest() != report["model_sha256"]:
        parser.error("artifact digest mismatch")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    files = [ROOT / "src/__init__.py", ROOT / "tools/start-simulator-api.ps1",
             ROOT / "tools/start-simulator-demo.ps1", ROOT / "examples/simulator_request.json",
             ROOT / "docs/simulator-integration-checkpoints.md"]
    files += sorted((ROOT / "src/simulator").glob("*.py"))
    files += sorted((ROOT / "artifacts/education-ridge-v1").glob("*.json"))
    files += sorted((ROOT / "artifacts/education-ridge-v1").glob("*summary.csv"))
    files += sorted(p for p in build.rglob("*") if p.is_file() and not any("DoNotShip" in part or "BurstDebug" in part for part in p.parts))
    with zipfile.ZipFile(args.output, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        archive.writestr("README.md", README)
        for path in files:
            archive.write(path, path.relative_to(ROOT).as_posix())
    print(json.dumps({"output": str(args.output.resolve()), "files": len(files)+1,
                      "bytes": args.output.stat().st_size, "sha256": hashlib.sha256(args.output.read_bytes()).hexdigest()}))


if __name__ == "__main__":
    main()
