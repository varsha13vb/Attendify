from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.justification_model import Justification
from datetime import datetime

justification_bp = Blueprint("justification", __name__)

# ================= APPLY JUSTIFICATION =================
@justification_bp.route("/apply", methods=["POST"])
@jwt_required()
def apply_justification():
    data = request.get_json()

    employee_id = get_jwt_identity()

    new_request = Justification(
        employee_id=employee_id,
        date=datetime.today().date(),   
        reason=data.get("reason"),
        status="Pending"
    )


    db.session.add(new_request)
    db.session.commit()

    return jsonify({"message": "Justification submitted successfully"}), 200


@justification_bp.route("/my", methods=["GET"])
@jwt_required()
def get_my_justifications():
    employee_id = get_jwt_identity()

    records = Justification.query.filter_by(employee_id=employee_id).all()

    result = []
    for r in records:
        result.append({
            "date": r.date.strftime("%Y-%m-%d"),
            "reason": r.reason,
            "status": r.status
        })

    return jsonify(result), 200