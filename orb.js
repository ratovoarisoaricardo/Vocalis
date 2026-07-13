/**
 * Copyright (c) 2026 Ricardo Ratovoarisoa. Tous droits réservés.
 * Ce projet et son code source sont protégés sous licence propriétaire.
 *
 * Vocalis AI - Voice Orb Visualizer
 * Utilise HTML5 Canvas et l'API Web Audio pour animer un orbe réactif en temps réel.
 */

class VoiceOrb {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // États de l'orbe : 'idle', 'listening', 'thinking', 'speaking'
        this.state = 'idle';
        
        // Audio API
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.microphone = null;
        this.micActive = false;
        
        // Paramètres géométriques et d'animation
        this.baseRadius = 75;
        this.phase = 0;
        this.rotation = 0;
        this.time = 0;
        this.amplitudeFactor = 0; // Facteur d'amplitude réactif pour l'écoute
        
        // Configuration des vagues empilées pour un effet 3D organique
        this.waves = [
            { color: 'rgba(139, 92, 246, 0.4)', speed: 0.02, frequency: 3, amplitude: 15, noise: 0.1 },   // Violet
            { color: 'rgba(6, 182, 212, 0.4)', speed: -0.03, frequency: 2, amplitude: 20, noise: 0.15 },  // Cyan
            { color: 'rgba(236, 72, 153, 0.3)', speed: 0.015, frequency: 4, amplitude: 12, noise: 0.08 },  // Rose
            { color: 'rgba(16, 185, 129, 0.2)', speed: -0.01, frequency: 1.5, amplitude: 25, noise: 0.2 }  // Vert (parole)
        ];
        
        // Particules pour l'état "thinking" (réflexion)
        this.particles = [];
        this.initParticles();
        
