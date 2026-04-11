from flask import Blueprint, request, jsonify
from app import db
from flask_jwt_extended import jwt_required
from datetime import datetime

policy_bp = Blueprint('policy', __name__)

# -----------------------------
# MODEL (if not created separately)
# -----------------------------
class Policy(db.Model):
    __tablename__ = 'policies'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100))
    severity = db.Column(db.Enum('Low', 'Medium', 'High'), default='Medium')
    applicable_to = db.Column(db.String(255))
    enforcement_action = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# -----------------------------
# GET ALL POLICIES
# -----------------------------
@policy_bp.route('/policies', methods=['GET'])
@jwt_required()
def get_policies():
    try:
        policies = Policy.query.all()

        data = []
        for p in policies:
            data.append({
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "category": p.category,
                "severity": p.severity,
                "applicable_to": p.applicable_to,
                "enforcement_action": p.enforcement_action,
                "is_active": p.is_active,
                "created_at": p.created_at.strftime('%Y-%m-%d'),
                "updated_at": p.updated_at.strftime('%Y-%m-%d')
            })

        return jsonify(data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------
# ADD POLICY
# -----------------------------
@policy_bp.route('/policies', methods=['POST'])
@jwt_required()
def add_policy():
    data = request.get_json()

    try:
        new_policy = Policy(
            title=data.get('title'),
            description=data.get('description'),
            category=data.get('category'),
            severity=data.get('severity'),
            applicable_to=data.get('applicable_to'),
            enforcement_action=data.get('enforcement_action'),
            is_active=data.get('is_active', True)
        )

        db.session.add(new_policy)
        db.session.commit()

        return jsonify({"message": "Policy created successfully"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# -----------------------------
# UPDATE POLICY
# -----------------------------
@policy_bp.route('/policies/<int:id>', methods=['PUT'])
@jwt_required()
def update_policy(id):
    policy = Policy.query.get_or_404(id)
    data = request.get_json()

    try:
        policy.title = data.get('title', policy.title)
        policy.description = data.get('description', policy.description)
        policy.category = data.get('category', policy.category)
        policy.severity = data.get('severity', policy.severity)
        policy.applicable_to = data.get('applicable_to', policy.applicable_to)
        policy.enforcement_action = data.get('enforcement_action', policy.enforcement_action)

        db.session.commit()

        return jsonify({"message": "Policy updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# -----------------------------
# DELETE POLICY
# -----------------------------
@policy_bp.route('/policies/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_policy(id):
    policy = Policy.query.get_or_404(id)

    try:
        db.session.delete(policy)
        db.session.commit()

        return jsonify({"message": "Policy deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# -----------------------------
# TOGGLE ACTIVE STATUS (IMPORTANT)
# -----------------------------
@policy_bp.route('/policies/<int:id>/toggle', methods=['PUT'])
@jwt_required()
def toggle_policy(id):
    policy = Policy.query.get_or_404(id)
    data = request.get_json()

    try:
        policy.is_active = data.get('is_active', policy.is_active)
        db.session.commit()

        return jsonify({"message": "Policy status updated"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500