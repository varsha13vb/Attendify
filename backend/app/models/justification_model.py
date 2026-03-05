from app import db

class Justification(db.Model):
    __tablename__ = "justifications"

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(
        db.String(20),
        db.ForeignKey("users.employee_id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False
    )
    date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.Enum("Pending", "Approved", "Rejected"), default="Pending")
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())
