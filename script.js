// FlashGenius - Script para funcionalidad de texto a voz
// Versión: 1.0
// Autor: FlashGenius Team

let currentCardIndex = 0;
let cards = [];
let currentAudio = null; // Para controlar el audio actual
let speechSynthesis = window.speechSynthesis;
let isPlaying = false;

// Configuración de TTS
const ttsConfig = {
  useWebSpeechAPI: true, // Cambiar a false para usar API externa
  language: 'es-ES', // Idioma por defecto
  rate: 0.9, // Velocidad de habla
  pitch: 1, // Tono
  volume: 1 // Volumen
};

// Configuración para APIs externas (ejemplos)
const externalTTSConfig = {
  // Google Cloud Text-to-Speech
  googleTTS: {
    apiKey: 'YOUR_GOOGLE_API_KEY',
    endpoint: 'https://texttospeech.googleapis.com/v1/text:synthesize',
    voice: {
      languageCode: 'es-ES',
      name: 'es-ES-Neural2-A',
      ssmlGender: 'FEMALE'
    },
    audioConfig: {
      audioEncoding: 'MP3'
    }
  },
  // ElevenLabs TTS
  elevenLabs: {
    apiKey: 'YOUR_ELEVENLABS_API_KEY',
    endpoint: 'https://api.elevenlabs.io/v1/text-to-speech',
    voiceId: 'YOUR_VOICE_ID',
    settings: {
      stability: 0.75,
      similarity_boost: 0.75
    }
  }
};

/**
 * Función principal para reproducir texto usando diferentes métodos de TTS
 * @param {string} text - Texto a reproducir
 * @param {HTMLElement} button - Botón que activó la función
 */
function speakText(text, button) {
  // Detener audio anterior si está reproduciéndose
  if (isPlaying) {
    stopCurrentAudio();
    return;
  }

  if (ttsConfig.useWebSpeechAPI) {
    speakWithWebAPI(text, button);
  } else {
    useExternalTTSAPI(text, button);
  }
}

/**
 * Reproducir texto usando Web Speech API del navegador
 * @param {string} text - Texto a reproducir
 * @param {HTMLElement} button - Botón de audio
 */
function speakWithWebAPI(text, button) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = ttsConfig.language;
    utterance.rate = ttsConfig.rate;
    utterance.pitch = ttsConfig.pitch;
    utterance.volume = ttsConfig.volume;

    // Eventos del habla
    utterance.onstart = () => {
      isPlaying = true;
      updateButtonState(button, 'playing');
    };

    utterance.onend = () => {
      isPlaying = false;
      updateButtonState(button, 'idle');
    };

    utterance.onerror = (event) => {
      console.error('Error en síntesis de voz:', event.error);
      isPlaying = false;
      updateButtonState(button, 'idle');
      showErrorMessage('Error al reproducir audio: ' + event.error);
    };

    speechSynthesis.speak(utterance);
  } else {
    showErrorMessage('Tu navegador no soporta síntesis de voz');
  }
}

/**
 * Usar API externa de TTS
 * @param {string} text - Texto a reproducir
 * @param {HTMLElement} button - Botón de audio
 */
function useExternalTTSAPI(text, button) {
  updateButtonState(button, 'loading');

  // Ejemplo de implementación con Google Cloud TTS
  if (externalTTSConfig.googleTTS.apiKey !== 'YOUR_GOOGLE_API_KEY') {
    callGoogleTTS(text, button);
  }
  // Ejemplo de implementación con ElevenLabs
  else if (externalTTSConfig.elevenLabs.apiKey !== 'YOUR_ELEVENLABS_API_KEY') {
    callElevenLabsTTS(text, button);
  }
  // Fallback a Web Speech API
  else {
    console.warn('APIs externas no configuradas. Usando Web Speech API como respaldo.');
    setTimeout(() => {
      ttsConfig.useWebSpeechAPI = true;
      speakWithWebAPI(text, button);
    }, 1000);
  }
}

/**
 * Llamada a Google Cloud Text-to-Speech API
 * @param {string} text - Texto a reproducir
 * @param {HTMLElement} button - Botón de audio
 */
