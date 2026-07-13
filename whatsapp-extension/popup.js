document.addEventListener('DOMContentLoaded', () => {
    // Charger la langue sauvegardée
    chrome.storage.local.get(['targetLang'], (result) => {
        if (result.targetLang) {
            document.getElementById('targetLang').value = result.targetLang;
        }
    });

    // Sauvegarder la langue
    document.getElementById('saveBtn').addEventListener('click', () => {
        const lang = document.getElementById('targetLang').value;
        chrome.storage.local.set({ targetLang: lang }, () => {
            const status = document.getElementById('status');
            status.style.display = 'block';
            setTimeout(() => { status.style.display = 'none'; }, 2000);
        });
    });
});
