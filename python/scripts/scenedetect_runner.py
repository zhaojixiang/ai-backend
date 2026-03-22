import sys
import json
import os

import cv2
from scenedetect import VideoManager, SceneManager
from scenedetect.detectors import ContentDetector


def video_duration_seconds(path: str) -> float:
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        return 0.0
    try:
        fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
        frames = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0.0
        if fps > 0 and frames > 0:
            return float(frames / fps)
    finally:
        cap.release()
    return 0.0


video_path = sys.argv[1]
output_dir = sys.argv[2]

os.makedirs(output_dir, exist_ok=True)

video_manager = VideoManager([video_path])
scene_manager = SceneManager()
scene_manager.add_detector(ContentDetector())

video_manager.start()
scene_manager.detect_scenes(frame_source=video_manager)

scene_list = scene_manager.get_scene_list()

result = []

for i, scene in enumerate(scene_list):
    start = scene[0].get_seconds()
    end = scene[1].get_seconds()

    result.append({
        "index": i,
        "start": start,
        "end": end
    })

# 无切镜时 PySceneDetect 返回空列表；整段视频应算作 1 个分镜
if not result:
    duration = video_duration_seconds(video_path)
    result.append({"index": 0, "start": 0.0, "end": duration})

print(json.dumps(result))

base_dir = os.path.dirname(video_path)
json_path = os.path.join(base_dir, "scenes.json")

with open(json_path, "w") as f:
    json.dump(result, f)