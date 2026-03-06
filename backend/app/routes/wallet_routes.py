from datetime import datetime

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models.attendance_model import Attendance

wallet_bp = Blueprint('wallet', __name__)


@wallet_bp.route('/', methods=['GET'])
@jwt_required()
def wallet_info():
    employee_id = get_jwt_identity()
    now = datetime.now()
    monthly_limit = 45

    monthly_records = (
        Attendance.query
        .filter_by(employee_id=employee_id)
        .filter(Attendance.date >= datetime(now.year, now.month, 1).date())
        .all()
    )
    used_minutes = sum((record.late_minutes or 0) for record in monthly_records)
    remaining = max(monthly_limit - used_minutes, 0)

    return jsonify({
        "monthly_limit": monthly_limit,
        "used_minutes": used_minutes,
        "remaining_minutes": remaining,
    }), 200
