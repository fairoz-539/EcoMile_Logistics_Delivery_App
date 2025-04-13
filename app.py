from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash, make_response
import firebase_admin
from firebase_admin import credentials, auth, db
from datetime import timedelta
import os
from dotenv import load_dotenv
import logging
import random
from openrouteservice import Client
import time

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Configure session cookie settings
app.config['SESSION_COOKIE_SECURE'] = False  # Set to False for local dev (HTTP); True for production (HTTPS)
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)
app.config['SESSION_REFRESH_EACH_REQUEST'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Firebase Admin SDK setup
cred = credentials.Certificate("firebase-auth.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'Your_databaseURL'
})
db_ref = db.reference()

# Initialize ORS client
ors_client = Client(key='Your_ors_client_api_key')

# Decorator for routes that require authentication
def auth_required(f):
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if token:
            try:
                decoded_token = auth.verify_id_token(token, check_revoked=True, clock_skew_seconds=60)
                session['user'] = decoded_token  # Update session with token data
            except Exception as e:
                logger.error(f"Token verification failed: {str(e)}")
        if 'user' not in session:
            if request.path.startswith('/'):  # API routes return JSON
                return jsonify({"error": "Unauthorized"}), 401
            flash('Please log in to access this page.', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@app.route('/auth', methods=['POST'])
def authorize():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    try:
        decoded_token = auth.verify_id_token(token, check_revoked=True, clock_skew_seconds=60)
        session['user'] = decoded_token
        user_id = decoded_token['uid']
        user_ref = db_ref.child('users').child(user_id)
        if not user_ref.get():
            user_ref.set({
                'email': decoded_token.get('email', f"User_{user_id}"),
                'eco_points': 0
            })
        return redirect(url_for('auth_index'))
    except Exception as e:
        logger.error(f"Auth error: {str(e)}")
        return jsonify({"error": str(e)}), 401

@app.route('/')
@auth_required
def auth_index():
    user_id = session['user']['uid']
    latest_route = db_ref.child('routes').child(user_id).order_by_key().limit_to_last(1).get()
    route_data = None
    if latest_route:
        route_data = list(latest_route.values())[0]
    return render_template('index.html', route_data=route_data)

@app.route('/dashboard')
@auth_required
def auth_dashboard():
    user_id = session['user']['uid']
    points = db_ref.child('users').child(user_id).child('eco_points').get() or 0
    raw_requests = db_ref.child('collaboration_requests').child(user_id).get() or {}

    # Process raw Firebase data into a list of requests
    requests = []
    if raw_requests:
        for collab_id, req_data in raw_requests.items():
            request = {
                'competitor_id': req_data.get('competitor_id', 'Unknown'),
                'goods': req_data.get('goods', []),
                'services': req_data.get('services', 'N/A'),
                'routes': req_data.get('routes', 'N/A'),
                'cost_sharing': req_data.get('cost_sharing', {
                    'user_cost': 0,
                    'competitor_cost': 0,
                    'total_savings': 0
                }),
                'status': req_data.get('status', 'Pending'),  # Default to 'Pending'
                'created_at': time.ctime(req_data.get('timestamp', 0))  # Convert timestamp to readable string
            }
            requests.append(request)

    return render_template('dashboard.html', points=points, requests=requests)

@app.route('/collaboration_hub')
@auth_required
def collaboration_hub():
    user_id = session['user']['uid']
    latest_route = db_ref.child('routes').child(user_id).order_by_key().limit_to_last(1).get()
    route_data = list(latest_route.values())[0] if latest_route else None
    competitor_data = {"competitor_1": {"geometry": [[80.2389, 13.1123], [80.2345, 13.0356], [80.2301, 13.0456]]}}
    points = db_ref.child('users').child(user_id).child('eco_points').get() or 0
    return render_template('collaboration.html', route_data=route_data, competitor_data=competitor_data, points=points)

@app.route('/login')
def login():
    if 'user' in session:
        return redirect(url_for('auth_index'))
    return render_template('login.html')

@app.route('/signup')
def signup():
    if 'user' in session:
        return redirect(url_for('auth_index'))
    return render_template('signup.html')

@app.route('/reset-password')
def reset_password():
    if 'user' in session:
        return redirect(url_for('auth_index'))
    return render_template('forgot_password.html')

@app.route('/logout')
def logout():
    session.pop('user', None)
    response = make_response(redirect(url_for('login')))
    response.set_cookie('session', '', expires=0)
    return response

@app.route('/geocode', methods=['POST'])
def geocode():
    data = request.get_json()
    address = data.get('address', '').strip()
    if not address:
        return jsonify({"error": "Address is required"}), 400

    logger.debug(f"Geocoding address: {address}")
    try:
        geocode = ors_client.pelias_search(address)
        if not geocode['features']:
            logger.warning(f"No coordinates found for address: {address}")
            return jsonify({"error": "No coordinates found for the address"}), 404
        coordinates = geocode['features'][0]['geometry']['coordinates']
        logger.debug(f"Geocoded coordinates: {coordinates}")
        return jsonify({"coordinates": coordinates})
    except Exception as e:
        logger.error(f"Geocoding error: {str(e)}")
        return jsonify({"error": f"Geocoding failed: {str(e)}"}), 500

@app.route('/calculate_route', methods=['POST'])
@auth_required
def calculate_route():
    data = request.get_json()
    addresses = data.get('addresses', [])
    eco_mode = data.get('ecoMode', False)

    logger.debug(f"Received addresses for route calculation: {addresses}")
    if len(addresses) < 2:
        return jsonify({"error": "At least one starting point and one ending point are required."}), 400

    try:
        coordinates = []
        for address in addresses:
            geocode = ors_client.pelias_search(address + ", Chennai, India")
            if not geocode['features']:
                return jsonify({"error": f"Could not geocode address: {address}"}), 400
            coords = geocode['features'][0]['geometry']['coordinates']
            coordinates.append(coords)

        route = ors_client.directions(
            coordinates=coordinates,
            profile='driving-car',
            format='geojson',
            instructions=False,
            preference='recommended' if not eco_mode else 'shortest'
        )
        geometry = route['features'][0]['geometry']['coordinates']
        total_distance = route['features'][0]['properties']['summary']['distance'] / 1000  # km
        total_duration = route['features'][0]['properties']['summary']['duration'] / 60  # minutes

        fuel_consumption = total_distance * 0.14
        fuel_savings = total_distance * 0.03 if eco_mode else 0
        cost_savings = total_distance * 0.8 if eco_mode else 0
        traffic_impact = random.uniform(2, 15)
        co2_savings_vs_industry = total_distance * 60 if eco_mode else 0
        efficiency_score = random.randint(75, 95)
        sustainability_score = min(95 + (5 if eco_mode else 0), 100)
        avg_delivery_time = total_duration / len(coordinates)
        driver_performance = min(90 + int(total_distance / 10), 100)

        analytics = {
            "fuel_consumption": fuel_consumption,
            "fuel_savings": fuel_savings,
            "cost_savings": cost_savings,
            "traffic_impact": traffic_impact,
            "co2_savings_vs_industry": co2_savings_vs_industry,
            "efficiency_score": efficiency_score,
            "sustainability_score": sustainability_score,
            "delivery_times": [{"stop": i, "estimated_time": avg_delivery_time} for i in range(len(coordinates))],
            "avg_delivery_time": avg_delivery_time,
            "driver_performance": driver_performance
        }

        total_co2 = total_distance * 200

        risky_areas = []
        if total_distance > 10:
            risky_areas.append({"location": "Midpoint", "reason": "High traffic zone detected"})

        user_id = session['user']['uid']
        route_data = {
            "addresses": addresses,
            "geometry": geometry,
            "total_distance": total_distance,
            "total_duration": total_duration,
            "total_co2": total_co2,
            "analytics": analytics,
            "locations": coordinates,
            "risky_areas": risky_areas,
            "timestamp": db_ref.push().key
        }
        db_ref.child('routes').child(user_id).child(route_data['timestamp']).set(route_data)
        logger.debug(f"Route data stored in Firebase: {route_data}")

        return jsonify(route_data)
    except Exception as e:
        logger.error(f"Route calculation error: {str(e)}")
        return jsonify({"error": f"Failed to calculate route: {str(e)}"}), 500

@app.route('/get_competitor_routes', methods=['POST'])
@auth_required
def get_competitor_routes():
    data = request.get_json()
    geometry = data.get('geometry', [])
    competitor_routes = [
        {"competitor_id": "competitor_1", "geometry": [[80.2389, 13.1123], [80.2345, 13.0356], [80.2301, 13.0456]]}
    ]
    return jsonify({"competitor_routes": competitor_routes})

@app.route('/submit_collaboration', methods=['POST'])
@auth_required
def submit_collaboration():
    data = request.get_json()
    goods = data.get('goods', [])
    services = data.get('services', '')
    routes = data.get('routes', '')
    competitor_id = data.get('competitor_id', 'competitor_1')
    cost_sharing = data.get('cost_sharing', {})

    if not goods or not services:
        logger.error("Missing goods or services in submit_collaboration")
        return jsonify({"error": "Please select goods and a service type."}), 400

    user_id = session['user']['uid']
    if not routes:
        latest_route = db_ref.child('routes').child(user_id).order_by_key().limit_to_last(1).get()
        routes = ', '.join(list(latest_route.values())[0]['addresses']) if latest_route else "No route available"

    collaboration_id = db_ref.child('collaboration_requests').child(user_id).push().key
    collaboration_data = {
        "goods": goods,
        "services": services,
        "routes": routes,
        "competitor_id": competitor_id,
        "cost_sharing": cost_sharing,
        "status": "Pending",  # Add default status
        "timestamp": int(time.time())
    }
    db_ref.child('collaboration_requests').child(user_id).child(collaboration_id).set(collaboration_data)

    # Award 10 EcoPoints
    points_ref = db_ref.child('users').child(user_id).child('eco_points')
    current_points = points_ref.get() or 0
    points_ref.set(current_points + 10)

    logger.debug(f"Collaboration offer submitted: {collaboration_id}")
    return jsonify({"message": "Collaboration offer sent! You earned 10 EcoPoints.", "collaboration_id": collaboration_id})

@app.route('/get_chat_messages/<collaboration_id>', methods=['GET'])
@auth_required
def get_chat_messages(collaboration_id):
    messages = db_ref.child('chat_messages').child(collaboration_id).get() or {}
    formatted_messages = [
        {"sender": msg.get('sender'), "message": msg.get('message'), "created_at": time.ctime(msg.get('timestamp'))}
        for msg in messages.values()
    ]
    return jsonify({"messages": formatted_messages})

@app.route('/send_chat_message/<collaboration_id>', methods=['POST'])
@auth_required
def send_chat_message(collaboration_id):
    data = request.get_json()
    message = data.get('message', '')
    if not message:
        return jsonify({"error": "Message cannot be empty."}), 400

    user_id = session['user']['uid']
    db_ref.child('chat_messages').child(collaboration_id).push({
        "sender": session['user']['email'],
        "message": message,
        "timestamp": int(time.time())
    })
    return jsonify({"message": "Message sent."})

@app.route('/leaderboard', methods=['GET'])
@auth_required
def get_leaderboard():
    users = db_ref.child('users').get() or {}
    leaderboard = [
        {"user": user_data.get('email', f"User_{uid}"), "points": user_data.get('eco_points', 0)}
        for uid, user_data in users.items()
    ]
    return jsonify({"leaderboard": leaderboard})

if __name__ == '__main__':
    app.run(debug=True, port=3000)
