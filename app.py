from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import requests
from ai_engine import process_query

app = Flask(__name__, static_url_path='/static')
CORS(app)  # ✅ Enable CORS for all routes

# Replace this with your actual key and host from RapidAPI
RAPIDAPI_KEY = "ca648c7816msh59a32159118ba12p187562jsn9a6181e78fac"
RAPIDAPI_HOST = "real-time-amazon-data.p.rapidapi.com"

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('q')
    if not query:
        return jsonify({"error": "No query provided"}), 400

    processed_query = process_query(query)

    url = f"https://{RAPIDAPI_HOST}/search"
    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST
    }
    params = {
        "country": "IN",
        "query": processed_query
    }

    try:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code != 200:
            return jsonify({"error": "API error", "status": response.status_code}), response.status_code

        data = response.json()
        products = data.get("data", {}).get("products", [])
        if not isinstance(products, list):
            return jsonify({"error": "Unexpected API format"}), 500

        enriched = []
        for item in products:
            title = item.get("product_title")
            link = item.get("product_url")
            price = item.get("product_price") or "Not available"
            image = item.get("product_photo")
            rating = item.get("product_star_rating")
            delivery = item.get("delivery")

            if title and link:
                enriched.append({
                    "title": title,
                    "link": link,
                    "price": str(price),
                    "image": image,
                    "rating": float(rating) if rating else 0.0,
                    "delivery": delivery or "Not listed"
                })

        # Sort: best rated + delivery available
        enriched.sort(key=lambda x: (-x["rating"], x["delivery"] == "Not listed"))

        return jsonify(enriched[:5])

    except Exception as e:
        return jsonify({
            "error": str(e),
            "note": "Outer exception block"
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))  # ✅ important for Render
    app.run(debug=True, host='0.0.0.0', port=port)
