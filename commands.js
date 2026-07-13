/**
 * Copyright (c) 2026 Ricardo Ratovoarisoa. Tous droits réservés.
 * Ce projet et son code source sont protégés sous licence propriétaire.
 *
 * Vocalis AI - Voice Commands & Dynamic Widgets
 * Analyse les commandes vocales en français et gère la création des widgets interactifs.
 */

// Stockage global des widgets actifs
const ActiveWidgets = {
    timers: [],
    notes: [],
    weather: []
};

/**
 * Analyse une transcription textuelle pour détecter et exécuter des commandes locales.
 * @param {string} text - Le texte transcrit
 * @returns {object|null} - Infos sur l'action exécutée ou null si aucune commande locale détectée
 */
function parseVoiceCommand(text) {
    const trimmedText = text.trim();
    const cleanText = trimmedText.toLowerCase();
    
    // ===== COMMANDES PRIORITAIRES ÉTUDIANT (SMART ROOM & POMODORO) =====
    
    // 1. Chambre Connectée (Smart Room)
    const lightMatch = trimmedText.match(/^(?:allume|éteins|active|désactive)\s+(?:la\s+)?(?:lampe|lumière)(?:\s+(?:de\s+)?bureau)?/i);
    const heatingMatch = trimmedText.match(/^(?:règle\s+)?(?:le\s+)?(?:chauffage|thermostat)\s*(?:à|sur)?\s*(\d+)/i) ||
                         trimmedText.match(/^(?:la\s+)?température\s*(?:à|sur)?\s*(\d+)/i);
    const coffeeMatch = trimmedText.match(/^(?:prépare|fais|lance|fais\s+couler)\s+(?:un\s+|le\s+|du\s+)?café/i) ||
                        trimmedText.match(/^café\s+(?:en\s+cours|lance|démarré)/i);
    const focusMatch = trimmedText.match(/^(?:active|désactive|lance|arrête)\s+(?:le\s+)?mode\s*(?:concentration|silence|focus)/i);

    if (lightMatch || heatingMatch || coffeeMatch || focusMatch) {
        let action = '';
        let value = null;
        let response = '';
        
        if (lightMatch) {
            const isOn = !cleanText.includes('éteins') && !cleanText.includes('désactive');
            action = 'light';
            value = isOn;
            response = isOn ? "J'allume la lampe de votre bureau." : "J'éteins la lampe de votre bureau.";
        } else if (heatingMatch) {
            const temp = parseInt(heatingMatch[1]);
            action = 'heating';
            value = temp;
            response = `Je règle le chauffage de la chambre sur ${temp} degrés.`;
        } else if (coffeeMatch) {
            action = 'coffee';
            value = true;
            response = "C'est parti, je lance la cafetière de votre chambre.";
        } else if (focusMatch) {
            const isOn = !cleanText.includes('désactive') && !cleanText.includes('arrête');
            action = 'focus';
            value = isOn;
            response = isOn ? "Mode concentration activé. Je passe en mode silence." : "Mode concentration désactivé.";
        }
        
        createSmartRoomWidget(action, value);
        return {
            type: 'smart_room',
            speechResponse: response,
            data: { action, value }
        };
    }

    // 2. Pomodoro / Sessions d'étude
    const pomodoroMatch = trimmedText.match(/^(?:lance|démarre|commence|crée|créer|lancer|démarrer)\s+(?:un\s+|une\s+)?(?:pomodoro|minuteur\s+d'étude|session\s+de\s+révision)/i) ||
                          cleanText === 'pomodoro';
    if (pomodoroMatch) {
        createPomodoroWidget();
        return {
            type: 'pomodoro',
            speechResponse: "C'est parti ! Je démarre une session d'étude de 25 minutes. Concentrez-vous bien.",
            data: null
        };
    }

    // ===== AUTRES COMMANDES LOCALES =====

    // 3. COMMANDE : Créer une note
    // Exemples : "crée une note : acheter des pommes", "ajoute une note de faire les courses"
    const noteMatch = trimmedText.match(/^(?:crée|ajoute|créer|ajouter)\s+(?:une\s+)?note\s*(?:de|:|à)?\s+(.+)$/i) || 
                      trimmedText.match(/^note\s*(?:de|:|à)?\s+(.+)$/i);
    if (noteMatch) {
        const content = noteMatch[1];
        createNoteWidget(content);
        return {
            type: 'note',
            speechResponse: `J'ai ajouté la note suivante : "${content}".`,
            data: content
        };
    }
    
    // 2. COMMANDE : Lancer un minuteur
    // Exemples : "lance un minuteur de 30 secondes", "minuteur 5 minutes"
    const timerMatch = trimmedText.match(/^(?:lance|démarre|crée|créer|lancer|démarrer|mets|mettre)\s+(?:un\s+)?minuteur\s*(?:de)?\s+(\d+)\s*(secondes|seconde|sec|s|minutes|minute|min|m)/i) ||
                        trimmedText.match(/^minuteur\s+(\d+)\s*(secondes|seconde|sec|s|minutes|minute|min|m)/i);
    if (timerMatch) {
        const duration = parseInt(timerMatch[1]);
        const unit = timerMatch[2].toLowerCase();
        let totalSeconds = duration;
        
        if (unit.startsWith('m')) {
            totalSeconds = duration * 60;
        }
        
        createTimerWidget(totalSeconds, `Minuteur de ${duration} ${unit}`);
        return {
            type: 'timer',
            speechResponse: `C'est parti pour un minuteur de ${duration} ${unit === 's' ? 'secondes' : unit}.`,
            data: totalSeconds
        };
    }
    
    // 3. COMMANDE : Météo
    // Exemples : "quel temps fait-il à Paris ?", "météo de Lyon"
    const weatherMatch = trimmedText.match(/^(?:quel\s+temps\s+fait-il\s+à|météo\s+à|temps\s+à|météo\s+de|temps\s+de)\s+(.+)$/i);
    if (weatherMatch) {
        const city = weatherMatch[1].replace(/[?.!]/g, '').trim();
        createWeatherWidget(city);
        // La réponse vocale sera modulée par les infos météo
        const weatherInfo = getMockWeatherData(city);
        return {
            type: 'weather',
            speechResponse: `Voici la météo pour ${weatherInfo.name} : il fait ${weatherInfo.temp} degrés avec un ciel ${weatherInfo.desc}.`,
            data: city
        };
    }
    
    // 4. COMMANDE : Calculatrice
    // Exemples : "combien font 25 plus 17", "calcule 120 divisé par 5"
    const calcMatch = trimmedText.match(/^(?:combien\s+font|calcule|calculer)\s+(.+)$/i);
    if (calcMatch) {
        const expression = calcMatch[1].replace(/[?.!]/g, '').trim();
        const result = evaluateExpression(expression);
        if (result !== null) {
            createCalcWidget(expression, result);
            return {
                type: 'calculator',
                speechResponse: `Le résultat de ${expression} est ${result}.`,
                data: result
            };
        }
    }
    
    // 5. COMMANDE : Jouer de la musique (YouTube)
    // Exemples : "joue du jazz", "mets la chanson Bohemian Rhapsody", "écoute Stromae"
    const musicMatch = trimmedText.match(/^(?:joue|écoute|mets|lance|play)\s+(?:la\s+musique|la\s+chanson|le\s+morceau|du|de\s+la|l'album)?\s*(.+)$/i) ||
                       trimmedText.match(/^(?:musique)\s+(.+)$/i);
    if (musicMatch && !cleanText.includes('vidéo') && !cleanText.includes('video')) {
        const query = musicMatch[1].replace(/[?.!]/g, '').trim();
        const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' music')}`;
        window.open(ytUrl, '_blank');
        createMediaWidget('music', query);
        return {
            type: 'music',
            speechResponse: `Je lance "${query}" sur YouTube. Bonne écoute !`,
            data: ytUrl
        };
    }
    
    // 6. COMMANDE : Regarder une vidéo (YouTube)
    // Exemples : "regarde une vidéo sur les dinosaures", "mets la vidéo de Mr Beast"
    const videoMatch = trimmedText.match(/^(?:regarde|regarder|lance|mets)\s+(?:la|une|le)?\s*vidéo\s*(?:de|sur|du)?\s*(.+)$/i) ||
                       trimmedText.match(/^(?:vidéo)\s+(?:de|sur)?\s*(.+)$/i);
    if (videoMatch) {
        const query = videoMatch[1].replace(/[?.!]/g, '').trim();
        const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        window.open(ytUrl, '_blank');
        createMediaWidget('video', query);
        return {
            type: 'video',
            speechResponse: `Je recherche la vidéo "${query}" sur YouTube.`,
            data: ytUrl
        };
    }
    
    // 7. COMMANDE : Contrôle du volume
    // Exemples : "augmente le volume", "baisse le son", "coupe le son", "volume à 50 pourcent"
    const volUpMatch = trimmedText.match(/^(?:augmente|monte|plus\s+fort)\s+(?:le\s+)?(?:volume|son)/i);
    const volDownMatch = trimmedText.match(/^(?:baisse|diminue|réduis|moins\s+fort)\s+(?:le\s+)?(?:volume|son)/i);
    const volMuteMatch = trimmedText.match(/^(?:coupe|mute|désactive|tais-toi)\s+(?:le\s+)?(?:volume|son)/i);
    const volUnmuteMatch = trimmedText.match(/^(?:remets|active|réactive)\s+(?:le\s+)?(?:volume|son)/i);
    const volSetMatch = trimmedText.match(/^(?:volume|son)\s+(?:à|a)\s+(\d+)\s*(?:pourcent|%)?/i);
    
    if (volUpMatch || volDownMatch || volMuteMatch || volUnmuteMatch || volSetMatch) {
        let currentVol = parseFloat(localStorage.getItem('app_volume') || '0.8');
        let action = '';
        
        if (volUpMatch) {
            currentVol = Math.min(1.0, currentVol + 0.2);
            action = 'augmenté';
        } else if (volDownMatch) {
            currentVol = Math.max(0.0, currentVol - 0.2);
            action = 'baissé';
        } else if (volMuteMatch) {
            currentVol = 0;
            action = 'coupé';
        } else if (volUnmuteMatch) {
            currentVol = 0.8;
            action = 'réactivé';
        } else if (volSetMatch) {
            currentVol = Math.min(1.0, Math.max(0, parseInt(volSetMatch[1]) / 100));
            action = `réglé à ${volSetMatch[1]}%`;
        }
        
        localStorage.setItem('app_volume', currentVol.toString());
        // Déclencher un événement global pour que app.js mette à jour
        window.dispatchEvent(new CustomEvent('vocalis-volume-change', { detail: { volume: currentVol } }));
        createVolumeWidget(currentVol);
        
        return {
            type: 'volume',
            speechResponse: `Volume ${action}. Niveau actuel : ${Math.round(currentVol * 100)} pourcent.`,
            data: currentVol
        };
    }
    
    // 8. COMMANDE : Explorateur de fichiers
    // Exemples : "ouvre mes fichiers", "cherche le fichier rapport", "explore mes documents"
    const fileOpenMatch = trimmedText.match(/^(?:ouvre|explore|parcours|affiche)\s+(?:mes\s+)?(?:fichiers|documents|dossiers)/i);
    const fileSearchMatch = trimmedText.match(/^(?:cherche|trouve|recherche)\s+(?:le\s+)?fichier\s+(.+)$/i) ||
                            trimmedText.match(/^(?:ouvre|ouvrir)\s+(?:le\s+)?fichier\s+(.+)$/i);
    
    if (fileOpenMatch) {
        // Lancer l'explorateur de fichiers
        if (typeof FileExplorer !== 'undefined') {
            FileExplorer.requestAccess();
        }
        return {
            type: 'file_explore',
            speechResponse: "J'ouvre l'explorateur de fichiers. Sélectionnez un dossier à parcourir.",
            data: null
        };
    }
    
    if (fileSearchMatch) {
        const fileName = fileSearchMatch[1].replace(/[?.!]/g, '').trim();
        if (typeof FileExplorer !== 'undefined') {
            FileExplorer.searchAndOpen(fileName);
        }
        return {
            type: 'file_search',
            speechResponse: `Je recherche le fichier "${fileName}" dans vos dossiers.`,
            data: fileName
        };
    }
    
    // 8.5 COMMANDE : Ouvrir un logiciel PC (Computer Use)
    // Exemples : "ouvre le logiciel calculatrice", "lance l'application notepad", "démarre chrome", "ouvrir whatsapp"
    const softwareMatch = trimmedText.match(/^(?:ouvre|ouvrir|lance|lancer|démarre|démarrer)\s+(?:le\s+logiciel|l'application|l'appli|le\s+programme)?\s*(.+)$/i);
    // On évite les conflits avec "ouvre le fichier" ou "ouvre mes fichiers"
    if (softwareMatch && !cleanText.includes('fichier') && !cleanText.includes('document')) {
        const appName = softwareMatch[1].replace(/[?.!]/g, '').trim();
        
        // Envoi de la requête au serveur Python local (Dejavu/Agent)
        fetch('http://localhost:5000/open-software', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ app_name: appName })
        }).then(response => response.json())
          .then(data => {
              if(data.status === 'success') {
                  console.log("Logiciel ouvert:", data.message);
              } else {
                  console.error("Erreur:", data.message);
              }
          }).catch(err => console.error("Erreur de connexion au serveur local:", err));
          
        return {
            type: 'open_software',
            speechResponse: `J'ouvre le logiciel ${appName} sur votre ordinateur.`,
            data: appName
        };
    }

    // 8.6 COMMANDE : Envoyer un message WhatsApp via Computer Use
    // Exemple : "envoie un message sur whatsapp disant bonjour comment ça va"
    const waSendMatch = trimmedText.match(/^(?:envoie\s+un\s+message\s+(?:sur\s+|dans\s+)?whatsapp\s+disant|écris\s+sur\s+whatsapp)\s+(.+)$/i);
    if (waSendMatch) {
        const message = waSendMatch[1].trim();
        fetch('http://localhost:5000/send-whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        }).catch(e => console.error(e));
        
        return {
            type: 'whatsapp_send',
            speechResponse: `J'ouvre WhatsApp et je tape le message.`,
            data: message
        };
    }
    
    // 8.7 COMMANDE : Traduire le message WhatsApp via Computer Use
    // Exemple : "traduis le message whatsapp"
    const waTransMatch = trimmedText.match(/^(?:traduis\s+le\s+message|traduis\s+whatsapp)/i);
    if (waTransMatch) {
        fetch('http://localhost:5000/translate-whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target_lang: 'fr' }) // La langue pourrait être dynamique
        }).then(res => res.json()).then(data => {
            if (data.status === 'success') {
                console.log("Traduction:", data.translated);
                const msg = new SpeechSynthesisUtterance("Traduction : " + data.translated);
                msg.lang = 'fr-FR';
                window.speechSynthesis.speak(msg);
            }
        }).catch(e => console.error(e));
        
        return {
            type: 'whatsapp_translate',
            speechResponse: "Je copie et traduis le message sélectionné dans WhatsApp...",
            data: null
        };
    }
    
    // 8.8 COMMANDE : Changement de langue explicite (Voice Switching)
    // Exemples : "parle anglais", "passe en anglais", "speak english", "spik inglich"
    const langSwitchMatch = trimmedText.match(/^(?:parle|passe\s+en|speak)\s+(anglais|français|espagnol|english|french|spanish|inglich)$/i);
    if (langSwitchMatch) {
        let requestedLang = langSwitchMatch[1].toLowerCase();
        let targetCode = 'fr-FR';
        let targetName = 'français';
        
        if (['anglais', 'english', 'inglich'].includes(requestedLang)) {
            targetCode = 'en-US';
            targetName = 'anglais';
        } else if (['espagnol', 'spanish'].includes(requestedLang)) {
            targetCode = 'es-ES';
            targetName = 'espagnol';
        }
        
        // Dire à app.js de changer de langue
        window.dispatchEvent(new CustomEvent('vocalis-change-lang', { detail: { lang: targetCode } }));
        
        return {
            type: 'lang_switch',
            speechResponse: `D'accord, je passe en ${targetName}.`,
            data: targetCode
        };
    }
    
    // 9. COMMANDE : Mode Dictée
    // Exemples : "mode dictée", "écris ce que je dis", "commence à écrire"
    const dictationStartMatch = trimmedText.match(/^(?:mode\s+dictée|écris\s+ce\s+que\s+je\s+dis|commence\s+à\s+écrire|dictée|mode\s+écriture)/i);
    const dictationStopMatch = trimmedText.match(/^(?:arrête\s+la\s+dictée|arrête\s+d'écrire|stop\s+dictée|fin\s+de\s+dictée)/i);
    const correctTextMatch = trimmedText.match(/^(?:corrige\s+le\s+texte|corrige\s+ça|correction)/i);
    
    if (dictationStartMatch) {
        window.dispatchEvent(new CustomEvent('vocalis-dictation', { detail: { action: 'start' } }));
        createDictationWidget();
        return {
            type: 'dictation_start',
            speechResponse: "Mode dictée activé. Je transcris tout ce que vous dites. Dites « arrête la dictée » pour terminer.",
            data: null
        };
    }
    
    if (dictationStopMatch) {
        window.dispatchEvent(new CustomEvent('vocalis-dictation', { detail: { action: 'stop' } }));
        return {
            type: 'dictation_stop',
            speechResponse: "Mode dictée désactivé. Votre texte est prêt.",
            data: null
        };
    }
    
    if (correctTextMatch) {
        window.dispatchEvent(new CustomEvent('vocalis-dictation', { detail: { action: 'correct' } }));
        return {
            type: 'dictation_correct',
            speechResponse: "Je corrige votre texte avec l'intelligence artificielle. Un instant...",
            data: null
        };
    }
    
    // 10. COMMANDE : Réflexion profonde
    // Exemples : "réfléchis sur l'amour", "pense à l'avenir de l'IA", "que penses-tu de la politique"
    const thinkMatch = trimmedText.match(/^(?:réfléchis|réfléchir|pense|penser|analyse|analyser)\s+(?:sur|à|au|aux)\s+(.+)$/i) ||
                       trimmedText.match(/^(?:que\s+penses-tu\s+de|ton\s+avis\s+sur|donne-moi\s+ton\s+avis\s+sur)\s+(.+)$/i);
    if (thinkMatch) {
        const subject = thinkMatch[1].replace(/[?.!]/g, '').trim();
        // Retourner un objet spécial que processUserInput gèrera
        return {
            type: 'deep_think',
            speechResponse: null, // Sera géré par processUserInput
            data: subject
        };
    }
    
    // 11. COMMANDE : Shazam (Reconnaissance musicale)
    const shazamMatch = trimmedText.match(/^(?:shazam|c'est\s+quoi\s+(?:cette|la)\s+musique|quelle\s+est\s+cette\s+(?:musique|chanson)|reconnais\s+cette\s+musique|identifie\s+cette\s+musique|reconnaître\s+cette\s+musique|quelle\s+est\s+la\s+chanson)/i);
    if (shazamMatch) {
        window.dispatchEvent(new CustomEvent('vocalis-shazam-trigger'));
        return {
            type: 'shazam',
            speechResponse: "D'accord, j'écoute la musique pour l'identifier.",
            data: null
        };
    }
    
    // 12. COMMANDE : Tout effacer
    if (cleanText === 'efface tout' || cleanText === 'supprime tout' || cleanText === 'nettoie l\'écran') {
        clearAllWidgets();
        return {
            type: 'clear',
            speechResponse: "J'ai effacé tous vos widgets et réinitialisé l'écran.",
            data: null
        };
    }

    // 13. COMMANDE : Recherche Web (Dernier recours car très générale)
    // Exemples : "cherche pizza sur google", "recherche l'histoire de France sur google"
    const searchMatch = trimmedText.match(/^(?:cherche|recherche|trouve)\s+(.+)\s+sur\s+google$/i) ||
                        trimmedText.match(/^(?:recherche|cherche|trouve)\s+(.+)$/i);
    if (searchMatch && (cleanText.includes('cherche') || cleanText.includes('recherche') || cleanText.includes('trouve'))) {
        const query = searchMatch[1].replace(/[?.!]/g, '').trim();
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        // Ouvrir directement
        window.open(searchUrl, '_blank');
        return {
            type: 'search',
            speechResponse: `Je lance la recherche pour "${query}" sur Google dans un nouvel onglet.`,
            data: searchUrl
        };
    }
    
    return null; // Pas une commande d'action directe, laisser à l'IA générale
}

/**
 * Crée un widget Note
 */
function createNoteWidget(content) {
    const container = document.getElementById('widgetsContainer');
    removeEmptyState();
    
    const widgetId = 'note-' + Date.now();
    const card = document.createElement('div');
    card.className = 'widget-card widget-note';
    card.id = widgetId;
    
    // Majuscule sur le premier caractère
    const formattedContent = content.charAt(0).toUpperCase() + content.slice(1);
    
    card.innerHTML = `
        <button class="widget-card-close" onclick="closeWidget('${widgetId}')"><i class="fa-solid fa-xmark"></i></button>
        <div class="widget-title"><i class="fa-solid fa-note-sticky"></i> Note</div>
        <div class="note-content">${formattedContent}</div>
    `;
    
    container.insertBefore(card, container.firstChild);
}

/**
 * Crée un widget Minuteur interactif
 */
function createTimerWidget(seconds, title) {
    const container = document.getElementById('widgetsContainer');
    removeEmptyState();
    
    const widgetId = 'timer-' + Date.now();
    const card = document.createElement('div');
    card.className = 'widget-card widget-timer';
    card.id = widgetId;
    
    card.innerHTML = `
        <button class="widget-card-close" onclick="closeWidget('${widgetId}')"><i class="fa-solid fa-xmark"></i></button>
        <div class="widget-title"><i class="fa-solid fa-stopwatch"></i> Minuteur</div>
        <div class="timer-layout">
            <div class="timer-ring">
                <svg class="timer-svg" viewBox="0 0 80 80">
                    <circle class="timer-circle-bg" cx="40" cy="40" r="36" />
                    <circle class="timer-circle-progress" id="progress-${widgetId}" cx="40" cy="40" r="36" />
                </svg>
                <div class="timer-text" id="time-${widgetId}">${formatTime(seconds)}</div>
            </div>
            <div class="timer-controls">
                <div class="timer-title-text">${title}</div>
                <div class="timer-btn-row">
                    <button class="timer-btn active" id="btn-pause-${widgetId}"><i class="fa-solid fa-pause"></i> Pause</button>
                    <button class="timer-btn" id="btn-reset-${widgetId}"><i class="fa-solid fa-rotate-left"></i> Reset</button>
                </div>
            </div>
        </div>
    `;
    
    container.insertBefore(card, container.firstChild);
    
    // Logique du décompte
    let remainingTime = seconds;
    let isPaused = false;
    const timeDisplay = document.getElementById(`time-${widgetId}`);
    const progressBar = document.getElementById(`progress-${widgetId}`);
    const pauseBtn = document.getElementById(`btn-pause-${widgetId}`);
    const resetBtn = document.getElementById(`btn-reset-${widgetId}`);
    
    const totalDash = 226; // 2 * PI * r = 226.19
    progressBar.style.strokeDashoffset = 0;
    
    const interval = setInterval(() => {
        if (isPaused) return;
        
        remainingTime--;
        
        // Mettre à jour l'affichage et la barre de progression
        timeDisplay.innerText = formatTime(remainingTime);
        const dashOffset = totalDash - (remainingTime / seconds) * totalDash;
        progressBar.style.strokeDashoffset = dashOffset;
        
        if (remainingTime <= 0) {
            clearInterval(interval);
            triggerTimerAlarm(widgetId, card);
        }
    }, 1000);
    
    // Gérer Pause / Reprendre
    pauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        if (isPaused) {
            pauseBtn.innerHTML = '<i class="fa-solid fa-play"></i> Reprendre';
            pauseBtn.classList.remove('active');
        } else {
            pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
            pauseBtn.classList.add('active');
        }
    });
    
    // Gérer Reset
    resetBtn.addEventListener('click', () => {
        remainingTime = seconds;
        isPaused = false;
        pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        pauseBtn.classList.add('active');
        timeDisplay.innerText = formatTime(seconds);
        progressBar.style.strokeDashoffset = 0;
        card.classList.remove('alarm-flash');
    });
    
    // Stocker l'intervalle pour pouvoir le détruire si on ferme le widget
    card.timerInterval = interval;
}

/**
 * Gère le déclenchement de la sonnerie d'un minuteur
 */
function triggerTimerAlarm(widgetId, cardElement) {
    cardElement.classList.add('alarm-flash');
    
    // Lancer le son
    const sound = document.getElementById('alertSound');
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log("L'utilisateur doit interagir d'abord pour jouer le son."));
    }
    
    // Modifier les contrôles
    const controls = cardElement.querySelector('.timer-controls');
    controls.innerHTML = `
        <div class="timer-title-text" style="color: var(--danger); font-weight: bold; animation: pulse 1s infinite;">Temps écoulé !</div>
        <div class="timer-btn-row">
            <button class="timer-btn" style="background: var(--danger); color: white; border: none;" onclick="stopTimerAlarm('${widgetId}')">
                <i class="fa-solid fa-volume-xmark"></i> Arrêter
            </button>
        </div>
    `;
}

/**
 * Arrête l'alarme du minuteur
 */
function stopTimerAlarm(widgetId) {
    const card = document.getElementById(widgetId);
    if (card) {
        card.classList.remove('alarm-flash');
        const sound = document.getElementById('alertSound');
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
        closeWidget(widgetId);
    }
}

/**
 * Crée un widget Météo avec des données stylisées
 */
/**
 * Dictionnaire de correspondance des codes météo WMO
 */
function getWMOWeatherInfo(code) {
    const mappings = {
        0: { desc: 'Ciel dégagé', icon: 'fa-solid fa-sun' },
        1: { desc: 'Principalement dégagé', icon: 'fa-solid fa-cloud-sun' },
        2: { desc: 'Partiellement nuageux', icon: 'fa-solid fa-cloud-sun' },
        3: { desc: 'Couvert', icon: 'fa-solid fa-cloud' },
        45: { desc: 'Brouillard', icon: 'fa-solid fa-smog' },
        48: { desc: 'Brouillard givrant', icon: 'fa-solid fa-smog' },
        51: { desc: 'Bruine légère', icon: 'fa-solid fa-cloud-rain' },
        53: { desc: 'Bruine modérée', icon: 'fa-solid fa-cloud-rain' },
        55: { desc: 'Bruine dense', icon: 'fa-solid fa-cloud-rain' },
        56: { desc: 'Bruine verglaçante légère', icon: 'fa-solid fa-cloud-rain' },
        57: { desc: 'Bruine verglaçante dense', icon: 'fa-solid fa-cloud-rain' },
        61: { desc: 'Pluie faible', icon: 'fa-solid fa-cloud-showers-heavy' },
        63: { desc: 'Pluie modérée', icon: 'fa-solid fa-cloud-showers-heavy' },
        65: { desc: 'Pluie forte', icon: 'fa-solid fa-cloud-showers-heavy' },
        66: { desc: 'Pluie verglaçante légère', icon: 'fa-solid fa-cloud-showers-heavy' },
        67: { desc: 'Pluie verglaçante forte', icon: 'fa-solid fa-cloud-showers-heavy' },
        71: { desc: 'Chute de neige légère', icon: 'fa-solid fa-snowflake' },
        73: { desc: 'Chute de neige modérée', icon: 'fa-solid fa-snowflake' },
        75: { desc: 'Chute de neige forte', icon: 'fa-solid fa-snowflake' },
        77: { desc: 'Grains de neige', icon: 'fa-solid fa-snowflake' },
        80: { desc: 'Averses de pluie faibles', icon: 'fa-solid fa-cloud-showers-heavy' },
        81: { desc: 'Averses de pluie modérées', icon: 'fa-solid fa-cloud-showers-heavy' },
        82: { desc: 'Averses de pluie violentes', icon: 'fa-solid fa-cloud-showers-heavy' },
        85: { desc: 'Averses de neige légères', icon: 'fa-solid fa-snowflake' },
        86: { desc: 'Averses de neige fortes', icon: 'fa-solid fa-snowflake' },
        95: { desc: 'Orage', icon: 'fa-solid fa-cloud-bolt' },
        96: { desc: 'Orage avec grêle légère', icon: 'fa-solid fa-cloud-bolt' },
        99: { desc: 'Orage avec grêle forte', icon: 'fa-solid fa-cloud-bolt' }
    };
    return mappings[code] || { desc: 'Nuageux', icon: 'fa-solid fa-cloud' };
}

/**
 * Crée un widget Météo avec des données réelles et l'heure locale
 */
function createWeatherWidget(city) {
    const container = document.getElementById('widgetsContainer');
    removeEmptyState();
    
    const widgetId = 'weather-' + Date.now();
    const card = document.createElement('div');
    card.className = 'widget-card widget-weather';
    card.id = widgetId;
    
    // Rendre l'état de chargement initial
    card.innerHTML = `
        <button class="widget-card-close" onclick="closeWidget('${widgetId}')"><i class="fa-solid fa-xmark"></i></button>
        <div class="widget-title"><i class="fa-solid fa-cloud"></i> Météo</div>
        <div class="weather-loading" id="loading-${widgetId}">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Récupération des données météo pour ${city}...</span>
        </div>
    `;
    
    container.insertBefore(card, container.firstChild);
    
    // Fonction locale pour charger les données mockées en cas d'erreur de réseau
    function loadFallbackWeather() {
        const info = getMockWeatherData(city);
        let iconClass = 'fa-solid fa-cloud-sun';
        if (info.desc.includes('soleil') || info.desc.includes('beau') || info.desc.includes('dégagé')) {
            iconClass = 'fa-solid fa-sun';
        } else if (info.desc.includes('pluie') || info.desc.includes('pluvieux')) {
            iconClass = 'fa-solid fa-cloud-showers-heavy';
        } else if (info.desc.includes('orage')) {
            iconClass = 'fa-solid fa-cloud-bolt';
        } else if (info.desc.includes('neige')) {
            iconClass = 'fa-solid fa-snowflake';
        } else if (info.desc.includes('nuageux') || info.desc.includes('couvert')) {
            iconClass = 'fa-solid fa-cloud';
        }
        
        const loadingEl = document.getElementById(`loading-${widgetId}`);
        if (loadingEl) {
            loadingEl.remove();
        }
        
        // Ajouter le contenu réel (fallback)
        const contentDiv = document.createElement('div');
        contentDiv.className = 'weather-layout';
        contentDiv.innerHTML = `
            <div class="weather-main">
                <i class="${iconClass} weather-icon"></i>
                <div class="weather-temp">${info.temp}°C</div>
            </div>
            <div class="weather-details">
                <div class="weather-city">${info.name}</div>
                <div>${info.desc}</div>
                <div>Humidité : ${info.humidity}% (Simulé)</div>
                <div>Vent : ${info.wind} km/h</div>
            </div>
        `;
        card.appendChild(contentDiv);
    }
    
    // Démarrer la requête asynchrone réelle
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`)
        .then(res => res.json())
        .then(geoData => {
            if (geoData.results && geoData.results.length > 0) {
                const geo = geoData.results[0];
                const displayName = geo.name + (geo.country ? `, ${geo.country_code ? geo.country_code.toUpperCase() : geo.country}` : '');
                
                // Récupérer la météo réelle avec les coordonnées et le bon fuseau horaire
                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current_weather=true&timezone=${geo.timezone || 'auto'}`)
                    .then(res => res.json())
                    .then(weatherData => {
                        if (weatherData.current_weather) {
                            const cur = weatherData.current_weather;
                            const wmoInfo = getWMOWeatherInfo(cur.weathercode);
                            
                            // Formater l'heure locale de la ville cible (Norme ISO 8601)
                            let localTimeStr = '--:--';
                            if (cur.time) {
                                try {
                                    const dateObj = new Date(cur.time + "Z"); // Open-Meteo renvoie l'heure locale sans Z
                                    localTimeStr = new Intl.DateTimeFormat(document.documentElement.lang || 'fr-FR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        timeZone: 'UTC' 
                                    }).format(dateObj);
                                } catch (e) {
                                    localTimeStr = cur.time.split('T')[1] || '--:--';
                                }
                            }
                            
                            const loadingEl = document.getElementById(`loading-${widgetId}`);
                            if (loadingEl) {
                                loadingEl.remove();
                            }
                            
                            const contentDiv = document.createElement('div');
                            contentDiv.className = 'weather-layout';
                            contentDiv.innerHTML = `
                                <div class="weather-main">
                                    <i class="${wmoInfo.icon} weather-icon"></i>
                                    <div class="weather-temp">${Math.round(cur.temperature)}°C</div>
                                </div>
                                <div class="weather-details">
                                    <div class="weather-city">${displayName}</div>
                                    <div>${wmoInfo.desc}</div>
                                    <div class="weather-time"><i class="fa-regular fa-clock"></i> Heure locale : ${localTimeStr}</div>
                                    <div>Vent : ${Math.round(cur.windspeed)} km/h</div>
                                </div>
                            `;
                            card.appendChild(contentDiv);
                        } else {
                            loadFallbackWeather();
                        }
                    })
                    .catch(err => {
                        console.warn("Erreur API météo :", err);
                        loadFallbackWeather();
                    });
            } else {
                loadFallbackWeather();
            }
        })
        .catch(err => {
            console.warn("Erreur API géocodage :", err);
            loadFallbackWeather();
        });
}

