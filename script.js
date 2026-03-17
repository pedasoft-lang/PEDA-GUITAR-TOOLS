const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
let octaveOffset = 0;
let includeLowString = false;

const RilevatoreAccordi = {
    rules: [
        { name: "",     intervals: [0, 4, 7] },
        { name: "m",     intervals: [0, 3, 7] },
        { name: "maj7",  intervals: [0, 4, 7, 11] },
        { name: "7",     intervals: [0, 4, 7, 10] },
        { name: "m7",    intervals: [0, 3, 7, 10] },
        { name: "6",     intervals: [0, 4, 7, 9] },
        { name: "m6",    intervals: [0, 3, 7, 9] },
        { name: "add9",  intervals: [0, 4, 7, 2] },
        { name: "add4",  intervals: [0, 4, 5, 7] },
        { name: "6/9",   intervals: [0, 4, 7, 9, 2] },
        { name: "sus4",  intervals: [0, 5, 7] },
        { name: "7sus4", intervals: [0, 5, 7, 10] },
        { name: "sus2",  intervals: [0, 2, 7] },
        { name: "dim",   intervals: [0, 3, 6] },
        { name: "dim7",  intervals: [0, 3, 6, 9] },
        { name: "ø",     intervals: [0, 3, 6, 10] },
        { name: "aug",   intervals: [0, 4, 8] },
        { name: "5",     intervals: [0, 7] }
    ],
    analyze(notesSuonate) {
        if (notesSuonate.length < 2) return { name: "---", root: null };
        const uniqueIndices = [...new Set(notesSuonate.map(n => n.index))];
        const lowestNoteIdx = notesSuonate[0].index; 
        let bestMatch = null;
        for (let rIdx of uniqueIndices) {
            const currentInts = uniqueIndices.map(i => (i - rIdx + 12) % 12);
            for (let rule of this.rules) {
                const ruleInts = rule.intervals.map(i => i % 12);
                const isMatch = ruleInts.every(i => currentInts.includes(i)) && currentInts.every(i => ruleInts.includes(i));
                if (isMatch) {
                    const slash = (rIdx !== lowestNoteIdx) ? "/" + NOTES[lowestNoteIdx] : "";
                    const name = NOTES[rIdx] + rule.name + slash;
                    if (rIdx === lowestNoteIdx) return { name, root: rIdx };
                    if (!bestMatch) bestMatch = { name, root: rIdx };
                }
            }
        }
        return bestMatch || { name: "Sconosciuto", root: null };
    }
};

const THEORY = {
    TUNINGS: {
        6: { "STANDARD (E)": ["E", "B", "G", "D", "A", "E"] },
        7: { "STANDARD (B)": ["E", "B", "G", "D", "A", "E", "B"] },
        8: { "STANDARD (F#)": ["E", "B", "G", "D", "A", "E", "B", "F#"] }
    },
    MODAL: { "0,2,4,5,7,9,11": "IONICA", "0,2,3,5,7,9,10": "DORICA", "0,1,3,5,7,8,10": "FRIGIA", "0,2,4,6,7,9,11": "LIDIA", "0,2,4,5,7,9,10": "MISOLIDIA", "0,2,3,5,7,8,10": "EOLIA", "0,1,3,5,6,8,10": "LOCRIA" },
    EXOTIC: { 
        "0,2,4,5,6,8,10": "ARABA",
        "0,1,4,5,6,8,11": "PERSIANA",
        "0,1,4,5,7,8,11": "BIZANTINA (DOPPIA ARM.)",
        "0,1,4,5,7,8,10": "ORIENTALE",
        "0,1,3,5,7,8,10": "INDIANA (ASAVARI)",
        "0,2,4,5,7,8,10": "ASAVARI ASCENDENTE",
        "0,1,3,5,7,8,10": "ASAVARI DISCENDENTE",
        "0,3,4,6,7,9,10": "UNGHERESE MINORE",
        "0,2,4,6,7,9,10": "UNGHERESE MAGGIORE",
        "0,2,3,7,8": "GIAPPONESE (HIRAJOSHI)",
        "0,1,5,7,8": "HON KUMOI SHIOUZHI",
        "0,1,5,6,10": "IWATO",
        "0,2,5,7,10": "EGIZIANA",
        "0,2,5,7,9": "VIETNAMITA",
        "0,1,3,5,7,8,11": "NAPOLETANA MINORE",
        "0,1,3,5,7,9,11": "NAPOLETANA MAGGIORE",
        "0,1,4,5,7,9,10": "GIAVANESE",
        "0,1,3,4,6,7,9,10": "DIMINUITA (T-S)",
        "0,2,3,5,6,8,9,11": "DIMINUITA (S-T)",
        "0,2,4,6,8,10": "ESATONALE",
        "0,1,3,4,7,8,10": "ENIGMATICA",
        "0,2,3,6,7,8,11": "ZINGARA"
    },
    PENTA: { "0,2,4,7,9": "MAGGIORE", "0,3,5,7,10": "MINORE", "0,3,5,6,7,10": "BLUES" },
    CAGED: { "forma-a": "FORMA A" },
    INTERVALS: { 0: "1", 1: "b2", 2: "2", 3: "b3", 4: "3", 5: "4", 6: "#4", 7: "5", 8: "b6", 9: "6", 10: "b7", 11: "7" }
};

