import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# API Keys and Models
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/free")

# Local Storage Directory
# Default to Projects/ folder next to backend/ inside ThreatForge workspace
DEFAULT_PROJECTS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "Projects")
)
PROJECTS_ROOT_DIR = os.getenv("PROJECTS_ROOT_DIR", DEFAULT_PROJECTS_DIR)

# Ensure the root projects folder exists
os.makedirs(PROJECTS_ROOT_DIR, exist_ok=True)