/**
 * Crée un widget Calculatrice
 */
function createCalcWidget(expression, result) {
    const container = document.getElementById('widgetsContainer');
    removeEmptyState();
    
    const widgetId = 'calc-' + Date.now();
    const card = document.createElement('div');
    card.className = 'widget-card widget-calc';
    card.id = widgetId;
    
    card.innerHTML = `
        <button class="widget-card-close" onclick="closeWidget('${widgetId}')"><i class="fa-solid fa-xmark"></i></button>
        <div class="widget-title"><i class="fa-solid fa-calculator"></i> Calcul</div>
        <div class="calc-layout">
            <div class="calc-expression">${expression} =</div>
            <div class="calc-result">${result}</div>
        </div>
    `;
    
    container.insertBefore(card, container.firstChild);
}

/* --- Widgets chambre connectée et Pomodoro --- */

// État global de la chambre intelligente
const SmartRoomState = {
    light: false,
    heating: 20,
    coffee: false,
    focus: false
};

if (localStorage.getItem('smart_room_state')) {
    try {
        Object.assign(SmartRoomState, JSON.parse(localStorage.getItem('smart_room_state')));
    } catch(e) {}
}

window.toggleSmartRoomLight = function(cardId) {
    SmartRoomState.light = !SmartRoomState.light;
    localStorage.setItem('smart_room_state', JSON.stringify(SmartRoomState));
    updateSmartRoomWidgetUI(cardId);
};

