// Injection dans WhatsApp Web

let targetLanguage = 'fr';

// Charger la langue cible
chrome.storage.local.get(['targetLang'], (result) => {
    if (result.targetLang) {
        targetLanguage = result.targetLang;
    }
});

// Écouter les changements de langue
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.targetLang) {
        targetLanguage = changes.targetLang.newValue;
    }
});

/**
 * Fonction pour traduire un texte via le Background Script
 */
async function translateText(text, targetLang) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            { action: 'translate', text: text, targetLang: targetLang },
            (response) => {
                if (response && response.translatedText) {
                    resolve(response.translatedText);
                } else {
                    reject('Erreur de traduction');
                }
            }
        );
    });
}

/**
 * Injecte les boutons de traduction sur les messages reçus
 */
function addTranslationButtonsToMessages() {
    // Les messages dans WhatsApp Web ont souvent une structure spécifique
    // On cherche les divs qui contiennent le texte du message. 
    // .copyable-text est une classe souvent utilisée par WhatsApp.
    const messages = document.querySelectorAll('.message-in .copyable-text[data-pre-plain-text], .message-out .copyable-text[data-pre-plain-text]');
    
    messages.forEach(msg => {
        // Vérifier si on n'a pas déjà ajouté un bouton
        if (msg.parentNode && !msg.parentNode.querySelector('.vocalis-btn')) {
            const btn = document.createElement('button');
            btn.className = 'vocalis-btn';
            btn.innerHTML = '🌐 Traduire';
            btn.title = "Traduire avec Vocalis AI";
            
            // Le texte actuel est dans le span interne
            const spanText = msg.querySelector('span[dir="ltr"]') || msg;
            
            btn.onclick = async (e) => {
                e.stopPropagation();
                const textToTranslate = spanText.innerText;
                if (!textToTranslate) return;
                
                btn.innerHTML = '🔄...';
                
                try {
                    const translated = await translateText(textToTranslate, targetLanguage);
                    
                    // Créer un élément pour afficher la traduction
                    let transEl = msg.parentNode.querySelector('.vocalis-translated-text');
                    if (!transEl) {
                        transEl = document.createElement('div');
                        transEl.className = 'vocalis-translated-text';
                        msg.parentNode.appendChild(transEl);
                    }
                    transEl.innerText = translated;
                    btn.innerHTML = '🌐 Traduit';
                    btn.style.color = '#25D366';
                } catch (err) {
                    btn.innerHTML = '❌ Erreur';
                }
            };
            
            // Ajouter le bouton à côté de l'heure du message ou en bas
            const container = msg.parentNode;
            container.appendChild(btn);
        }
    });
}

/**
 * Injecte le bouton de traduction pour l'input
 */
function addInputTranslator() {
    // L'input principal de WhatsApp est un div contenteditable
    const mainInput = document.querySelector('div[contenteditable="true"][data-tab="10"]');
    
    if (mainInput) {
        const parent = mainInput.closest('footer') || mainInput.parentElement.parentElement;
        
        if (parent && !parent.querySelector('#vocalis-input-translator')) {
            const btn = document.createElement('button');
            btn.id = 'vocalis-input-translator';
            btn.innerHTML = '🌐';
            btn.title = "Traduire mon message (Vocalis AI)";
            
            // Style inline pour s'assurer qu'il se place bien dans la barre
            btn.style.position = 'absolute';
            btn.style.right = '60px'; // Ajuster selon le bouton micro/envoyer de WhatsApp
            btn.style.bottom = '12px';
            btn.style.zIndex = '1000';
            
            // L'ancrer de manière relative au parent
            parent.style.position = 'relative';
            parent.appendChild(btn);
            
            btn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const textToTranslate = mainInput.innerText;
                if (!textToTranslate || textToTranslate.trim() === '') return;
                
                btn.innerHTML = '⏳';
                
                try {
                    const translated = await translateText(textToTranslate, targetLanguage);
                    
                    // Pour remplacer le texte dans un contenteditable React (Lexical), 
                    // il faut souvent simuler une insertion de texte.
                    mainInput.focus();
                    document.execCommand('selectAll', false, null);
                    document.execCommand('insertText', false, translated);
                    
                    btn.innerHTML = '🌐';
                } catch (err) {
                    btn.innerHTML = '❌';
                    setTimeout(() => btn.innerHTML = '🌐', 2000);
                }
            };
        }
    }
}

// Observer les changements dans le DOM (pour injecter les boutons au fil de l'eau)
const observer = new MutationObserver((mutations) => {
    // Ne pas appeler trop souvent, utiliser un debounce basique si besoin
    addTranslationButtonsToMessages();
    addInputTranslator();
});

// Lancer l'observation une fois le body chargé
if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
} else {
    document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
    });
}