async function callGoogleTTS(text, button) {
  try {
    const response = await fetch(
      `${externalTTSConfig.googleTTS.endpoint}?key=${externalTTSConfig.googleTTS.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text: text },
          voice: externalTTSConfig.googleTTS.voice,
          audioConfig: externalTTSConfig.googleTTS.audioConfig
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    const audioContent = data.audioContent;

    // Convertir base64 a blob y reproducir
    const audioBlob = base64ToBlob(audioContent, 'audio/mp3');
    const audioUrl = URL.createObjectURL(audioBlob);
    playAudioFromUrl(audioUrl, button);

  } catch (error) {
    console.error('Error con Google TTS:', error);
    showErrorMessage('Error al cargar audio desde Google TTS');
    updateButtonState(button, 'idle');
    
    // Fallback a Web Speech API
    ttsConfig.useWebSpeechAPI = true;
    speakWithWebAPI(text, button);
  }
}

/**
 * Llamada a ElevenLabs TTS API
 * @param {string} text - Texto a reproducir
 * @param {HTMLElement} button - Botón de audio
 */
async function callElevenLabsTTS(text, button) {
  try {
    const response = await fetch(
      `${externalTTSConfig.elevenLabs.endpoint}/${externalTTSConfig.elevenLabs.voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': externalTTSConfig.elevenLabs.apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: externalTTSConfig.elevenLabs.settings
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    playAudioFromUrl(audioUrl, button);

  } catch (error) {
    console.error('Error con ElevenLabs:', error);
    showErrorMessage('Error al cargar audio desde ElevenLabs');
    updateButtonState(button, 'idle');
    
    // Fallback a Web Speech API
    ttsConfig.useWebSpeechAPI = true;
    speakWithWebAPI(text, button);
  }
}

/**
 * Reproducir audio desde URL
 * @param {string} audioUrl - URL del audio
 * @param {HTMLElement} button - Botón de audio
 */
function playAudioFromUrl(audioUrl, button) {
  currentAudio = new Audio(audioUrl);
  
  currentAudio.onplay = () => {
    isPlaying = true;
    updateButtonState(button, 'playing');
  };
  
  currentAudio.onended = () => {
    isPlaying = false;
    updateButtonState(button, 'idle');
    URL.revokeObjectURL(audioUrl);
  };

  currentAudio.onerror = () => {
    isPlaying = false;
    updateButtonState(button, 'idle');
    showErrorMessage('Error al reproducir el archivo de audio');
    URL.revokeObjectURL(audioUrl);
  };
  
  currentAudio.play().catch(error => {
    console.error('Error al reproducir audio:', error);
    showErrorMessage('Error al reproducir audio');
    updateButtonState(button, 'idle');
  });
}

/**
 * Actualizar estado visual del botón
 * @param {HTMLElement} button - Botón a actualizar
 * @param {string} state - Estado: 'idle', 'loading', 'playing'
 */
function updateButtonState(button, state) {
  button.classList.remove('playing', 'loading');
  
  // Actualizar indicador de estado global
  updateAppStateIndicator(state);
  
  switch (state) {
    case 'loading':
      button.innerHTML = '⏳';
      button.classList.add('loading');
      button.title = 'Cargando audio...';
      break;
    case 'playing':
      button.innerHTML = '⏸️';
      button.classList.add('playing');
      button.title = 'Detener audio';
      break;
    case 'idle':
    default:
      button.innerHTML = '🔊';
      button.title = 'Reproducir audio';
      break;
  }
}

/**
 * Actualizar indicador de estado de la aplicación
 * @param {string} state - Estado actual
 */
function updateAppStateIndicator(state) {
  let indicator = document.querySelector('.app-state-indicator');
  
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'app-state-indicator';
    document.body.appendChild(indicator);
  }

  indicator.classList.remove('audio-playing');
  
  switch (state) {
    case 'playing':
      indicator.textContent = '🔊 Reproduciendo...';
      indicator.classList.add('audio-playing');
      indicator.style.display = 'block';
      break;
    case 'loading':
      indicator.textContent = '⏳ Cargando audio...';
      indicator.style.display = 'block';
      break;
    case 'idle':
    default:
      // Ocultar con delay para mejor UX
      setTimeout(() => {
        indicator.style.display = 'none';
      }, 1000);
      break;
  }
}

/**
 * Detener todo audio actual
 */
function stopCurrentAudio() {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  isPlaying = false;
  
  // Resetear todos los botones de audio
  document.querySelectorAll('.audio-btn').forEach(btn => {
    updateButtonState(btn, 'idle');
  });
}

/**
 * Reproducir audio de la tarjeta actual
 */
function playCurrentCardAudio() {
  if (cards[currentCardIndex]) {
    const currentCard = cards[currentCardIndex];
    const isFlipped = currentCard.classList.contains('flipped');
    
    // Determinar qué lado está visible
    const audioButton = isFlipped 
      ? currentCard.querySelector('.flashcard-back .audio-btn')
      : currentCard.querySelector('.flashcard-front .audio-btn');
    
    if (audioButton) {
      audioButton.click();
    }
  }
}

/**
 * Mostrar mensaje de error
 * @param {string} message - Mensaje a mostrar
 */
function showErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(245, 87, 108, 0.9);
    color: white;
    padding: 15px 20px;
    border-radius: 10px;
    z-index: 1000;
    backdrop-filter: blur(10px);
    animation: slideInFromRight 0.3s ease-out;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: 0.9rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.2);
    max-width: 300px;
  `;

  document.body.appendChild(errorDiv);

  setTimeout(() => {
    errorDiv.style.animation = 'slideOutToRight 0.3s ease-in';
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 300);
  }, 3000);
}

/**
 * Convertir base64 a blob
 * @param {string} base64Data - Datos en base64
 * @param {string} contentType - Tipo de contenido
 * @returns {Blob} - Blob resultante
 */
function base64ToBlob(base64Data, contentType) {
  const byteCharacters = atob(base64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

/**
 * Configurar voces disponibles para Web Speech API
 */
function setupVoices() {
  if ('speechSynthesis' in window) {
    const voices = speechSynthesis.getVoices();
    
    // Buscar voces en español
    const spanishVoices = voices.filter(voice => 
      voice.lang.startsWith('es') || voice.lang.includes('ES')
    );
    
    if (spanishVoices.length > 0) {
      console.log('Voces en español disponibles:', spanishVoices.map(v => v.name));
      // Usar la primera voz en español encontrada
      ttsConfig.preferredVoice = spanishVoices[0];
    }
  }
}

// Configurar voces cuando estén disponibles
if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = setupVoices;
  setupVoices(); // Intentar inmediatamente en caso de que ya estén cargadas
}

// Funciones principales de la aplicación (mantener compatibilidad)
function createFlashcards() {
  const input = document.getElementById("bulkInput").value;

  if (!input.trim()) {
    alert("¡Por favor ingresa algunas flashcards antes de generar!");
    return;
  }

  const container = document.getElementById("flashcardsContainer");

  // Clear existing flashcards but keep the UI structure
  const existingCards = container.querySelectorAll(".flashcard");
  existingCards.forEach((card) => card.remove());

  // Mejorar el parsing para manejar flashcards con opciones múltiples
  cards = parseFlashcards(input)
    .map((cardData, index) => {
      if (cardData.question && cardData.answer) {
        // Formatear pregunta con opciones múltiples
        const formattedQuestion = formatMultipleChoice(cardData.question);
        const formattedAnswer = formatMultipleChoice(cardData.answer);
        
        const flashcard = document.createElement("div");
        flashcard.className = "flashcard";
        flashcard.innerHTML = `
          <div class="flashcard-inner">
            <div class="flashcard-face flashcard-front">
              <div class="flashcard-content">
                <div class="question-text">${formattedQuestion}</div>
                <button class="audio-btn" title="Reproducir pregunta" onclick="speakText('${cardData.question.replace(/'/g, "\\'")}', this)">
                  🔊
                </button>
              </div>
            </div>
            <div class="flashcard-face flashcard-back">
              <div class="flashcard-content">
                <div class="answer-text">${formattedAnswer}</div>
                <button class="audio-btn" title="Reproducir respuesta" onclick="speakText('${cardData.answer.replace(/'/g, "\\'")}', this)">
                  🔊
                </button>
              </div>
            </div>
          </div>
        `;

        // Add click handler for flipping (pero no en los botones de audio)
        flashcard.addEventListener("click", (e) => {
          if (!e.target.classList.contains('audio-btn')) {
            flashcard.classList.toggle("flipped");
          }
        });

        container.appendChild(flashcard);
        return flashcard;
      }
    })
    .filter(Boolean);

  currentCardIndex = 0;
  updateCardDisplay();
  updateStats();

  // Add success feedback
  const btn = document.querySelector(".btn-primary");
  const originalText = btn.innerHTML;
  btn.innerHTML = "✅ Cards Generated!";
  btn.style.background = "var(--success-gradient)";

  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.style.background = "var(--primary-gradient)";
  }, 2000);
}

function updateCardDisplay() {
  if (cards.length === 0) return;

  // Detener audio al cambiar de tarjeta
  stopCurrentAudio();

  cards.forEach((card, index) => {
    card.classList.toggle("active", index === currentCardIndex);
    card.classList.remove("flipped");
  });

  const progress = ((currentCardIndex + 1) / cards.length) * 100;
  document.getElementById("progress").style.width = `${progress}%`;
  document.getElementById("cardCounter").textContent = `Card ${
    currentCardIndex + 1
  } of ${cards.length}`;

  updateStats();
}

function updateStats() {
  if (cards.length === 0) {
    document.getElementById("totalCards").textContent = "0";
    document.getElementById("currentCard").textContent = "0";
    document.getElementById("progressPercent").textContent = "0%";
    return;
  }

  document.getElementById("totalCards").textContent = cards.length;
  document.getElementById("currentCard").textContent =
    currentCardIndex + 1;
  document.getElementById("progressPercent").textContent =
    Math.round(((currentCardIndex + 1) / cards.length) * 100) + "%";
}

function nextCard() {
  if (currentCardIndex < cards.length - 1) {
    currentCardIndex++;
    updateCardDisplay();

    // Add haptic feedback effect
    const btn = document.querySelector('.icon-btn[onclick="nextCard()"]');
    if (btn) {
      btn.style.transform = "translateY(-8px) scale(1.15)";
      btn.style.background = "var(--accent-gradient)";
      setTimeout(() => {
        btn.style.transform = "";
        btn.style.background = "";
      }, 150);
    }
    
    // Mostrar feedback de navegación
    showNavigationFeedback('next');
  } else {
    // Mostrar feedback cuando se llega al final
    showBoundaryFeedback('end');
  }
}

function previousCard() {
  if (currentCardIndex > 0) {
    currentCardIndex--;
    updateCardDisplay();

    // Add haptic feedback effect
    const btn = document.querySelector(
      '.icon-btn[onclick="previousCard()"]'
    );
    if (btn) {
      btn.style.transform = "translateY(-8px) scale(1.15)";
      btn.style.background = "var(--accent-gradient)";
      setTimeout(() => {
        btn.style.transform = "";
        btn.style.background = "";
      }, 150);
    }
    
    // Mostrar feedback de navegación
    showNavigationFeedback('previous');
  } else {
    // Mostrar feedback cuando se llega al inicio
    showBoundaryFeedback('start');
  }
}

function toggleCard() {
  if (cards[currentCardIndex]) {
    const wasFlipped = cards[currentCardIndex].classList.contains('flipped');
    cards[currentCardIndex].classList.toggle("flipped");

    // Add haptic feedback effect
    const btn = document.querySelector(".flip-btn");
    if (btn) {
      btn.style.transform = "translateY(-10px) scale(1.2) rotate(180deg)";
      btn.style.background = "var(--success-gradient)";
      setTimeout(() => {
        btn.style.transform = "";
        btn.style.background = "";
      }, 300);
    }
    
    // Mostrar feedback de flip
    showFlipFeedback(!wasFlipped);
  }
}

/**
 * Mostrar feedback de navegación
 */
function showNavigationFeedback(direction) {
  const feedback = document.createElement('div');
  feedback.className = 'navigation-feedback';
  
  const emoji = direction === 'next' ? '→' : '←';
  const text = direction === 'next' ? 'Siguiente' : 'Anterior';
  
  feedback.innerHTML = `${emoji} ${text}`;
  feedback.style.cssText = `
    position: fixed;
    bottom: 100px;
    ${direction === 'next' ? 'right: 20px' : 'left: 20px'};
    background: var(--primary-gradient);
    color: white;
    padding: 10px 16px;
    border-radius: 8px;
    z-index: 1000;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 0.9rem;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    animation: navigationFeedbackShow 0.4s ease-out;
    pointer-events: none;
  `;

  document.body.appendChild(feedback);

  setTimeout(() => {
    if (feedback.parentNode) {
      feedback.style.animation = 'navigationFeedbackHide 0.3s ease-in';
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback);
        }
      }, 300);
    }
  }, 1200);
}

/**
 * Mostrar feedback cuando se llega a los límites
 */
function showBoundaryFeedback(boundary) {
  const feedback = document.createElement('div');
  feedback.className = 'boundary-feedback';
  
  const text = boundary === 'end' ? '🏁 Última tarjeta' : '🏠 Primera tarjeta';
  
  feedback.textContent = text;
  feedback.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(245, 87, 108, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 10px;
    z-index: 1000;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 0.9rem;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    animation: boundaryFeedbackShow 0.5s ease-out;
    pointer-events: none;
  `;

  document.body.appendChild(feedback);

  setTimeout(() => {
    if (feedback.parentNode) {
      feedback.style.animation = 'boundaryFeedbackHide 0.3s ease-in';
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback);
        }
      }, 300);
    }
  }, 2000);
}