        // Redimensionnement initial
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Démarrer l'animation loop
        this.animate();
    }
    
    // Initialise les particules de réflexion
    initParticles() {
        this.particles = [];
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: 0,
                y: 0,
                angle: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.03,
                radius: 1 + Math.random() * 2,
                distance: this.baseRadius + Math.random() * 40,
                color: Math.random() > 0.5 ? 'rgba(6, 182, 212, 0.6)' : 'rgba(139, 92, 246, 0.6)',
                pulse: Math.random() * Math.PI
            });
        }
    }
    
    // Ajuste la taille du canvas
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }
    
    // Active l'entrée microphone et configure le Web Audio Analyser
    async initAudio() {
        if (this.audioContext) return true;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Créer le contexte audio
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            this.micActive = true;
            return true;
        } catch (err) {
            console.warn("Accès micro refusé ou indisponible :", err);
            this.micActive = false;
            return false;
        }
    }
    
    // Modifie l'état de l'orbe et adapte les paramètres visuels
    setState(state) {
        if (['idle', 'listening', 'thinking', 'speaking'].includes(state)) {
            this.state = state;
            
            // Mise à jour de l'effet lumineux de fond
            const glowBg = document.getElementById('glowBg');
            if (glowBg) {
                glowBg.classList.remove('glow-idle', 'glow-listening', 'glow-thinking', 'glow-speaking');
                
                if (state === 'idle') {
                    glowBg.style.background = 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)';
                    glowBg.style.transform = 'scale(1)';
                } else if (state === 'listening') {
                    glowBg.style.background = 'radial-gradient(circle, rgba(6, 182, 212, 0.45) 0%, transparent 70%)';
                    glowBg.style.transform = 'scale(1.1)';
                } else if (state === 'thinking') {
                    glowBg.style.background = 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)';
                    glowBg.style.transform = 'scale(1.05)';
                } else if (state === 'speaking') {
                    glowBg.style.background = 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, transparent 70%)';
                    glowBg.style.transform = 'scale(1.15)';
                }
            }
        }
    }
    
    // Calcule le volume moyen capté par le micro
    getMicVolume() {
        if (!this.micActive || !this.analyser || !this.dataArray) return 0;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        let values = 0;
        let length = this.dataArray.length;
        
        for (let i = 0; i < length; i++) {
            values += this.dataArray[i];
        }
        
        // Moyenne (0 à 255) normalisée entre 0 et 1
        return values / length / 255;
    }
    
    // Obtenir une valeur d'amplitude simulée pour l'état de parole
    getSimulatedSpeechVolume() {
        // Crée une enveloppe d'amplitude pseudo-aléatoire mais fluide
        let base = Math.sin(this.time * 0.15) * Math.cos(this.time * 0.07);
        if (base < 0) base = 0;
        
        // Ajouter du bruit haute fréquence pour imiter la parole humaine
        let noise = Math.sin(this.time * 0.8) * 0.2;
        let volume = base * 0.6 + Math.max(0, noise) * 0.4;
        
        return Math.min(1, volume * 1.5);
    }
    
    // Dessine l'orbe vocal
    drawOrb() {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Calcul du volume selon l'état
        let volume = 0;
        if (this.state === 'listening') {
            volume = this.getMicVolume();
            // Lisser la transition
            this.amplitudeFactor += (volume - this.amplitudeFactor) * 0.2;
        } else if (this.state === 'speaking') {
            volume = this.getSimulatedSpeechVolume();
            this.amplitudeFactor += (volume - this.amplitudeFactor) * 0.15;
        } else {
            this.amplitudeFactor += (0 - this.amplitudeFactor) * 0.1;
        }
        
        // Effet de halo flouté en arrière-plan immédiat de l'orbe
        this.ctx.save();
        const mainGlow = this.ctx.createRadialGradient(cx, cy, 20, cx, cy, this.baseRadius * 1.8);
        if (this.state === 'listening') {
            mainGlow.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
            mainGlow.addColorStop(1, 'rgba(6, 182, 212, 0)');
        } else if (this.state === 'thinking') {
            mainGlow.addColorStop(0, 'rgba(236, 72, 153, 0.25)');
            mainGlow.addColorStop(1, 'rgba(236, 72, 153, 0)');
        } else if (this.state === 'speaking') {
            mainGlow.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
            mainGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
        } else {
            mainGlow.addColorStop(0, 'rgba(139, 92, 246, 0.2)');
            mainGlow.addColorStop(1, 'rgba(139, 92, 246, 0)');
        }
        this.ctx.fillStyle = mainGlow;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, this.baseRadius * 1.8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // --- 1. Dessiner les vagues de l'orbe ---
        if (this.state !== 'thinking') {
            this.waves.forEach((wave, index) => {
                // Si on parle ou écoute, on fait vibrer l'orbe plus fort
                let amp = wave.amplitude;
                if (this.state === 'listening' || this.state === 'speaking') {
                    amp = wave.amplitude + this.amplitudeFactor * 65 * (1 + index * 0.15);
                } else {
                    // Mode idle : pulsation douce
                    amp = wave.amplitude + Math.sin(this.time * 0.05 + index) * 3;
                }
                
                this.ctx.save();
                this.ctx.beginPath();
                
                // Dessin de l'orbe déformé en cercle ondulé
                const numPoints = 120;
                for (let i = 0; i <= numPoints; i++) {
                    const angle = (i / numPoints) * Math.PI * 2;
                    
                    // Calcul de la déformation d'onde
                    const waveTime = this.time * wave.speed;
                    const sinVal = Math.sin(angle * wave.frequency + waveTime + index);
                    const cosVal = Math.cos(angle * (wave.frequency - 0.5) - waveTime);
                    
                    // Plus de turbulence à fort volume
                    const distortion = (sinVal * 0.7 + cosVal * 0.3) * amp;
                    const r = this.baseRadius + distortion;
                    
                    const x = cx + Math.cos(angle + this.rotation * wave.speed) * r;
                    const y = cy + Math.sin(angle + this.rotation * wave.speed) * r;
                    
                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
                
                this.ctx.closePath();
                
                // Remplissage avec dégradé radial
                const radGrad = this.ctx.createRadialGradient(cx, cy, 10, cx, cy, this.baseRadius + amp);
                radGrad.addColorStop(0, wave.color.replace('0.4', '0.05').replace('0.3', '0.04').replace('0.2', '0.02'));
                radGrad.addColorStop(0.7, wave.color);
                radGrad.addColorStop(1, wave.color.replace('0.4', '0.6').replace('0.3', '0.5').replace('0.2', '0.4'));
                
                this.ctx.fillStyle = radGrad;
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = wave.color;
                this.ctx.fill();
                this.ctx.restore();
            });
        }
        
        // --- 2. Dessiner le mode "thinking" (réflexion orbitale) ---
        if (this.state === 'thinking') {
            // Dessiner un noyau central brillant
            this.ctx.save();
            const coreGrad = this.ctx.createRadialGradient(cx, cy, 5, cx, cy, this.baseRadius * 0.75);
            coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            coreGrad.addColorStop(0.3, 'rgba(236, 72, 153, 0.6)'); // Rose
            coreGrad.addColorStop(0.7, 'rgba(139, 92, 246, 0.3)'); // Violet
            coreGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
            
            this.ctx.fillStyle = coreGrad;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, this.baseRadius * 0.75, 0, Math.PI * 2);
            this.ctx.shadowBlur = 25;
            this.ctx.shadowColor = 'rgba(236, 72, 153, 0.6)';
            this.ctx.fill();
            this.ctx.restore();
            
            // Dessiner les particules orbitales
            this.particles.forEach(p => {
                p.angle += p.speed;
                p.pulse += 0.05;
                
                // Effet de vague sur la distance
                const distOffset = Math.sin(p.pulse) * 8;
                const distance = p.distance + distOffset;
                
                const px = cx + Math.cos(p.angle) * distance;
                const py = cy + Math.sin(p.angle) * distance;
                
                // Dessiner la particule
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.arc(px, py, p.radius * (1 + Math.sin(p.pulse) * 0.3), 0, Math.PI * 2);
                this.ctx.fillStyle = p.color;
                this.ctx.shadowBlur = 8;
                this.ctx.shadowColor = p.color;
                this.ctx.fill();
                this.ctx.restore();
            });
            
            // Dessiner un anneau d'énergie rotatif
            this.ctx.save();
            this.ctx.translate(cx, cy);
            this.ctx.rotate(this.time * 0.015);
            this.ctx.strokeStyle = 'rgba(236, 72, 153, 0.15)';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([15, 35]);
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.baseRadius + 15, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.rotate(-this.time * 0.03); // Rotation inverse
            this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
            this.ctx.setLineDash([5, 15]);
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.baseRadius + 25, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }
        
        // --- 3. Dessiner le noyau central en mode Idle/Listening/Speaking ---
        if (this.state !== 'thinking') {
            this.ctx.save();
            const coreGrad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, this.baseRadius - 10);
            
            if (this.state === 'listening') {
                coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                coreGrad.addColorStop(0.4, 'rgba(6, 182, 212, 0.5)');
                coreGrad.addColorStop(1, 'rgba(139, 92, 246, 0.1)');
            } else if (this.state === 'speaking') {
                coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                coreGrad.addColorStop(0.4, 'rgba(16, 185, 129, 0.5)');
                coreGrad.addColorStop(1, 'rgba(6, 182, 212, 0.1)');
            } else {
                coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
                coreGrad.addColorStop(0.4, 'rgba(139, 92, 246, 0.3)');
                coreGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
            }
            
            this.ctx.fillStyle = coreGrad;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, this.baseRadius - 10, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        
        // Progression globale
        this.time += 1;
        this.rotation += 0.5;
    }
    
    // Loop principal d'animation
    animate() {
        this.drawOrb();
        requestAnimationFrame(() => this.animate());
    }
}
