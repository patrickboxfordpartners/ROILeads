import os
import sys

# Add the 'backend' folder to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))

# Now we can import your existing app instance
from app.main_prod import app
