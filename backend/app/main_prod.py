# backend/app/main_prod.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import your actual logic routers
from app.apis.leads import router as leads_router
from app.apis.roi import router as roi_router

app = FastAPI(title="ROI Calculator API")

# Allow the Frontend to talk to this Backend
# In production, change ["*"] to your actual Vercel frontend URL, e.g. ["https://my-roi-app.vercel.app"]
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
