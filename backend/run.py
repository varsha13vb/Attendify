from app import create_app, db


app = create_app()
with app.app_context():
    try:
        db.create_all()
        print("✅ Database connected and tables created successfully")
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        exit(1)

if __name__ == "__main__":
    app.run(debug=True)
print(app.url_map)
