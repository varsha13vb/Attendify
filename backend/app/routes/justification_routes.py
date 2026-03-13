from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from app import db
from app.models.justification_model import Justification

justification_bp = Blueprint("justification", __name__)

# ================= APPLY JUSTIFICATION =================
@justification_bp.route("/apply", methods=["POST"])
@jwt_required()
def apply_justification():

    data = request.get_json() or {}

    employee_id = get_jwt_identity()
    reason = (data.get("reason") or "").strip()

    if not reason:
        return jsonify({"message": "Reason is required"}), 400

    new_request = Justification(
        employee_id=employee_id,
        date=datetime.today().date(),
        reason=reason,
        status="Pending"
    )

    try:
        db.session.add(new_request)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Failed to submit justification"}), 500

    return jsonify({
        "message": "Justification submitted successfully"
    }), 200


# ================= GET MY JUSTIFICATIONS =================
@justification_bp.route("/my", methods=["GET"])
@jwt_required()
def get_my_justifications():

    employee_id = get_jwt_identity()

    records = (
        Justification.query
        .filter_by(employee_id=employee_id)
        .order_by(Justification.created_at.desc(), Justification.id.desc())
        .all()
    )

    return jsonify([
        {
            "date": r.date.strftime("%Y-%m-%d"),
            "reason": r.reason,
            "status": r.status
        }
        for r in records
    ]), 200