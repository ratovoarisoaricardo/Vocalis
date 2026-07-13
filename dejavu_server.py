# Copyright (c) 2026 Ricardo Ratovoarisoa. Tous droits réservés.
# Ce projet et son code source sont protégés sous licence propriétaire.

import os
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS

# Tentez d'importer Dejavu. Installez-le avec : pip install PyDejavu flask flask-cors
try:
    from dejavu import Dejavu
    from dejavu.logic.recognizer.file_recognizer import FileRecognizer
    DEJAVU_AVAILABLE = True
except BaseException:
    # Gère ImportError et les SyntaxError sous Python 3
    DEJAVU_AVAILABLE = False

app = Flask(__name__)
# CRITICAL: Activer les CORS pour autoriser l'appel depuis le navigateur client
CORS(app)

# Configuration de la base de données Dejavu (MySQL ou PostgreSQL)
config = {
    "database": {
        "host": "127.0.0.1",
        "user": "root",
        "password": "your_password",
        "database": "dejavu",
    },
    "database_type": "mysql" # Peut être "postgres" ou "mysql"
}

djv = None
if DEJAVU_AVAILABLE:
    try:
        # Initialisation de Dejavu
        djv = Dejavu(config)
    except Exception as e:
        print(f"Erreur d'initialisation de Dejavu : {e}")
        print("Le serveur tournera en mode simulation tant que la base de données n'est pas configurée.")

