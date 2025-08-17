from flask import Flask, render_template, jsonify, request
import threading
from ais_worker import start_ais_listener


app = Flask(__name__)

# Memoria condivisa tra ricezione AIS e frontend
navi = {}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/navi")
def get_navi():
    print("🔍 Navi in memoria:", navi)
    # Filtra solo navi tra Venezia e Trieste
    filtered = []
    for nave in navi.values():
        if (nave.get("lat") is not None and nave.get("lon") is not None and
            45.2 <= nave["lat"] <= 46.0 and 12.0 <= nave["lon"] <= 14.0):
            
            filtered.append({
                "mmsi": nave["mmsi"],
                "lat": nave["lat"],
                "lon": nave["lon"],
                "name": nave.get("name", "N/A"),
                "type": nave.get("type", "N/A")
            })

    return jsonify(filtered)

@app.route("/get_ship_position")
def get_ship_position():
    mmsi = request.args.get("mmsi")
    if not mmsi:
        return jsonify({"error": "Parametro mmsi mancante"}), 400

    # forza confronto su stringhe
    mmsi = str(mmsi)
    nave = None
    for k, v in navi.items():
        if str(k) == mmsi:
            nave = v
            break

    if nave and nave.get("lat") is not None and nave.get("lon") is not None:
        return jsonify({"lat": nave["lat"], "lng": nave["lon"]})
    else:
        return jsonify({"error": "Nave non trovata"}), 404

# Avvia il listener AIS in background
threading.Thread(target=start_ais_listener, args=(navi,), daemon=True).start()

if __name__ == "__main__":
    app.run(debug=True)