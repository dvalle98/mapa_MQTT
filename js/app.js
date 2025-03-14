// js/app.js
let speedGauge;

document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        protocol: document.getElementById('protocol'),
        host: document.getElementById('host'),
        port: document.getElementById('port'),
        clientId: document.getElementById('clientId'),
        username: document.getElementById('username'),
        password: document.getElementById('password'),
        sslToggle: document.getElementById('sslToggle'),
        configForm: document.getElementById('mqttConfigForm'),
        latitude: document.getElementById('latitude'),
        longitude: document.getElementById('longitude'),
        speedChart: document.getElementById('speedChart'),
        map: L.map('map'),
        marker: null,
        chart: null,
        dataConfigForm: document.getElementById('dataConfigForm'),
        dataConfigWidgetsForm: document.getElementById('dataConfigWidgetsForm'),
        inputTopic: document.getElementById('inputTopic'),
        outputTopic: document.getElementById('outputTopic'),
        showLat: document.getElementById('showLat'),
        showLon: document.getElementById('showLon'),
        showSpeed: document.getElementById('showSpeed'),
        toggleMap: document.getElementById('toggleMap'),
        toggleSpeedChart: document.getElementById('toggleSpeedChart'),
        toggleGauge: document.getElementById('toggleGauge'),
        toggleGPS: document.getElementById('toggleGPS')
    };

    let state = {
        mqttClient: null,
        config: loadSavedConfig(),
        mapInitialized: false,
        dataConfig: loadDataConfig(),
        widgets: {
            map: true,
            speedChart: true,
            gauge: true
        }
    };

    // Inicialización de widgets
    loadWidgetsConfig();
    applyWidgetsConfig();

    // Inicializar gauge
    speedGauge = new RadialGauge({
        renderTo: 'speedGauge',
        width: 300,
        height: 300,
        units: 'km/h',
        minValue: 0,
        maxValue: 120,
        majorTicks: ['0', '20', '40', '60', '80', '100', '120'],
        highlights: [
            { from: 0, to: 60, color: 'rgba(0,200,0,.2)' },
            { from: 60, to: 100, color: 'rgba(255,140,0,.2)' },
            { from: 100, to: 120, color: 'rgba(255,0,0,.2)' }
        ],
        value: 0
    }).draw();

    // Toggle Password
    document.getElementById('togglePassword').addEventListener('click', function() {
        const passwordField = elements.password;
        const type = passwordField.type === 'password' ? 'text' : 'password';
        passwordField.type = type;
        this.innerHTML = type === 'password' 
            ? '<i class="fas fa-eye"></i>'
            : '<i class="fas fa-eye-slash"></i>';
    });

    function init() {
        initializeMap();
        initializeChart();
        setupEventListeners();
        loadFormValues();
        if (state.config.brokerUrl) connectMQTT();
        loadDataFormValues();
    }

    function initializeMap() {
        elements.map.setView([10.9831158, -74.7952174], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(elements.map);
        elements.marker = L.marker([0, 0]).addTo(elements.map);
    }

    function initializeChart() {
        const ctx = elements.speedChart.getContext('2d');
        elements.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Velocidad (km/h)',
                    data: [],
                    borderColor: getComputedStyle(document.documentElement)
                        .getPropertyValue('--secondary-color')
                        .trim(),
                    borderWidth: 2,
                    fill: false
                }]
            },
            options: { 
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
                plugins: {display: false}
            }
        });
    }

    function connectMQTT() {
        if (!validateSSL()) return;

        state.mqttClient = new Paho.Client(
            state.config.brokerUrl,
            state.config.clientId
        );

        state.mqttClient.onConnectionLost = onConnectionLost;
        state.mqttClient.onMessageArrived = onMessageReceived;

        const connectOptions = {
            timeout: 10,
            cleanSession: true,
            onSuccess: () => {
                console.log('Conectado');
                state.mqttClient.subscribe(state.dataConfig.inputTopic);
                showSuccess('Conexión MQTT establecida');
            },
            onFailure: (err) => showError(`Error de conexión: ${err.errorMessage}`)
        };

        if (state.config.username) connectOptions.userName = state.config.username;
        if (state.config.password) connectOptions.password = state.config.password;

        try {
            state.mqttClient.connect(connectOptions);
        } catch (err) {
            showError(`Error crítico: ${err}`);
        }
    }

    function showSuccess(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success position-fixed top-0 end-0 m-3';
        alert.innerHTML = `<i class="fas fa-check-circle me-2"></i>${message}`;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 5000);
    }

    function validateSSL() {
        if (state.config.ssl && !['mqtts', 'wss'].includes(state.config.protocol)) {
            showError('SSL requiere protocolo seguro (mqtts:// o wss://)');
            return false;
        }
        return true;
    }

    function onConnectionLost(response) {
        if (response.errorCode !== 0) {
            showError(`Conexión perdida: ${response.errorMessage}`);
            setTimeout(connectMQTT, 5000);
        }
    }

    function onMessageReceived(message) {
        try {
            const data = JSON.parse(message.payloadString);
            const filteredData = {};

            if (state.dataConfig.showLat && data.lat) filteredData.lat = data.lat;
            if (state.dataConfig.showLon && data.lon) filteredData.lon = data.lon;
            if (state.dataConfig.showSpeed && data.spd) filteredData.spd = data.spd;

            updateUI(filteredData);
        } catch (err) {
            showError("Error al procesar datos: Formato inválido");
        }
    }

    function updateUI(data) {
        // Actualizar coordenadas
        if (data.lat && data.lon) {
            elements.latitude.textContent = data.lat.toFixed(6);
            elements.longitude.textContent = data.lon.toFixed(6);
            elements.marker.setLatLng([data.lat, data.lon]);
            elements.map.panTo([data.lat, data.lon]);
        }

        // Actualizar gráfico
        if (data.spd !== undefined) {
            const chart = elements.chart;
            chart.data.labels.push(new Date().toLocaleTimeString());
            chart.data.datasets[0].data.push(data.spd);
            
            if (chart.data.labels.length > 15) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
            }
            chart.update();
        }

        // Actualizar gauge
        if (data.spd !== undefined) {
            speedGauge.value = data.spd;
            speedGauge.update();
        }
    }

    function loadSavedConfig() {
        return {
            brokerUrl: localStorage.getItem('mqttBroker'),
            clientId: localStorage.getItem('clientId'),
            username: localStorage.getItem('username'),
            password: localStorage.getItem('password'),
            ssl: localStorage.getItem('ssl') === 'true',
            protocol: localStorage.getItem('protocol')
        };
    }

    function loadDataConfig() {
        return {
            inputTopic: localStorage.getItem('inputTopic') || 'gps/in',
            outputTopic: localStorage.getItem('outputTopic') || 'gps/out',
            showLat: localStorage.getItem('showLat') === 'true',
            showLon: localStorage.getItem('showLon') === 'true',
            showSpeed: localStorage.getItem('showSpeed') === 'true'
        };
    }

    function loadDataFormValues() {
        elements.inputTopic.value = state.dataConfig.inputTopic;
        elements.outputTopic.value = state.dataConfig.outputTopic;
        elements.showLat.checked = state.dataConfig.showLat;
        elements.showLon.checked = state.dataConfig.showLon;
        elements.showSpeed.checked = state.dataConfig.showSpeed;
    }

    function loadWidgetsConfig() {
        const savedConfig = localStorage.getItem('widgetsConfig');
        if (savedConfig) {
            state.widgets = JSON.parse(savedConfig);
            document.getElementById('toggleMap').checked = state.widgets.map;
            document.getElementById('toggleSpeedChart').checked = state.widgets.speedChart;
            document.getElementById('toggleGauge').checked = state.widgets.gauge;
        }
    }

    function applyWidgetsConfig() {
        const widgets = {
            map: document.getElementById('map-container'),
            speedChart: document.getElementById('speedChart-container'),
            gauge: document.getElementById('gauge-container'),
            textLabel: document.getElementById('gps-data-header')
        };

        // Validar elementos
        for (const [key, element] of Object.entries(widgets)) {
            if (!element) {
                console.error(`Widget no encontrado: ${key}`);
                return;
            }
        }

        // Aplicar visibilidad
        for (const [key, element] of Object.entries(widgets)) {
            element.classList.toggle('widget-hidden', !state.widgets[key]);
        }

        // Reajustar componentes
        setTimeout(() => {
            if (elements.map) elements.map.invalidateSize();
            if (elements.chart) elements.chart.resize();
            if (speedGauge) speedGauge.update();
            if (widgets.textLabel) widgets.textLabel.classList.toggle('d-none', !state.widgets.textLabel);
        }, 300);
    }

    // Event listener for widget configuration form
    elements.dataConfigWidgetsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        state.widgets = {
            textLabel: document.getElementById('toggleGPS').checked,
            map: document.getElementById('toggleMap').checked,
            speedChart: document.getElementById('toggleSpeedChart').checked,
            gauge: document.getElementById('toggleGauge').checked
        };

        localStorage.setItem('widgetsConfig', JSON.stringify(state.widgets));
        applyWidgetsConfig();
        const modal = bootstrap.Modal.getInstance('#widgetsConfigModal');
        if (modal) modal.hide();
    });

    elements.dataConfigForm.addEventListener('submit', (e) => {
        e.preventDefault();

        state.dataConfig = {
            inputTopic: elements.inputTopic.value,
            outputTopic: elements.outputTopic.value,
            showLat: elements.showLat.checked,
            showLon: elements.showLon.checked,
            showSpeed: elements.showSpeed.checked
        };

        // Actualizar suscripción MQTT
        if (state.mqttClient?.isConnected()) {
            state.mqttClient.unsubscribe(state.dataConfig.inputTopic);
            state.mqttClient.subscribe(state.dataConfig.inputTopic);
        }

        // Guardar configuración
        localStorage.setItem('inputTopic', state.dataConfig.inputTopic);
        localStorage.setItem('outputTopic', state.dataConfig.outputTopic);
        localStorage.setItem('showLat', state.dataConfig.showLat);
        localStorage.setItem('showLon', state.dataConfig.showLon);
        localStorage.setItem('showSpeed', state.dataConfig.showSpeed);

        showSuccess('Configuración de datos guardada');
        bootstrap.Modal.getInstance('#dataConfigModal').hide();
    });

    function loadFormValues() {
        if (state.config.brokerUrl) {
            const [protocol, rest] = state.config.brokerUrl.split('://');
            const [host, port] = rest.split(':');
            elements.protocol.value = protocol;
            elements.host.value = host;
            elements.port.value = port.split('/')[0];
        }
        elements.clientId.value = state.config.clientId || generateClientId();
        elements.username.value = state.config.username || '';
        elements.password.value = state.config.password || '';
        elements.sslToggle.checked = state.config.ssl || false;
    }

    function generateClientId() {
        return 'client_' + Math.random().toString(36).substr(2, 9);
    }

    function setupEventListeners() {
        elements.configForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const protocol = elements.protocol.value;
            const brokerUrl = `${protocol}://${elements.host.value}:${elements.port.value}/mqtt`;

            if (!validateForm(brokerUrl)) return;

            state.config = {
                brokerUrl: brokerUrl,
                clientId: elements.clientId.value,
                username: elements.username.value,
                password: elements.password.value,
                ssl: elements.sslToggle.checked,
                protocol: protocol
            };

            saveConfig();

            if (state.mqttClient?.isConnected()) state.mqttClient.disconnect();
            connectMQTT();
            bootstrap.Modal.getInstance('#configModal').hide();
        });
    }

    function saveConfig() {
        localStorage.setItem('mqttBroker', state.config.brokerUrl);
        localStorage.setItem('clientId', state.config.clientId);
        localStorage.setItem('username', state.config.username);
        localStorage.setItem('password', state.config.password);
        localStorage.setItem('ssl', state.config.ssl);
        localStorage.setItem('protocol', state.config.protocol);
    }

    function validateForm(brokerUrl) {
        if (!['mqtt', 'mqtts', 'ws', 'wss'].includes(elements.protocol.value)) {
            showError('Protocolo no válido');
            return false;
        }
        if (!elements.host.value || !elements.port.value) {
            showError('Complete todos los campos obligatorios');
            return false;
        }
        return true;
    }

    function showError(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger position-fixed top-0 end-0 m-3';
        alert.textContent = message;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 5000);
    }

    init();
});

// Funciones globales para control de modales
function toggleConfig() {
    const modal = new bootstrap.Modal(document.getElementById('configModal'));
    modal.show();
}

function toggleDataConfig() {
    const modal = new bootstrap.Modal(document.getElementById('dataConfigModal'));
    modal.show();
}

function toggleWidgetsConfig() {
    const modal = new bootstrap.Modal(document.getElementById('widgetsConfigModal'));
    modal.show();
}