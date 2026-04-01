import threading
import sys
import time


class Loader:
    def __init__(self, message: str = "Thinking"):
        self.message = message
        self.frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
        self.running = False
        self.thread = None
    
    def _animate(self):
        frame_idx = 0
        while self.running:
            sys.stdout.write(f"\r{self.message}... {self.frames[frame_idx]}")
            sys.stdout.flush()
            frame_idx = (frame_idx + 1) % len(self.frames)
            time.sleep(0.1)
        sys.stdout.write("\r" + " " * (len(self.message) + 20) + "\r")
        sys.stdout.flush()
    
    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._animate, daemon=True)
        self.thread.start()
    
    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=0.5)


def with_loader(func):
    def wrapper(*args, **kwargs):
        loader = Loader()
        loader.start()
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            loader.stop()
    return wrapper


def input_with_loader(prompt: str = "You> "):
    return input(prompt)