window.adjustSmartRoomHeating = function(cardId, amount) {
    SmartRoomState.heating = Math.max(15, Math.min(30, SmartRoomState.heating + amount));
    localStorage.setItem('smart_room_state', JSON.stringify(SmartRoomState));
    updateSmartRoomWidgetUI(cardId);
};

window.triggerSmartRoomCoffee = function(cardId) {
    if (SmartRoomState.coffee) return;
    SmartRoomState.coffee = true;
    localStorage.setItem('smart_room_state', JSON.stringify(SmartRoomState));
    updateSmartRoomWidgetUI(cardId);
    
    setTimeout(() => {
        SmartRoomState.coffee = false;
        localStorage.setItem('smart_room_state', JSON.stringify(SmartRoomState));
        updateSmartRoomWidgetUI(cardId);
        const sound = document.getElementById('alertSound');
        if (sound) {
            sound.play().catch(e => {});
        }
    }, 8000);
};

window.toggleSmartRoomFocus = function(cardId) {
    SmartRoomState.focus = !SmartRoomState.focus;
    localStorage.setItem('smart_room_state', JSON.stringify(SmartRoomState));
    updateSmartRoomWidgetUI(cardId);
};

function updateSmartRoomWidgetUI(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const btnLight = card.querySelector('.sr-btn-light');
    const txtHeating = card.querySelector('.sr-heating-val');
    const btnCoffee = card.querySelector('.sr-btn-coffee');
    const btnFocus = card.querySelector('.sr-btn-focus');
    
    if (btnLight) {
        if (SmartRoomState.light) {
            btnLight.classList.add('active');
            btnLight.innerHTML = '<i class="fa-solid fa-lightbulb text-yellow"></i><span>Lampe : ALLUMÉE</span>';
        } else {
            btnLight.classList.remove('active');
            btnLight.innerHTML = '<i class="fa-regular fa-lightbulb"></i><span>Lampe : ÉTEINTE</span>';
        }
    }
    
    if (txtHeating) {
        txtHeating.textContent = `${SmartRoomState.heating}°C`;
    }
    
    if (btnCoffee) {
        if (SmartRoomState.coffee) {
            btnCoffee.classList.add('active');
            btnCoffee.innerHTML = '<i class="fa-solid fa-mug-hot text-brown fa-bounce"></i><span>Café en cours...</span>';
        } else {
            btnCoffee.classList.remove('active');
            btnCoffee.innerHTML = '<i class="fa-solid fa-mug-hot"></i><span>Prêt pour un café</span>';
        }
    }
    
    if (btnFocus) {
        if (SmartRoomState.focus) {
            btnFocus.classList.add('active');
            btnFocus.innerHTML = '<i class="fa-solid fa-eye-slash text-purple"></i><span>Focus : ACTIF</span>';
        } else {
            btnFocus.classList.remove('active');
            btnFocus.innerHTML = '<i class="fa-solid fa-eye"></i><span>Mode normal</span>';
        }
    }
}