let activeModule = null;

function render() {
    const grid = document.getElementById('fretGrid');
    const sNum = parseInt(document.getElementById('stringNumSelector').value);
    const tKey = document.getElementById('tuningSelector').value;
    if (!tKey) return;
    const savedStates = Array.from(document.querySelectorAll('.string-row')).map(row => {
        const nut = row.querySelector('.fret[data-fret="0"]');
        return nut ? { active: nut.classList.contains('active'), muted: nut.classList.contains('is-muted') } : { active: true, muted: false };
    }).reverse();
    grid.innerHTML = "";
    const inlays = document.createElement('div');
    inlays.className = "inlays-layer";
    for(let f=0; f<=24; f++) {
        const div = document.createElement('div');
        div.className="inlay-fret"; div.dataset.fret = f;
        if ([3,5,7,9,15,17,19,21].includes(f)) div.innerHTML='<div class="dot"></div>';
        if (f === 12 || f === 24) { 
            div.style.display = "flex"; div.style.flexDirection = "column"; 
            div.style.justifyContent = "space-around"; div.style.padding = "45px 0"; 
            div.innerHTML='<div class="dot"></div><div class="dot"></div>'; 
        }
        inlays.appendChild(div);
    }
    grid.appendChild(inlays);
    const tuning = THEORY.TUNINGS[sNum][tKey];
    tuning.forEach((startNote, sIdx) => {
        const row = document.createElement('div');
        row.className = "string-row";
        row.style.setProperty('--sw', (1.2 + sIdx * 0.9) + "px");
        let startIdx = NOTES.indexOf(startNote.toUpperCase());
        for (let f = 0; f <= 24; f++) {
            const fret = document.createElement('div');
            fret.className = "fret"; fret.dataset.fret = f;
            if (f === 0 && savedStates[sIdx]) {
                if (savedStates[sIdx].active) fret.classList.add('active');
                if (savedStates[sIdx].muted) fret.classList.add('is-muted');
            } else if (f === 0) { fret.classList.add('active'); }
            const noteName = NOTES[(startIdx + f) % 12];
            let fnum = (sIdx === 0 && [3,5,7,9,12,15,17,19,21,24].includes(f)) ? '<div class="fnum">' + f + '</div>' : "";
            if (f === 0) {
                fret.innerHTML = fnum + `<button class="integrated-btn" onclick="transpose(${sIdx}, -1); event.stopPropagation();">-</button><div class="note-circle"><span class="note-name">${noteName}</span><span class="interval-name"></span></div><button class="integrated-btn" onclick="transpose(${sIdx}, 1); event.stopPropagation();">+</button><div class="mute-x">✕</div>`;
            } else {
                fret.innerHTML = fnum + '<div class="note-circle"><span class="note-name">' + noteName + '</span><span class="interval-name"></span></div><div class="mute-x">✕</div>';
            }
            fret.onclick = () => {
                if (f === 0) {
                    fret.classList.toggle('is-muted');
                    if (fret.classList.contains('is-muted')) fret.classList.remove('active');
                    else fret.classList.add('active');
                } else {
                    if (activeModule === 'chord') {
                        const currentRow = fret.parentElement;
                        currentRow.querySelectorAll('.fret').forEach(fEl => { if (fEl !== fret) fEl.classList.remove('active'); });
                        const nut = currentRow.querySelector('.fret[data-fret="0"]');
                        if (nut) nut.classList.remove('active');
                    }
                    fret.classList.toggle('active');
                    if (!fret.classList.contains('active') && activeModule === 'chord') {
                        const nut = fret.parentElement.querySelector('.fret[data-fret="0"]');
                        if (nut && !nut.classList.contains('is-muted')) nut.classList.add('active');
                    }
                }
                updateLogic(false);
            };
            row.appendChild(fret);
        }
        grid.appendChild(row);
    });
    updateLogic(true);
}

