from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import your actual logic routers
from app.apis.leads import router as leads_router
from app.apis.roi import router as roi_router

# Initialize FastAPI with root_path="/api"
# This tells FastAPI that it is sitting behind a proxy (Vercel)
# that is stripping the "/api" prefix, or that the prefix exists
# so docs and redirects generate correctly.
app = FastAPI(
    title="ROI Calculator API",
    root_path="/api"
)

# Allow the Frontend to talk to this Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect the endpoints
app.include_router(leads_router)
app.include_router(roi_router)

@app.get("/")
def health_check():
    return {"status": "ok", "service": "roi-calculator"}
