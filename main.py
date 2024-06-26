from pynput.mouse import Button, Controller
from pyautogui import size
import time
from flask import Flask, send_from_directory
from flask_socketio import SocketIO, send, emit

app = Flask(__name__)
socketio = SocketIO(app)
mouse = Controller()

@app.route("/<path:path>")
def handle_path(path):
    return send_from_directory("public", path)

@app.route("/")
def handle_root():
    return send_from_directory("public", "index.html")

@socketio.on("move")
def handle_move(moveValues):
    mouse.move(moveValues["x"], moveValues["y"])
    print("Move", moveValues)

@socketio.on("click")
def handle_click(clickValues):
    if clickValues["button"] == "left":
        mouse.click(button=Button.left)
    if clickValues["button"] == "right":
        mouse.click(button=Button.right)
    print("Click", clickValues)

@socketio.on("scroll")
def handle_scroll(scrollValues):
    mouse.scroll(0, scrollValues["y"] / 50)
    print("Scroll", scrollValues)

@socketio.on("statechange")
def handle_statechange(changedState):
    if changedState["state"] == "left":
        if changedState["value"] == True:
            mouse.press(Button.left)
        if changedState["value"] == False:
            mouse.release(Button.left)
    if changedState["state"] == "right":
        if changedState["value"] == True:
            mouse.press(Button.right)
        if changedState["value"] == False:
            mouse.release(Button.right)

@socketio.on("log")
def handle_log(text):
    print(text)

@socketio.on("connect")
def handle_connect():
    emit("init", list(size()))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)