function transpose(sIdx, step) {
    const sNum = parseInt(document.getElementById('stringNumSelector').value);
    const tKey = document.getElementById('tuningSelector').value;
    let tuning = THEORY.TUNINGS[sNum][tKey];
    let idx = NOTES.indexOf(tuning[sIdx].toUpperCase());
    tuning[sIdx] = NOTES[(idx + step + 12) % 12];
    render();
}

function updateLogic(autoFill = true) {
    const allFrets = document.querySelectorAll('.fret');
    const rootEl = document.getElementById('commonRoot');
    const typeEl = document.getElementById('commonType');
    const modeEl = document.getElementById('displayMode');
    if (!rootEl || !typeEl || !modeEl) return;
    const rootIdx = parseInt(rootEl.value);
    const intervalsArr = (activeModule === 'caged') ? [0, 2, 4, 7, 9] : (typeEl.value ? typeEl.value.split(',').map(Number) : []);
    const is3NPS = modeEl.value === '3nps';

    document.getElementById('octaveUp').classList.toggle('active-glow', octaveOffset === 12);
    document.getElementById('octaveDown').classList.toggle('active-glow', octaveOffset === -12);
    document.getElementById('toggleLowString').classList.toggle('active-glow', includeLowString);

    if (activeModule === 'chord') {
        allFrets.forEach(f => { f.classList.remove('invalid', 'is-root', 'is-minor', 'is-major'); if(f.querySelector('.interval-name')) f.querySelector('.interval-name').innerText = ""; });
        const rows = Array.from(document.querySelectorAll('.string-row'));
        let noteObjects = [];
        rows.reverse().forEach(row => {
            const active = row.querySelector('.fret.active:not(.is-muted)');
            if (active) {
                const noteName = active.querySelector('.note-name').innerText;
                noteObjects.push({ name: noteName, index: NOTES.indexOf(noteName) });
            }
        });
        const chordRowDeg = document.getElementById('chordRowDegrees');
        const chordRowNot = document.getElementById('chordRowNotes');
        chordRowDeg.innerHTML = '<span class="label-tiny">Gradi:</span>';
        chordRowNot.innerHTML = '<span class="label-tiny">Note:</span>';
        if (noteObjects.length >= 1) {
            const result = RilevatoreAccordi.analyze(noteObjects);
            document.getElementById('chordName').innerText = result.name;
            if (result.root !== null) {
                const uniqueNotes = [];
                const seen = new Set();
                noteObjects.forEach(obj => { if (!seen.has(obj.index)) { uniqueNotes.push(obj); seen.add(obj.index); } });
                uniqueNotes.sort((a, b) => ((a.index - result.root + 12) % 12) - ((b.index - result.root + 12) % 12));
                uniqueNotes.forEach(noteObj => {
                    const diff = (noteObj.index - result.root + 12) % 12;
                    const degLabel = THEORY.INTERVALS[diff];
                    const colorClass = diff === 0 ? 'is-root' : degLabel.includes('b') ? 'is-minor' : 'is-major';
                    chordRowDeg.innerHTML += `<div class="info-cell"><span class="info-val">${degLabel}</span></div>`;
                    chordRowNot.innerHTML += `<div class="info-cell"><span class="note-val-display ${colorClass}">${noteObj.name}</span></div>`;
                });
                document.querySelectorAll('.fret.active:not(.is-muted)').forEach(f => {
                    const noteName = f.querySelector('.note-name').innerText;
                    const currentNoteIdx = NOTES.indexOf(noteName);
                    const diff = (currentNoteIdx - result.root + 12) % 12;
                    const degLabel = THEORY.INTERVALS[diff];
                    if (diff === 0) f.classList.add('is-root');
                    else if (degLabel.includes('b')) f.classList.add('is-minor');
                    else f.classList.add('is-major');
                });
            }
        } else { document.getElementById('chordName').innerText = "---"; }
    } else if (activeModule && activeModule !== 'chord') {
        const rowDeg = document.getElementById('rowDegrees'), rowNot = document.getElementById('rowNotes'), rowInt = document.getElementById('rowIntervals');
        rowDeg.innerHTML = '<span class="label-tiny">Gradi:</span>'; rowNot.innerHTML = '<span class="label-tiny">Note:</span>'; rowInt.innerHTML = '<span class="label-tiny">Intervalli:</span>';
        
        if(intervalsArr.length > 0) {
            const displaySteps = [];
            const count = intervalsArr.length;
            const customDegreeMap = ["1", "2", "3", "4", "5", "6", "7", "1", "9", "3", "11", "12", "13", "7", "1"];
            for(let i=0; i<15; i++) { displaySteps.push(intervalsArr[i % count] + (Math.floor(i / count) * 12)); }
            displaySteps.forEach((v, i) => {
                const noteName = NOTES[(rootIdx + v) % 12];
                const diff = (NOTES.indexOf(noteName) - rootIdx + 12) % 12;
                const degLabel = THEORY.INTERVALS[diff];
                let colorClass = diff === 0 ? 'is-root' : degLabel.includes('b') ? 'is-minor' : 'is-major';
                rowDeg.innerHTML += '<div class="info-cell"><span class="info-val">' + (customDegreeMap[i] || "") + '</span></div>';
                rowNot.innerHTML += '<div class="info-cell"><span class="note-val-display ' + colorClass + '">' + noteName + '</span></div>';
                rowInt.innerHTML += '<div class="info-cell"></div>'; 
                if (i < displaySteps.length - 1) {
                    const step = displaySteps[i+1] - displaySteps[i];
                    const label = (step === 1 ? "S" : step === 2 ? "T" : step + "st");
                    rowInt.innerHTML += '<div class="inter-cell">' + label + '</div>';
                    rowDeg.innerHTML += '<div class="inter-cell"></div>';
                    rowNot.innerHTML += '<div class="inter-cell"></div>';
                }
            });
        }

        if (activeModule === 'caged' && autoFill) {
            allFrets.forEach(f => f.classList.remove('active', 'is-root', 'is-minor', 'is-major'));
            const rows = Array.from(document.querySelectorAll('.string-row')).reverse();
            let aStringStart = NOTES.indexOf(rows[4].querySelector('.fret[data-fret="0"] .note-name').innerText);
            let rootFretOnA = (rootIdx - aStringStart + 12) % 12;
            if (rootFretOnA < 2) rootFretOnA += 12;

            const shapeA = [
                { s: 5, frets: [rootFretOnA, rootFretOnA + 2] }, 
                { s: 4, frets: [rootFretOnA, rootFretOnA + 2] }, 
                { s: 3, frets: [rootFretOnA - 1, rootFretOnA + 2] }, 
                { s: 2, frets: [rootFretOnA - 1, rootFretOnA + 2] }, 
                { s: 1, frets: [rootFretOnA, rootFretOnA + 2] }, 
                { s: 0, frets: [rootFretOnA, rootFretOnA + 2] }  
            ];

            shapeA.forEach(item => {
                item.frets.forEach(fNum => {
                    const target = rows[item.s]?.querySelector(`.fret[data-fret="${fNum}"]`);
                    if(target) target.classList.add('active');
                });
            });
        } else if (is3NPS && autoFill) {
            allFrets.forEach(f => f.classList.remove('active', 'invalid', 'is-root', 'is-minor', 'is-major'));
            const rows = Array.from(document.querySelectorAll('.string-row')).reverse();
            const scaleNotes = intervalsArr.map(i => (rootIdx + i) % 12);
            let basePos = (rootIdx + 3); 
            let rootFret = basePos + octaveOffset;
            let startIndex = includeLowString ? 0 : 1;
            let noteCounter = includeLowString ? -3 : 0;
            const getScaleNoteAt = (index) => { const len = scaleNotes.length; return scaleNotes[((index % len) + len) % len]; };
            for (let sIdx = startIndex; sIdx < rows.length; sIdx++) {
                let countOnString = 0;
                let stringBaseIdx = NOTES.indexOf(rows[sIdx].querySelector('.fret[data-fret="0"] .note-name').innerText);
                let startSearch = (sIdx === startIndex) ? rootFret - (includeLowString ? 5 : 0) : rootFret - 2;
                for (let f = startSearch; f <= 24 && countOnString < 3; f++) {
                    if (f < 0) continue;
                    let currentNoteOnFret = (stringBaseIdx + f) % 12;
                    if (currentNoteOnFret === getScaleNoteAt(noteCounter)) {
                        const targetFret = rows[sIdx].querySelector(`.fret[data-fret="${f}"]`);
                        if(targetFret) { targetFret.classList.add('active'); noteCounter++; countOnString++; if(countOnString === 1) rootFret = f; }
                    }
                }
            }
        }

        allFrets.forEach(f => {
            const noteName = f.querySelector('.note-name').innerText;
            const diff = (NOTES.indexOf(noteName) - rootIdx + 12) % 12;
            const isInScale = intervalsArr.includes(diff);
            if (!is3NPS && activeModule !== 'caged' && autoFill) { if (parseInt(f.dataset.fret) !== 0) f.classList.remove('active'); if (isInScale) f.classList.add('active'); }
            if (f.classList.contains('active') && !f.classList.contains('is-muted')) {
                if (!isInScale) f.classList.add('invalid');
                else {
                    const degLabel = THEORY.INTERVALS[diff];
                    if (diff === 0) f.classList.add('is-root');
                    else if (degLabel.includes('b')) f.classList.add('is-minor');
                    else f.classList.add('is-major');
                }
            }
        });
    }
}

