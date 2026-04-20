from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models.attendance_model import Attendance
from app.models.user_model import User
from app.services.late_wallet_service import check_and_send_late_wallet_alert

attendance_bp = Blueprint("attendance", __name__)


def _get_current_user():
    identity = get_jwt_identity()
    if not identity:
        return None

    user = User.query.filter_by(employee_id=str(identity)).first()
    if user:
        return user

    try:
        return User.query.filter_by(id=int(identity)).first()
    except Exception:
        return None


def _require_admin() -> bool:
    user = _get_current_user()
    return bool(user and user.role == "admin")


@attendance_bp.route("/", methods=["GET"])
@attendance_bp.route("/records", methods=["GET"])
@jwt_required()
def get_attendance():
    user = _get_current_user()
    if not user:
        return jsonify({"message": "User not found"}), 404

    employee_id = user.employee_id

    try:
        check_and_send_late_wallet_alert(employee_id)
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


@attendance_bp.route("/all", methods=["GET"])
@jwt_required()
def get_all_attendance_for_date():
    if not _require_admin():
        return jsonify({"message": "Unauthorized"}), 403

    date_str = (request.args.get("date") or "").strip()
    if not date_str:
        date_value = datetime.today().date()
    else:
        try:
            date_value = datetime.strptime(date_str, "%Y-%m-%d").date()
        except Exception:
            return jsonify({"message": "Invalid date. Use YYYY-MM-DD"}), 400

    employees = User.query.filter_by(role="employee").order_by(User.employee_id.asc()).all()

    records = Attendance.query.filter(Attendance.date == date_value).all()
    record_map = {r.employee_id: r for r in records}

    result = []
    for emp in employees:
        record = record_map.get(emp.employee_id)
        result.append(
            {
                "name": emp.name,
                "employee_id": emp.employee_id,
                "date": date_value.strftime("%Y-%m-%d"),
                "check_in": str(record.check_in) if record and record.check_in else None,
                "check_out": None,
                "work_hours": None,
                "late_minutes": (record.late_minutes or 0) if record else 0,
                "status": (record.status or "Present") if record else "Absent",
            }
        )

    return jsonify(result), 200


@attendance_bp.route("/monthly-summary", methods=["GET"])
@jwt_required()
def get_monthly_attendance_summary():
    if not _require_admin():
        return jsonify({"message": "Unauthorized"}), 403

    month_str = (request.args.get("month") or "").strip()  # YYYY-MM
    now = datetime.now()
    if month_str:
        try:
            year = int(month_str.split("-")[0])
            month = int(month_str.split("-")[1])
            if month < 1 or month > 12:
                raise ValueError()
        except Exception:
            return jsonify({"message": "Invalid month. Use YYYY-MM"}), 400
    else:
        year = now.year
        month = now.month

    start_date = datetime(year, month, 1).date()
    if month == 12:
        end_date = datetime(year + 1, 1, 1).date()
    else:
        end_date = datetime(year, month + 1, 1).date()

    employees = User.query.filter_by(role="employee").order_by(User.employee_id.asc()).all()

    summary = {
        emp.employee_id: {
            "name": emp.name,
            "employee_id": emp.employee_id,
            "total": 0,
            "present": 0,
            "late": 0,
            "absent": 0,
            "half": 0,
            "late_minutes": 0,
        }
        for emp in employees
    }

    rows = (
        Attendance.query
        .filter(Attendance.date >= start_date)
        .filter(Attendance.date < end_date)
        .all()
    )

    for r in rows:
        emp = summary.get(r.employee_id)
        if not emp:
            continue

        emp["total"] += 1
        emp["late_minutes"] += int(r.late_minutes or 0)

        if r.status == "Present":
            emp["present"] += 1
        elif r.status == "Late":
            emp["late"] += 1
        elif r.status == "Absent":
            emp["absent"] += 1
        elif r.status == "Half Day":
            emp["half"] += 1

    return jsonify(list(summary.values())), 200
