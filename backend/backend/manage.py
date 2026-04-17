#!/usr/bin/env python
"""Wrapper to run Django management commands when the working dir is backend/backend."""
import runpy
import os
from pathlib import Path


def main():
    project_backend_dir = Path(__file__).resolve().parents[1]
    target_manage = project_backend_dir / 'manage.py'
    os.chdir(project_backend_dir)
    runpy.run_path(str(target_manage), run_name='__main__')


if __name__ == '__main__':
    main()
