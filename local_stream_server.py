# 本地视频流模拟服务（供前端 Monitor 页面测试用）
# 依赖: pip install websockets pillow
# 运行: python local_stream_server.py
# 前端连接: ws://localhost:8081/ws/video 或 ws://localhost:8081/ws/rtmp

import asyncio
import json
import base64
import io

try:
    from PIL import Image
    from websockets.server import serve
except ImportError:
    print("请先安装依赖: pip install websockets pillow")
    exit(1)

# 生成一帧 320x240 的彩色图（蓝绿色块 + 文字区域），保证浏览器能正常显示
def make_frame():
    img = Image.new("RGB", (320, 240), color=(30, 120, 180))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode("ascii")

# 启动时生成一帧，循环发送（避免每帧重新生成拖慢速度）
FRAME_B64 = make_frame()

async def send_frames(ws, path):
    print("客户端已连接:", path)
    try:
        while True:
            msg = {
                "image": FRAME_B64,
                "fps": 25,
                "speed": 12.3,
                "weather": "晴",
                "source": "本地" if "/video" in path else "RTMP",
            }
            await ws.send(json.dumps(msg))
            await asyncio.sleep(0.2)
    except Exception as e:
        print("断开:", e)

async def main():
    async with serve(send_frames, "localhost", 8081):
        print("本地流服务已启动: ws://localhost:8081")
        print("  - 本地视频: ws://localhost:8081/ws/video")
        print("  - RTMP流:  ws://localhost:8081/ws/rtmp")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
