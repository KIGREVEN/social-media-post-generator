#!/usr/bin/env python3
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask
from flask_jwt_extended import JWTManager, decode_token
from src.config import config

# Create a minimal Flask app to test JWT
app = Flask(__name__)
app.config.from_object(config['production'])

jwt = JWTManager(app)

# Test token from the API
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc1NDkxNTQ4NSwianRpIjoiZGM2OTA0NWMtYWM0NC00NjU2LWIyZmUtYzRkMTg1NTZlNTViIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6MSwibmJmIjoxNzU0OTE1NDg1LCJleHAiOjE3NTU1MjAyODV9.8cyupOauqhLsz2HioAPcr2QxuITNO_1pQYqgwnA0GuQ"

try:
    with app.app_context():
        decoded = decode_token(token)
        print("Token is valid!")
        print(f"Decoded token: {decoded}")
        print(f"User ID: {decoded['sub']}")
except Exception as e:
    print(f"Token validation failed: {e}")
    print(f"JWT Secret Key: {app.config.get('JWT_SECRET_KEY')}")

