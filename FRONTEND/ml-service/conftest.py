"""Make the ml-service root importable so `import app...` works under pytest
regardless of the invocation directory."""

import os
import sys

_ROOT = os.path.dirname(os.path.abspath(__file__))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)
