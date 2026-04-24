from datetime import date, datetime, time, timedelta
from typing import Optional

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db
from app.models.attendance_model import Attendance
from app.models.leave_model import Leave
from app.models.system_config_model import SystemConfig
from app.models.user_model import User
from app.services.late_wallet_service import (
    check_and_send_late_wallet_alert,
    get_monthly_late_wallet_limit,
    get_remaining_late_wallet_minutes,
    get_used_late_wallet_minutes,
)

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


def _get_config() -> dict:
    cfg = SystemConfig.query.get(1)
    return {
        "check_in": getattr(cfg, "check_in", "09:00") or "09:00",
        "check_out": getattr(cfg, "check_out", "18:00") or "18:00",
        "late_tolerance": int(getattr(cfg, "late_tolerance", 15) or 0),
        "monthly_late_wallet": int(getattr(cfg, "monthly_late_wallet", 45) or 0),
        "min_work_hours": float(getattr(cfg, "min_work_hours", 8) or 0),
    }


def _parse_hhmm(value: str) -> time:
    try:
        return datetime.strptime(value, "%H:%M").time()
    except Exception:
        return datetime.strptime("09:00", "%H:%M").time()


def _combine(day_value: date, time_value: Optional[time]) -> Optional[datetime]:
    if not time_value:
        return None
    return datetime.combine(day_value, time_value)


def _get_month_bounds(year: int, month: int) -> tuple[date, date]:
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)
    return start_date, end_date


def _get_daily_record(employee_id: str, day_value: date) -> Optional[Attendance]:
    return (
        Attendance.query.filter_by(employee_id=employee_id, date=day_value)
        .order_by(Attendance.id.desc())
        .first()
    )


def _format_time(value: Optional[time]) -> Optional[str]:
    return value.strftime("%H:%M:%S") if value else None


def _calculate_work_hours(record: Optional[Attendance]) -> Optional[float]:
    if not record or not record.check_in or not record.checkout:
        return None

    start_dt = _combine(record.date, record.check_in)
    end_dt = _combine(record.date, record.checkout)
    if not start_dt or not end_dt or end_dt < start_dt:
        return None

    return round((end_dt - start_dt).total_seconds() / 3600, 2)


def _resolve_status(record: Optional[Attendance]) -> str:
    if not record:
        return "Absent"
    if record.status:
        return record.status
    return "Late" if (record.late_minutes or 0) > 0 else "Present"


def _wallet_payload(employee_id: str, when: datetime) -> dict:
    monthly_limit = get_monthly_late_wallet_limit()
    used_minutes = get_used_late_wallet_minutes(employee_id, when=when)
    remaining_minutes = max(monthly_limit - used_minutes, 0)
    return {
        "monthly_limit": monthly_limit,
        "used_minutes": used_minutes,
        "remaining_minutes": remaining_minutes,
    }


def _serialize_record(record: Optional[Attendance]) -> Optional[dict]:
    if not record:
        return None

    return {
        "id": record.id,
        "date": record.date.strftime("%Y-%m-%d"),
        "check_in": _format_time(record.check_in),
        "check_out": _format_time(record.checkout),
        "late_minutes": int(record.late_minutes or 0),
        "status": _resolve_status(record),
        "work_hours": _calculate_work_hours(record),
    }


