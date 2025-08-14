# file: app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

app = FastAPI(title="Mock Video API")

app.mount("/image", StaticFiles(directory="img"), name="img")
app.mount("/video", StaticFiles(directory="vid"), name="vid")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], 
)

class VideoQuery(BaseModel):
    query: Optional[str] = None
    limit: Optional[int] = 10

class VideoItem(BaseModel):
    video: str
    frame: str

@app.get("/video/{name}")
def get_video_link(name: str):
    return {"url": "https://media.istockphoto.com/id/2225181490/vi/video/m%E1%BB%99t-b%E1%BB%A9c-%E1%BA%A3nh-c%E1%BA%ADn-c%E1%BA%A3nh-tr%C3%AAn-cao-c%E1%BB%A7a-m%E1%BB%99t-ly-latte-%C4%91%C6%B0%E1%BB%A3c-ch%E1%BA%BF-t%C3%A1c-%C4%91%E1%BA%B9p-m%E1%BA%AFt-v%E1%BB%9Bi-ngh%E1%BB%87-thu%E1%BA%ADt-latte-h%C3%ACnh.mp4?s=mp4-640x640-is&k=20&c=qDEhAp4BK9n4X8iVc4pAjnXot0PWMVlUkMvhlNNJlXk="}#f"http://localhost:8000/static/videos/{name}"}

@app.get("/image/{name}")
def get_image_link(name: str):
    return {"url": "https://static.vecteezy.com/system/resources/thumbnails/057/068/323/small/single-fresh-red-strawberry-on-table-green-background-food-fruit-sweet-macro-juicy-plant-image-photo.jpg"}#f"http://localhost:8000/static/images/{name}"}

@app.post("/videos", response_model=List[VideoItem])
def list_videos(_: VideoQuery):
    return [
        {"video": "mock.mp4", "frame": "aimh_logo.png"},
        {"video": "mock.mp4", "frame": "aimh_logo.png"},
        {"video": "mock.mp4", "frame": "aimh_logo.png"},
        {"video": "mock4.mp4", "frame": "aimh_logo.png"},
        {"video": "mock4.mp4", "frame": "aimh_logo.png"},
        {"video": "mock4.mp4", "frame": "aimh_logo.png"},
        {"video": "mock3.mp4", "frame": "aimh_logo.png"},
        {"video": "mock4.mp4", "frame": "aimh_logo.png"},
        {"video": "mock.mp4", "frame": "aimh_logo.png"},
        {"video": "mock2.mp4", "frame": "aimh_logo.png"},
        {"video": "mock3.mp4", "frame": "aimh_logo.png"},
        {"video": "mock4.mp4", "frame": "aimh_logo.png"},
        {"video": "mock.mp4", "frame": "aimh_logo.png"},
        {"video": "mock2.mp4", "frame": "aimh_logo.png"},
        {"video": "mock3.mp4", "frame": "aimh_logo.png"},
    ]

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
