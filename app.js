const NUM_GRUPOS = 12;
const EQUIPOS_POR_GRUPO = 4;
const FIGURAS_POR_EQUIPO = 20;

const dataRaw = {
    nombres: ["Mexico", "Sudafrica", "Corea del Sur", "Chequia", "Canada", "Bosnia y Herzegovina", "Qatar", "Suiza", "Brasil", "Marruecos", "Haiti", "Escocia", "EE.UU.", "Paraguay", "Australia", "Turquia", "Alemania", "Curazao", "Costa de Marfil", "Ecuador", "Paises Bajos", "Japon", "Suecia", "Tunez", "Belgica", "Egipto", "Iran", "Nueva Zelanda", "Espana", "Cabo Verde", "Arabia Saudita", "Uruguay", "Francia", "Senegal", "Irak", "Noruega", "Argentina", "Algeria", "Austria", "Jordania", "Portugal", "RD Congo", "Uzbekistan", "Colombia", "Inglaterra", "Croacia", "Ghana", "Panama"],
    codigos: ["MEX", "RSA", "KOR", "CZE", "CAN", "BIH", "QAT", "SUI", "BRA", "MAR", "HAI", "SCO", "USA", "PAR", "AUS", "TUR", "GER", "CUW", "CIV", "ECU", "NED", "JPN", "SWE", "TUN", "BEL", "EGY", "IRN", "NZL", "ESP", "CPV", "KSA", "URU", "FRA", "SEN", "IRQ", "NOR", "ARG", "ALG", "AUT", "JOR", "POR", "COD", "UZB", "COL", "ENG", "CRO", "GHA", "PAN"],
    letras: "ABCDEFGHIJKL"
};

let album = []; // Contiene los grupos y el equipo institucional

class AlbumApp {
    constructor() {
        this.loadData();
        this.renderDashboard();
    }

    loadData() {
        const stored = localStorage.getItem('album2026_data');
        if (stored) {
            album = JSON.parse(stored);
        } else {
            this.initializeAlbum();
        }
    }

    saveData() {
        localStorage.setItem('album2026_data', JSON.stringify(album));
        this.updateGlobalStats();
    }

    initializeAlbum() {
        album = [];
        let idx = 0;
        
        // Equipos normales
        for (let i = 0; i < NUM_GRUPOS; i++) {
            let grupo = { id: dataRaw.letras[i], tipo: 'grupo', equipos: [] };
            for (let j = 0; j < EQUIPOS_POR_GRUPO; j++) {
                grupo.equipos.push({
                    nombre: dataRaw.nombres[idx],
                    codigo: dataRaw.codigos[idx],
                    figuras: new Array(FIGURAS_POR_EQUIPO).fill(0)
                });
                idx++;
            }
            album.push(grupo);
        }

        // FWC
        album.push({
            id: 'FWC', tipo: 'especial',
            equipos: [{
                nombre: "Institucionales",
                codigo: "FWC",
                figuras: new Array(FIGURAS_POR_EQUIPO).fill(0)
            }]
        });

        this.saveData();
    }

    getStats(equipo) {
        let obtenidas = 0;
        let repetidas = 0;
        equipo.figuras.forEach(st => {
            if (st > 0) obtenidas++;
            if (st > 1) repetidas += (st - 1);
        });
        return { obtenidas, repetidas, pct: (obtenidas / FIGURAS_POR_EQUIPO) * 100 };
    }

    updateGlobalStats() {
        let total = 0, repetidas = 0;
        const totalFiguras = (48 * 20) + 20;

        album.forEach(grupo => {
            grupo.equipos.forEach(eq => {
                const s = this.getStats(eq);
                total += s.obtenidas;
                repetidas += s.repetidas;
            });
        });

        const pct = ((total / totalFiguras) * 100).toFixed(2);
        
        document.getElementById('global-progress').innerText = `${pct}%`;
        document.getElementById('global-count').innerText = `${total} / ${totalFiguras}`;
        document.getElementById('global-rep').innerText = repetidas;
    }

    renderDashboard() {
        this.updateGlobalStats();
        const grid = document.getElementById('groups-grid');
        grid.innerHTML = '';

        album.forEach((grupo, gIdx) => {
            grupo.equipos.forEach((eq, eIdx) => {
                const s = this.getStats(eq);
                
                const card = document.createElement('div');
                card.className = 'team-card';
                card.onclick = () => this.openTeamModal(gIdx, eIdx);
                
                const badge = grupo.tipo === 'especial' ? '⭐' : `Grupo ${grupo.id}`;

                card.innerHTML = `
                    <h3>${eq.nombre} <span class="code">${eq.codigo}</span></h3>
                    <div style="font-size: 0.8rem; color: var(--text-muted)">${badge}</div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${s.pct}%"></div>
                    </div>
                    <div style="margin-top: 0.5rem; font-size: 0.9rem; text-align: right;">${s.pct.toFixed(1)}%</div>
                `;
                grid.appendChild(card);
            });
        });
    }

    openTeamModal(gIdx, eIdx) {
        this.currentTeam = { gIdx, eIdx, eq: album[gIdx].equipos[eIdx] };
        this.renderTeamModal();
        document.getElementById('team-modal').classList.remove('hidden');
    }

