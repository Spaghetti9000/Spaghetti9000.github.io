import os
import json

# Path to the emails folder
emails_dir = os.path.join(os.path.dirname(__file__), "emails")

# List all .html files in emails/
email_files = [f for f in os.listdir(emails_dir) if f.endswith(".html")]

# Save as manifest.json in the same folder
with open(os.path.join(emails_dir, "manifest.json"), "w") as manifest_file:
    json.dump(email_files, manifest_file, indent=2)

print("manifest.json generated with the following emails:")
for f in email_files:
    print("  -", f)
