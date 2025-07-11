# 🧠 FlashGenius - Smart Learning Cards con Texto a Voz

Una aplicación web moderna para crear y estudiar flashcards con funcionalidad de reproducción por voz integrada.

## ✨ Características

- **Creación fácil de flashcards**: Formato simple `pregunta::respuesta`
- **Interfaz moderna**: Diseño glassmorphism con animaciones fluidas
- **Texto a voz**: Reproduce preguntas y respuestas en audio
- **Navegación intuitiva**: Controles de teclado y mouse
- **Progreso visual**: Barra de progreso y estadísticas en tiempo real
- **Diseño responsivo**: Optimizado para dispositivos móviles y desktop

## 🚀 Cómo usar

### 1. Crear flashcards

Ingresa tus flashcards en el formato:

```
¿Cuál es la capital de Francia?::París
¿Cuánto es 2 + 2?::4
¿Qué significa HTML?::HyperText Markup Language
```

### 2. Controles disponibles

#### 🖱️ Mouse/Touch

- **Clic en la tarjeta**: Voltear para ver la respuesta
- **Botón 🔊**: Reproducir audio del texto
- **Botones ← →**: Navegar entre tarjetas
- **Botón 🔄**: Voltear tarjeta actual

#### ⌨️ Teclado

- **←/→**: Navegar entre tarjetas
- **Espacio**: Voltear tarjeta
- **P**: Reproducir audio de la tarjeta actual
- **S**: Detener audio
- **Esc**: Volver al frente y detener audio

## 🔊 Funcionalidad de Texto a Voz

### Web Speech API (Por defecto)

La aplicación usa la Web Speech API del navegador para reproducir texto en voz alta:

- ✅ **Ventajas**: Funciona sin configuración adicional, gratis, offline
- ⚠️ **Limitaciones**: Calidad variable según el navegador, voces limitadas

### APIs Externas (Configuración avanzada)

#### Google Cloud Text-to-Speech

Para usar Google Cloud TTS, edita `script.js`:

```javascript
const externalTTSConfig = {
  googleTTS: {
    apiKey: "TU_API_KEY_DE_GOOGLE",
    endpoint: "https://texttospeech.googleapis.com/v1/text:synthesize",
    voice: {
      languageCode: "es-ES",
      name: "es-ES-Neural2-A",
      ssmlGender: "FEMALE",
    },
  },
};

// Cambiar a false para usar API externa
ttsConfig.useWebSpeechAPI = false;
```

#### ElevenLabs TTS

Para usar ElevenLabs:

```javascript
const externalTTSConfig = {
  elevenLabs: {
    apiKey: "TU_API_KEY_DE_ELEVENLABS",
    voiceId: "TU_VOICE_ID",
    settings: {
      stability: 0.75,
      similarity_boost: 0.75,
    },
  },
};
```

## 📁 Estructura del proyecto

```
flashcards/
├── index.html          # Archivo principal HTML
├── styles.css          # Estilos CSS
├── script.js           # Lógica JavaScript
├── LICENSE.md          # Licencia
└── README.md           # Este archivo
```

## 🛠️ Configuración de desarrollo

### Opción 1: Servidor local simple

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (si tienes http-server instalado)
npx http-server
```

### Opción 2: Live Server (VS Code)

1. Instala la extensión "Live Server"
2. Clic derecho en `index.html` → "Open with Live Server"

## 🔧 Personalización

### Configurar idioma y voz

En `script.js`, modifica:

```javascript
const ttsConfig = {
  useWebSpeechAPI: true,
  language: "es-ES", // Cambiar idioma (es-ES, en-US, fr-FR, etc.)
  rate: 0.9, // Velocidad (0.1 - 10)
  pitch: 1, // Tono (0 - 2)
  volume: 1, // Volumen (0 - 1)
};
```

### Estilos personalizados

Modifica las variables CSS en `styles.css`:

```css
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --accent-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  /* ... más variables */
}
```

## 🌐 Compatibilidad de navegadores

### Web Speech API

- ✅ Chrome/Chromium
- ✅ Safari (macOS/iOS)
- ✅ Edge
- ⚠️ Firefox (limitado)

### APIs Externas

- ✅ Todos los navegadores modernos
- ⚠️ Requiere conexión a internet
- 💰 Requiere cuentas de pago en los servicios

## 🚨 Solución de problemas

### Audio no funciona

1. **Verificar permisos**: Algunos navegadores requieren interacción del usuario
2. **Comprobar volumen**: Verificar volumen del sistema y navegador
3. **Probar en otro navegador**: Chrome generalmente tiene mejor soporte
4. **Habilitar audio**: Verificar que el sitio no esté silenciado

### Errores de API externa

1. **API Key válida**: Verificar que las credenciales sean correctas
2. **Cuotas**: Comprobar límites de uso de la API
3. **CORS**: Algunas APIs requieren configuración de servidor

## 📝 Notas de desarrollo

### Para agregar nuevas funcionalidades:

1. **Nuevos idiomas**: Agregar códigos en la configuración de TTS
2. **Más APIs**: Implementar nuevas funciones en `useExternalTTSAPI()`
3. **Mejores voces**: Configurar voces premium en las APIs externas

### Estructura del código:

- `createFlashcards()`: Genera las tarjetas desde el texto
- `speakText()`: Función principal de TTS
- `updateCardDisplay()`: Maneja la navegación y progreso
- `stopCurrentAudio()`: Detiene y resetea audio

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE.md` para más detalles.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o sugerencias:

1. Revisa los problemas comunes en este README
2. Abre un issue en GitHub
3. Consulta la documentación de las APIs externas

---

¡Hecho con ❤️ para mejorar tu experiencia de aprendizaje!
