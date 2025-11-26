import os
import sys

# Add the 'backend' folder to the Python path
# This allows 'from app.libs...' to work
sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))

# Now import the app
from app.main_prod import app
