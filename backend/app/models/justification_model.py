from app import db
from datetime import datetime

class Justification(db.Model):
    __tablename__ = "justifications"

    id = db.Column(db.Integer, primary_key=True)

    employee_id = db.Column(
        db.String(20),
        db.ForeignKey("users.employee_id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False
    )

    date = db.Column(db.Date, nullable=False)

    # ✅ ADD THIS
    late_minutes = db.Column(db.Integer)

    reason = db.Column(db.Text, nullable=False)

    status = db.Column(
        db.Enum("Pending", "Approved", "Rejected"),
        default="Pending"
    )

    # ✅ ADD THIS
    admin_response = db.Column(db.Text)

    created_at = db.Column(
        db.TIMESTAMP,
        server_default=db.func.current_timestamp()
    )