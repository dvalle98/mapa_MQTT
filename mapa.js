var map = L.map('mapa2').setView([0, 0], 1);

// Agregar capa de mapa
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Obtener ubicación del dispositivo
navigator.geolocation.getCurrentPosition(function(position) {
    // Agregar marcador en la ubicación del dispositivo
    var marker = L.marker([position.coords.latitude, position.coords.longitude]).addTo(map);
});
