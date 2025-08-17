// Funzione per creare il contenuto del popup
function creaPopup(mmsi, name, type) {
    return `
        <b>Nome:</b> ${name}<br>
        <b>MMSI:</b> ${mmsi}<br>
        <b>Tipo:</b> ${type}
    `;
}

// Inizializza la mappa centrata tra Trieste e Venezia
let map = L.map('map').setView([45.8, 13.0], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

let navi = {};
let shipMarker = null;
let shipSquare = null;

function drawSquare(lat, lng) {
    const side = 0.036; // ~4km
    const bounds = [
        [lat - side / 2, lng - side / 2],
        [lat - side / 2, lng + side / 2],
        [lat + side / 2, lng + side / 2],
        [lat + side / 2, lng - side / 2]
    ];
    if (shipSquare) {
        map.removeLayer(shipSquare);
    }
    shipSquare = L.polygon(bounds, { color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }).addTo(map);
}

let naveSelezionata = null;

document.getElementById('selectShipBtn').onclick = function () {
    naveSelezionata = document.getElementById('mmsiInput').value;
};

function aggiornaNavi() {
    fetch("/navi")
        .then(res => res.json())
        .then(data => {
            let naveTrovata = null;

            data.forEach(nave => {
                const { mmsi, lat, lon, name = "N/A", type = "Unknown" } = nave;
                if (lat == null || lon == null) return;

                const latlng = [lat, lon];

                if (!navi[mmsi]) {
                    const marker = L.marker(latlng)
                        .addTo(map)
                        .bindPopup(creaPopup(mmsi, name, type));
                    const polyline = L.polyline([latlng], {
                        color: 'red',
                        weight: 2
                    }).addTo(map);
                    navi[mmsi] = {
                        marker,
                        polyline,
                        percorso: [latlng]
                    };
                } else {
                    const naveCorrente = navi[mmsi];
                    naveCorrente.percorso.push(latlng);
                    naveCorrente.marker.setLatLng(latlng);
                    // Aggiorna popup assicurandoti che rimanga associato
                    naveCorrente.marker.bindPopup(creaPopup(mmsi, name, type));
                    naveCorrente.polyline.setLatLngs(naveCorrente.percorso);
                }

                if (naveSelezionata && mmsi === naveSelezionata) {
                    naveTrovata = nave;
                }
            });

            if (naveTrovata) {
                const { lat, lon } = naveTrovata;
                if (shipMarker) {
                    map.removeLayer(shipMarker);
                }
                shipMarker = L.marker([lat, lon]).addTo(map);
                drawSquare(lat, lon);
                map.setView([lat, lon], 15);
            }
        });
}

function aggiornaNaveSelezionata() {
  if (!naveSelezionata) return;

  fetch(`/get_ship_position?mmsi=${encodeURIComponent(String(naveSelezionata))}`)
    .then(res => res.json())
    .then(pos => {
      if (pos.error) {
        console.warn(pos.error);
        return;
      }
      const { lat, lng } = pos;

      // riusa il marker invece di ricrearlo
      if (!shipMarker) {
        shipMarker = L.marker([lat, lng], { zIndexOffset: 1000 }).addTo(map);
      } else {
        shipMarker.setLatLng([lat, lng]);
      }

      drawSquare(lat, lng);
      map.setView([lat, lng], 15);
    })
    .catch(err => console.error("Errore /get_ship_position:", err));
}

// timers
setInterval(aggiornaNavi, 5000);            // tutte le navi
setInterval(aggiornaNaveSelezionata, 5000); // solo la selezionata