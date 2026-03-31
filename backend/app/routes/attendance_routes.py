from datetime import datetime

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.attendance_model import Attendance
from app.models.user_model import User
from app.services.notification_service import ensure_notification_once

attendance_bp = Blueprint("attendance", __name__)

def _check_late_wallet_alert(employee_id: str) -> None:
    now = datetime.now()
    monthly_limit = 45

    monthly_records = (
        Attendance.query
        .filter_by(employee_id=employee_id)
        .filter(Attendance.date >= datetime(now.year, now.month, 1).date())
        .all()
    )
    used_minutes = sum((record.late_minutes or 0) for record in monthly_records)
    remaining = monthly_limit - used_minutes

    user = User.query.filter_by(employee_id=employee_id).first()
    if not user:
        return

    # Respect preference: attendance alerts toggle.
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

    if remaining <= 10:
        ensure_notification_once(
            employee_id=employee_id,
            event_key=f"late_wallet_low:{month_key}",
            message=(
                f"Late wallet alert for {month_key}: only {remaining} minute(s) remaining."
            ),
            send_email=True,
            email_subject="Late Wallet Alert",
        )


@attendance_bp.route("/", methods=["GET"])
@jwt_required()
def get_attendance():
    employee_id = get_jwt_identity()

    try:
        _check_late_wallet_alert(employee_id)
    except Exception:
        # Never fail attendance fetch due to notification logic.
        pass

    records = (
        Attendance.query
        .filter_by(employee_id=employee_id)
        .order_by(Attendance.date.desc())
        .all()
    )

    result = []
    for r in records:
        result.append({
            "date": r.date.strftime("%Y-%m-%d"),
            "check_in": str(r.check_in) if r.check_in else None,
            "late_minutes": r.late_minutes or 0,
            "status": r.status or "Present",
        })

    return jsonify(result), 200
