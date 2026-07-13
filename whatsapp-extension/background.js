// Service Worker pour l'extension Chrome (Manifest V3)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'translate') {
        // Utilisation de l'API Google Translate (gratuite, endpoint non officiel souvent utilisé par les extensions)
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${request.targetLang}&dt=t&q=${encodeURIComponent(request.text)}`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                let translatedText = '';
                if (data && data[0]) {
                    data[0].forEach(item => {
                        if (item[0]) translatedText += item[0];
                    });
                }
                sendResponse({ translatedText: translatedText });
            })
            .catch(error => {
                console.error('Erreur de traduction:', error);
                sendResponse({ error: 'Échec de la traduction' });
            });
        
        return true; // Indique que la réponse sera envoyée de manière asynchrone
    }
});
