from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.attendance_model import Attendance

attendance_bp = Blueprint("attendance", __name__)

@attendance_bp.route("/", methods=["GET"])
@jwt_required()
def get_attendance():
    employee_id = get_jwt_identity()

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
