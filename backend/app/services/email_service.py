import logging
import threading

from flask import Flask

from app import mail


def send_message_async(app: Flask, message) -> None:
    """
    Send a Flask-Mail `Message` in a background thread so requests don't block.

    This is meant for dev/low-volume usage. If you need guaranteed delivery,
    use a proper task queue (Celery/RQ) instead.
    """

    def _send() -> None:
        try:
            with app.app_context():
                mail.send(message)
        except Exception:
            logging.exception("Failed to send email asynchronously")

    thread = threading.Thread(target=_send, daemon=True, name="mail-send")
    thread.start()
