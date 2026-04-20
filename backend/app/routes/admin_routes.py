from flask_mail import Message
from flask import Blueprint, request, jsonify
from app import db, mail
from app.models.user_model import User
from flask_jwt_extended import jwt_required
from sqlalchemy.exc import IntegrityError
from datetime import datetime

admin_bp = Blueprint('admin', __name__)

# GET all employees
@admin_bp.route('/employees', methods=['GET'])
@jwt_required()
def get_employees():
    try:
        employees = User.query.filter_by(role='employee').all()
        output = []

        for emp in employees:
            output.append({
                "id": emp.id,
                "name": emp.name,
                "email": emp.email,
                "employee_id": emp.employee_id,
                "dob": emp.dob.strftime('%Y-%m-%d') if emp.dob else None,
                "role": emp.role,
                "created_at": emp.created_at.strftime('%Y-%m-%d') if emp.created_at else None,
            })

        return jsonify(output), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500


# POST - Add employee
@admin_bp.route('/employees', methods=['POST'])
@jwt_required()
def add_employee():
    data = request.get_json() or {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    employee_id = (data.get("employee_id") or "").strip()
    dob_str = (data.get("dob") or "").strip()
    password = data.get("password") or dob_str

    if not name:
        return jsonify({"message": "Name is required"}), 400
    if not email:
        return jsonify({"message": "Email is required"}), 400
    if not employee_id:
        return jsonify({"message": "Employee ID is required"}), 400
    if not dob_str:
        return jsonify({"message": "DOB is required"}), 400

    try:
        dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
    except Exception:
        return jsonify({"message": "Invalid DOB format. Use YYYY-MM-DD."}), 400

    existing_by_employee_id = User.query.filter_by(employee_id=employee_id).first()
    if existing_by_employee_id:
        return jsonify({"message": "Employee ID already exists"}), 400

    existing_by_email = User.query.filter_by(email=email).first()
    if existing_by_email:
        return (
            jsonify(
                {
                    "message": (
                        "Email already exists "
                        f"(belongs to {existing_by_email.role} {existing_by_email.employee_id})"
                    )
                }
            ),
            400,
        )

    try:
        new_user = User(
            name=name,
            email=email,
            employee_id=employee_id,
            dob=dob,
            role='employee'
        )

        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()

        msg = Message(
            subject="Your Account Details",
            recipients=[email]
        )

        msg.body = f"""
Hello {name},

Your account has been created.

Employee ID: {employee_id}
Password: {dob_str}

Please login and change your password.
        """

        mail.send(msg)

        return jsonify({"message": "Employee created & email sent"}), 201

    except IntegrityError:
        db.session.rollback()
        # In case a unique constraint fires despite our checks (race/collation/etc).
        return jsonify({"message": "Employee ID or Email already exists"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500


# DELETE
@admin_bp.route('/employees/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_employee(user_id):
    user = User.query.get_or_404(user_id)

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "Employee deleted successfully"}), 200


# UPDATE
@admin_bp.route('/employees/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_employee(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json

    name = (data.get("name", user.name) or "").strip()
    email = (data.get("email", user.email) or "").strip().lower()
    employee_id = (data.get("employee_id", user.employee_id) or "").strip()
    dob_value = data.get("dob", user.dob)

    if isinstance(dob_value, str):
        try:
            dob_value = datetime.strptime(dob_value, "%Y-%m-%d").date()
        except Exception:
            return jsonify({"message": "Invalid DOB format. Use YYYY-MM-DD."}), 400

    if User.query.filter(User.id != user.id, User.employee_id == employee_id).first():
        return jsonify({"message": "Employee ID already exists"}), 400

    if User.query.filter(User.id != user.id, User.email == email).first():
        return jsonify({"message": "Email already exists"}), 400

    user.name = name
    user.email = email
    user.employee_id = employee_id
    user.dob = dob_value

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Employee ID or Email already exists"}), 400

    return jsonify({"message": "Employee updated successfully"}), 200
