from datetime import date

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from app.models.holiday_model import Holiday

holidays_bp = Blueprint("holidays", __name__)


@holidays_bp.route("/upcoming", methods=["GET"])
@jwt_required()
def upcoming_holidays():
    today = date.today()

    holidays = (
        Holiday.query
        .filter(Holiday.date >= today)
        .order_by(Holiday.date.asc(), Holiday.id.asc())
        .limit(50)
        .all()
    )

    return jsonify([
        {
            "name": h.name,
            "date": h.date.strftime("%Y-%m-%d"),
        }
        for h in holidays
    ]), 200