function createSmartRoomWidget(action, value) {
    const container = document.getElementById('widgetsContainer');
    const existing = container.querySelector('.widget-smart-room');
    
    if (action) {
        SmartRoomState[action] = value;
        localStorage.setItem('smart_room_state', JSON.stringify(SmartRoomState));
        
        if (action === 'coffee' && value === true) {
            setTimeout(() => {
                SmartRoomState.coffee = false;
                localStorage.setItem('smart_room_state', JSON.stringify(SmartRoomState));
                if (existing) updateSmartRoomWidgetUI(existing.id);
            }, 8000);
        }
    }
    
    if (existing) {
        updateSmartRoomWidgetUI(existing.id);
        existing.style.transform = 'scale(1.03)';
        setTimeout(() => { existing.style.transform = 'none'; }, 200);
        return;
    }
    
    removeEmptyState();
    
    const widgetId = 'smartroom-' + Date.now();
    const card = document.createElement('div');
    card.className = 'widget-card widget-smart-room';
    card.id = widgetId;
    
    card.innerHTML = `
        <button class="widget-card-close" onclick="closeWidget('${widgetId}')"><i class="fa-solid fa-xmark"></i></button>
        <div class="widget-title"><i class="fa-solid fa-house-laptop"></i> Chambre Connectée</div>
        <div class="smart-room-grid">
            <button class="sr-module-btn sr-btn-light" onclick="toggleSmartRoomLight('${widgetId}')">
                <i class="fa-regular fa-lightbulb"></i>
                <span>Lampe : ÉTEINTE</span>
            </button>
            <div class="sr-module-thermostat">
                <div class="sr-thermostat-header">
                    <i class="fa-solid fa-temperature-half"></i>
                    <span>Chauffage</span>
                </div>
                <div class="sr-thermostat-controls">
                    <button class="sr-temp-btn" onclick="adjustSmartRoomHeating('${widgetId}', -1)">-</button>
                    <span class="sr-heating-val">${SmartRoomState.heating}°C</span>
                    <button class="sr-temp-btn" onclick="adjustSmartRoomHeating('${widgetId}', 1)">+</button>
                </div>
            </div>
            <button class="sr-module-btn sr-btn-coffee" onclick="triggerSmartRoomCoffee('${widgetId}')">
                <i class="fa-solid fa-mug-hot"></i>
                <span>Prêt pour un café</span>
            </button>
            <button class="sr-module-btn sr-btn-focus" onclick="toggleSmartRoomFocus('${widgetId}')">
                <i class="fa-solid fa-eye"></i>
                <span>Mode normal</span>
            </button>
        </div>
    `;
    
    container.insertBefore(card, container.firstChild);
    updateSmartRoomWidgetUI(widgetId);
}