def _get_late_minutes(now: datetime, schedule: dict) -> int:
    scheduled_check_in = datetime.combine(now.date(), _parse_hhmm(schedule["check_in"]))
    tolerated_until = scheduled_check_in + timedelta(minutes=int(schedule["late_tolerance"] or 0))
    if now <= tolerated_until:
        return 0
    return max(int((now - tolerated_until).total_seconds() // 60), 0)


def _get_week_dates(end_day: date, count: int = 7) -> list[date]:
    return [end_day - timedelta(days=offset) for offset in range(count - 1, -1, -1)]


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
        pass

    records = (
        Attendance.query.filter_by(employee_id=employee_id)
        .order_by(Attendance.date.desc(), Attendance.id.desc())
        .all()
    )

    return jsonify([_serialize_record(record) for record in records]), 200


@attendance_bp.route("/today-status", methods=["GET"])
@jwt_required()
def get_today_status():
    user = _get_current_user()
    if not user:
        return jsonify({"message": "User not found"}), 404

    now = datetime.now()
    today = now.date()
    schedule = _get_config()
    record = _get_daily_record(user.employee_id, today)

    return (
        jsonify(
            {
                "employee": {
                    "employee_id": user.employee_id,
                    "name": user.name,
                },
                "date": today.strftime("%Y-%m-%d"),
                "server_time": now.isoformat(),
                "schedule": schedule,
                "wallet": _wallet_payload(user.employee_id, now),
                "record": _serialize_record(record),
                "can_clock_in": not bool(record and record.check_in),
                "can_clock_out": bool(record and record.check_in and not record.checkout),
            }
        ),
        200,
    )


@attendance_bp.route("/clock-in", methods=["POST"])
@jwt_required()
def clock_in():
    user = _get_current_user()
    if not user:
        return jsonify({"message": "User not found"}), 404

    now = datetime.now()
    today = now.date()
    schedule = _get_config()
    record = _get_daily_record(user.employee_id, today)

    if record and record.check_in:
        return jsonify({"message": "You have already clocked in for today"}), 400

    late_minutes = _get_late_minutes(now, schedule)
    remaining_before = get_remaining_late_wallet_minutes(user.employee_id, when=now)

    if late_minutes <= 0:
        status = "Present"
    elif late_minutes <= remaining_before:
        status = "Late"
    else:
        status = "Half Day"

    if not record:
        record = Attendance(employee_id=user.employee_id, date=today)
        db.session.add(record)

    record.check_in = now.time().replace(microsecond=0)
    record.late_minutes = late_minutes
    record.status = status

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Failed to clock in"}), 500

    try:
        check_and_send_late_wallet_alert(user.employee_id, when=now)
    except Exception:
        pass

    return (
        jsonify(
            {
                "message": "Clock-in recorded successfully",
                "record": _serialize_record(record),
                "wallet": _wallet_payload(user.employee_id, now),
            }
        ),
        200,
    )


@attendance_bp.route("/clock-out", methods=["POST"])
@jwt_required()
def clock_out():
    user = _get_current_user()
    if not user:
        return jsonify({"message": "User not found"}), 404

    now = datetime.now()
    today = now.date()
    record = _get_daily_record(user.employee_id, today)
    if not record or not record.check_in:
        return jsonify({"message": "Please clock in before clocking out"}), 400

    if record.checkout:
        return jsonify({"message": "You have already clocked out for today"}), 400

    record.checkout = now.time().replace(microsecond=0)

    work_hours = _calculate_work_hours(record) or 0
    min_work_hours = float(_get_config()["min_work_hours"] or 0)
    if work_hours < min_work_hours:
        record.status = "Half Day"
    elif (record.late_minutes or 0) > 0 and record.status != "Half Day":
        record.status = "Late"
    elif record.status != "Half Day":
        record.status = "Present"

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Failed to clock out"}), 500

    return (
        jsonify(
            {
                "message": "Clock-out recorded successfully",
                "record": _serialize_record(record),
                "wallet": _wallet_payload(user.employee_id, now),
            }
        ),
        200,
    )


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

    employee_filter = (request.args.get("employee_id") or "").strip()
    employee_query = User.query.filter_by(role="employee")
    if employee_filter and employee_filter.lower() != "all":
        employee_query = employee_query.filter(User.employee_id == employee_filter)
    employees = employee_query.order_by(User.employee_id.asc()).all()

    records = Attendance.query.filter(Attendance.date == date_value).all()
    record_map: dict[str, Attendance] = {}
    for record in records:
        if record.employee_id not in record_map:
            record_map[record.employee_id] = record

    result = []
    reference_dt = datetime.combine(date_value, time(12, 0))
    for emp in employees:
        record = record_map.get(emp.employee_id)
        status = _resolve_status(record) if record else "Absent"
        result.append(
            {
                "name": emp.name,
                "employee_id": emp.employee_id,
                "date": date_value.strftime("%Y-%m-%d"),
                "check_in": _format_time(record.check_in) if record else None,
                "check_out": _format_time(record.checkout) if record else None,
                "work_hours": _calculate_work_hours(record),
                "late_minutes": int(record.late_minutes or 0) if record else 0,
                "wallet_remaining": get_remaining_late_wallet_minutes(emp.employee_id, when=reference_dt),
                "status": status,
            }
        )

    return jsonify(result), 200


@attendance_bp.route("/monthly-summary", methods=["GET"])
@jwt_required()
def get_monthly_attendance_summary():
    if not _require_admin():
        return jsonify({"message": "Unauthorized"}), 403

    month_str = (request.args.get("month") or "").strip()
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

    start_date, end_date = _get_month_bounds(year, month)
    employees = User.query.filter_by(role="employee").order_by(User.employee_id.asc()).all()
    monthly_limit = get_monthly_late_wallet_limit()

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
            "wallet_left": monthly_limit,
            "work_hours": 0,
        }
        for emp in employees
    }

    rows = (
        Attendance.query.filter(Attendance.date >= start_date)
        .filter(Attendance.date < end_date)
        .order_by(Attendance.date.asc(), Attendance.id.asc())
        .all()
    )

    for record in rows:
        employee_summary = summary.get(record.employee_id)
        if not employee_summary:
            continue

        employee_summary["total"] += 1
        employee_summary["late_minutes"] += int(record.late_minutes or 0)
        employee_summary["work_hours"] += _calculate_work_hours(record) or 0

        status = _resolve_status(record)
        if status == "Present":
            employee_summary["present"] += 1
        elif status == "Late":
            employee_summary["late"] += 1
        elif status == "Absent":
            employee_summary["absent"] += 1
        elif status == "Half Day":
            employee_summary["half"] += 1

    result = []
    for employee_summary in summary.values():
        employee_summary["wallet_left"] = max(monthly_limit - employee_summary["late_minutes"], 0)
        employee_summary["work_hours"] = round(employee_summary["work_hours"], 2)
        result.append(employee_summary)

    return jsonify(result), 200


