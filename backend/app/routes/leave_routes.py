from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.leave_model import Leave
from app.models.user_model import User
from datetime import datetime
from sqlalchemy import desc

leave_bp = Blueprint("leave", __name__)

# ================= APPLY LEAVE =================
@leave_bp.route("/apply-leave", methods=["POST"])
@jwt_required()
def apply_leave():
    data = request.get_json()

    # JWT identity returns employee_id (since you set it that way)
    employee_id = get_jwt_identity()

    try:
        # Convert dates
        from_date = datetime.strptime(
            data.get("from_date"), "%Y-%m-%d"
        ).date()

        to_date = datetime.strptime(
            data.get("to_date"), "%Y-%m-%d"
        ).date()

        today = datetime.today().date()

        # ❌ Prevent past leave
        if from_date < today:
            return jsonify({"message": "Cannot apply leave for past dates"}), 400

        # ❌ Prevent invalid range
        if to_date < from_date:
            return jsonify({"message": "To date cannot be before From date"}), 400

        new_leave = Leave(
            employee_id=employee_id,
            leave_type=data.get("leave_type"),
            from_date=from_date,
            to_date=to_date,
            reason=data.get("reason"),
            status="Pending"
        )

        db.session.add(new_leave)
        db.session.commit()

        return jsonify({"message": "Leave applied successfully"}), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 500


# ================= GET LATEST LEAVE =================
@leave_bp.route("/latest-leave/<string:employee_id>", methods=["GET"])
@jwt_required()
def get_latest_leave(employee_id):

    user = User.query.filter_by(employee_id=employee_id).first()

    if not user:
        return jsonify({}), 200

    latest_leave = (
        Leave.query
        .filter_by(employee_id=employee_id)
        .order_by(desc(Leave.created_at))
        .first()
    )

    if not latest_leave:
        return jsonify({}), 200

    return jsonify({
        "leaveType": latest_leave.leave_type,
        "fromDate": latest_leave.from_date.strftime("%Y-%m-%d"),
        "toDate": latest_leave.to_date.strftime("%Y-%m-%d"),
        "status": latest_leave.status
    }), 200