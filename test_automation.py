# Copyright (c) 2026 Ricardo Ratovoarisoa. Tous droits réservés.
# Ce projet et son code source sont protégés sous licence propriétaire.

import requests
import time
import sys

BASE_URL = "http://localhost:5000"

def test_open_software():
    print("Test 1: Ouverture d'un logiciel (Notepad)...")
    try:
        response = requests.post(f"{BASE_URL}/open-software", json={"app_name": "notepad"})
        print(f"Statut: {response.status_code}")
        print(f"Réponse: {response.json()}")
        if response.status_code == 200:
            print("✅ Succès: Le bloc-notes a été ouvert.")
            return True
        else:
            print("❌ Échec de l'ouverture du logiciel.")
            return False
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")
        return False

def test_whatsapp_message():
    print("\nTest 2: Envoi d'un message WhatsApp (Arrière-plan/Fast-Focus)...")
    print("Veuillez ne pas toucher la souris...")
    time.sleep(2)
    try:
        response = requests.post(f"{BASE_URL}/send-whatsapp", json={"message": "Ceci est un test automatique généré par l'assistant."})
        print(f"Statut: {response.status_code}")
        print(f"Réponse: {response.json()}")
        if response.status_code == 200:
            print("✅ Succès: Message WhatsApp envoyé.")
            return True
        else:
            print("❌ Échec de l'envoi WhatsApp.")
            return False
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")
        return False

def test_execute_macro():
    print("\nTest 3: Exécution de macros (Clavier optimisé + Sécurité Souris)...")
    
    # Ouvrir le bloc-notes d'abord pour avoir un endroit où écrire
    print("-> Ouverture de Notepad...")
    requests.post(f"{BASE_URL}/open-software", json={"app_name": "notepad"})
    time.sleep(2) # Laisser le temps à Notepad de s'ouvrir et de prendre le focus
    
    # 1. Test de la sécurité (bloquer la souris)
    print("-> Test Sécurité : Tentative d'un clic souris (doit échouer)")
    try:
        res_sec = requests.post(f"{BASE_URL}/execute-macro", json={
            "actions": [{"action": "click", "args": [100, 100]}]
        })
        print(f"   Statut: {res_sec.status_code}")
        if res_sec.status_code == 403:
            print("   ✅ Sécurité OK : L'action de souris a été bloquée.")
        else:
            print(f"   ❌ Échec Sécurité : {res_sec.json()}")
    except Exception as e:
        print(f"   ❌ Erreur de connexion: {e}")

    # 2. Test de rapidité du clavier
    print("-> Test Vitesse : Écriture rapide et raccourcis")
    macro_actions = {
        "actions": [
            {"action": "write", "args": ["Ceci est un test de vitesse extreme de l'IA.\n"], "interval": 0.002, "pause": 0.01},
            {"action": "write", "args": ["Elle ne doit utiliser que le clavier!\n"], "interval": 0.002, "pause": 0.01},
            {"action": "hotkey", "args": ["ctrl", "a"], "pause": 0.1},
            {"action": "hotkey", "args": ["right"], "pause": 0.05},
            {"action": "write", "args": ["Fin du test rapide.\n"], "interval": 0.002, "pause": 0.01}
        ]
    }
    
    start_time = time.time()
    try:
        res_macro = requests.post(f"{BASE_URL}/execute-macro", json=macro_actions)
        end_time = time.time()
        print(f"   Statut: {res_macro.status_code}")
        if res_macro.status_code == 200:
            duration = end_time - start_time
            print(f"   ✅ Succès Macro : Actions executées en {duration:.2f} secondes.")
            return True
        else:
            print(f"   ❌ Échec de la macro: {res_macro.json()}")
            return False
    except Exception as e:
        print(f"   ❌ Erreur de connexion: {e}")
        return False

if __name__ == "__main__":
    print("--- DÉMARRAGE DES TESTS AUTOMATIQUES ---\n")
    test_open_software()
    print("\nAttente de 3 secondes avant le test WhatsApp...")
    time.sleep(3)
    test_whatsapp_message()
    print("\nAttente de 3 secondes avant le test des macros...")
    time.sleep(3)
    test_execute_macro()
    print("\n--- FIN DES TESTS ---")
