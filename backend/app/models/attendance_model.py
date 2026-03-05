from app import db

class Attendance(db.Model):
    __tablename__ = "attendance"

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.String(20), db.ForeignKey("users.employee_id"))
    date = db.Column(db.Date, nullable=False)
    check_in = db.Column(db.Time)
    late_minutes = db.Column(db.Integer, default=0)
    status = db.Column(db.Enum("Present", "Absent", "Late", "Half Day"))