/**
 * Mostrar feedback al voltear tarjeta
 */
function showFlipFeedback(isFlippedToAnswer) {
  const feedback = document.createElement('div');
  feedback.className = 'flip-feedback';
  
  const text = isFlippedToAnswer ? '💡 Respuesta' : '❓ Pregunta';
  
  feedback.textContent = text;
  feedback.style.cssText = `
    position: fixed;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
    background: var(--success-gradient);
    color: white;
    padding: 10px 16px;
    border-radius: 8px;
    z-index: 1000;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 0.9rem;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    animation: flipFeedbackShow 0.4s ease-out;
    pointer-events: none;
  `;

  document.body.appendChild(feedback);

  setTimeout(() => {
    if (feedback.parentNode) {
      feedback.style.animation = 'flipFeedbackHide 0.3s ease-in';
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback);
        }
      }, 300);
    }
  }, 1000);
}

// Enhanced keyboard navigation with visual feedback
document.addEventListener("keydown", (e) => {
  // No procesar si el usuario está escribiendo en un campo de texto
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
    return;
  }

  // Prevent default behavior for our shortcuts
  if (["ArrowLeft", "ArrowRight", " ", "KeyP", "KeyS", "Escape", "KeyF"].includes(e.code)) {
    e.preventDefault();
  }

  // Mostrar feedback visual de la tecla presionada
  showKeyPressedFeedback(e.code);

  switch (e.code) {
    case "ArrowLeft":
      if (cards.length > 0) {
        previousCard();
        highlightKeyboardShortcut("←");
      }
      break;
    case "ArrowRight":
      if (cards.length > 0) {
        nextCard();
        highlightKeyboardShortcut("→");
      }
      break;
    case "Space":
      if (cards.length > 0) {
        toggleCard();
        highlightKeyboardShortcut("Space");
      }
      break;
    case "KeyP":
      if (cards.length > 0) {
        playCurrentCardAudio();
        highlightKeyboardShortcut("P");
      }
      break;
    case "KeyS":
      stopCurrentAudio();
      highlightKeyboardShortcut("S");
      break;
    case "KeyF":
      // Nuevo: Foco en el campo de texto
      focusOnTextArea();
      highlightKeyboardShortcut("F");
      break;
    case "Escape":
      // Reset current card to front and stop audio
      stopCurrentAudio();
      if (cards[currentCardIndex]) {
        cards[currentCardIndex].classList.remove("flipped");
      }
      highlightKeyboardShortcut("Esc");
      break;
    case "Digit1":
    case "Digit2":
    case "Digit3":
    case "Digit4":
    case "Digit5":
    case "Digit6":
    case "Digit7":
    case "Digit8":
    case "Digit9":
      // Navegar directamente a tarjeta específica
      const cardNumber = parseInt(e.code.replace('Digit', '')) - 1;
      if (cardNumber < cards.length) {
        jumpToCard(cardNumber);
      }
      break;
  }
});

