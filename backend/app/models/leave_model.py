from app import db

class Leave(db.Model):
    __tablename__ = "leaves"

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(
        db.String(20),
        db.ForeignKey("users.employee_id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False
    )
    leave_type = db.Column(db.Enum("Sick","Casual","Earned","Unpaid","Other"), nullable=False)
    from_date = db.Column(db.Date, nullable=False)
    to_date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.Enum("Pending","Approved","Rejected"), default="Pending")
    applied_on = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())