@attendance_bp.route("/dashboard-summary", methods=["GET"])
@jwt_required()
def get_admin_dashboard_summary():
    if not _require_admin():
        return jsonify({"message": "Unauthorized"}), 403

    today = datetime.now().date()
    employees = User.query.filter_by(role="employee").order_by(User.employee_id.asc()).all()
    employee_count = len(employees)

    today_records = Attendance.query.filter(Attendance.date == today).all()
    today_record_map: dict[str, Attendance] = {}
    for record in today_records:
        if record.employee_id not in today_record_map:
            today_record_map[record.employee_id] = record

    present_today = 0
    late_today = 0
    half_day_today = 0
    absent_today = 0

    for employee in employees:
        record = today_record_map.get(employee.employee_id)
        status = _resolve_status(record) if record else "Absent"
        if status == "Absent":
            absent_today += 1
        else:
            present_today += 1
            if status == "Late":
                late_today += 1
            elif status == "Half Day":
                half_day_today += 1

    month_start, month_end = _get_month_bounds(today.year, today.month)
    month_records = (
        Attendance.query.filter(Attendance.date >= month_start)
        .filter(Attendance.date < month_end)
        .all()
    )
    monthly_late_used = sum(int(record.late_minutes or 0) for record in month_records)

    monthly_limit = get_monthly_late_wallet_limit()
    monthly_wallet_total = monthly_limit * employee_count
    monthly_wallet_remaining = max(monthly_wallet_total - monthly_late_used, 0)

    recent_leaves = (
        db.session.query(Leave, User)
        .join(User, Leave.employee_id == User.employee_id)
        .order_by(Leave.applied_on.desc(), Leave.id.desc())
        .limit(6)
        .all()
    )
    pending_leaves = Leave.query.filter_by(status="Pending").count()

    week_dates = _get_week_dates(today, count=7)
    week_start = week_dates[0]
    week_end = week_dates[-1] + timedelta(days=1)
    week_records = (
        Attendance.query.filter(Attendance.date >= week_start)
        .filter(Attendance.date < week_end)
        .all()
    )

    attendance_counts = {day_value: 0 for day_value in week_dates}
    late_counts = {day_value: 0 for day_value in week_dates}
    for record in week_records:
        if record.date not in attendance_counts:
            continue
        status = _resolve_status(record)
        if status != "Absent":
            attendance_counts[record.date] += 1
        if status in {"Late", "Half Day"} or (record.late_minutes or 0) > 0:
            late_counts[record.date] += 1

    return (
        jsonify(
            {
                "summary": {
                    "employee_count": employee_count,
                    "present_today": present_today,
                    "late_today": late_today,
                    "half_day_today": half_day_today,
                    "absent_today": absent_today,
                    "pending_leaves": pending_leaves,
                    "monthly_late_used": monthly_late_used,
                    "monthly_wallet_total": monthly_wallet_total,
                    "monthly_wallet_remaining": monthly_wallet_remaining,
                },
                "charts": {
                    "labels": [day_value.strftime("%b %d") for day_value in week_dates],
                    "attendance_counts": [attendance_counts[day_value] for day_value in week_dates],
                    "late_counts": [late_counts[day_value] for day_value in week_dates],
                },
                "leave_requests": [
                    {
                        "name": user.name,
                        "employee_id": user.employee_id,
                        "from_date": leave.from_date.strftime("%Y-%m-%d"),
                        "to_date": leave.to_date.strftime("%Y-%m-%d"),
                        "leave_type": leave.leave_type,
                        "status": leave.status,
                    }
                    for leave, user in recent_leaves
                ],
            }
        ),
        200,
    )