/**
 * Mostrar feedback visual cuando se presiona una tecla
 */
function showKeyPressedFeedback(keyCode) {
  const keyName = getKeyDisplayName(keyCode);
  if (!keyName) return;

  // Crear elemento de feedback
  const feedback = document.createElement('div');
  feedback.className = 'key-press-feedback';
  feedback.textContent = keyName;
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(102, 126, 234, 0.9);
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    z-index: 1000;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 0.8rem;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    animation: keyFeedbackShow 0.5s ease-out;
    pointer-events: none;
  `;

  document.body.appendChild(feedback);

  // Remover después de la animación
  setTimeout(() => {
    if (feedback.parentNode) {
      feedback.style.animation = 'keyFeedbackHide 0.3s ease-in';
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback);
        }
      }, 300);
    }
  }, 1500);
}

/**
 * Obtener nombre de visualización de la tecla
 */
function getKeyDisplayName(keyCode) {
  const keyMap = {
    'ArrowLeft': '← Previous',
    'ArrowRight': '→ Next',
    'Space': 'Space - Flip',
    'KeyP': 'P - Play Audio',
    'KeyS': 'S - Stop Audio',
    'KeyF': 'F - Focus Input',
    'Escape': 'Esc - Reset'
  };
  return keyMap[keyCode];
}

/**
 * Resaltar el atajo de teclado correspondiente en la UI
 */
function highlightKeyboardShortcut(keyName) {
  const shortcuts = document.querySelectorAll('.shortcut-bubble');
  shortcuts.forEach(shortcut => {
    const keyElement = shortcut.querySelector('.key-bubble');
    if (keyElement && keyElement.textContent === keyName) {
      shortcut.classList.add('key-highlighted');
      setTimeout(() => {
        shortcut.classList.remove('key-highlighted');
      }, 600);
    }
  });
}

/**
 * Enfocar en el área de texto
 */
function focusOnTextArea() {
  const textArea = document.getElementById('bulkInput');
  if (textArea) {
    textArea.focus();
    textArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/**
 * Saltar directamente a una tarjeta específica
 */
function jumpToCard(cardIndex) {
  if (cardIndex >= 0 && cardIndex < cards.length) {
    currentCardIndex = cardIndex;
    updateCardDisplay();
    
    // Mostrar feedback
    showJumpToCardFeedback(cardIndex + 1);
  }
}

/**
 * Mostrar feedback al saltar a tarjeta específica
 */
function showJumpToCardFeedback(cardNumber) {
  const feedback = document.createElement('div');
  feedback.className = 'jump-card-feedback';
  feedback.textContent = `Tarjeta ${cardNumber}`;
  feedback.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--accent-gradient);
    color: white;
    padding: 15px 25px;
    border-radius: 12px;
    z-index: 1001;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 1.2rem;
    backdrop-filter: blur(10px);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    animation: jumpCardShow 0.8s ease-out;
    pointer-events: none;
  `;

  document.body.appendChild(feedback);

  setTimeout(() => {
    if (feedback.parentNode) {
      feedback.style.animation = 'jumpCardHide 0.4s ease-in';
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback);
        }
      }, 400);
    }
  }, 1200);
}

