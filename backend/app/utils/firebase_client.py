import firebase_admin
from firebase_admin import credentials, firestore
import os

# Initialize Firebase Admin SDK
def initialize_firebase():
    if not firebase_admin._apps:
        cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH', './firebase-service-account.json')
        
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            # For Railway deployment, use environment variables
            firebase_admin.initialize_app()
    
    return firestore.client()

# Get Firestore client
db = initialize_firebase()
