from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import desc

from app import db
from app.models.leave_model import Leave
from app.models.user_model import User

leave_bp = Blueprint("leave", __name__)


@leave_bp.route("/apply-leave", methods=["POST"])
@jwt_required()
def apply_leave():
    data = request.get_json() or {}
    employee_id = get_jwt_identity()

    leave_type = data.get("leave_type")
    reason = (data.get("reason") or "").strip()
    from_date_raw = data.get("from_date")
    to_date_raw = data.get("to_date")

    if not leave_type or not from_date_raw or not to_date_raw or not reason:
        return jsonify({"message": "All leave fields are required"}), 400

    try:
        from_date = datetime.strptime(from_date_raw, "%Y-%m-%d").date()
        to_date = datetime.strptime(to_date_raw, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"message": "Invalid date format. Use YYYY-MM-DD"}), 400

    today = datetime.today().date()
    if from_date < today:
        return jsonify({"message": "Cannot apply leave for past dates"}), 400

    if to_date < from_date:
        return jsonify({"message": "To date cannot be before From date"}), 400

    new_leave = Leave(
        employee_id=employee_id,
        leave_type=leave_type,
        from_date=from_date,
        to_date=to_date,
        reason=reason,
        status="Pending",
    )

    try:
        db.session.add(new_leave)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Failed to apply leave"}), 500

    return jsonify({"message": "Leave applied successfully"}), 200


@leave_bp.route("/latest-leave/<string:employee_id>", methods=["GET"])
@jwt_required()
def get_latest_leave(employee_id):
    user = User.query.filter_by(employee_id=employee_id).first()
    if not user:
        return jsonify({}), 200

    latest_leave = (
        Leave.query
        .filter_by(employee_id=employee_id)
        .order_by(desc(Leave.applied_on), desc(Leave.id))
        .first()
    )

    if not latest_leave:
        return jsonify({}), 200

    return jsonify({
        "leaveType": latest_leave.leave_type,
        "fromDate": latest_leave.from_date.strftime("%Y-%m-%d"),
        "toDate": latest_leave.to_date.strftime("%Y-%m-%d"),
        "status": latest_leave.status,
    }), 200