// Add smooth scroll behavior and initial animation
document.addEventListener("DOMContentLoaded", () => {
  // Animate elements on load
  const elements = document.querySelectorAll(
    ".input-section, .flashcards-container"
  );
  elements.forEach((el, index) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";

    setTimeout(() => {
      el.style.transition = "all 0.6s ease-out";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, index * 200);
  });
  
  // Inicializar mejoras en botones
  initializeButtonEnhancements();
  
  // Mostrar mensaje de bienvenida con atajos
  showWelcomeMessage();
});

/**
 * Inicializar mejoras en botones
 */
function initializeButtonEnhancements() {
  // Agregar efecto de ondas a todos los botones
  document.querySelectorAll('.btn').forEach(btn => {
    btn.classList.add('btn-wave');
  });
  
  // Agregar tooltips mejorados
  document.querySelectorAll('[title]').forEach(element => {
    element.addEventListener('mouseenter', showEnhancedTooltip);
    element.addEventListener('mouseleave', hideEnhancedTooltip);
  });
}

/**
 * Mostrar mensaje de bienvenida
 */
function showWelcomeMessage() {
  const welcome = document.createElement('div');
  welcome.className = 'welcome-message';
  welcome.innerHTML = `
    <div class="welcome-content">
      <h3>🎉 ¡Bienvenido a FlashGenius!</h3>
      <p>Usa las teclas del teclado para una experiencia más rápida:</p>
      <div class="welcome-shortcuts">
        <span class="welcome-key">←/→</span> Navegar
        <span class="welcome-key">Space</span> Voltear
        <span class="welcome-key">P</span> Audio
      </div>
      <small>Este mensaje se ocultará automáticamente</small>
    </div>
  `;
  
  welcome.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    backdrop-filter: blur(5px);
    animation: welcomeShow 0.5s ease-out;
  `;
  
  const content = welcome.querySelector('.welcome-content');
  content.style.cssText = `
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: 20px;
    padding: 30px;
    text-align: center;
    color: var(--text-light);
    max-width: 400px;
    animation: welcomeContentShow 0.6s ease-out 0.2s both;
  `;
  
  content.querySelector('h3').style.marginBottom = '15px';
  content.querySelector('p').style.marginBottom = '20px';
  
  const shortcuts = content.querySelector('.welcome-shortcuts');
  shortcuts.style.cssText = `
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-bottom: 15px;
    flex-wrap: wrap;
  `;
  
  content.querySelectorAll('.welcome-key').forEach(key => {
    key.style.cssText = `
      background: rgba(255, 255, 255, 0.2);
      padding: 5px 10px;
      border-radius: 6px;
      font-family: monospace;
      font-weight: bold;
      font-size: 0.9rem;
    `;
  });
  
  content.querySelector('small').style.cssText = `
    opacity: 0.7;
    font-size: 0.8rem;
  `;

  document.body.appendChild(welcome);

  // Auto-hide after 5 seconds or on click
  const hideWelcome = () => {
    welcome.style.animation = 'welcomeHide 0.4s ease-in';
    setTimeout(() => {
      if (welcome.parentNode) {
        welcome.parentNode.removeChild(welcome);
      }
    }, 400);
  };

  setTimeout(hideWelcome, 5000);
  welcome.addEventListener('click', hideWelcome);
}

/**
 * Mostrar tooltip mejorado
 */
function showEnhancedTooltip(event) {
  const tooltip = document.createElement('div');
  tooltip.className = 'enhanced-tooltip';
  tooltip.textContent = event.target.getAttribute('title');
  
  // Remover título original para evitar tooltip nativo
  event.target.setAttribute('data-original-title', event.target.getAttribute('title'));
  event.target.removeAttribute('title');
  
  tooltip.style.cssText = `
    position: absolute;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.8rem;
    z-index: 1000;
    pointer-events: none;
    white-space: nowrap;
    animation: tooltipShow 0.2s ease-out;
  `;
  
  document.body.appendChild(tooltip);
  
  // Posicionar tooltip
  const rect = event.target.getBoundingClientRect();
  tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
  tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
  
  event.target._tooltip = tooltip;
}

/**
 * Ocultar tooltip mejorado
 */
function hideEnhancedTooltip(event) {
  if (event.target._tooltip) {
    event.target._tooltip.style.animation = 'tooltipHide 0.2s ease-in';
    setTimeout(() => {
      if (event.target._tooltip && event.target._tooltip.parentNode) {
        event.target._tooltip.parentNode.removeChild(event.target._tooltip);
      }
    }, 200);
    delete event.target._tooltip;
  }
  
  // Restaurar título original
  if (event.target.getAttribute('data-original-title')) {
    event.target.setAttribute('title', event.target.getAttribute('data-original-title'));
    event.target.removeAttribute('data-original-title');
  }
}

// Add some easter eggs and fun interactions
let konami = [];
const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // ↑↑↓↓←→←→BA

document.addEventListener("keydown", (e) => {
  konami.push(e.keyCode);
  if (konami.length > konamiCode.length) {
    konami.shift();
  }

  if (JSON.stringify(konami) === JSON.stringify(konamiCode)) {
    // Easter egg: confetti effect
    document.body.style.animation = "none";
    document.body.offsetHeight; // Trigger reflow
    document.body.style.animation = "rainbow 2s ease-in-out";

    setTimeout(() => {
      document.body.style.animation = "";
    }, 2000);
  }
});

/**
 * Parser inteligente para flashcards que maneja opciones múltiples
 * @param {string} input - Texto de entrada con flashcards
 * @returns {Array} - Array de objetos {question, answer}
 */
function parseFlashcards(input) {
  const flashcards = [];
  
  // Normalizar el input: eliminar espacios extra y unificar saltos de línea
  const normalizedInput = input.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Dividir por el separador ::
  const parts = normalizedInput.split('::');
  
  if (parts.length < 2) {
    return [];
  }
  
  // Procesar cada par pregunta-respuesta
  for (let i = 0; i < parts.length - 1; i++) {
    let questionPart = parts[i];
    let answerPart = parts[i + 1];
    
    // Si no es la primera parte, necesitamos separar la respuesta anterior de la nueva pregunta
    if (i > 0) {
      // La pregunta actual está al final de questionPart
      // Necesitamos encontrar dónde termina la respuesta anterior y empieza la nueva pregunta
      
      const lines = questionPart.split('\n');
      let questionStartIndex = -1;
      
      // Buscar hacia atrás desde el final para encontrar el inicio de la nueva pregunta
      for (let j = lines.length - 1; j >= 0; j--) {
        const line = lines[j].trim();
        
        // Una nueva pregunta puede empezar con:
        // 1. Una línea que contiene signos de interrogación
        // 2. Una línea que parece ser el título/inicio de una pregunta de opción múltiple
        // 3. Después de una línea vacía seguida de texto
        
        if (line === '') {
          // Línea vacía - posible separador entre respuesta y nueva pregunta
          if (j < lines.length - 1) {
            questionStartIndex = j + 1;
            break;
          }
        } else if (j === 0 || questionStartIndex === -1) {
          // Si llegamos al inicio o no hemos encontrado un punto de corte claro
          // Buscar patrones que indiquen el inicio de una pregunta
          
          // Verificar si esta línea y las siguientes parecen formar una pregunta completa
          let looksLikeQuestion = false;
          
          // Buscar hacia adelante para ver si hay opciones a), b), c), d)
          for (let k = j; k < lines.length; k++) {
            const nextLine = lines[k].trim();
            if (/^[a-z]\)/.test(nextLine)) {
              looksLikeQuestion = true;
              break;
            }
          }
          
          // O si contiene signos de interrogación
          if (line.includes('?') || looksLikeQuestion) {
            questionStartIndex = j;
            break;
          }
        }
      }
      
      // Si encontramos un punto de corte, separar respuesta anterior y nueva pregunta
      if (questionStartIndex > 0) {
        const previousAnswer = lines.slice(0, questionStartIndex).join('\n').trim();
        if (flashcards.length > 0 && previousAnswer) {
          // Agregar a la respuesta anterior, eliminando líneas vacías al inicio
          const cleanPreviousAnswer = previousAnswer.replace(/^\s*\n+/, '');
          if (cleanPreviousAnswer) {
            flashcards[flashcards.length - 1].answer += '\n' + cleanPreviousAnswer;
          }
        }
        questionPart = lines.slice(questionStartIndex).join('\n').trim();
      } else if (questionStartIndex === 0) {
        // La nueva pregunta empieza desde el inicio
        questionPart = questionPart.trim();
      } else {
        // No se encontró un punto de corte claro, asumir que todo es parte de la pregunta
        questionPart = questionPart.trim();
      }
    } else {
      // Primera parte, solo limpiar espacios
      questionPart = questionPart.trim();
    }
    
    // Para la respuesta, si no es la última iteración, necesitamos encontrar dónde termina
    if (i < parts.length - 2) {
      const answerLines = answerPart.split('\n');
      let actualAnswerLines = [];
      
      for (let j = 0; j < answerLines.length; j++) {
        const line = answerLines[j].trim();
        
        // Detectar si esta línea parece el inicio de una nueva pregunta
        // Criterios: línea vacía seguida de texto, o líneas que parecen preguntas
        if (line === '') {
          // Línea vacía - verificar si la siguiente parece una pregunta
          if (j < answerLines.length - 1) {
            const nextLine = answerLines[j + 1].trim();
            // Si la siguiente línea parece una pregunta, parar aquí
            if (nextLine && (nextLine.includes('?') || nextLine.includes(':'))) {
              break;
            }
          }
          actualAnswerLines.push(answerLines[j]);
        } else {
          // Línea con contenido - verificar si parece inicio de pregunta
          const isQuestionStart = line.includes('?') && !line.toLowerCase().includes('respuesta') && 
                                 !line.toLowerCase().includes('correcta') && 
                                 !line.toLowerCase().includes('correct');
          
          if (isQuestionStart && j > 0) {
            // Parece el inicio de una nueva pregunta
            break;
          }
          
          actualAnswerLines.push(answerLines[j]);
        }
      }
      
      answerPart = actualAnswerLines.join('\n').trim();
    } else {
      // Última respuesta, tomar todo
      answerPart = answerPart.trim();
    }
    
    // Limpiar y validar la pregunta y respuesta
    questionPart = questionPart.trim();
    answerPart = answerPart.trim();
    
    if (questionPart && answerPart) {
      flashcards.push({
        question: questionPart,
        answer: answerPart
      });
    }
  }
  
  return flashcards;
}

/**
 * Formatear texto con opciones múltiples para mejor visualización
 * @param {string} text - Texto que puede contener opciones múltiples
 * @returns {string} - Texto formateado con HTML
 */
function formatMultipleChoice(text) {
  // Detectar si el texto contiene opciones múltiples (a), b), c), d))
  const hasMultipleChoice = /[a-z]\)/g.test(text);
  
  if (!hasMultipleChoice) {
    // No hay opciones múltiples, devolver texto simple con saltos de línea
    return `<div class="simple-text">${text.replace(/\n/g, '<br>')}</div>`;
  }
  
  // Hay opciones múltiples - formatear con estilo mínimo para preservar la narración
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  let formattedText = '<div class="multiple-choice-text">';
  
  for (const line of lines) {
    if (/^[a-z]\)/.test(line)) {
      // Es una opción - agregar clase especial para estilo
      formattedText += `<div class="option-line">${line}</div>`;
    } else {
      // Es parte de la pregunta principal
      formattedText += `<div class="question-line">${line}</div>`;
    }
  }
  
  formattedText += '</div>';
  return formattedText;
}

// Exponer funciones globalmente para compatibilidad con onclick en HTML
window.speakText = speakText;
window.stopCurrentAudio = stopCurrentAudio;
window.playCurrentCardAudio = playCurrentCardAudio;
window.createFlashcards = createFlashcards;
window.nextCard = nextCard;
window.previousCard = previousCard;
window.toggleCard = toggleCard;