@app.route('/recognize', methods=['POST'])
def recognize():
    # Vérifier si un fichier audio a été envoyé
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "Aucun fichier audio trouvé dans la requête (nom du paramètre attendu: 'file')"}), 400
    
    audio_file = request.files['file']
    
    # Créer un fichier temporaire pour enregistrer l'audio reçu
    fd, temp_path = tempfile.mkstemp(suffix=".wav")
    try:
        os.close(fd)
        audio_file.save(temp_path)
        
        # Mode Simulation si Dejavu n'est pas disponible ou non connecté à la BDD
        if not DEJAVU_AVAILABLE or djv is None:
            # Simulation : renvoie un résultat factice pour tester la connexion CORS et le format
            print("--- MODE SIMULATION DEJAVU ---")
            print(f"Audio reçu et enregistré sous : {temp_path}")
            return jsonify({
                "status": "success",
                "song_name": "Get Lucky (Local DB Mock)",
                "artist": "Daft Punk",
                "album": "Random Access Memories",
                "release_date": "2013"
            })
        
        # Reconnaissance réelle avec Dejavu
        print("Lancement de la reconnaissance Dejavu...")
        results = djv.recognize(FileRecognizer, temp_path)
        
        if results and 'results' in results and len(results['results']) > 0:
            best_match = results['results'][0]
            # Dejavu renvoie la chanson identifiée
            return jsonify({
                "status": "success",
                "song_name": best_match.get('song_name', 'Chanson inconnue'),
                "artist": best_match.get('artist', 'Artiste inconnu'),
                "confidence": best_match.get('confidence', 0),
                "offset_seconds": best_match.get('offset_seconds', 0)
            })
        else:
            return jsonify({
                "status": "success",
                "message": "Aucune correspondance trouvée dans la base de données locale."
            })
            
    except Exception as e:
        print(f"Erreur de traitement : {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        # Nettoyage du fichier temporaire
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/fingerprint', methods=['POST'])
def fingerprint_directory():
    """Endpoint pour indexer un dossier de musiques MP3"""
    if not DEJAVU_AVAILABLE or djv is None:
        return jsonify({"status": "error", "message": "Dejavu n'est pas configuré sur ce serveur."}), 400
        
    data = request.get_json() or {}
    directory_path = data.get('directory')
    
    if not directory_path or not os.path.isdir(directory_path):
        return jsonify({"status": "error", "message": "Chemin de dossier invalide ou manquant."}), 400
        
    try:
        # Lancer l'indexation du dossier de MP3
        djv.fingerprint_directory(directory_path, [".mp3", ".wav"])
        return jsonify({"status": "success", "message": f"Indexation du dossier {directory_path} terminée."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

import subprocess

@app.route('/open-software', methods=['POST'])
def open_software():
    """Endpoint pour ouvrir un logiciel sur le PC local"""
    data = request.get_json() or {}
    app_name = data.get('app_name', '').lower().strip()
    
    if not app_name:
        return jsonify({"status": "error", "message": "Nom du logiciel manquant."}), 400
        
    try:
        # Mapping basique pour Windows (peut être étendu)
        app_map = {
            "calculatrice": "calc.exe",
            "calc": "calc.exe",
            "bloc-notes": "notepad.exe",
            "notepad": "notepad.exe",
            "chrome": "chrome.exe",
            "navigateur": "chrome.exe",
            "word": "winword.exe",
            "excel": "excel.exe",
            "paint": "mspaint.exe",
            "whatsapp": "whatsapp:"
        }
        
        executable = app_map.get(app_name, app_name)
        
        # Sur Windows, on utilise 'start' via cmd pour lancer en arrière-plan sans bloquer
        if os.name == 'nt':
            subprocess.Popen(f"start {executable}", shell=True)
        else:
            # Sur Mac/Linux
            subprocess.Popen([executable])
            
        return jsonify({"status": "success", "message": f"Le logiciel {app_name} a été lancé avec succès."})
    except Exception as e:
        return jsonify({"status": "error", "message": f"Erreur lors de l'ouverture du logiciel : {str(e)}"}), 500

@app.route('/execute-macro', methods=['POST'])
def execute_macro():
    """Endpoint pour exécuter dynamiquement des macros PyAutoGUI (IA Agentique)"""
    if not PYAUTOGUI_AVAILABLE:
        return jsonify({"status": "error", "message": "PyAutoGUI non disponible."}), 500
        
    data = request.get_json() or {}
    actions = data.get('actions', [])
    
    if not actions or not isinstance(actions, list):
        return jsonify({"status": "error", "message": "Aucune action fournie."}), 400
        
    try:
        for action in actions:
            act_type = action.get('action')
            args = action.get('args', [])
            
            # Sécurité : Restreindre l'IA uniquement au clavier (pas de souris)
            if act_type not in ['press', 'hotkey', 'write', 'sleep']:
                return jsonify({"status": "error", "message": f"Action de sécurité bloquée: '{act_type}'. L'IA ne peut utiliser que le clavier (souris désactivée)."}), 403
            
            if act_type == 'press':
                pyautogui.press(args[0])
            elif act_type == 'hotkey':
                pyautogui.hotkey(*args)
            elif act_type == 'write':
                # Intervalle très réduit par défaut (0.005) pour une écriture instantanée
                interval = action.get('interval', 0.005)
                pyautogui.write(args[0], interval=interval)
            elif act_type == 'sleep':
                time.sleep(float(args[0]))
                
            # Pause dynamique très courte entre les actions
            pause_time = action.get('pause', 0.01)
            if pause_time > 0:
                time.sleep(pause_time)
            
        return jsonify({"status": "success", "message": f"{len(actions)} actions exécutées."})
    except Exception as e:
        print(f"Erreur d'exécution macro : {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

try:
    import pyautogui
    import pygetwindow as gw
    import pyperclip
    import requests
    import time
    PYAUTOGUI_AVAILABLE = True
except ImportError:
    PYAUTOGUI_AVAILABLE = False
    print("Attention: pyautogui, pygetwindow, pyperclip ou requests manquent. 'pip install pyautogui pygetwindow pyperclip requests'")

try:
    import uiautomation as auto
    UIA_AVAILABLE = True
except ImportError:
    UIA_AVAILABLE = False
    print("Info: uiautomation non installé (utilisé pour les tests pur arrière-plan). 'pip install uiautomation'")

@app.route('/send-whatsapp', methods=['POST'])
def send_whatsapp():
    """Envoie un message sur l'application native WhatsApp Desktop"""
    if not PYAUTOGUI_AVAILABLE:
        return jsonify({"status": "error", "message": "Dépendances manquantes. Installez pyautogui, pygetwindow, pyperclip."}), 500
        
    data = request.get_json() or {}
    message = data.get('message', '')
    
    if not message:
        return jsonify({"status": "error", "message": "Message vide."}), 400
        
    try:
        # Trouver la fenêtre WhatsApp
        windows = gw.getWindowsWithTitle('WhatsApp')
        if not windows:
            # Tenter de l'ouvrir
            subprocess.Popen("start whatsapp:", shell=True)
            time.sleep(3)
            windows = gw.getWindowsWithTitle('WhatsApp')
            
        if windows:
            win = windows[0]
            
            # Sauvegarder la fenêtre actuellement active pour le mode "Arrière-plan Éclair"
            previous_window = gw.getActiveWindow()
            
            if win.isMinimized:
                win.restore()
            win.activate()
            time.sleep(0.3) # Temps ultra court (Apparition Éclair)
            
            pyperclip.copy(message)
            pyautogui.hotkey('ctrl', 'v')
            time.sleep(0.1)
            pyautogui.press('enter')
            
            # Restaurer instantanément l'ancienne fenêtre (Mode Arrière-plan Éclair)
            if previous_window and previous_window.title != win.title:
                try:
                    previous_window.activate()
                except:
                    pass
            else:
                # Si pas d'ancienne fenêtre, minimiser WhatsApp pour qu'il disparaisse
                win.minimize()
            
            return jsonify({"status": "success", "message": "Message envoyé en mode rapide."})
        else:
            return jsonify({"status": "error", "message": "Impossible de trouver ou d'ouvrir WhatsApp."}), 404
            
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/translate-whatsapp', methods=['POST'])
def translate_whatsapp():
    """Copie le texte sélectionné dans WhatsApp et le traduit"""
    if not PYAUTOGUI_AVAILABLE:
        return jsonify({"status": "error", "message": "Dépendances manquantes."}), 500
        
    data = request.get_json() or {}
    target_lang = data.get('target_lang', 'fr')
    
    try:
        windows = gw.getWindowsWithTitle('WhatsApp')
        if not windows:
            return jsonify({"status": "error", "message": "Fenêtre WhatsApp introuvable."}), 404
            
        win = windows[0]
        previous_window = gw.getActiveWindow()
        
        if win.isMinimized:
            win.restore()
        win.activate()
        time.sleep(0.3)
        
        pyautogui.hotkey('ctrl', 'c')
        time.sleep(0.1)
        
        # Restaurer la fenêtre d'origine
        if previous_window and previous_window.title != win.title:
            try:
                previous_window.activate()
            except:
                pass
        else:
            win.minimize()
        
        text = pyperclip.paste()
        if not text:
             return jsonify({"status": "error", "message": "Aucun texte copié. Sélectionnez le message d'abord."}), 400
             
        # Traduction via l'API publique Google Translate
        import urllib.parse
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl={target_lang}&dt=t&q={urllib.parse.quote(text)}"
        response = requests.get(url)
        if response.status_code == 200:
            data_resp = response.json()
            translated = ''.join([item[0] for item in data_resp[0] if item[0]])
            return jsonify({"status": "success", "original": text, "translated": translated})
        else:
            return jsonify({"status": "error", "message": "Erreur lors de la traduction."}), 500
            
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    print("Démarrage du serveur Dejavu local sur http://localhost:5000")
    print("Installez les dépendances : pip install PyDejavu flask flask-cors")
    app.run(host='0.0.0.0', port=5000, debug=True)
