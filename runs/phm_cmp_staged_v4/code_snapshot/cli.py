from __future__ import annotations

import argparse
import os
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="PHM CMP preparation, training, sealed evaluation, and reporting")
    sub = parser.add_subparsers(dest="command", required=True)
    prep = sub.add_parser("prepare")
    prep.add_argument("--data-root", type=Path, required=True)
    prep.add_argument("--run-dir", type=Path, required=True)
    fit = sub.add_parser("train")
    fit.add_argument("--run-dir", type=Path, required=True)
    fit.add_argument("--threads", type=int, default=4)
    for name in ["evaluate", "report", "verify"]:
        sub.add_parser(name).add_argument("--run-dir", type=Path, required=True)
    stability = sub.add_parser("stability", help="Stage B TRAIN-only nested group stability assessment")
    stability.add_argument("--source-run", type=Path, required=True)
    stability.add_argument("--output-dir", type=Path, required=True)
    stability.add_argument("--threads", type=int, default=4)
    args = parser.parse_args()
    if args.command == "prepare":
        from .data import prepare
        prepare(args.data_root, args.run_dir)
    elif args.command == "train":
        from .experiment import train
        train(args.run_dir, max(1, args.threads))
    elif args.command == "evaluate":
        from .experiment import evaluate
        evaluate(args.run_dir)
    elif args.command == "report":
        from .report import report
        report(args.run_dir)
    elif args.command == "stability":
        from .stability import run_stability
        run_stability(args.source_run, args.output_dir, max(1, args.threads))
    else:
        from .verify import verify
        verify(args.run_dir)


if __name__ == "__main__":
    main()
