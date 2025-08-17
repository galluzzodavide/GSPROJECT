const WebSocket = require('ws');
const socket = new WebSocket("wss://stream.aisstream.io/v0/stream");

socket.onopen = function (_) {
  const subscriptionMessage = {
    Apikey: "7d33927681ad1d125df5a6f75e0a90b7572aeb89",
    BoundingBoxes: [
      [
        [-90.0, -180.0],
        [90.0, 180.0]
      ]
    ],
    // Questi due filtri sono opzionali, puoi toglierli o modificarli
    FiltersShipMMSI: ["368207620", "367719770", "211476060"],
    FilterMessageTypes: ["PositionReport"]
  };
  console.log("Sto per inviare messaggio:", JSON.stringify(subscriptionMessage, null, 2));
  socket.send(JSON.stringify(subscriptionMessage));
  console.log("Abbonamento inviato");
};

socket.onmessage = function (event) {
  const aisMessage = JSON.parse(event.data);
  console.log("Messaggio AIS:", aisMessage);
};

socket.onerror = function (err) {
  console.error("Errore WebSocket:", err);
};
