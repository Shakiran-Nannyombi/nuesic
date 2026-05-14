import sys
import os

# Add backend/ to path so "from app.routers import ..." resolves correctly
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend')
sys.path.insert(0, backend_dir)

from main import app  # noqa: E402 — must come after sys.path setup
