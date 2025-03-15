# Mapa MQTT en Tiempo Real para Dispositivos GPS 🛰️📍

![image](https://github.com/user-attachments/assets/cdbdf943-5181-4bdd-a0b9-a61775f09812)


Herramienta de visualización para proyectos IoT con GPS. Desarrollada para estudiantes y entusiastas que necesitan monitorear dispositivos en tiempo real usando protocolo MQTT.

**Objetivo del Proyecto:**  
Brindar una plataforma accesible y de código abierto para el seguimiento de dispositivos IoT con GPS, facilitando el aprendizaje y desarrollo de soluciones de localización.

## Características Principales ✨
- Visualización en mapa interactivo (OpenStreetMap)
- Configuración directa del broker MQTT desde el dashboard
- Soporte para múltiples dispositivos simultáneos
- Datos mostrados en tiempo real:
  - Posición GPS (lat/lon)
  - Velocidad y rumbo
  - Estado de batería y carga
  - Intensidad de señal
  - Identificación RFID
- Iconos dinámicos según estado del dispositivo

## Requisitos ⚙️
- Node.js v14+ y npm
- Broker MQTT (Ej: Mosquitto, EMQX)
- Dispositivo GPS compatible

## Instalación 🚀

```bash
# Clonar repositorio
git clone https://github.com/dvalle98/mapa_MQTT.git
cd mapa_MQTT

# Instalar dependencias
npm install

# Iniciar servidor
npm start
```

Accede al dashboard: [http://localhost:3000](http://localhost:3000)

## Configuración Inicial 🔧

1. En el dashboard, ve a ⚙️ **Configuración > Conexión MQTT**
2. Completa los datos de tu broker:
   - URL del servidor (ej: `mqtt://mi-broker.com`)
   - Puerto (ej: `1883`)
   - Tópico de suscripción (ej: `dispositivos/+/datos`)
3. Guarda los cambios

![Configuración MQTT](link-imagen-config.png)

## Formato de Datos Requerido 📨
Los dispositivos deben enviar datos en este formato JSON:

```json
{
  "id": "868020034072685",  // Identificador único
  "lat": 10.925832,         // Latitud (decimal)
  "lon": -74.833282,        // Longitud (decimal)
  "spd": 60.6,              // Velocidad (km/h)
  "brng": 16,               // Rumbo (grados)
  "acc": 0,                 // Precisión (metros)
  "time": "17:59",          // Hora del dispositivo
  "volt": 80,               // Batería (0-100%)
  "sig": 23,                // Intensidad señal (dBm)
  "RFID": "0000000000",     // Identificación RFID
  "charging": 1             // Cargando (0=No, 1=Si)
}
```

## Publicar Datos de Prueba 💻
```bash
mosquitto_pub -h [BROKER] -t [TÓPICO] -m '{
  "id": "868020034072685",
  "lat": 10.925832,
  "lon": -74.833282,
  "spd": 60.6,
  "brng": 16,
  "acc": 0,
  "time": "17:59",
  "volt": 80,
  "sig": 23,
  "RFID": "0000000000",
  "charging": 1
}'
```

## Interpretación de Marcadores 🎯
| Icono | Estado                |
|-------|-----------------------|
| 🔵    | Cargando              | 
| 🟢    | Batería >20%          |
| 🔴    | Batería crítica (<20%)|
| ⚫    | Sin datos recientes   |

## Personalización 🎨
1. **Estilos visuales:**  
   Editar archivos en `/public/css/`

2. **Lógica del mapa:**  
   Modificar `src/mapLogic.js`

3. **Iconos personalizados:**  
   Reemplazar imágenes en `/public/images/markers/`

## Solución de Problemas ⚠️
**Dispositivos no visibles:**
```bash
# Verificar conexión MQTT
nc -vz [broker] [puerto]

# Monitorear tópico
mosquitto_sub -h [broker] -t "[tópico]"
```

**Datos desactualizados:**
- Revisar intervalo de envío del dispositivo
- Verificar conexión a internet del dispositivo

## Contribuciones 🤝
Aceptamos contribuciones mediante Pull Requests. Por favor:
1. Crea un issue describiendo tu propuesta
2. Sigue el estilo de código existente
3. Incluye documentación actualizada

## Autor y Contacto 📬
**Diego Valle**  
Desarrollador IoT y entusiasta de tecnologías abiertas

📧 Correo: [dvalle@example.com](mailto:vallediego013@gmail.com)   
💼 LinkedIn: [Diego valle](https://www.linkedin.com/in/diego-valle-60738a164/)

---

**Nota de Licencia:**  
Este proyecto es de autoría propia. Para uso comercial o modificaciones, contactar al autor.
```

¿Necesitas aportar algún detalle adicional? 😊