function init() {
    const sSel = document.getElementById('stringNumSelector');
    const tSel = document.getElementById('tuningSelector');
    const cRoot = document.getElementById('commonRoot');
    const cType = document.getElementById('commonType');
    const dMode = document.getElementById('displayMode');
    const rBtn = document.getElementById('resetBtn');
    const octUp = document.getElementById('octaveUp');
    const octDown = document.getElementById('octaveDown');
    const lowBtn = document.getElementById('toggleLowString');

    lowBtn.onclick = () => { includeLowString = !includeLowString; lowBtn.innerText = `Includi 6ª Corda: ${includeLowString ? 'ON' : 'OFF'}`; updateLogic(true); };
    octUp.onclick = () => { octaveOffset = (octaveOffset === 12) ? 0 : 12; updateLogic(true); };
    octDown.onclick = () => { octaveOffset = (octaveOffset === -12) ? 0 : -12; updateLogic(true); };
    
    sSel.addEventListener('change', () => { tSel.innerHTML = Object.keys(THEORY.TUNINGS[sSel.value]).map(t => '<option value="' + t + '">' + t + '</option>').join(''); render(); });
    tSel.addEventListener('change', render);
    dMode.addEventListener('change', () => updateLogic(true));
    rBtn.onclick = () => { octaveOffset = 0; includeLowString = false; lowBtn.innerText = "Includi 6ª Corda: OFF"; document.querySelectorAll('.fret').forEach(f => { f.classList.remove('active', 'is-muted', 'is-root', 'is-minor', 'is-major', 'invalid'); }); updateLogic(false); };
    cRoot.innerHTML = NOTES.map((n, i) => '<option value="' + i + '">' + n + '</option>').join('');
    
    const btns = { chord: 'toggleChordBtn', scale: 'toggleScaleBtn', exotic: 'toggleExoticBtn', penta: 'togglePentaBtn', caged: 'toggleCagedBtn' };
    Object.keys(btns).forEach(k => {
        const btn = document.getElementById(btns[k]);
        if (!btn) return;
        btn.onclick = () => {
            activeModule = (activeModule === k) ? null : k;
            octaveOffset = 0; includeLowString = false;
            lowBtn.innerText = "Includi 6ª Corda: OFF";
            document.querySelectorAll('.fret').forEach(f => { f.classList.remove('active', 'is-muted', 'is-root', 'is-minor', 'is-major', 'invalid'); });
            
            if (k === 'scale') populateType(THEORY.MODAL); 
            else if (k === 'exotic') populateType(THEORY.EXOTIC); 
            else if (k === 'penta') populateType(THEORY.PENTA);
            else if (k === 'caged') populateType(THEORY.CAGED);

            document.getElementById('moduleContent').classList.toggle('hidden', activeModule === null);
            document.getElementById('chordMenu').classList.toggle('hidden', activeModule !== 'chord');
            document.querySelector('.module-grid-layout').classList.toggle('hidden', activeModule === 'chord' || activeModule === null);
            document.getElementById('displayModeGroup').classList.toggle('hidden', activeModule === 'chord' || activeModule === null);
            document.getElementById('octaveGroup').classList.toggle('hidden', activeModule === 'chord' || activeModule === null);
            document.getElementById('extensionGroup').classList.toggle('hidden', activeModule === 'chord' || activeModule === null);
            
            Object.values(btns).forEach(id => { document.getElementById(id)?.classList.remove('active'); });
            if(activeModule) { document.getElementById(btns[k]).classList.add('active'); updateLogic(true); } else { updateLogic(false); }
        };
    });

    function populateType(obj) { 
        cType.innerHTML = Object.keys(obj).map(k => '<option value="' + k + '">' + obj[k] + '</option>').join(''); 
        cRoot.onchange = () => updateLogic(true); 
        cType.onchange = () => updateLogic(true); 
    }

    tSel.innerHTML = Object.keys(THEORY.TUNINGS[sSel.value]).map(t => '<option value="' + t + '">' + t + '</option>').join('');
    render();
}
window.onload = init;