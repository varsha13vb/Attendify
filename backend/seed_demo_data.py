"""
Seed presentation-ready demo data for Attendify.

Usage:
    python seed_demo_data.py
    python seed_demo_data.py --password MyDemoPass123

What it does:
    - recreates a fixed set of demo users
    - adds attendance rows for recent workdays
    - adds leave requests, justifications, holidays, and notifications
    - keeps normal users and normal records untouched
"""

from __future__ import annotations

import argparse
from datetime import date, datetime, time, timedelta

from app import create_app, db
from app.models.attendance_model import Attendance
from app.models.holiday_model import Holiday
from app.models.justification_model import Justification
from app.models.late_wallet_model import LateWallet
from app.models.leave_model import Leave
from app.models.notification_model import Notification
from app.models.system_config_model import SystemConfig
from app.models.user_model import User


DEMO_EVENT_PREFIX = "demo-seed:"
DEMO_PASSWORD = "Demo@123"
DEMO_ADMIN = {
    "employee_id": "ADM900",
    "name": "Demo Admin",
    "email": "admin.demo@attendify.local",
    "dob": date(1992, 5, 16),
    "department": "Administration",
    "role": "admin",
}
DEMO_EMPLOYEES = [
    {
        "employee_id": "DEMO901",
        "name": "Aarav Mehta",
        "email": "aarav.demo@attendify.local",
        "dob": date(1998, 4, 12),
        "department": "Computer Science",
    },
    {
        "employee_id": "DEMO902",
        "name": "Priya Sharma",
        "email": "priya.demo@attendify.local",
        "dob": date(1999, 7, 21),
        "department": "Information Technology",
    },
    {
        "employee_id": "DEMO903",
        "name": "Rohan Verma",
        "email": "rohan.demo@attendify.local",
        "dob": date(1997, 11, 9),
        "department": "Operations",
    },
    {
        "employee_id": "DEMO904",
        "name": "Sneha Iyer",
        "email": "sneha.demo@attendify.local",
        "dob": date(1998, 2, 14),
        "department": "Design",
    },
    {
        "employee_id": "DEMO905",
        "name": "Karan Gupta",
        "email": "karan.demo@attendify.local",
        "dob": date(1996, 9, 30),
        "department": "Finance",
    },
    {
        "employee_id": "DEMO906",
        "name": "Neha Patel",
        "email": "neha.demo@attendify.local",
        "dob": date(1998, 1, 18),
        "department": "Human Resources",
    },
    {
        "employee_id": "DEMO907",
        "name": "Aditya Rao",
        "email": "aditya.demo@attendify.local",
        "dob": date(1997, 6, 8),
        "department": "Marketing",
    },
    {
        "employee_id": "DEMO908",
        "name": "Ishita Nair",
        "email": "ishita.demo@attendify.local",
        "dob": date(1999, 3, 25),
        "department": "Support",
    },
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed demo data for Attendify.")
    parser.add_argument(
        "--password",
        default=DEMO_PASSWORD,
        help="Password to assign to all demo accounts.",
    )
    return parser.parse_args()


def get_recent_weekdays(count: int, *, end_day: date | None = None) -> list[date]:
    days: list[date] = []
    final_day = end_day or date.today()
    current = final_day

    while len(days) < count:
        if current == final_day or current.weekday() < 5:
            days.append(current)
        current -= timedelta(days=1)

    days.reverse()
    return days


def get_upcoming_holidays(start_day: date) -> list[dict]:
    return [
        {"name": "Demo Foundation Day", "date": start_day + timedelta(days=6)},
        {"name": "Team Retreat", "date": start_day + timedelta(days=19)},
        {"name": "Innovation Break", "date": start_day + timedelta(days=33)},
        {"name": "Festival Holiday", "date": start_day + timedelta(days=48)},
    ]


def attendance_template(status: str, *, employee_index: int, day_index: int) -> dict:
    if status == "Present":
        minute_shift = (employee_index + day_index) % 5
        return {
            "check_in": time(8, 55 + minute_shift),
            "check_out": time(18, 0 + (day_index % 3), 0),
            "late_minutes": 0,
            "status": "Present",
        }

    if status == "Late":
        late_minutes = 6 + ((employee_index + day_index) % 4) * 4
        return {
            "check_in": time(9, 15 + late_minutes),
            "check_out": time(18, 10 + (employee_index % 3), 0),
            "late_minutes": late_minutes,
            "status": "Late",
        }

    if status == "Half Day":
        late_minutes = 22 + ((employee_index + day_index) % 3) * 6
        return {
            "check_in": time(10, 0 + (employee_index % 3) * 5),
            "check_out": time(14, 15 + (day_index % 4) * 5),
            "late_minutes": late_minutes,
            "status": "Half Day",
        }

    return {
        "check_in": None,
        "check_out": None,
        "late_minutes": 0,
        "status": "Absent",
    }


def build_attendance_records(employee_ids: list[str]) -> list[Attendance]:
    workdays = get_recent_weekdays(12)
    base_cycle = [
        "Present",
        "Late",
        "Present",
        "Present",
        "Half Day",
        "Present",
        "Late",
        "Absent",
        "Present",
        "Late",
        "Present",
        "Present",
    ]
    today_statuses = [
        "Present",
        "Late",
        "Present",
        "Half Day",
        "Late",
        "Present",
        "Absent",
        "Present",
    ]

    rows: list[Attendance] = []

    for employee_index, employee_id in enumerate(employee_ids):
        for day_index, day_value in enumerate(workdays):
            status = base_cycle[(day_index + employee_index) % len(base_cycle)]
            if day_index == len(workdays) - 1 and employee_index < len(today_statuses):
                status = today_statuses[employee_index]

            payload = attendance_template(
                status,
                employee_index=employee_index,
                day_index=day_index,
            )
            rows.append(
                Attendance(
                    employee_id=employee_id,
                    date=day_value,
                    check_in=payload["check_in"],
                    checkout=payload["check_out"],
                    late_minutes=payload["late_minutes"],
                    status=payload["status"],
                )
            )

    return rows


def build_leave_records(employee_ids: list[str]) -> list[Leave]:
    today = date.today()
    return [
        Leave(
            employee_id=employee_ids[0],
            leave_type="Casual",
            from_date=today + timedelta(days=2),
            to_date=today + timedelta(days=3),
            reason="Family function out of town.",
            status="Pending",
        ),
        Leave(
            employee_id=employee_ids[1],
            leave_type="Sick",
            from_date=today + timedelta(days=5),
            to_date=today + timedelta(days=6),
            reason="Recovering from a viral fever.",
            status="Approved",
            admin_response="Approved. Take care and share prescription if needed.",
        ),
        Leave(
            employee_id=employee_ids[2],
            leave_type="Earned",
            from_date=today + timedelta(days=8),
            to_date=today + timedelta(days=10),
            reason="Short personal trip already planned.",
            status="Approved",
            admin_response="Approved and marked in the roster.",
        ),
        Leave(
            employee_id=employee_ids[3],
            leave_type="Other",
            from_date=today + timedelta(days=4),
            to_date=today + timedelta(days=4),
            reason="Need to attend a university project review.",
            status="Rejected",
            admin_response="Rejected due to same-day staffing shortage.",
        ),
        Leave(
            employee_id=employee_ids[4],
            leave_type="Casual",
            from_date=today + timedelta(days=11),
            to_date=today + timedelta(days=12),
            reason="Visiting hometown for a family commitment.",
            status="Pending",
        ),
        Leave(
            employee_id=employee_ids[5],
            leave_type="Unpaid",
            from_date=today + timedelta(days=15),
            to_date=today + timedelta(days=17),
            reason="Preparing for certification exam.",
            status="Approved",
            admin_response="Approved as unpaid leave.",
        ),
    ]


def build_justification_records(employee_ids: list[str]) -> list[Justification]:
    today = date.today()
    return [
        Justification(
            employee_id=employee_ids[1],
            date=today - timedelta(days=1),
            late_minutes=14,
            reason="Metro delay caused by signaling issue.",
            status="Approved",
            admin_response="Approved for documented transport delay.",
        ),
        Justification(
            employee_id=employee_ids[3],
            date=today - timedelta(days=3),
            late_minutes=28,
            reason="Medical checkup ran longer than expected.",
            status="Pending",
        ),
        Justification(
            employee_id=employee_ids[4],
            date=today - timedelta(days=5),
            late_minutes=10,
            reason="Rain and road diversion increased travel time.",
            status="Rejected",
            admin_response="Please plan buffer time during weather alerts.",
        ),
        Justification(
            employee_id=employee_ids[6],
            date=today - timedelta(days=2),
            late_minutes=18,
            reason="Bus breakdown on the main route.",
            status="Approved",
            admin_response="Approved this time due to transport issue.",
        ),
    ]


def build_notifications(employee_ids: list[str]) -> list[Notification]:
    return [
        Notification(
            employee_id=None,
            event_key=f"{DEMO_EVENT_PREFIX}announcement",
            message="Demo notice: Monthly review meeting moved to 4:00 PM today.",
            is_read=False,
        ),
        Notification(
            employee_id=employee_ids[1],
            event_key=f"{DEMO_EVENT_PREFIX}leave-approved",
            message="Your sick leave request has been approved.",
            is_read=False,
        ),
        Notification(
            employee_id=employee_ids[3],
            event_key=f"{DEMO_EVENT_PREFIX}justification-pending",
            message="Your late-arrival justification is waiting for admin review.",
            is_read=True,
        ),
        Notification(
            employee_id=employee_ids[6],
            event_key=f"{DEMO_EVENT_PREFIX}wallet-alert",
            message="You are close to exhausting your monthly late wallet.",
            is_read=False,
        ),
    ]


def recreate_demo_rows(password: str) -> None:
    all_demo_people = [DEMO_ADMIN, *DEMO_EMPLOYEES]
    demo_employee_ids = [person["employee_id"] for person in all_demo_people]
    demo_emails = [person["email"] for person in all_demo_people]
    demo_holidays = get_upcoming_holidays(date.today())
    demo_holiday_names = [holiday["name"] for holiday in demo_holidays]

    db.session.query(Attendance).filter(
        Attendance.employee_id.in_(demo_employee_ids)
    ).delete(synchronize_session=False)
    db.session.query(Leave).filter(
        Leave.employee_id.in_(demo_employee_ids)
    ).delete(synchronize_session=False)
    db.session.query(Justification).filter(
        Justification.employee_id.in_(demo_employee_ids)
    ).delete(synchronize_session=False)
    db.session.query(LateWallet).filter(
        LateWallet.employee_id.in_(demo_employee_ids)
    ).delete(synchronize_session=False)
    db.session.query(Notification).filter(
        (Notification.employee_id.in_(demo_employee_ids))
        | (Notification.event_key.like(f"{DEMO_EVENT_PREFIX}%"))
    ).delete(synchronize_session=False)
    db.session.query(User).filter(
        (User.employee_id.in_(demo_employee_ids)) | (User.email.in_(demo_emails))
    ).delete(synchronize_session=False)
    db.session.query(Holiday).filter(
        Holiday.name.in_(demo_holiday_names)
    ).delete(synchronize_session=False)

    config = db.session.get(SystemConfig, 1)
    if not config:
        config = SystemConfig(id=1)
        db.session.add(config)

    config.check_in = "09:00"
    config.check_out = "18:00"
    config.late_tolerance = 15
    config.monthly_late_wallet = 45
    config.min_work_hours = 8

    for person in all_demo_people:
        user = User(
            employee_id=person["employee_id"],
            name=person["name"],
            email=person["email"],
            dob=person["dob"],
            department=person["department"],
            role=person.get("role", "employee"),
        )
        user.dark_mode = False
        user.email_notifications = True
        user.push_notifications = False
        user.attendance_alerts = True
        user.leave_requests = True
        user.set_password(password)
        db.session.add(user)

    db.session.flush()

    employee_ids = [person["employee_id"] for person in DEMO_EMPLOYEES]

    for row in build_attendance_records(employee_ids):
        db.session.add(row)

    for row in build_leave_records(employee_ids):
        db.session.add(row)

    for row in build_justification_records(employee_ids):
        db.session.add(row)

    for row in build_notifications(employee_ids):
        db.session.add(row)

    for holiday in demo_holidays:
        db.session.add(Holiday(name=holiday["name"], date=holiday["date"]))

    db.session.commit()


def print_summary(password: str) -> None:
    print("Demo data seeded successfully.")
    print(f"Admin login: {DEMO_ADMIN['employee_id']} / {password}")
    print("Employee logins:")
    for employee in DEMO_EMPLOYEES:
        print(f"  - {employee['employee_id']} / {password} ({employee['name']})")


def main() -> None:
    args = parse_args()
    app = create_app()

    with app.app_context():
        recreate_demo_rows(args.password)
        print_summary(args.password)


if __name__ == "__main__":
    main()
