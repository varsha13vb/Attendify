import logging
import os
from datetime import datetime
from typing import Optional

from flask import current_app
from flask_mail import Message

from app import db
from app.models.notification_model import Notification
from app.models.user_model import User
from app.services.email_service import send_message_async


def _mail_sender() -> Optional[str]:
    return (
        current_app.config.get("MAIL_DEFAULT_SENDER")
        or current_app.config.get("MAIL_USERNAME")
        or os.getenv("MAIL_USERNAME")
    )


def _mail_configured() -> bool:
    return bool(current_app.config.get("MAIL_SERVER") and _mail_sender())


def preference_enabled(user: Optional[User], field_name: str, *, default: bool) -> bool:
    if not user:
        return default

    value = getattr(user, field_name, None)
    if value is None:
        return default

    return bool(value)


def create_notification(
    *,
    employee_id: Optional[str],
    message: str,
    event_key: Optional[str] = None,
) -> Notification:
    notification = Notification(employee_id=employee_id, message=message, event_key=event_key)
    db.session.add(notification)
    return notification


def ensure_notification_once(
    *,
    employee_id: str,
    event_key: str,
    message: str,
    send_email: bool = False,
    email_subject: Optional[str] = None,
) -> bool:
    """
    Idempotently create a notification for a user (deduped by `event_key`).

    Returns True if a new notification was created.
    """

    existing = Notification.query.filter_by(employee_id=employee_id, event_key=event_key).first()
    if existing:
        return False

    create_notification(employee_id=employee_id, message=message, event_key=event_key)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        logging.exception("Failed creating notification %s for %s", event_key, employee_id)
        return False

    if send_email:
        try:
            _send_notification_email(employee_id, subject=email_subject or "Attendify Notification", body=message)
        except Exception:
            logging.exception("Failed sending notification email for %s", employee_id)

    return True


def _send_notification_email(employee_id: str, *, subject: str, body: str) -> None:
    user = User.query.filter_by(employee_id=employee_id).first()
    if not user or not user.email:
        return

    if not preference_enabled(user, "email_notifications", default=True):
        return

    if not _mail_configured():
        return

    sender = _mail_sender()
    if not sender:
        return

    msg = Message(subject=subject, sender=sender, recipients=[user.email])
    msg.body = body

    # Keep HTML minimal (avoid template dependencies).
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    msg.html = f"""
    <div style="font-family:Segoe UI,Arial,sans-serif">
      <h3 style="margin:0 0 10px 0;color:#7D3C98">Attendify</h3>
      <p style="margin:0 0 8px 0"><b>{subject}</b></p>
      <p style="margin:0 0 12px 0">{body}</p>
      <p style="margin:0;color:#6b7280;font-size:12px">Sent: {now}</p>
    </div>
    """

    send_message_async(current_app._get_current_object(), msg)