window.togglePomodoroTimer = function(widgetId) {
    const card = document.getElementById(widgetId);
    if (!card) return;
    card.isPaused = !card.isPaused;
    
    const playBtn = document.getElementById(`pomoBtnPlay-${widgetId}`);
    if (playBtn) {
        playBtn.innerHTML = card.isPaused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
    }
};

window.resetPomodoroTimer = function(widgetId) {
    const card = document.getElementById(widgetId);
    if (!card) return;
    
    card.isPaused = true;
    card.mode = 'focus';
    card.timeRemaining = 1500;
    card.totalTime = 1500;
    
    const playBtn = document.getElementById(`pomoBtnPlay-${widgetId}`);
    if (playBtn) {
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
    
    const statusText = document.getElementById(`pomoStatus-${widgetId}`);
    if (statusText) {
        statusText.textContent = "Focus 📚";
        statusText.classList.remove('break-mode');
    }
    
    const msgText = document.getElementById(`pomoMsg-${widgetId}`);
    if (msgText) {
        msgText.textContent = "Reste concentré, tu peux le faire !";
    }
    
    updatePomodoroWidgetUI(card);
};

function updatePomodoroWidgetUI(card) {
    const mins = Math.floor(card.timeRemaining / 60);
    const secs = card.timeRemaining % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const timeEl = document.getElementById(`pomoTime-${card.id}`);
    if (timeEl) {
        timeEl.textContent = timeStr;
    }
    
    const progressCircle = card.querySelector('.pomodoro-circle-progress');
    if (progressCircle) {
        const radius = 50;
        const circumference = 2 * Math.PI * radius;
        const progress = card.timeRemaining / card.totalTime;
        const offset = circumference - (progress * circumference);
        progressCircle.style.strokeDashoffset = offset;
    }
}

function createPomodoroWidget() {
    const container = document.getElementById('widgetsContainer');
    removeEmptyState();
    
    const widgetId = 'pomodoro-' + Date.now();
    const card = document.createElement('div');
    card.className = 'widget-card widget-pomodoro';
    card.id = widgetId;
    
    card.timeRemaining = 1500;
    card.totalTime = 1500;
    card.isPaused = false;
    card.mode = 'focus';
    
    card.innerHTML = `
        <button class="widget-card-close" onclick="closeWidget('${widgetId}')"><i class="fa-solid fa-xmark"></i></button>
        <div class="widget-title"><i class="fa-solid fa-brain"></i> Session d'étude (Pomodoro)</div>
        <div class="pomodoro-layout">
            <div class="pomodoro-circle-container">
                <svg class="pomodoro-svg" width="120" height="120">
                    <circle class="pomodoro-circle-bg" cx="60" cy="60" r="50"></circle>
                    <circle class="pomodoro-circle-progress" cx="60" cy="60" r="50" style="stroke-dasharray: 314.16; stroke-dashoffset: 0;"></circle>
                </svg>
                <div class="pomodoro-time" id="pomoTime-${widgetId}">25:00</div>
            </div>
            <div class="pomodoro-details">
                <div class="pomodoro-status" id="pomoStatus-${widgetId}">Focus 📚</div>
                <div class="pomodoro-message" id="pomoMsg-${widgetId}">Reste concentré, tu peux le faire !</div>
                <div class="pomodoro-controls">
                    <button class="pomo-control-btn pomo-btn-play" id="pomoBtnPlay-${widgetId}" onclick="togglePomodoroTimer('${widgetId}')">
                        <i class="fa-solid fa-pause"></i>
                    </button>
                    <button class="pomo-control-btn pomo-btn-reset" onclick="resetPomodoroTimer('${widgetId}')">
                        <i class="fa-solid fa-rotate-left"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    card.timerInterval = setInterval(() => {
        if (card.isPaused) return;
        
        card.timeRemaining--;
        if (card.timeRemaining <= 0) {
            const sound = document.getElementById('alertSound');
            if (sound) sound.play().catch(e => {});
            
            if (card.mode === 'focus') {
                card.mode = 'break';
                card.timeRemaining = 300; // 5 mins break
                card.totalTime = 300;
                const statusEl = document.getElementById(`pomoStatus-${widgetId}`);
                if (statusEl) {
                    statusEl.textContent = "Pause ☕";
                    statusEl.classList.add('break-mode');
                }
                const msgEl = document.getElementById(`pomoMsg-${widgetId}`);
                if (msgEl) msgEl.textContent = "Prends l'air et étire-toi !";
            } else {
                card.mode = 'focus';
                card.timeRemaining = 1500;
                card.totalTime = 1500;
                const statusEl = document.getElementById(`pomoStatus-${widgetId}`);
                if (statusEl) {
                    statusEl.textContent = "Focus 📚";
                    statusEl.classList.remove('break-mode');
                }
                const msgEl = document.getElementById(`pomoMsg-${widgetId}`);
                if (msgEl) msgEl.textContent = "Reste concentré, tu peux le faire !";
            }
        }
        
        updatePomodoroWidgetUI(card);
    }, 1000);
    
    container.insertBefore(card, container.firstChild);
}

/* --- Fonctions Utilitaires --- */

// Ferme un widget spécifique
window.closeWidget = function(widgetId) {
    const widget = document.getElementById(widgetId);
    if (widget) {
        // Stopper les timers actifs
        if (widget.timerInterval) {
            clearInterval(widget.timerInterval);
        }
        
        // Ajouter une classe d'animation de sortie
        widget.style.transform = 'scale(0.9) translateY(-15px)';
        widget.style.opacity = '0';
        widget.style.transition = 'all 0.25s ease';
        
        setTimeout(() => {
            widget.remove();
            checkEmptyState();
        }, 250);
    }
};

// Tout effacer
function clearAllWidgets() {
    const container = document.getElementById('widgetsContainer');
    const cards = container.querySelectorAll('.widget-card');
    cards.forEach(card => {
        if (card.timerInterval) clearInterval(card.timerInterval);
        card.remove();
    });
    
    // Arrêter le son si actif
    const sound = document.getElementById('alertSound');
    if (sound) {
        sound.pause();
        sound.currentTime = 0;
    }
    
    checkEmptyState();
}

// Mises à jour du badge de nombre de widgets actifs
function updateWidgetCountBadge() {
    const container = document.getElementById('widgetsContainer');
    if (!container) return;
    const cards = container.querySelectorAll('.widget-card');
    const badge = document.getElementById('widgetCountBadge');
    if (badge) {
        badge.textContent = cards.length;
        if (cards.length > 0) {
            badge.classList.add('visible');
        } else {
            badge.classList.remove('visible');
        }
    }
}

// Vérifie si le panneau est vide et affiche le message par défaut
function checkEmptyState() {
    const container = document.getElementById('widgetsContainer');
    const cards = container.querySelectorAll('.widget-card');
    const emptyState = document.getElementById('emptyWidgetsState');
    
    if (cards.length === 0 && emptyState) {
        emptyState.style.display = 'flex';
    }
    updateWidgetCountBadge();
}

// Retire le message de panneau vide
function removeEmptyState() {
    const emptyState = document.getElementById('emptyWidgetsState');
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    updateWidgetCountBadge();
}

// Formate les secondes en MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Simule des données météo haute fidélité pour n'importe quelle ville
function getMockWeatherData(cityName) {
    const city = cityName.trim();
    const formattedCity = city.charAt(0).toUpperCase() + city.slice(1);
    
    // Base de données simulée pour les grandes villes
    const db = {
        'paris': { temp: 19, desc: 'légèrement nuageux', humidity: 62, wind: 15 },
        'marseille': { temp: 27, desc: 'grand soleil', humidity: 45, wind: 25 },
        'lyon': { temp: 22, desc: 'ciel voilé', humidity: 55, wind: 10 },
        'montreal': { temp: 24, desc: 'pluie fine', humidity: 80, wind: 20 },
        'montréal': { temp: 24, desc: 'pluie fine', humidity: 80, wind: 20 },
        'bruxelles': { temp: 16, desc: 'pluvieux', humidity: 85, wind: 18 },
        'brussels': { temp: 16, desc: 'pluvieux', humidity: 85, wind: 18 },
        'geneve': { temp: 21, desc: 'dégagé et beau', humidity: 50, wind: 8 },
        'genève': { temp: 21, desc: 'dégagé et beau', humidity: 50, wind: 8 },
        'londres': { temp: 15, desc: 'couvert et brumeux', humidity: 90, wind: 22 },
        'tokyo': { temp: 28, desc: 'chaud et humide', humidity: 75, wind: 12 },
        'new york': { temp: 25, desc: 'orage passager', humidity: 68, wind: 14 }
    };
    
    const key = city.toLowerCase();
    if (db[key]) {
        return { name: formattedCity, ...db[key] };
    }
    
    // Génération semi-aléatoire pour les autres villes
    // Utilise le nom de la ville comme graine de hasard pour garder les résultats cohérents
    let seed = 0;
    for (let i = 0; i < key.length; i++) {
        seed += key.charCodeAt(i);
    }
    
    const temps = [12, 15, 18, 22, 26, 30, 8, -2];
    const descs = ['grand soleil', 'nuageux', 'couvert', 'pluie fine', 'pluie torrentielle', 'ciel dégagé', 'brumeux'];
    
    const tempIndex = seed % temps.length;
    const descIndex = seed % descs.length;
    const humidity = 40 + (seed % 50);
    const wind = 5 + (seed % 35);
    
    return {
        name: formattedCity,
        temp: temps[tempIndex],
        desc: descs[descIndex],
        humidity: humidity,
        wind: wind
    };
}

// Évalue une expression mathématique textuelle en français de manière sûre
function evaluateExpression(expr) {
    let clean = expr.toLowerCase();
    
    // Remplacements en français
    clean = clean.replace(/plus/g, '+');
    clean = clean.replace(/moins/g, '-');
    clean = clean.replace(/fois/g, '*');
    clean = clean.replace(/multiplié\s+par/g, '*');
    clean = clean.replace(/x/g, '*');
    clean = clean.replace(/divisé\s+par/g, '/');
    clean = clean.replace(/sur/g, '/');
    
    // Nettoyer pour ne garder QUE les chiffres, opérateurs mathématiques de base et parenthèses
    clean = clean.replace(/[^0-9+\-*/().\s]/g, '');
    
    try {
        // Utilisation sûre de Function au lieu de eval direct
        const result = new Function(`return (${clean})`)();
        if (result === undefined || isNaN(result) || !isFinite(result)) {
            return null;
        }
        // Limiter le nombre de décimales
        return Number(result.toFixed(4));
    } catch (e) {
        return null;
    }
}

/**
 * Crée un widget Média (Musique ou Vidéo)
 */
function createMediaWidget(type, query) {
    const container = document.getElementById('widgetsContainer');
    removeEmptyState();
    
    const widgetId = `media-${Date.now()}`;
    const card = document.createElement('div');
    card.className = `widget-card widget-media widget-media-${type}`;
    card.id = widgetId;
    
    const icon = type === 'music' ? 'fa-music' : 'fa-film';
    const title = type === 'music' ? 'Musique' : 'Vidéo';
    const emoji = type === 'music' ? '🎵' : '🎬';
    
    card.innerHTML = `
        <button class="widget-card-close" onclick="closeWidget('${widgetId}')"><i class="fa-solid fa-xmark"></i></button>
        <div class="widget-title"><i class="fa-solid ${icon}"></i> ${title}</div>
        <div class="media-layout">
            <div class="media-icon-pulse">${emoji}</div>
            <div class="media-info">
                <div class="media-query">${query}</div>
                <div class="media-source">Ouvert sur YouTube</div>
            </div>
        </div>
    `;
    
    container.insertBefore(card, container.firstChild);
}

/**
 * Crée un widget Shazam (Reconnaissance Musicale)
 */
function createShazamWidget(songInfo) {
    const container = document.getElementById('widgetsContainer');
    removeEmptyState();
    
    const widgetId = `shazam-${Date.now()}`;
    const card = document.createElement('div');
    card.className = `widget-card widget-shazam`;
    card.id = widgetId;
    
    const linksHtml = [];
    if (songInfo.song_link) {
        linksHtml.push(`<a href="${songInfo.song_link}" target="_blank" class="shazam-link-btn listen-link" title="Écouter"><i class="fa-solid fa-up-right-from-square"></i> Lis.tn</a>`);
    }
    if (songInfo.spotify_link) {
        linksHtml.push(`<a href="${songInfo.spotify_link}" target="_blank" class="shazam-link-btn spotify-link" title="Spotify"><i class="fa-brands fa-spotify"></i> Spotify</a>`);
    }
    if (songInfo.apple_music_link) {
        linksHtml.push(`<a href="${songInfo.apple_music_link}" target="_blank" class="shazam-link-btn apple-link" title="Apple Music"><i class="fa-brands fa-apple"></i> Apple</a>`);
    }
    if (songInfo.youtube_link) {
        linksHtml.push(`<a href="${songInfo.youtube_link}" target="_blank" class="shazam-link-btn youtube-link" title="YouTube"><i class="fa-brands fa-youtube"></i> YouTube</a>`);
    }
    
    card.innerHTML = `
        <button class="widget-card-close" onclick="closeWidget('${widgetId}')"><i class="fa-solid fa-xmark"></i></button>
        <div class="widget-title"><i class="fa-solid fa-music" style="color: #0088ff;"></i> Shazam AI</div>
        <div class="shazam-layout">
            <div class="shazam-disc-art">
                <i class="fa-solid fa-compact-disc animated-disc"></i>
            </div>
            <div class="shazam-info">
                <div class="shazam-song-title">${songInfo.title}</div>
                <div class="shazam-artist">${songInfo.artist}</div>
                ${songInfo.album ? `<div class="shazam-album"><i class="fa-solid fa-record-vinyl"></i> ${songInfo.album}</div>` : ''}
                ${songInfo.release_date ? `<div class="shazam-release"><i class="fa-solid fa-calendar-days"></i> ${songInfo.release_date}</div>` : ''}
            </div>
        </div>
        ${linksHtml.length > 0 ? `<div class="shazam-actions">${linksHtml.join('')}</div>` : ''}
    `;
    
    container.insertBefore(card, container.firstChild);
}

/**
 * Crée un widget Volume
 */
function createVolumeWidget(volume) {
    const container = document.getElementById('widgetsContainer');
    removeEmptyState();
    
    // Supprimer l'ancien widget volume s'il existe
    const existing = container.querySelector('.widget-volume');
    if (existing) existing.remove();
    
    const widgetId = `vol-${Date.now()}`;
    const card = document.createElement('div');
    card.className = 'widget-card widget-volume';
    card.id = widgetId;
    
    const pct = Math.round(volume * 100);
    let volIcon = 'fa-volume-high';
    if (pct === 0) volIcon = 'fa-volume-xmark';
    else if (pct < 40) volIcon = 'fa-volume-low';
    else if (pct < 70) volIcon = 'fa-volume-low';
    
    card.innerHTML = `
        <button class="widget-card-close" onclick="closeWidget('${widgetId}')"><i class="fa-solid fa-xmark"></i></button>
        <div class="widget-title"><i class="fa-solid fa-sliders"></i> Volume</div>
        <div class="volume-layout">
            <i class="fa-solid ${volIcon} volume-icon"></i>
            <div class="volume-bar-track">
                <div class="volume-bar-fill" style="width: ${pct}%"></div>
            </div>
            <span class="volume-pct">${pct}%</span>
        </div>
    `;
    
    container.insertBefore(card, container.firstChild);
    
    // Auto-supprimer après 4 secondes
    setTimeout(() => {
        const el = document.getElementById(widgetId);
        if (el) {
            el.style.opacity = '0';
            el.style.transform = 'scale(0.9)';
            setTimeout(() => { el.remove(); checkEmptyState(); }, 300);
        }
    }, 4000);
}

/**
 * Crée un widget Dictée
 */
function createDictationWidget() {
    const container = document.getElementById('widgetsContainer');
    removeEmptyState();
    
    // Ne pas créer en double
    if (container.querySelector('.widget-dictation')) return;
    
    const widgetId = `dictation-${Date.now()}`;
    const card = document.createElement('div');
    card.className = 'widget-card widget-dictation';
    card.id = widgetId;
    
    card.innerHTML = `
        <button class="widget-card-close" onclick="closeWidget('${widgetId}'); window.dispatchEvent(new CustomEvent('vocalis-dictation', {detail:{action:'stop'}}))"><i class="fa-solid fa-xmark"></i></button>
        <div class="widget-title"><i class="fa-solid fa-pen-fancy"></i> Mode Dictée <span class="dictation-status-badge">● En cours</span></div>
        <div class="dictation-layout">
            <div class="dictation-text-area" id="dictationTextArea" contenteditable="true" placeholder="Votre texte apparaîtra ici..."></div>
            <div class="dictation-corrected hidden" id="dictationCorrected">
                <div class="corrected-header"><i class="fa-solid fa-wand-magic-sparkles"></i> Texte corrigé</div>
                <div class="corrected-text" id="dictationCorrectedText"></div>
            </div>
            <div class="dictation-actions">
                <button class="dictation-btn" onclick="window.dispatchEvent(new CustomEvent('vocalis-dictation', {detail:{action:'correct'}}))">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> Corriger
                </button>
                <button class="dictation-btn" onclick="copyDictationText()">
                    <i class="fa-solid fa-copy"></i> Copier
                </button>
                <button class="dictation-btn btn-danger-light" onclick="clearDictationText()">
                    <i class="fa-solid fa-eraser"></i> Effacer
                </button>
            </div>
        </div>
    `;
    
    container.insertBefore(card, container.firstChild);
}

// Copier le texte de la dictée
function copyDictationText() {
    const corrected = document.getElementById('dictationCorrectedText');
    const original = document.getElementById('dictationTextArea');
    const textToCopy = (corrected && corrected.textContent.trim()) ? corrected.textContent : (original ? original.textContent : '');
    
    if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            const btn = document.querySelector('.dictation-btn:nth-child(2)');
            if (btn) {
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Copié !';
                setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-copy"></i> Copier'; }, 2000);
            }
        });
    }
}

// Effacer le texte de la dictée
function clearDictationText() {
    const area = document.getElementById('dictationTextArea');
    const corrected = document.getElementById('dictationCorrected');
    if (area) area.textContent = '';
    if (corrected) corrected.classList.add('hidden');
}
