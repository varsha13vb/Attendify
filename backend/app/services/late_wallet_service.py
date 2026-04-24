from datetime import datetime
from typing import Optional

from app.models.attendance_model import Attendance
from app.models.system_config_model import SystemConfig
from app.models.user_model import User
from app.services.notification_service import ensure_notification_once


LOW_WALLET_THRESHOLD_MINUTES = 10


def get_monthly_late_wallet_limit() -> int:
    cfg = SystemConfig.query.get(1)
    try:
        return int(cfg.monthly_late_wallet) if cfg else 45
    except Exception:
        return 45


def get_used_late_wallet_minutes(employee_id: str, *, when: Optional[datetime] = None) -> int:
    now = when or datetime.now()
    start_date = datetime(now.year, now.month, 1).date()
    if now.month == 12:
        end_date = datetime(now.year + 1, 1, 1).date()
    else:
        end_date = datetime(now.year, now.month + 1, 1).date()

    monthly_records = (
        Attendance.query
        .filter_by(employee_id=employee_id)
        .filter(Attendance.date >= start_date)
        .filter(Attendance.date < end_date)
        .all()
    )
    return sum((record.late_minutes or 0) for record in monthly_records)


def get_remaining_late_wallet_minutes(employee_id: str, *, when: Optional[datetime] = None) -> int:
    remaining = get_monthly_late_wallet_limit() - get_used_late_wallet_minutes(employee_id, when=when)
    return max(remaining, 0)


def check_and_send_late_wallet_alert(employee_id: str, *, when: Optional[datetime] = None) -> None:
    now = when or datetime.now()
    monthly_limit = get_monthly_late_wallet_limit()
    used_minutes = get_used_late_wallet_minutes(employee_id, when=now)
    remaining = max(monthly_limit - used_minutes, 0)

    user = User.query.filter_by(employee_id=employee_id).first()
    if not user:
        return

    try:
        if user.attendance_alerts is False:
            return
    except Exception:
        pass

    month_key = f"{now.year:04d}-{now.month:02d}"

    if remaining <= 0:
        ensure_notification_once(
            employee_id=employee_id,
            event_key=f"late_wallet_exceeded:{month_key}",
            message=(
                f"Late wallet exceeded for {month_key}. "
                "You have exhausted your monthly late minutes."
            ),
            send_email=True,
            email_subject="Late Wallet Exceeded",
        )
        return

    if 0 < remaining <= LOW_WALLET_THRESHOLD_MINUTES:
        ensure_notification_once(
            employee_id=employee_id,
            event_key=f"late_wallet_low:{month_key}",
            message=(
                f"Late wallet alert for {month_key}: only {remaining} minute(s) remaining "
                f"out of your configured monthly late wallet of {monthly_limit} minute(s)."
            ),
            send_email=True,
            email_subject="Late Wallet Alert",
        )
