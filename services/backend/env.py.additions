# --- services/backend/migrations/env.py : the only 3 edits you make to the generated file ---

# (1) Under "from alembic import context", add:
import app.models  # noqa: F401  (importing the module registers every table on Base.metadata)
from app.config import get_settings
from app.db import Base

# (2) Directly under "config = context.config", add:
# Use the same DATABASE_URL as the app; '%' must be doubled because alembic.ini is parsed by configparser.
config.set_main_option("sqlalchemy.url", get_settings().database_url.replace("%", "%%"))

# (3) Replace "target_metadata = None" with:
target_metadata = Base.metadata