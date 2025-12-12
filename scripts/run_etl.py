"""
Central ETL runner for PX2.

This script orchestrates the different data-building steps (IBGE catalogs,
aliases, BCB catalogs, etc.) so you can schedule a single entrypoint from
Windows Task Scheduler.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Callable, List, Tuple


PROJECT_ROOT = Path(__file__).resolve().parent.parent
LOGS_DIR = PROJECT_ROOT / "logs"


def setup_logging() -> None:
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    log_file = LOGS_DIR / "etl_run.log"

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s",
        handlers=[
            logging.FileHandler(log_file, encoding="utf-8"),
            logging.StreamHandler(),
        ],
    )


def _step(name: str, fn: Callable[[], None]) -> None:
    logging.info("===== Starting ETL step: %s =====", name)
    try:
        fn()
        logging.info("===== Finished ETL step: %s (OK) =====", name)
    except Exception as exc:  # noqa: BLE001
        logging.exception("ETL step failed: %s - %s", name, exc)
        # Fail fast so the scheduler notices a non‑zero exit code
        raise


def build_steps() -> List[Tuple[str, Callable[[], None]]]:
    """
    Define the ETL pipeline steps.

    You can comment / uncomment steps here if needed.
    """
    # Local imports so that just importing this file does not pull everything.
    from backend.collectors.get_cnt_catalog import main as build_cnt_catalog
    from scripts.build_bcb_catalog_api import search_and_build_catalog as build_bcb_catalog
    from scripts.classify_ibge_series import process_catalog as classify_ibge_catalog
    from scripts.create_semantic_aliases import process_catalog as create_semantic_aliases
    from scripts.generate_aliases import process_catalog as generate_smart_aliases

    return [
        ("IBGE CNT catalog (SIDRA)", build_cnt_catalog),
        ("IBGE catalog classification", classify_ibge_catalog),
        ("IBGE semantic aliases", create_semantic_aliases),
        ("IBGE smart aliases (final catalog)", generate_smart_aliases),
        ("BCB catalog via seriesbr API", build_bcb_catalog),
        # If you want the heavy async BCB catalog discovery, also enable:
        # ("BCB async catalog scan", run_build_bcb_catalog_async),
    ]


def main() -> None:
    setup_logging()
    logging.info("==== PX2 ETL run started ====")

    steps = build_steps()
    for name, fn in steps:
        _step(name, fn)

    logging.info("==== PX2 ETL run completed successfully ====")


if __name__ == "__main__":
    main()


