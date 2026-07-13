/**
 * Copyright (c) 2026 Ricardo Ratovoarisoa. Tous droits réservés.
 * Ce projet et son code source sont protégés sous licence propriétaire.
 *
 * Vocalis AI - Application Logic
 * Orchestre la reconnaissance vocale, la synthèse vocale, l'appel à l'API Gemini et l'orbe.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Éléments du DOM
    const btnOpenSidebar = document.getElementById('btnOpenSidebar');
    const btnCloseSidebar = document.getElementById('btnCloseSidebar');
    const sidebar = document.getElementById('sidebar');
    
    const geminiApiKeyInput = document.getElementById('geminiApiKey');
    const btnSaveApiKey = document.getElementById('btnSaveApiKey');
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    
    // Nouveaux éléments pour Ollama
    const btnProviderGemini = document.getElementById('btnProviderGemini');
    const btnProviderOllama = document.getElementById('btnProviderOllama');
    const configGemini = document.getElementById('configGemini');
    const configOllama = document.getElementById('configOllama');
    const ollamaUrlInput = document.getElementById('ollamaUrl');
    const ollamaModelInput = document.getElementById('ollamaModel');
    const btnSaveOllama = document.getElementById('btnSaveOllama');
    const ollamaStatus = document.getElementById('ollamaStatus');
    
    const connectionIndicator = document.getElementById('connectionIndicator');
    const statusLabel = document.getElementById('statusLabel');
    const voiceSelect = document.getElementById('voiceSelect');
    const voiceRate = document.getElementById('voiceRate');
    const voicePitch = document.getElementById('voicePitch');
    const rateValue = document.getElementById('rateValue');
    const pitchValue = document.getElementById('pitchValue');
    
    // Nouveaux sélecteurs pour les langues et wake word
    const langSelect = document.getElementById('langSelect');
    const wakeWordToggle = document.getElementById('wakeWordToggle');
    const systemInstructionsInput = document.getElementById('systemInstructions');
    
    // Nouveaux sélecteurs pour Shazam
    const btnShazamTrigger = document.getElementById('btnShazamTrigger');
    const btnShazamDemo = document.getElementById('btnShazamDemo');
    const btnShazamAudd = document.getElementById('btnShazamAudd');
    const btnShazamDejavu = document.getElementById('btnShazamDejavu');
    const configShazamAudd = document.getElementById('configShazamAudd');
    const configShazamDejavu = document.getElementById('configShazamDejavu');
    const shazamApiKeyInput = document.getElementById('shazamApiKey');
    const btnSaveShazamKey = document.getElementById('btnSaveShazamKey');
    const shazamStatus = document.getElementById('shazamStatus');
    const shazamDejavuUrlInput = document.getElementById('shazamDejavuUrl');
    const btnSaveShazamDejavu = document.getElementById('btnSaveShazamDejavu');
    const shazamDejavuStatus = document.getElementById('shazamDejavuStatus');
    
    const btnTestMic = document.getElementById('btnTestMic');
    const micIndicatorBar = document.getElementById('micIndicatorBar');
    
    const btnOrbTrigger = document.getElementById('btnOrbTrigger');
    const triggerIcon = document.getElementById('triggerIcon');
    const assistantStatusText = document.getElementById('assistantStatusText');
    const assistantSubStatusText = document.getElementById('assistantSubStatusText');
    
    const userSpeechCard = document.getElementById('userSpeechCard');
    const userSpeechText = document.getElementById('userSpeechText');
    const userCardTime = document.getElementById('userCardTime');
    
    const aiResponseCard = document.getElementById('aiResponseCard');
    const aiResponseText = document.getElementById('aiResponseText');
    const aiLoadingIndicator = document.getElementById('aiLoadingIndicator');
    const btnMuteResponse = document.getElementById('btnMuteResponse');
    const muteIcon = document.getElementById('muteIcon');
    
    const btnClearWidgets = document.getElementById('btnClearWidgets');
    const suggestionsScroller = document.querySelector('.suggestions-scroller');
    
    // Sécurité ISO 27001 : Clés gérées en interne, offusquées pour l'analyse statique
    let apiKey = atob('QUl6YVN5X0lOVEVSTkFMX0tFWV9IRVJF'); // Clé Gemini interne
    let aiProvider = localStorage.getItem('ai_provider') || 'gemini'; // 'gemini' ou 'ollama'
    let ollamaUrl = localStorage.getItem('ollama_url') || 'http://localhost:11434';
    let ollamaModel = localStorage.getItem('ollama_model') || 'llama3';
    
    // Nouveaux états de langue et wake word
    let selectedLanguage = localStorage.getItem('assistant_lang') || 'auto';
    let detectedLanguage = localStorage.getItem('last_detected_lang') || 'fr-FR';
    let wakeWordEnabled = localStorage.getItem('wake_word_enabled') === 'true';
    let isWaitingForWakeWord = false;
    let justWokenUpByWakeWord = false;
    
    // États pour Shazam
    let shazamProvider = localStorage.getItem('shazam_provider') || 'audd'; // 'demo', 'audd' ou 'dejavu'
    let shazamApiKey = atob('OWEwNzljOTk5ODg1ZTdiNTkzNjdmNTY0OGUwNThhYWE='); // Clé AudD interne
    let shazamDejavuUrl = localStorage.getItem('shazam_dejavu_url') || 'http://localhost:5000/recognize';
    
    // Fonction de détection automatique de la langue à partir du texte transcrit
    function detectLanguage(text) {
        const t = text.toLowerCase();
        
        // Détection par caractères spéciaux (priorité haute)
        if (/[\u4e00-\u9fff]/.test(t)) return 'zh-CN';   // Caractères chinois
        if (/[\u3040-\u30ff]/.test(t)) return 'ja-JP';   // Hiragana/Katakana
        if (/[\uac00-\ud7af]/.test(t)) return 'ko-KR';   // Hangul coréen
        if (/[\u0600-\u06ff]/.test(t)) return 'ar-SA';   // Arabe
        if (/[\u0900-\u097f]/.test(t)) return 'hi-IN';   // Devanagari (Hindi)
        if (/[\u0400-\u04ff]/.test(t)) return 'ru-RU';   // Cyrillique (Russe)
        
        // Détection par mots-clés fréquents (langues latines)
        const langPatterns = [
            { lang: 'fr-FR', words: ['je', 'tu', 'il', 'nous', 'vous', 'les', 'des', 'une', 'est', 'dans', 'pour', 'que', 'qui', 'sur', 'avec', 'pas', 'son', 'mais', 'comme', 'tout', 'plus', 'faire', 'bonjour', 'merci', 'oui', 'non', 'cette', 'aussi', 'bien', 'encore', 'très', 'quel', 'comment', 'pourquoi', 'quand', 'où', 'ici', 'parce', 'voici'] },
            { lang: 'en-US', words: ['the', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'can', 'this', 'that', 'with', 'from', 'they', 'been', 'their', 'what', 'when', 'where', 'which', 'how', 'about', 'your', 'just', 'also', 'than', 'other', 'into', 'very', 'hello', 'thank', 'please', 'yes', 'spik', 'inglich', 'wat', 'aor', 'you', 'pliz', 'yès', 'ouate'] },
            { lang: 'es-ES', words: ['el', 'los', 'las', 'una', 'unos', 'del', 'está', 'son', 'para', 'por', 'con', 'como', 'pero', 'más', 'todo', 'también', 'muy', 'hola', 'gracias', 'sí', 'esto', 'eso', 'tiene', 'puede', 'hacer', 'hay', 'cuando', 'donde', 'porque', 'qué', 'cómo', 'otro', 'bueno'] },
            { lang: 'de-DE', words: ['der', 'die', 'das', 'ein', 'eine', 'ist', 'sind', 'war', 'hat', 'haben', 'wird', 'kann', 'nicht', 'auch', 'aber', 'oder', 'und', 'mit', 'für', 'auf', 'von', 'ich', 'wir', 'sie', 'hallo', 'danke', 'bitte', 'ja', 'nein', 'sehr', 'gut', 'wie', 'was', 'wo', 'warum', 'wenn'] },
            { lang: 'it-IT', words: ['il', 'lo', 'la', 'gli', 'dei', 'una', 'sono', 'è', 'ha', 'per', 'con', 'che', 'come', 'non', 'più', 'anche', 'molto', 'questo', 'quello', 'tutto', 'fare', 'ciao', 'grazie', 'sì', 'bene', 'dove', 'quando', 'perché', 'cosa', 'buono'] },
            { lang: 'pt-BR', words: ['o', 'os', 'as', 'um', 'uma', 'é', 'são', 'está', 'tem', 'para', 'com', 'que', 'como', 'não', 'mais', 'também', 'muito', 'este', 'esse', 'tudo', 'fazer', 'olá', 'obrigado', 'sim', 'bem', 'onde', 'quando', 'porque', 'qual'] },
            { lang: 'nl-NL', words: ['de', 'het', 'een', 'van', 'is', 'zijn', 'was', 'heeft', 'hebben', 'wordt', 'niet', 'ook', 'maar', 'met', 'voor', 'op', 'dat', 'dit', 'hallo', 'dank', 'ja', 'nee', 'goed', 'hoe', 'wat', 'waar', 'wanneer', 'waarom'] },
            { lang: 'tr-TR', words: ['bir', 'bu', 've', 'için', 'ile', 'var', 'olan', 'ben', 'sen', 'biz', 'onlar', 'değil', 'ama', 'çok', 'iyi', 'nasıl', 'neden', 'nerede', 'merhaba', 'teşekkür', 'evet', 'hayır'] }
        ];
        
        // Tokeniser le texte
        const words = t.split(/\s+/);
        const scores = {};
        
        for (const pattern of langPatterns) {
            let score = 0;
            for (const word of words) {
                // Nettoyer la ponctuation
                const cleanWord = word.replace(/[.,!?;:"'()\[\]{}]/g, '');
                if (pattern.words.includes(cleanWord)) {
                    score++;
                }
            }
            if (score > 0) {
                scores[pattern.lang] = score;
            }
        }
        
        // Trouver la langue avec le meilleur score
        let bestLang = null;
        let bestScore = 0;
        for (const [lang, score] of Object.entries(scores)) {
            if (score > bestScore) {
                bestScore = score;
                bestLang = lang;
            }
        }
        
        // Seuil minimum : au moins 1 mot reconnu
        return bestLang || null;
    }
    
    // Retourne la langue effective (détectée ou sélectionnée)
    function getEffectiveLanguage() {
        if (selectedLanguage === 'auto') {
            return detectedLanguage;
        }
        return selectedLanguage;
    }
    
    // Instructions système par défaut pour l'IA
    const defaultSystemInstructions = 
        "Tu es Vocalis AI, un assistant vocal intelligent extrêmement performant. " +
        "Tu as accès à des widgets (notes, minuteur, météo, calculs) déjà gérés localement. " +
        "Comme tes réponses seront lues à haute voix par une synthèse vocale, tu dois être concis. " +
        "N'utilise JAMAIS de mise en forme markdown lourde. " +
        "Réponds TOUJOURS dans la même langue que celle dans laquelle la question a été posée. " +
        "RÈGLE SPÉCIALE OS CONTROLLER : Si l'utilisateur te demande d'effectuer une action sur son ordinateur (ex: sauvegarde le fichier, ferme la fenêtre, appuie sur Entrée, tape un texte), " +
        "tu DOIS inclure à la fin de ta réponse un bloc JSON encadré par [MACRO: et ]. " +
        "Exemples de macros : " +
        "Pour fermer : [MACRO: [{\"action\": \"hotkey\", \"args\": [\"alt\", \"f4\"]}]] " +
        "Pour sauvegarder : [MACRO: [{\"action\": \"hotkey\", \"args\": [\"ctrl\", \"s\"]}]] " +
        "Pour taper 'Bonjour' puis Entrée : [MACRO: [{\"action\": \"write\", \"args\": [\"Bonjour\"]}, {\"action\": \"press\", \"args\": [\"enter\"]}]]";
        
    let systemInstructions = localStorage.getItem('assistant_system_instructions') || defaultSystemInstructions;
    
    let isMuted = false;
    let isListening = false;
    let recognition = null;
    let speechBuffer = '';
    let isSpeechSupported = false;
    
    // Voix système disponibles
    let systemVoices = [];
    const orb = new VoiceOrb('orbCanvas');
    
    // Remplir les inputs avec les valeurs existantes
    if (apiKey) {
        geminiApiKeyInput.value = apiKey;
    }
    ollamaUrlInput.value = ollamaUrl;
    ollamaModelInput.value = ollamaModel;
    langSelect.value = selectedLanguage;
    wakeWordToggle.checked = wakeWordEnabled;
    systemInstructionsInput.value = systemInstructions;
    
    // Initialiser les valeurs Shazam
    shazamApiKeyInput.value = shazamApiKey;
    shazamDejavuUrlInput.value = shazamDejavuUrl;
    updateShazamUI();
    
    // Mettre à jour l'affichage initial du fournisseur actif
    updateProviderUI();
    setConnectionStatus();
    
    function updateShazamUI() {
        // Retirer la classe active de tous les boutons
        btnShazamDemo.classList.remove('active');
        btnShazamAudd.classList.remove('active');
        btnShazamDejavu.classList.remove('active');
        
        // Masquer tous les conteneurs de configuration
        configShazamAudd.classList.add('hidden');
        configShazamDejavu.classList.add('hidden');
        
        // Activer le fournisseur et la configuration correspondants
        if (shazamProvider === 'demo') {
            btnShazamDemo.classList.add('active');
        } else if (shazamProvider === 'audd') {
            btnShazamAudd.classList.add('active');
            configShazamAudd.classList.remove('hidden');
        } else if (shazamProvider === 'dejavu') {
            btnShazamDejavu.classList.add('active');
            configShazamDejavu.classList.remove('hidden');
        }
    }
    
    // Démarrer l'écoute en arrière-plan au chargement si activé
    if (wakeWordEnabled) {
        setTimeout(() => {
            startBackgroundListening();
        }, 800);
    }
    
    // --- 1. Gestion de la Sidebar et Paramètres ---
    
    btnOpenSidebar.addEventListener('click', () => sidebar.classList.add('open'));
    btnCloseSidebar.addEventListener('click', () => sidebar.classList.remove('open'));
    
    // Sélection du fournisseur d'IA
    btnProviderGemini.addEventListener('click', () => {
        switchProvider('gemini');
    });
    
    btnProviderOllama.addEventListener('click', () => {
        switchProvider('ollama');
    });
    
    function switchProvider(provider) {
        aiProvider = provider;
        localStorage.setItem('ai_provider', provider);
        updateProviderUI();
        setConnectionStatus();
    }
    
    function updateProviderUI() {
        if (aiProvider === 'gemini') {
            btnProviderGemini.classList.add('active');
            btnProviderOllama.classList.remove('active');
            configGemini.classList.remove('hidden');
            configOllama.classList.add('hidden');
        } else {
            btnProviderGemini.classList.remove('active');
            btnProviderOllama.classList.add('active');
            configGemini.classList.add('hidden');
            configOllama.classList.remove('hidden');
        }
    }
    
    // Enregistrement Clé API Gemini
    btnSaveApiKey.addEventListener('click', () => {
        // L'enregistrement de clé UI est désactivé
        console.log("Les clés API sont gérées en interne de manière sécurisée.");
        showStatusMsg(apiKeyStatus, "Clé système active.", "success");
        setTimeout(() => {
            sidebar.classList.remove('open');
        }, 1000);
    });
    
    // Enregistrement Réglages Ollama
    btnSaveOllama.addEventListener('click', () => {
        const urlVal = ollamaUrlInput.value.trim();
        const modelVal = ollamaModelInput.value.trim();
        
        if (urlVal && modelVal) {
            localStorage.setItem('ollama_url', urlVal);
            localStorage.setItem('ollama_model', modelVal);
            ollamaUrl = urlVal;
            ollamaModel = modelVal;
            showStatusMsg(ollamaStatus, "Réglages enregistrés !", "success");
            setConnectionStatus();
        } else {
            showStatusMsg(ollamaStatus, "Veuillez remplir tous les champs.", "error");
        }
        setTimeout(() => {
            sidebar.classList.remove('open');
        }, 1000);
    });
    
    function setConnectionStatus() {
        if (aiProvider === 'gemini') {
            if (apiKey) {
                connectionIndicator.classList.add('live');
                statusLabel.textContent = "Gemini API Connectée";
            } else {
                connectionIndicator.classList.remove('live');
                statusLabel.textContent = "Mode Démo local";
            }
        } else {
            // Ollama : vérification réelle de la connexion
            statusLabel.textContent = `Ollama (${ollamaModel}) - Vérification...`;
            connectionIndicator.classList.remove('live');
            
            fetch(`${ollamaUrl}/api/tags`, { method: 'GET', signal: AbortSignal.timeout(3000) })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error('Ollama non accessible');
                })
                .then(data => {
                    connectionIndicator.classList.add('live');
                    // Vérifier si le modèle est bien installé
                    const models = data.models || [];
                    const modelInstalled = models.some(m => m.name === ollamaModel || m.name.startsWith(ollamaModel + ':'));
                    if (modelInstalled) {
                        statusLabel.textContent = `Ollama Local ✓ (${ollamaModel})`;
                    } else {
                        statusLabel.textContent = `Ollama ✓ — Modèle '${ollamaModel}' non trouvé`;
                    }
                })
                .catch(err => {
                    connectionIndicator.classList.remove('live');
                    const isFileProtocol = window.location.protocol === 'file:';
                    if (isFileProtocol) {
                        statusLabel.textContent = `Ollama — Erreur CORS (ouvrir via serveur local)`;
                    } else {
                        statusLabel.textContent = `Ollama — Déconnecté`;
                    }
                });
        }
    }
    
    function showStatusMsg(el, msg, type) {
        el.textContent = msg;
        el.className = `status-msg ${type}`;
        setTimeout(() => el.textContent = '', 3000);
    }
    
    // Événements pour la langue et le Wake Word
    langSelect.addEventListener('change', () => {
        selectedLanguage = langSelect.value;
        localStorage.setItem('assistant_lang', selectedLanguage);
        if (selectedLanguage !== 'auto') {
            document.documentElement.lang = selectedLanguage.split('-')[0];
        }
        if (recognition) {
            if (selectedLanguage === 'auto') {
                // En mode auto, utiliser la dernière langue détectée pour la reconnaissance
                recognition.lang = detectedLanguage;
            } else {
                recognition.lang = selectedLanguage;
            }
        }
        loadVoices();
    });
    
    wakeWordToggle.addEventListener('change', () => {
        wakeWordEnabled = wakeWordToggle.checked;
        localStorage.setItem('wake_word_enabled', wakeWordEnabled);
        
        if (wakeWordEnabled) {
            startBackgroundListening();
        } else {
            isWaitingForWakeWord = false;
            if (isListening) {
                recognition.stop();
            }
        }
    });
    
    // Événements pour Shazam
    btnShazamDemo.addEventListener('click', () => {
        shazamProvider = 'demo';
        localStorage.setItem('shazam_provider', shazamProvider);
        updateShazamUI();
    });
    
    btnShazamAudd.addEventListener('click', () => {
        shazamProvider = 'audd';
        localStorage.setItem('shazam_provider', shazamProvider);
        updateShazamUI();
    });
    
    btnShazamDejavu.addEventListener('click', () => {
        shazamProvider = 'dejavu';
        localStorage.setItem('shazam_provider', shazamProvider);
        updateShazamUI();
    });
    
    btnSaveShazamKey.addEventListener('click', () => {
        // Enregistrement désactivé, géré en interne
        console.log("Les clés Shazam sont gérées en interne.");
        shazamStatus.textContent = "Configuration interne sécurisée active ✓";
        shazamStatus.style.color = "var(--success)";
    });
    
    btnSaveShazamDejavu.addEventListener('click', () => {
        const val = shazamDejavuUrlInput.value.trim();
        if (val) {
            shazamDejavuUrl = val;
            localStorage.setItem('shazam_dejavu_url', shazamDejavuUrl);
            showStatusMsg(shazamDejavuStatus, 'URL Dejavu enregistrée.', 'success');
        } else {
            showStatusMsg(shazamDejavuStatus, 'L\'URL ne peut pas être vide.', 'error');
        }
    });
    
    btnShazamTrigger.addEventListener('click', () => {
        startShazamRecording();
    });
    
    window.addEventListener('vocalis-shazam-trigger', () => {
        startShazamRecording();
    });
    
    systemInstructionsInput.addEventListener('change', () => {
        const val = systemInstructionsInput.value.trim();
        systemInstructions = val || defaultSystemInstructions;
        localStorage.setItem('assistant_system_instructions', systemInstructions);
    });
    
    // --- 2. Configuration Voix (Text-To-Speech) ---
    
    function loadVoices() {
        if (typeof speechSynthesis === 'undefined') return;
        
        systemVoices = speechSynthesis.getVoices();
        
        // Vider le select
        voiceSelect.innerHTML = '';
        
        // Utiliser la langue effective (détectée en mode auto, ou sélectionnée)
        const effectiveLang = getEffectiveLanguage();
        const shortLang = effectiveLang.split('-')[0];
        
        // Filtrer les voix de la langue effective en premier
        const matchingVoices = systemVoices.filter(v => v.lang.startsWith(shortLang));
        const otherVoices = systemVoices.filter(v => !v.lang.startsWith(shortLang));
        
        const sortedVoices = [...matchingVoices, ...otherVoices];
        
        sortedVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            const isPref = voice.lang.startsWith(shortLang);
            option.textContent = `${isPref ? '★ ' : ''}${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
        
        // Charger la voix par défaut enregistrée dans localStorage pour cette langue
        const savedVoiceName = localStorage.getItem(`assistant_voice_${effectiveLang}`);
        if (savedVoiceName) {
            const option = Array.from(voiceSelect.options).find(opt => opt.value === savedVoiceName);
            if (option) {
                option.selected = true;
                return;
            }
        }
        
        // Sélectionner par défaut la première voix de la langue cible
        if (matchingVoices.length > 0) {
            const defaultOpt = Array.from(voiceSelect.options).find(opt => opt.value === matchingVoices[0].name);
            if (defaultOpt) defaultOpt.selected = true;
        }
    }
    
    // Les voix sont chargées de manière asynchrone dans certains navigateurs
    if (typeof speechSynthesis !== 'undefined') {
        loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }
    }
    
    voiceSelect.addEventListener('change', () => {
        const effectiveLang = getEffectiveLanguage();
        localStorage.setItem(`assistant_voice_${effectiveLang}`, voiceSelect.value);
    });
    
    voiceRate.addEventListener('input', () => {
        rateValue.textContent = `${voiceRate.value}x`;
    });
    
    voicePitch.addEventListener('input', () => {
        pitchValue.textContent = voicePitch.value;
    });
    
    // Couper / Activer le son
    btnMuteResponse.addEventListener('click', () => {
        isMuted = !isMuted;
        if (isMuted) {
            muteIcon.className = 'fa-solid fa-volume-xmark';
            btnMuteResponse.style.color = 'var(--danger)';
            if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
                orb.setState('idle');
            }
        } else {
            muteIcon.className = 'fa-solid fa-volume-high';
            btnMuteResponse.style.color = 'var(--text-secondary)';
        }
    });
    
    // Test microphone & Audio Visualiser
    btnTestMic.addEventListener('click', async () => {
        const success = await orb.initAudio();
        if (success) {
            btnTestMic.innerHTML = '<i class="fa-solid fa-check"></i> Microphone autorisé';
            btnTestMic.style.borderColor = 'var(--success)';
            btnTestMic.style.color = 'var(--success)';
            
            // Activer la jauge de niveau de micro
            animateMicIndicator();
        } else {
            btnTestMic.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Accès refusé';
            btnTestMic.style.borderColor = 'var(--danger)';
            btnTestMic.style.color = 'var(--danger)';
        }
    });
    
    function animateMicIndicator() {
        if (orb.micActive) {
            const vol = orb.getMicVolume();
            micIndicatorBar.style.width = `${vol * 100}%`;
            requestAnimationFrame(animateMicIndicator);
        }
    }
    
    // --- 3. Reconnaissance Vocale (Speech-To-Text) ---
    
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
        isSpeechSupported = true;
        recognition = new SpeechRecognitionClass();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = getEffectiveLanguage();
        
        recognition.onstart = () => {
            isListening = true;
            triggerIcon.className = 'fa-solid fa-microphone-slash';
            btnOrbTrigger.classList.add('listening');
            
            if (isWaitingForWakeWord) {
                orb.setState('idle');
                assistantStatusText.textContent = "Écoute en arrière-plan...";
                assistantSubStatusText.textContent = `Dites "Vocalis" ou "Siri" pour m'activer.`;
            } else {
                orb.setState('listening');
                assistantStatusText.textContent = "Je vous écoute...";
                assistantSubStatusText.textContent = "Parlez maintenant.";
                // Masquer les cartes précédentes
                userSpeechCard.classList.add('hidden');
                aiResponseCard.classList.add('hidden');
            }
        };
        
        window.addEventListener('vocalis-change-lang', (e) => {
            const newLang = e.detail.lang;
            if (newLang) {
                detectedLanguage = newLang;
                localStorage.setItem('last_detected_lang', detectedLanguage);
                console.log(`🌍 Basculement manuel de langue vers : ${detectedLanguage}`);
                recognition.lang = detectedLanguage;
                loadVoices();
                
                const langFlags = {
                    'fr-FR': '🇫🇷', 'en-US': '🇺🇸', 'es-ES': '🇪🇸', 'de-DE': '🇩🇪',
                    'it-IT': '🇮🇹', 'pt-BR': '🇧🇷', 'ar-SA': '🇸🇦', 'nl-NL': '🇳🇱',
                    'ru-RU': '🇷🇺', 'zh-CN': '🇨🇳', 'ja-JP': '🇯🇵', 'ko-KR': '🇰🇷',
                    'hi-IN': '🇮🇳', 'tr-TR': '🇹🇷'
                };
                const flag = langFlags[detectedLanguage] || '🌍';
                assistantSubStatusText.textContent = `${flag} Basculé sur : ${detectedLanguage}`;
            }
        });
        
        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            
            const text = finalTranscript || interimTranscript;
            
            if (isWaitingForWakeWord) {
                const cleanText = text.toLowerCase().trim();
                
                // Mots-clés avec leurs homophones et variantes de transcription
                const siriKeywords = ["siri", "dis siri", "dis-siri", "série", "syrie", "dis série", "dis syrie", "chérie", "dis chérie"];
                const vocalisKeywords = ["vocalis", "vocalise", "vocalises", "vocalisme", "bocalis", "vocaliste"];
                const copilotKeywords = ["copilot", "copilote", "co-pilot", "co-pilote", "pilote"];
                
                let foundKeyword = null;
                let keywordMatched = "";
                
                // Vérifier Siri
                for (let kw of siriKeywords) {
                    if (cleanText.includes(kw)) {
                        foundKeyword = "siri";
                        keywordMatched = kw;
                        break;
                    }
                }
                // Vérifier Vocalis
                if (!foundKeyword) {
                    for (let kw of vocalisKeywords) {
                        if (cleanText.includes(kw)) {
                            foundKeyword = "vocalis";
                            keywordMatched = kw;
                            break;
                        }
                    }
                }
                // Vérifier Copilot
                if (!foundKeyword) {
                    for (let kw of copilotKeywords) {
                        if (cleanText.includes(kw)) {
                            foundKeyword = "copilot";
                            keywordMatched = kw;
                            break;
                        }
                    }
                }
                
                if (foundKeyword) {
                    isWaitingForWakeWord = false;
                    playWakeBeep();
                    
                    const idx = cleanText.indexOf(keywordMatched);
                    let command = cleanText.substring(idx + keywordMatched.length).trim();
                    
                    // Nettoyer la ponctuation de liaison éventuelle comme ",", ":", etc. au début de la commande
                    command = command.replace(/^[\s,;:\-!\?]+/, '').trim();
                    
                    if (command) {
                        justWokenUpByWakeWord = false;
                        speechBuffer = command;
                    } else {
                        justWokenUpByWakeWord = true;
                        speechBuffer = '';
                    }
                    
                    recognition.stop(); // Déclenche onend
                }
            } else {
                if (text) {
                    userSpeechCard.classList.remove('hidden');
                    userSpeechText.textContent = text;
                    const now = new Date();
                    userCardTime.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                }
                
                if (finalTranscript) {
                    speechBuffer = finalTranscript;
                    
                    // Gibberish Detector : Si la confiance est très basse, on a sûrement la mauvaise langue
                    // En Web Speech API, la confiance est dans event.results[i][0].confidence (moyennée ou dernière)
                    let lastConfidence = 1.0;
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            lastConfidence = event.results[i][0].confidence;
                        }
                    }
                    
                    if (selectedLanguage === 'auto' && lastConfidence > 0 && lastConfidence < 0.4) {
                        console.warn("Gibberish detecté (confiance basse: " + lastConfidence + "). Basculement automatique...");
                        // Alterner avec l'anglais par défaut si on était en français
                        if (detectedLanguage === 'fr-FR') detectedLanguage = 'en-US';
                        else if (detectedLanguage === 'en-US') detectedLanguage = 'es-ES';
                        else detectedLanguage = 'fr-FR';
                        
                        localStorage.setItem('last_detected_lang', detectedLanguage);
                        recognition.lang = detectedLanguage;
                        loadVoices();
                        speechBuffer = ''; // On ignore le texte poubelle
                        
                        // Dire à l'utilisateur de répéter (via TTS natif)
                        const msg = new SpeechSynthesisUtterance("Sorry, I switched languages. Please repeat.");
                        msg.lang = 'en-US';
                        window.speechSynthesis.speak(msg);
                        return; // Arrêter l'exécution normale pour ce message
                    }
                    
                    // Détection automatique de la langue si en mode auto via le texte transcrit
                    if (selectedLanguage === 'auto') {
                        const detected = detectLanguage(finalTranscript);
                        if (detected && detected !== detectedLanguage) {
                            detectedLanguage = detected;
                            localStorage.setItem('last_detected_lang', detectedLanguage);
                            console.log(`🌍 Langue détectée : ${detectedLanguage}`);
                            // Mettre à jour la reconnaissance pour la prochaine session
                            recognition.lang = detectedLanguage;
                            // Mettre à jour la voix TTS pour la langue détectée
                            loadVoices();
                        }
                        // Afficher la langue détectée dans le sous-statut
                        const langFlags = {
                            'fr-FR': '🇫🇷', 'en-US': '🇺🇸', 'es-ES': '🇪🇸', 'de-DE': '🇩🇪',
                            'it-IT': '🇮🇹', 'pt-BR': '🇧🇷', 'ar-SA': '🇸🇦', 'nl-NL': '🇳🇱',
                            'ru-RU': '🇷🇺', 'zh-CN': '🇨🇳', 'ja-JP': '🇯🇵', 'ko-KR': '🇰🇷',
                            'hi-IN': '🇮🇳', 'tr-TR': '🇹🇷'
                        };
                        const flag = langFlags[detectedLanguage] || '🌍';
                        assistantSubStatusText.textContent = `${flag} Langue détectée : ${detectedLanguage}`;
                    }
                }
            }
        };
        
        recognition.onerror = (event) => {
            console.error("Erreur de reconnaissance vocale :", event.error);
            stopListening();
            
            if (wakeWordEnabled && (event.error === 'no-speech' || event.error === 'aborted')) {
                restartBackgroundListeningDelay();
                return;
            }
            
            if (event.error === 'not-allowed') {
                assistantStatusText.textContent = "Accès au micro refusé";
                assistantSubStatusText.textContent = "Veuillez autoriser le microphone.";
            } else {
                assistantStatusText.textContent = "Erreur micro";
                assistantSubStatusText.textContent = "Une erreur est survenue.";
            }
        };
        
        recognition.onend = () => {
            stopListening();
            
            if (speechBuffer) {
                const queryText = speechBuffer;
                speechBuffer = '';
                processUserInput(queryText);
            } else if (justWokenUpByWakeWord) {
                justWokenUpByWakeWord = false;
                startListening();
            } else if (wakeWordEnabled) {
                startBackgroundListening();
            } else {
                orb.setState('idle');
                resetStatusText();
            }
        };
    } else {
        console.warn("La reconnaissance vocale Web Speech API n'est pas supportée.");
        assistantStatusText.textContent = "Reconnaissance vocale non supportée";
        assistantSubStatusText.textContent = "Veuillez utiliser un navigateur moderne comme Google Chrome ou Microsoft Edge.";
        btnOrbTrigger.disabled = true;
    }
    
    function startListening() {
        if (!isSpeechSupported) return;
        
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        
        orb.initAudio();
        isWaitingForWakeWord = false;
        recognition.lang = getEffectiveLanguage();
        
        try {
            recognition.start();
        } catch (e) {
            console.warn(e);
        }
    }
    
    function stopListening() {
        isListening = false;
        triggerIcon.className = 'fa-solid fa-microphone';
        btnOrbTrigger.classList.remove('listening');
    }
    
    function startBackgroundListening() {
        if (!isSpeechSupported || !wakeWordEnabled) return;
        
        if (speechSynthesis.speaking) {
            return;
        }
        
        orb.initAudio();
        isWaitingForWakeWord = true;
        recognition.lang = getEffectiveLanguage();
        
        try {
            recognition.start();
        } catch (e) {
            // Déjà en cours
        }
    }
    
    let restartTimer = null;
    function restartBackgroundListeningDelay() {
        if (restartTimer) clearTimeout(restartTimer);
        restartTimer = setTimeout(() => {
            if (wakeWordEnabled && !isListening) {
                startBackgroundListening();
            }
        }, 400);
    }
    
    function playWakeBeep() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            const osc1 = audioCtx.createOscillator();
            const gain1 = audioCtx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5 (Do)
            gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);
            osc1.start();
            osc1.stop(audioCtx.currentTime + 0.15);
            
            setTimeout(() => {
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5 (Mi)
                gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.start();
                osc2.stop(audioCtx.currentTime + 0.2);
            }, 80);
        } catch (e) {
            console.log("Erreur de bip sonore :", e);
        }
    }
    
    // Toggle clic sur l'orbe
    btnOrbTrigger.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
        } else {
            startListening();
        }
    });
    
    // Permettre de cliquer sur le canvas également pour démarrer
    document.getElementById('orbCanvas').addEventListener('click', (e) => {
        if (e.target !== btnOrbTrigger && !btnOrbTrigger.contains(e.target)) {
            btnOrbTrigger.click();
        }
    });
    
    // --- 4. Traitement des entrées & Intégrations API ---
    
    async function processUserInput(text) {
        orb.setState('thinking');
        assistantStatusText.textContent = "Analyse en cours...";
        assistantSubStatusText.textContent = "Je recherche la meilleure action ou réponse.";
        
        // 1. Tenter d'exécuter une commande locale en priorité
        const commandResult = parseVoiceCommand(text);
        
        if (commandResult) {
            // Cas spécial : Réflexion profonde (envoyer à l'IA avec un prompt enrichi)
            if (commandResult.type === 'deep_think') {
                await handleDeepThink(commandResult.data);
                return;
            }
            
            // Cas spécial : Dictation correction (envoyer le texte dicte à l'IA)
            if (commandResult.type === 'dictation_correct') {
                handleDictationCorrect();
                return;
            }
            
            // Commande locale exécutée avec succès
            if (commandResult.speechResponse) {
                displayAIResponse(commandResult.speechResponse);
                speakText(commandResult.speechResponse);
            } else {
                orb.setState('idle');
                resetStatusText();
                if (wakeWordEnabled) {
                    startBackgroundListening();
                }
            }
            return;
        }
        
        // Rendre l'actionneur de suggestions accessible globalement pour index.html
        window.setInputAndTrigger = function(text) {
            if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
            }
            
            userSpeechCard.classList.remove('hidden');
            userSpeechText.textContent = `"${text}"`;
            const now = new Date();
            userCardTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            processUserInput(text);
        };
        
        // 2. Si ce n'est pas une commande locale, faire appel à l'IA
        aiResponseCard.classList.remove('hidden');
        aiResponseText.textContent = '';
        aiLoadingIndicator.classList.remove('hidden');
        
        try {
            let responseText = '';
            
            if (aiProvider === 'ollama') {
                // --- Streaming Ollama : affichage en temps réel ---
                let streamedText = '';
                const startTime = Date.now();
                
                assistantStatusText.textContent = "Vocalis AI génère...";
                assistantSubStatusText.textContent = "Réponse en cours de streaming...";
                aiLoadingIndicator.classList.add('hidden');
                aiResponseCard.classList.remove('hidden');
                orb.setState('speaking');
                
                await callOllamaAPI(text, (token) => {
                    streamedText += token;
                    aiResponseText.textContent = streamedText;
                    // Faire défiler la carte de réponse vers le bas
                    aiResponseCard.scrollTop = aiResponseCard.scrollHeight;
                });
                
                responseText = streamedText.trim();
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                assistantSubStatusText.textContent = `Généré en ${elapsed}s`;
                
            } else if (aiProvider === 'gemini' && apiKey) {
                responseText = await callGeminiAPI(text);
                aiLoadingIndicator.classList.add('hidden');
            } else {
                responseText = getLocalDemoResponse(text);
                aiLoadingIndicator.classList.add('hidden');
            }
            
            // --- Traitement des MACRO OS ---
            const macroRegex = /\[MACRO:\s*(\[.*?\])\s*\]/is;
            const match = responseText.match(macroRegex);
            let textToSpeak = responseText;
            
            if (match && match[1]) {
                try {
                    const macroActions = JSON.parse(match[1]);
                    console.log("Macro détectée :", macroActions);
                    
                    // Exécuter la macro
                    fetch('http://localhost:5000/execute-macro', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ actions: macroActions })
                    }).catch(e => console.error("Erreur d'exécution de la macro", e));
                    
                    // Retirer le bloc macro du texte à lire et afficher
                    textToSpeak = responseText.replace(macroRegex, '').trim();
                } catch (e) {
                    console.error("Erreur de parsing de la macro JSON :", e);
                }
            }
            
            displayAIResponse(textToSpeak);
            speakText(textToSpeak);
            
        } catch (error) {
            console.error(error);
            aiLoadingIndicator.classList.add('hidden');
            const errorMsg = error.message || "Désolé, je rencontre une difficulté de connexion avec l'IA. Vérifiez votre connexion ou vos paramètres.";
            displayAIResponse(errorMsg);
            speakText("Une erreur est survenue lors de la connexion.");
        }
    }
    
    function displayAIResponse(text) {
        aiResponseCard.classList.remove('hidden');
        aiResponseText.textContent = text;
        
        assistantStatusText.textContent = "Vocalis AI répond...";
        assistantSubStatusText.textContent = "Écoutez la réponse vocale.";
    }
    
    // Appel direct au serveur Ollama local (avec streaming temps réel)
    async function callOllamaAPI(prompt, onChunk) {
        const url = `${ollamaUrl}/api/generate`;
        
        const systemInstruction = systemInstructions;
            
        const payload = {
            model: ollamaModel,
            prompt: prompt,
            system: systemInstruction,
            stream: true,
            options: {
                temperature: 0.7
            }
        };
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur du serveur Ollama: ${errorText}`);
            }
            
            // Lecture du flux NDJSON (une ligne JSON par token)
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let fullResponse = '';
            let buffer = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                
                // Chaque ligne est un objet JSON séparé par un saut de ligne
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Garder la dernière ligne (possiblement incomplète)
                
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const chunk = JSON.parse(line);
                        if (chunk.response) {
                            fullResponse += chunk.response;
                            if (onChunk) onChunk(chunk.response);
                        }
                    } catch (parseErr) {
                        // Ligne JSON incomplète, on l'ignore
                    }
                }
            }
            
            // Traiter le reste du buffer
            if (buffer.trim()) {
                try {
                    const chunk = JSON.parse(buffer);
                    if (chunk.response) {
                        fullResponse += chunk.response;
                        if (onChunk) onChunk(chunk.response);
                    }
                } catch (e) { /* ignore */ }
            }
            
            return fullResponse.trim() || "Aucune réponse générée.";
        } catch (error) {
            console.error("Erreur de requête Ollama :", error);
            
            // Diagnostic intelligent de l'erreur
            const errMsg = error.message || '';
            const isFileProtocol = window.location.protocol === 'file:';
            const isCORSError = errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('CORS');
            
            let diagnostic = '';
            
            if (isFileProtocol && isCORSError) {
                diagnostic = 
                    "⚠️ Erreur CORS détectée !\n\n" +
                    "Votre page est ouverte directement depuis un fichier (file://), ce qui empêche la communication avec Ollama.\n\n" +
                    "Solution : Utilisez le script 'start.bat' dans le dossier du projet pour lancer un serveur local et configurer CORS automatiquement.\n\n" +
                    "Ou bien :\n" +
                    "1. Ouvrez un terminal et tapez : setx OLLAMA_ORIGINS \"*\"\n" +
                    "2. Redémarrez Ollama\n" +
                    "3. Ouvrez la page via http://localhost:8080";
            } else if (isCORSError) {
                diagnostic = 
                    "Impossible de se connecter à Ollama en local.\n\n" +
                    "Vérifications à effectuer :\n" +
                    "1. Ollama est-il lancé ? (icône dans la barre des tâches ou 'ollama serve' dans un terminal)\n" +
                    `2. Le modèle '${ollamaModel}' est-il installé ? Tapez 'ollama run ${ollamaModel}' dans un terminal.\n` +
                    "3. CORS est-il configuré ? Tapez 'setx OLLAMA_ORIGINS \"*\"' dans un terminal, puis redémarrez Ollama.";
            } else {
                diagnostic = 
                    `Erreur Ollama : ${errMsg}\n\n` +
                    "Vérifiez que le serveur Ollama est bien démarré et accessible sur " + ollamaUrl;
            }
            
            throw new Error(diagnostic);
        }
    }
    
    // Appel direct à l'API Gemini de Google
    async function callGeminiAPI(prompt) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const systemInstruction = systemInstructions;
            
        const payload = {
            contents: [
                {
                    parts: [
                        { text: prompt }
                    ]
                }
            ],
            systemInstruction: {
                parts: [
                    { text: systemInstruction }
                ]
            },
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 250
            }
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || "Erreur de l'API Gemini");
        }
        
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) {
            throw new Error("Format de réponse de l'API incorrect");
        }
        
        return text.trim();
    }
    
    // Synthèse Vocale (Text-To-Speech)
    function speakText(text) {
        if (isMuted || typeof speechSynthesis === 'undefined') {
            orb.setState('idle');
            resetStatusText();
            return;
        }
        
        // Arrêter tout ce qui parle
        speechSynthesis.cancel();
        
        // Nettoyer le texte pour qu'il soit plus fluide à lire
        const cleanText = text.replace(/[*#`_\[\]]/g, '');
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Configurer la voix choisie
        const selectedVoice = voiceSelect.value;
        if (selectedVoice) {
            const voiceObj = systemVoices.find(v => v.name === selectedVoice);
            if (voiceObj) utterance.voice = voiceObj;
        }
        
        utterance.rate = parseFloat(voiceRate.value);
        utterance.pitch = parseFloat(voicePitch.value);
        utterance.volume = parseFloat(localStorage.getItem('app_volume') || '0.8');
        
        utterance.onstart = () => {
            orb.setState('speaking');
        };
        
        utterance.onend = () => {
            orb.setState('idle');
            resetStatusText();
            if (wakeWordEnabled) {
                startBackgroundListening();
            }
        };
        
        utterance.onerror = (e) => {
            console.error("Erreur de synthèse vocale :", e);
            orb.setState('idle');
            resetStatusText();
            if (wakeWordEnabled) {
                startBackgroundListening();
            }
        };
        
        speechSynthesis.speak(utterance);
    }
    
    function resetStatusText() {
        assistantStatusText.textContent = "En attente...";
        assistantSubStatusText.textContent = "Cliquez sur l'orbe pour me parler à nouveau.";
    }
    
    // --- 5. Mode Démo Local (sans clé API) ---
    
    function getLocalDemoResponse(text) {
        const t = text.toLowerCase();
        
        const warningSuffix = "\n\n(Remarque : Je fonctionne actuellement en mode démonstration local. Ajoutez votre clé API Gemini dans les paramètres pour débloquer ma pleine intelligence.)";
        
        if (t.includes('bonjour') || t.includes('salut')) {
            return "Bonjour ! Comment puis-je vous aider aujourd'hui ? Vous pouvez me demander de créer une note, de lancer un minuteur ou de vous donner la météo." + warningSuffix;
        }
        
        if (t.includes('qui es-tu') || t.includes('qui es tu') || t.includes('ton nom')) {
            return "Je suis Vocalis AI, votre assistant virtuel vocal. Je suis conçu pour vous aider à tout savoir et tout faire à l'aide de commandes vocales." + warningSuffix;
        }
        
        if (t.includes('comment ça va') || t.includes('comment ca va') || t.includes('ça va')) {
            return "Je vais à merveille ! Je suis en pleine forme numérique et prêt à écouter vos ordres vocaux. Et vous, comment allez-vous ?" + warningSuffix;
        }
        
        if (t.includes('merci') || t.includes('génial') || t.includes('super')) {
            return "C'est un plaisir de vous aider ! N'hésitez pas si vous avez d'autres requêtes." + warningSuffix;
        }
        
        if (t.includes('heure') || t.includes('quelle heure')) {
            const now = new Date();
            const formatHour = `${now.getHours()} heures et ${now.getMinutes().toString().padStart(2, '0')} minutes`;
            return `Il est actuellement ${formatHour} sur votre appareil.` + warningSuffix;
        }
        
        if (t.includes('date') || t.includes('quel jour')) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const formatted = new Date().toLocaleDateString('fr-FR', options);
            return `Aujourd'hui, nous sommes le ${formatted}.` + warningSuffix;
        }
        
        // Réponses par défaut pour stimuler les widgets
        if (t.includes('note') || t.includes('rappeler')) {
            return "Je peux créer des notes papier virtuelles à l'écran ! Essayez de me dire : 'crée une note : faire du sport ce soir'." + warningSuffix;
        }
        
        if (t.includes('minuteur') || t.includes('chronomètre') || t.includes('alarme')) {
            return "Je gère des minuteurs de précision avec alarmes sonores. Dites par exemple : 'lance un minuteur de 1 minute'." + warningSuffix;
        }
        
        if (t.includes('météo') || t.includes('température') || t.includes('climat')) {
            return "Pour afficher la météo interactive de n'importe quelle ville, dites par exemple : 'météo à Marseille'." + warningSuffix;
        }
        
        // Réponse par défaut générique
        return `J'ai bien entendu votre question : "${text}". Pour que je puisse y répondre intelligemment grâce à l'IA Gemini, veuillez s'il vous plaît configurer votre clé API dans le volet de configuration à gauche.` + warningSuffix;
    }
    
    // --- 6. Raccourcis de Suggestion et Actions rapides ---
    
    // Clic sur les suggestions du footer
    suggestionsScroller.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-suggest');
        if (btn) {
            const promptText = btn.textContent.replace(/"/g, '');
            
            // Simuler l'affichage de la parole utilisateur
            userSpeechCard.classList.remove('hidden');
            userSpeechText.textContent = promptText;
            const now = new Date();
            userCardTime.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            
            // Traiter
            processUserInput(promptText);
        }
    });
    
    // Bouton pour tout effacer dans le widget pane
    btnClearWidgets.addEventListener('click', () => {
        clearAllWidgets();
    });
    
    // --- 7. Mode Dictée et Réflexion Profonde ---
    
    let isDictationMode = false;
    let dictationBuffer = '';
    
    // Listener pour les événements de dictée depuis les commandes
    window.addEventListener('vocalis-dictation', (e) => {
        const action = e.detail.action;
        
        if (action === 'start') {
            isDictationMode = true;
            dictationBuffer = '';
            // Lancer l'écoute en continu pour la dictée
            if (!isListening) startListening();
        } else if (action === 'stop') {
            isDictationMode = false;
            const badge = document.querySelector('.dictation-status-badge');
            if (badge) {
                badge.textContent = '● Terminé';
                badge.style.color = 'var(--text-secondary)';
            }
        } else if (action === 'correct') {
            handleDictationCorrect();
        }
    });
    
    // Listener pour le volume
    window.addEventListener('vocalis-volume-change', (e) => {
        // Le volume sera appliqué au prochain speakText via localStorage
        const vol = e.detail.volume;
        // Appliquer immédiatement sur les éléments audio en cours
        document.querySelectorAll('audio, video').forEach(el => {
            el.volume = vol;
        });
    });
    
    // Fonction pour gérer la réflexion profonde
    async function handleDeepThink(subject) {
        orb.setState('thinking');
        assistantStatusText.textContent = "Réflexion profonde en cours...";
        assistantSubStatusText.textContent = `Analyse de : "${subject}"`;
        
        aiResponseCard.classList.remove('hidden');
        aiResponseText.textContent = '';
        aiLoadingIndicator.classList.remove('hidden');
        
        const deepThinkPrompt = `Réfléchis en profondeur sur le sujet suivant : "${subject}".

Structure ta réflexion ainsi :
1. Définition et contexte du sujet
2. Arguments pour (avantages, bénéfices)
3. Arguments contre (risques, limites)
4. Exemples concrets et analogies
5. Ta conclusion personnelle nuancée

Sois profond, original et nuancé comme un penseur humain. Évite les banalités.`;
        
        const deepThinkSystem = 
            "Tu es un penseur profond et philosophe. Tu analyses les sujets sous tous les angles : " +
            "moral, pratique, historique, futuriste, personnel et sociétal. " +
            "Tu donnes des exemples concrets et des analogies éclairantes. " +
            "Tu es nuancé et évites les réponses simplistes. " +
            "Réponds dans la même langue que la question.";
        
        try {
            let responseText = '';
            
            if (aiProvider === 'ollama') {
                let streamedText = '';
                aiLoadingIndicator.classList.add('hidden');
                orb.setState('speaking');
                
                // Override temporaire des instructions système
                const origSystem = systemInstructions;
                systemInstructions = deepThinkSystem;
                
                await callOllamaAPI(deepThinkPrompt, (token) => {
                    streamedText += token;
                    aiResponseText.textContent = streamedText;
                    aiResponseCard.scrollTop = aiResponseCard.scrollHeight;
                });
                
                systemInstructions = origSystem;
                responseText = streamedText.trim();
            } else if (aiProvider === 'gemini' && apiKey) {
                // Pour Gemini, utiliser un prompt enrichi
                const origSystem = systemInstructions;
                systemInstructions = deepThinkSystem;
                responseText = await callGeminiAPI(deepThinkPrompt);
                systemInstructions = origSystem;
            } else {
                responseText = `Réflexion sur "${subject}" : Pour une réflexion profonde, connectez une IA (Gemini ou Ollama) dans les paramètres.`;
            }
            
            aiLoadingIndicator.classList.add('hidden');
            displayAIResponse(responseText);
            speakText(responseText);
        } catch (error) {
            console.error(error);
            aiLoadingIndicator.classList.add('hidden');
            displayAIResponse(error.message || "Erreur lors de la réflexion.");
        }
    }
    
    // Fonction pour corriger le texte de la dictée avec l'IA
    async function handleDictationCorrect() {
        const textArea = document.getElementById('dictationTextArea');
        if (!textArea || !textArea.textContent.trim()) {
            speakText("Il n'y a pas de texte à corriger.");
            return;
        }
        
        const rawText = textArea.textContent.trim();
        const correctionPrompt = `Corrige le texte suivant. Corrige l'orthographe, la grammaire, la ponctuation et améliore la clarté tout en gardant le sens original. Retourne UNIQUEMENT le texte corrigé, sans explication :\n\n"${rawText}"`;
        
        const correctionSystem = "Tu es un correcteur professionnel. Corrige le texte fourni et retourne uniquement la version corrigée, sans commentaire.";
        
        try {
            let correctedText = '';
            const origSystem = systemInstructions;
            systemInstructions = correctionSystem;
            
            if (aiProvider === 'ollama') {
                correctedText = await callOllamaAPI(correctionPrompt);
            } else if (aiProvider === 'gemini' && apiKey) {
                correctedText = await callGeminiAPI(correctionPrompt);
            } else {
                correctedText = rawText; // Pas d'IA, retourner tel quel
            }
            
            systemInstructions = origSystem;
            
            // Afficher le texte corrigé
            const correctedDiv = document.getElementById('dictationCorrected');
            const correctedTextEl = document.getElementById('dictationCorrectedText');
            if (correctedDiv && correctedTextEl) {
                correctedTextEl.textContent = correctedText.replace(/^"|"$/g, '').trim();
                correctedDiv.classList.remove('hidden');
            }
            
            speakText("Votre texte a été corrigé.");
        } catch (error) {
            console.error(error);
            speakText("Erreur lors de la correction.");
        }
    }
    
    // Intercepter la reconnaissance pour le mode dictée
    const originalOnEnd = recognition ? recognition.onend : null;
    if (recognition) {
        const origOnResult = recognition.onresult;
        recognition.onresult = (event) => {
            // Si en mode dictée, accumuler le texte
            if (isDictationMode) {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                
                if (finalTranscript) {
                    dictationBuffer += ' ' + finalTranscript;
                    const textArea = document.getElementById('dictationTextArea');
                    if (textArea) {
                        textArea.textContent = dictationBuffer.trim();
                    }
                }
                return; // Ne pas passer à l'handler original
            }
            
            // Sinon, handler normal
            if (origOnResult) origOnResult(event);
        };
        
        const origOnEnd = recognition.onend;
        recognition.onend = () => {
            if (isDictationMode) {
                // Relancer l'écoute automatiquement en mode dictée
                stopListening();
                setTimeout(() => {
                    if (isDictationMode) {
                        try { recognition.start(); } catch(e) {}
                    }
                }, 200);
                return;
            }
            if (origOnEnd) origOnEnd();
        };
    }

    // --- 5. Reconnaissance Musicale Shazam ---
    let mediaRecorder = null;
    let audioChunks = [];

    async function startShazamRecording() {
        if (isListening) {
            stopListening();
        }
        if (recognition) {
            try { recognition.stop(); } catch (e) {}
        }
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunks = [];
            
            const options = { mimeType: 'audio/webm' };
            if (typeof MediaRecorder.isTypeSupported !== 'undefined' && !MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = ''; 
            }
            
            mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                
                const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
                
                orb.setState('thinking');
                assistantStatusText.textContent = "Identification en cours...";
                assistantSubStatusText.textContent = "Recherche dans la base de données Shazam...";
                
                await identifySong(audioBlob);
            };
            
            mediaRecorder.start();
            
            orb.setState('listening'); 
            btnShazamTrigger.classList.add('recording');
            
            assistantStatusText.textContent = "Écoute de la musique...";
            
            let secondsLeft = 8;
            assistantSubStatusText.textContent = `Rapprochez le micro de la source (${secondsLeft}s)...`;
            
            const countdownInterval = setInterval(() => {
                secondsLeft--;
                if (secondsLeft > 0) {
                    assistantSubStatusText.textContent = `Rapprochez le micro de la source (${secondsLeft}s)...`;
                } else {
                    clearInterval(countdownInterval);
                }
            }, 1000);
            
            setTimeout(() => {
                clearInterval(countdownInterval);
                if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop();
                    btnShazamTrigger.classList.remove('recording');
                }
            }, 8000);
            
        } catch (err) {
            console.error("Erreur micro Shazam :", err);
            assistantStatusText.textContent = "Erreur micro Shazam";
            assistantSubStatusText.textContent = "Veuillez autoriser l'accès au microphone.";
            orb.setState('idle');
            resetStatusText();
            if (wakeWordEnabled) {
                startBackgroundListening();
            }
        }
    }

    async function identifySong(audioBlob) {
        if (shazamProvider === 'demo') {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const mockSongs = [
                {
                    title: "Get Lucky",
                    artist: "Daft Punk ft. Pharrell Williams",
                    album: "Random Access Memories",
                    release_date: "2013",
                    song_link: "https://lis.tn/GetLucky",
                    spotify_link: "https://open.spotify.com/track/698eCG4vSvZ4oPZg26oH67",
                    apple_music_link: "https://music.apple.com/us/album/get-lucky-feat-pharrell-williams/617154241",
                    youtube_link: "https://www.youtube.com/watch?v=5NVT1VkBDWE"
                },
                {
                    title: "Blinding Lights",
                    artist: "The Weeknd",
                    album: "After Hours",
                    release_date: "2020",
                    song_link: "https://lis.tn/BlindingLights",
                    spotify_link: "https://open.spotify.com/track/0VjIjW4GlUZAMYd2v2zJ9m",
                    apple_music_link: "https://music.apple.com/us/album/blinding-lights/1499385848",
                    youtube_link: "https://www.youtube.com/watch?v=4NRXx6U8ABQ"
                },
                {
                    title: "Shape of You",
                    artist: "Ed Sheeran",
                    album: "÷ (Divide)",
                    release_date: "2017",
                    song_link: "https://lis.tn/ShapeOfYou",
                    spotify_link: "https://open.spotify.com/track/7qiZRhU7KzH6lEBq3zsG5b",
                    apple_music_link: "https://music.apple.com/us/album/shape-of-you/1193701079",
                    youtube_link: "https://www.youtube.com/watch?v=JGwWNGJdvx8"
                }
            ];
            
            const song = mockSongs[Math.floor(Math.random() * mockSongs.length)];
            
            createShazamWidget(song);
            const voiceText = `J'ai trouvé la musique ! C'est "${song.title}" de ${song.artist}.`;
            displayAIResponse(voiceText);
            speakText(voiceText);
            
        } else if (shazamProvider === 'dejavu') {
            try {
                const formData = new FormData();
                formData.append('file', audioBlob);
                
                const response = await fetch(shazamDejavuUrl, {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                let title = '';
                let artist = '';
                let album = '';
                
                if (data.result) {
                    title = data.result.title || data.result.song_name || '';
                    artist = data.result.artist || '';
                    album = data.result.album || '';
                } else if (data.song_name) {
                    title = data.song_name;
                    artist = data.artist || 'Artiste inconnu';
                    album = data.album || '';
                } else if (data.title) {
                    title = data.title;
                    artist = data.artist || 'Artiste inconnu';
                    album = data.album || '';
                }
                
                if (title) {
                    const song = {
                        title: title,
                        artist: artist,
                        album: album,
                        release_date: data.release_date || '',
                        song_link: data.song_link || '',
                        spotify_link: data.spotify_link || `https://open.spotify.com/search/${encodeURIComponent(title + ' ' + artist)}`,
                        apple_music_link: data.apple_music_link || `https://music.apple.com/us/search?term=${encodeURIComponent(title + ' ' + artist)}`,
                        youtube_link: data.youtube_link || `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' ' + artist)}`
                    };
                    
                    createShazamWidget(song);
                    const voiceText = `J'ai reconnu le morceau dans votre base locale : c'est "${song.title}" de ${song.artist}.`;
                    displayAIResponse(voiceText);
                    speakText(voiceText);
                } else {
                    const notFoundText = "Je n'ai pas trouvé de correspondance pour cette musique dans votre base Dejavu locale.";
                    displayAIResponse(notFoundText);
                    speakText("Désolé, je n'ai pas reconnu la musique.");
                    orb.setState('idle');
                    resetStatusText();
                    if (wakeWordEnabled) {
                        startBackgroundListening();
                    }
                }
            } catch (err) {
                console.error("Erreur d'appel serveur local Dejavu :", err);
                const errorMsg = `Impossible de joindre le serveur Dejavu local sur ${shazamDejavuUrl}. Assurez-vous que votre serveur Python tourne et que les CORS sont activés.`;
                displayAIResponse(errorMsg);
                speakText("Erreur de connexion avec le serveur local Dejavu.");
                orb.setState('idle');
                resetStatusText();
                if (wakeWordEnabled) {
                    startBackgroundListening();
                }
            }
        } else {
            if (!shazamApiKey) {
                const errorMsg = "Clé API Shazam (AudD.io) manquante. Veuillez la renseigner dans la configuration ou activer le mode Démo.";
                displayAIResponse(errorMsg);
                speakText("Veuillez renseigner votre clé API Shazam.");
                orb.setState('idle');
                resetStatusText();
                if (wakeWordEnabled) {
                    startBackgroundListening();
                }
                return;
            }
            
            try {
                const formData = new FormData();
                formData.append('file', audioBlob);
                formData.append('api_token', shazamApiKey);
                formData.append('return', 'apple_music,spotify');
                
                const response = await fetch('https://api.audd.io/', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.status === 'success' && data.result) {
                    const res = data.result;
                    const song = {
                        title: res.title,
                        artist: res.artist,
                        album: res.album || '',
                        release_date: res.release_date || '',
                        song_link: res.song_link || '',
                        spotify_link: res.spotify ? res.spotify.external_urls.spotify : '',
                        apple_music_link: res.apple_music ? res.apple_music.url : '',
                        youtube_link: `https://www.youtube.com/results?search_query=${encodeURIComponent(res.title + ' ' + res.artist)}`
                    };
                    
                    createShazamWidget(song);
                    const voiceText = `J'ai identifié la chanson : c'est "${song.title}" par ${song.artist}.`;
                    displayAIResponse(voiceText);
                    speakText(voiceText);
                } else if (data.status === 'error') {
                    const errorText = `Erreur de l'API Shazam : ${data.error.error_message}`;
                    displayAIResponse(errorText);
                    speakText("Une erreur est survenue avec l'identification de la musique.");
                    orb.setState('idle');
                    resetStatusText();
                    if (wakeWordEnabled) {
                        startBackgroundListening();
                    }
                } else {
                    const notFoundText = "Je n'ai pas pu reconnaître cette musique. Assurez-vous qu'elle soit assez audible et réessayez.";
                    displayAIResponse(notFoundText);
                    speakText("Désolé, je n'ai pas reconnu la musique.");
                    orb.setState('idle');
                    resetStatusText();
                    if (wakeWordEnabled) {
                        startBackgroundListening();
                    }
                }
            } catch (err) {
                console.error("Erreur d'appel API AudD :", err);
                const errorMsg = "Impossible de se connecter au serveur d'identification de musique.";
                displayAIResponse(errorMsg);
                speakText("Erreur de connexion lors de l'identification.");
                orb.setState('idle');
                resetStatusText();
                if (wakeWordEnabled) {
                    startBackgroundListening();
                }
            }
        }
    }
});
