import os
import smtplib
from email.mime.text import MIMEText

from dotenv import load_dotenv


def main() -> None:
    load_dotenv()

    sender_email = os.getenv("MAIL_USERNAME")
    password = os.getenv("MAIL_PASSWORD")

    if not sender_email or not password:
        raise SystemExit(
            "Missing MAIL_USERNAME or MAIL_PASSWORD in environment/.env (backend/.env)."
        )

    receiver_email = sender_email  # send to yourself for testing

    msg = MIMEText("Test Email from Attendify backend")
    msg["Subject"] = "Test Mail"
    msg["From"] = sender_email
    msg["To"] = receiver_email

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587, timeout=20)
        server.starttls()
        server.login(sender_email, password)
        server.send_message(msg)
        server.quit()
        print("Email sent successfully")
    except Exception as e:
        print("Error:", e)
        raise


if __name__ == "__main__":
    main()