    renderTeamModal() {
        const { eq } = this.currentTeam;
        const s = this.getStats(eq);
        
        document.getElementById('modal-team-name').innerText = `${eq.nombre} (${eq.codigo})`;
        document.getElementById('modal-team-progress').style.width = `${s.pct}%`;
        document.getElementById('modal-team-pct').innerText = `${s.pct.toFixed(1)}%`;

        const grid = document.getElementById('stickers-grid');
        grid.innerHTML = '';

        eq.figuras.forEach((estado, index) => {
            const el = document.createElement('div');
            el.className = `sticker ${estado === 0 ? 'st-0' : (estado === 1 ? 'st-1' : 'st-rep')}`;
            
            el.innerHTML = estado > 1 ? `${index + 1}<span class="sticker-badge">+${estado - 1}</span>` : `${index + 1}`;
            
            // Toggle manual: Click izquierdo suma, click derecho (context menu) resta
            el.onclick = () => this.modifySticker(index, 1);
            el.oncontextmenu = (e) => {
                e.preventDefault();
                this.modifySticker(index, -1);
            };

            grid.appendChild(el);
        });
    }

    modifySticker(index, delta) {
        const eq = this.currentTeam.eq;
        if (delta < 0 && eq.figuras[index] === 0) return; // No bajar de 0
        
        eq.figuras[index] += delta;
        this.saveData();
        this.renderTeamModal();
        
        // Actualizar card de fondo sin recargar todo el grid
        this.renderDashboard(); 
    }

    closeModal(id) {
        document.getElementById(id).classList.add('hidden');
    }

    async openPackModal() {
        const modal = document.getElementById('pack-modal');
        const container = document.getElementById('pack-cards');
        const btnClose = document.getElementById('btn-close-pack');
        
        container.innerHTML = '';
        btnClose.classList.add('hidden');
        modal.classList.remove('hidden');

        // Generar 5 cartas
        for (let i = 0; i < 5; i++) {
            // Elegir equipo aleatorio (49 totales: 48 normales + 1 FWC)
            let totalEquipos = [];
            album.forEach(g => g.equipos.forEach(e => totalEquipos.push(e)));
            
            const eqAleatorio = totalEquipos[Math.floor(Math.random() * totalEquipos.length)];
            const figAleatoria = Math.floor(Math.random() * 20);
            
            const esNueva = eqAleatorio.figuras[figAleatoria] === 0;
            eqAleatorio.figuras[figAleatoria]++;

            const card = document.createElement('div');
            card.className = `pack-card ${esNueva ? 'new' : 'rep'}`;
            card.innerHTML = `
                <div class="card-team">${eqAleatorio.codigo}</div>
                <div class="card-num">${figAleatoria + 1}</div>
                <div class="card-status ${esNueva ? 'status-new' : 'status-rep'}">${esNueva ? 'NUEVA' : 'REPETIDA'}</div>
            `;
            container.appendChild(card);

            // Animación y Suspenso
            await new Promise(r => setTimeout(r, 600));
            card.classList.add('revealed');
        }

        this.saveData();
        this.renderDashboard();
        btnClose.classList.remove('hidden');
    }

    closePackModal() {
        this.closeModal('pack-modal');
    }

    showRanking() {
        const secRanking = document.getElementById('ranking-section');
        const secGroups = document.getElementById('groups-section');
        
        if (!secRanking.classList.contains('hidden')) {
            secRanking.classList.add('hidden');
            secGroups.classList.remove('hidden');
            return;
        }

        secGroups.classList.add('hidden');
        secRanking.classList.remove('hidden');

        let todos = [];
        album.forEach(g => g.equipos.forEach(eq => {
            const s = this.getStats(eq);
            todos.push({ nombre: eq.nombre, codigo: eq.codigo, pct: s.pct, obs: s.obtenidas });
        }));

        todos.sort((a, b) => b.obs - a.obs);
        const top10 = todos.slice(0, 10);

        const list = document.getElementById('ranking-list');
        list.innerHTML = '';

        top10.forEach((eq, i) => {
            const card = document.createElement('div');
            card.className = 'team-card';
            card.innerHTML = `
                <div style="font-size: 2rem; font-weight: 900; color: var(--text-muted); position: absolute; top: -10px; right: 10px; opacity: 0.2;">#${i+1}</div>
                <h3>${eq.nombre}</h3>
                <p class="code">${eq.codigo}</p>
                <div class="progress-bar-container" style="height: 10px;">
                    <div class="progress-bar" style="width: ${eq.pct}%"></div>
                </div>
                <p style="margin-top: 5px; font-weight: bold; color: var(--accent);">${eq.pct.toFixed(2)}%</p>
            `;
            list.appendChild(card);
        });
    }

    resetAlbum() {
        if (confirm("¿Estás seguro de que deseas borrar todo el progreso? Esta acción no se puede deshacer.")) {
            localStorage.removeItem('album2026_data');
            this.loadData();
            this.renderDashboard();
            document.getElementById('ranking-section').classList.add('hidden');
            document.getElementById('groups-section').classList.remove('hidden');
        }
    }
}

const app = new AlbumApp();
