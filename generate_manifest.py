import os
import json

# Path to the emails folder
emails_dir = os.path.join(os.path.dirname(__file__), "emails")

# Paths for the real and fake folders
real_folder = os.path.join(emails_dir, "real")
fake_folder = os.path.join(emails_dir, "fake")

# List all .html files in the real and fake folders
real_email_files = [f for f in os.listdir(real_folder) if f.endswith(".html")]
fake_email_files = [f for f in os.listdir(fake_folder) if f.endswith(".html")]

# Ensure the files in both folders have matching names
matching_email_files = [
    os.path.splitext(f)[0]  # Only take the name without extension
    for f in real_email_files
    if f in fake_email_files
]

# Wrap the list in a dict with a "file_pairs" key
manifest_data = {"file_pairs": matching_email_files}

# Save as manifest.json in the emails folder
with open(os.path.join(emails_dir, "manifest.json"), "w") as manifest_file:
    json.dump(manifest_data, manifest_file, indent=2)

print("manifest.json generated with the following email pairs:")
for email in matching_email_files:
    print(f"  - {email}")
