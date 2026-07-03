/* ============================================================
   LE KIOSQUE — Trois jeux neufs chaque matin
   Tout est généré de façon déterministe à partir de la date :
   pas de backend, tout le monde reçoit la même édition.
   ============================================================ */

'use strict';

/* ---------- 1. Aléatoire seedé ---------- */

function stringToSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^= h >>> 16) >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- 2. Date & édition ---------- */

const EPOCH = new Date(2026, 6, 3); // Édition n°1 : 3 juillet 2026, jour du lancement

function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const j = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${j}`;
}

function editionNumber(d = new Date()) {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((day - EPOCH) / 86400000) + 1;
}

function frDate(d = new Date()) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(d);
}

/* ============================================================
   3. LA CIBLE — le compte est bon
   La cible est construite à partir des plaques elles-mêmes :
   chaque édition est donc atteignable, garanti.
   ============================================================ */

function generateCible(dateStr) {
  const rng = mulberry32(stringToSeed(dateStr + '|cible'));
  const pool = [1,2,3,4,5,6,7,8,9,10,1,2,3,4,5,6,7,8,9,10,25,50,75,100];
  const plaques = seededShuffle(pool, rng).slice(0, 6);

  let target = null;
  for (let essai = 0; essai < 300 && target === null; essai++) {
    const ordre = seededShuffle(plaques, rng);
    const k = 3 + Math.floor(rng() * 3); // combine 3 à 5 plaques
    let acc = ordre[0];
    let ok = true;
    for (let i = 1; i < k; i++) {
      const v = ordre[i];
      const ops = seededShuffle(['*', '+', '-'], rng);
      let applied = false;
      for (const op of ops) {
        let r;
        if (op === '*') r = acc * v;
        else if (op === '+') r = acc + v;
        else r = acc - v;
        if (r > 0 && r <= 999) { acc = r; applied = true; break; }
      }
      if (!applied) { ok = false; break; }
    }
    if (ok && acc >= 101 && acc <= 999 && !plaques.includes(acc)) target = acc;
  }
  if (target === null) target = 101 + Math.floor(rng() * 899); // filet de sécurité (jamais atteint en pratique)

  return { plaques, target };
}

/* ============================================================
   4. LA SUITE — suite logique du jour
   ============================================================ */

const SUITE_FAMILLES = [
  {
    nom: 'arithmetique',
    indice: 'La différence entre deux termes consécutifs est toujours la même.',
    gen(rng) {
      const a = 2 + Math.floor(rng() * 14);
      const d = 2 + Math.floor(rng() * 8);
      return Array.from({ length: 6 }, (_, n) => a + d * n);
    }
  },
  {
    nom: 'geometrique',
    indice: 'Chaque terme est obtenu en multipliant le précédent par le même nombre.',
    gen(rng) {
      const a = 1 + Math.floor(rng() * 4);
      const r = 2 + Math.floor(rng() * 2);
      return Array.from({ length: 6 }, (_, n) => a * Math.pow(r, n));
    }
  },
  {
    nom: 'quadratique',
    indice: 'La différence entre les termes augmente régulièrement — regardez les différences des différences.',
    gen(rng) {
      const a = 1 + Math.floor(rng() * 3);
      const b = Math.floor(rng() * 6);
      const c = 1 + Math.floor(rng() * 9);
      return Array.from({ length: 6 }, (_, n) => a * n * n + b * n + c);
    }
  },
  {
    nom: 'fibonacci',
    indice: 'Chaque terme est la somme des deux qui le précèdent.',
    gen(rng) {
      const x0 = 1 + Math.floor(rng() * 5);
      const x1 = x0 + 1 + Math.floor(rng() * 5);
      const t = [x0, x1];
      while (t.length < 6) t.push(t[t.length - 1] + t[t.length - 2]);
      return t;
    }
  },
  {
    nom: 'alternee',
    indice: 'Deux opérations différentes s\u2019alternent d\u2019un terme à l\u2019autre.',
    gen(rng) {
      const s = 2 + Math.floor(rng() * 8);
      const p = 3 + Math.floor(rng() * 6);
      const t = [s];
      for (let i = 1; i < 6; i++) {
        t.push(i % 2 === 1 ? t[i - 1] + p : t[i - 1] * 2);
      }
      return t;
    }
  },
  {
    nom: 'carres',
    indice: 'Pensez aux carrés parfaits, légèrement décalés.',
    gen(rng) {
      const k = 1 + Math.floor(rng() * 4);
      const m = Math.floor(rng() * 9);
      return Array.from({ length: 6 }, (_, n) => (n + k) * (n + k) + m);
    }
  }
];

function generateSuite(dateStr) {
  for (let salt = 0; salt < 20; salt++) {
    const rng = mulberry32(stringToSeed(dateStr + '|suite|' + salt));
    const fam = SUITE_FAMILLES[Math.floor(rng() * SUITE_FAMILLES.length)];
    const termes = fam.gen(rng);
    const valides = termes.every(t => Number.isInteger(t) && t > 0 && t <= 9999)
      && new Set(termes).size > 2;
    if (valides) {
      return { visibles: termes.slice(0, 5), reponse: termes[5], indice: fam.indice };
    }
  }
  // Filet de sécurité : suite arithmétique simple
  return { visibles: [3, 7, 11, 15, 19], reponse: 23, indice: SUITE_FAMILLES[0].indice };
}

/* ============================================================
   5. LA GRILLE — Takuzu 6×6 à solution unique
   ============================================================ */

const T_SIZE = 6;

// Lignes valides : 3 zéros, 3 uns, jamais trois identiques d'affilée
const T_VALID_ROWS = (() => {
  const rows = [];
  for (let v = 0; v < 64; v++) {
    const bits = [];
    let ones = 0;
    for (let i = 5; i >= 0; i--) { const b = (v >> i) & 1; bits.push(b); ones += b; }
    if (ones !== 3) continue;
    let triple = false;
    for (let i = 0; i < 4; i++) {
      if (bits[i] === bits[i + 1] && bits[i + 1] === bits[i + 2]) { triple = true; break; }
    }
    if (!triple) rows.push(bits);
  }
  return rows;
})();

function rowsEqual(a, b) {
  for (let i = 0; i < T_SIZE; i++) if (a[i] !== b[i]) return false;
  return true;
}

function takuzuFullGrid(rng) {
  const rows = [];

  function colOk(candidate, depth) {
    for (let c = 0; c < T_SIZE; c++) {
      let ones = candidate[c];
      for (let r = 0; r < depth; r++) ones += rows[r][c];
      const zeros = depth + 1 - ones;
      if (ones > 3 || zeros > 3) return false;
      if (depth >= 2 &&
          rows[depth - 1][c] === candidate[c] &&
          rows[depth - 2][c] === candidate[c]) return false;
    }
    return true;
  }

  function colsDistinct() {
    for (let c1 = 0; c1 < T_SIZE; c1++) {
      for (let c2 = c1 + 1; c2 < T_SIZE; c2++) {
        let same = true;
        for (let r = 0; r < T_SIZE; r++) {
          if (rows[r][c1] !== rows[r][c2]) { same = false; break; }
        }
        if (same) return false;
      }
    }
    return true;
  }

  function backtrack(depth) {
    if (depth === T_SIZE) return colsDistinct();
    const candidats = seededShuffle(T_VALID_ROWS, rng);
    for (const cand of candidats) {
      if (rows.some(r => rowsEqual(r, cand))) continue;
      if (!colOk(cand, depth)) continue;
      rows.push(cand);
      if (backtrack(depth + 1)) return true;
      rows.pop();
    }
    return false;
  }

  backtrack(0);
  return rows.map(r => r.slice());
}

// Compte les solutions d'une grille partielle (plafonné à `cap`)
function takuzuCountSolutions(puzzle, cap) {
  const g = puzzle.map(r => r.slice());
  const vides = [];
  for (let r = 0; r < T_SIZE; r++)
    for (let c = 0; c < T_SIZE; c++)
      if (g[r][c] === null) vides.push([r, c]);

  let count = 0;

  function cellOk(r, c) {
    const v = g[r][c];
    // triples horizontaux / verticaux autour de (r,c)
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      for (let off = -2; off <= 0; off++) {
        let same = true;
        for (let k = 0; k < 3; k++) {
          const rr = r + dr * (off + k), cc = c + dc * (off + k);
          if (rr < 0 || rr >= T_SIZE || cc < 0 || cc >= T_SIZE || g[rr][cc] !== v) { same = false; break; }
        }
        if (same) return false;
      }
    }
    // comptes ligne / colonne
    let rOnes = 0, rFill = 0, cOnes = 0, cFill = 0;
    for (let i = 0; i < T_SIZE; i++) {
      if (g[r][i] !== null) { rFill++; rOnes += g[r][i]; }
      if (g[i][c] !== null) { cFill++; cOnes += g[i][c]; }
    }
    if (rOnes > 3 || rFill - rOnes > 3) return false;
    if (cOnes > 3 || cFill - cOnes > 3) return false;
    // unicité des lignes complètes
    if (rFill === T_SIZE) {
      for (let r2 = 0; r2 < T_SIZE; r2++) {
        if (r2 === r) continue;
        let full = true, same = true;
        for (let i = 0; i < T_SIZE; i++) {
          if (g[r2][i] === null) { full = false; break; }
          if (g[r2][i] !== g[r][i]) same = false;
        }
        if (full && same) return false;
      }
    }
    // unicité des colonnes complètes
    if (cFill === T_SIZE) {
      for (let c2 = 0; c2 < T_SIZE; c2++) {
        if (c2 === c) continue;
        let full = true, same = true;
        for (let i = 0; i < T_SIZE; i++) {
          if (g[i][c2] === null) { full = false; break; }
          if (g[i][c2] !== g[i][c]) same = false;
        }
        if (full && same) return false;
      }
    }
    return true;
  }

  function solve(idx) {
    if (count >= cap) return;
    if (idx === vides.length) { count++; return; }
    const [r, c] = vides[idx];
    for (const v of [0, 1]) {
      g[r][c] = v;
      if (cellOk(r, c)) solve(idx + 1);
      g[r][c] = null;
      if (count >= cap) return;
    }
  }

  solve(0);
  return count;
}

function generateTakuzu(dateStr) {
  const rng = mulberry32(stringToSeed(dateStr + '|takuzu'));
  const solution = takuzuFullGrid(rng);
  const puzzle = solution.map(r => r.slice());

  const positions = [];
  for (let r = 0; r < T_SIZE; r++)
    for (let c = 0; c < T_SIZE; c++) positions.push([r, c]);

  // On creuse tant que la solution reste unique, sans descendre
  // sous 12 cases imposées (retirer moins de cases préserve l'unicité)
  const MIN_IMPOSEES = 12;
  let imposees = T_SIZE * T_SIZE;
  for (const [r, c] of seededShuffle(positions, rng)) {
    if (imposees <= MIN_IMPOSEES) break;
    const sauvegarde = puzzle[r][c];
    puzzle[r][c] = null;
    if (takuzuCountSolutions(puzzle, 2) !== 1) puzzle[r][c] = sauvegarde;
    else imposees--;
  }

  return { puzzle, solution };
}

// Analyse une grille (valeurs 0/1/null) et retourne les conflits de règles :
// cellules fautives + raisons lisibles. Une grille complète sans conflit
// est une solution valide (donc LA solution, l'unicité étant garantie).
function takuzuConflits(g) {
  const cellules = new Set();
  const raisons = [];
  const marque = (r, c) => cellules.add(r + ',' + c);

  // Règle 1 : jamais trois pions identiques d'affilée
  let triples = 0;
  for (let r = 0; r < T_SIZE; r++) {
    for (let c = 0; c < T_SIZE; c++) {
      if (c + 2 < T_SIZE && g[r][c] !== null &&
          g[r][c] === g[r][c + 1] && g[r][c] === g[r][c + 2]) {
        marque(r, c); marque(r, c + 1); marque(r, c + 2); triples++;
      }
      if (r + 2 < T_SIZE && g[r][c] !== null &&
          g[r][c] === g[r + 1][c] && g[r][c] === g[r + 2][c]) {
        marque(r, c); marque(r + 1, c); marque(r + 2, c); triples++;
      }
    }
  }
  if (triples > 0) raisons.push(`${triples} alignement${triples > 1 ? 's' : ''} de trois pions identiques`);

  // Règle 2 : au plus 3 pions de chaque couleur par ligne / colonne
  for (let r = 0; r < T_SIZE; r++) {
    let bleus = 0, rouges = 0;
    for (let c = 0; c < T_SIZE; c++) {
      if (g[r][c] === 0) bleus++; else if (g[r][c] === 1) rouges++;
    }
    if (bleus > 3 || rouges > 3) {
      for (let c = 0; c < T_SIZE; c++) if (g[r][c] !== null) marque(r, c);
      raisons.push(`ligne ${r + 1} : plus de trois pions ${bleus > 3 ? 'bleus' : 'rouges'}`);
    }
  }
  for (let c = 0; c < T_SIZE; c++) {
    let bleus = 0, rouges = 0;
    for (let r = 0; r < T_SIZE; r++) {
      if (g[r][c] === 0) bleus++; else if (g[r][c] === 1) rouges++;
    }
    if (bleus > 3 || rouges > 3) {
      for (let r = 0; r < T_SIZE; r++) if (g[r][c] !== null) marque(r, c);
      raisons.push(`colonne ${c + 1} : plus de trois pions ${bleus > 3 ? 'bleus' : 'rouges'}`);
    }
  }

  // Règle 3 : pas deux lignes (ou colonnes) complètes identiques
  for (let r1 = 0; r1 < T_SIZE; r1++) {
    for (let r2 = r1 + 1; r2 < T_SIZE; r2++) {
      if (g[r1].every(v => v !== null) && g[r2].every(v => v !== null) &&
          g[r1].every((v, i) => v === g[r2][i])) {
        for (let c = 0; c < T_SIZE; c++) { marque(r1, c); marque(r2, c); }
        raisons.push(`lignes ${r1 + 1} et ${r2 + 1} identiques`);
      }
    }
  }
  for (let c1 = 0; c1 < T_SIZE; c1++) {
    for (let c2 = c1 + 1; c2 < T_SIZE; c2++) {
      let pleines = true, memes = true;
      for (let r = 0; r < T_SIZE; r++) {
        if (g[r][c1] === null || g[r][c2] === null) { pleines = false; break; }
        if (g[r][c1] !== g[r][c2]) memes = false;
      }
      if (pleines && memes) {
        for (let r = 0; r < T_SIZE; r++) { marque(r, c1); marque(r, c2); }
        raisons.push(`colonnes ${c1 + 1} et ${c2 + 1} identiques`);
      }
    }
  }

  return { cellules, raisons };
}

/* ============================================================
   6. Application (uniquement dans le navigateur)
   ============================================================ */

if (typeof document !== 'undefined') {

  /* ---------- Stockage ---------- */

  const DATE = todayStr();
  const KEY_JOUR = 'kiosque-jour-' + DATE;
  const KEY_STATS = 'kiosque-stats';

  function loadJour() {
    try { return JSON.parse(localStorage.getItem(KEY_JOUR)) || {}; }
    catch { return {}; }
  }
  function saveJour(etat) {
    try { localStorage.setItem(KEY_JOUR, JSON.stringify(etat)); } catch {}
  }
  function loadStats() {
    try {
      return JSON.parse(localStorage.getItem(KEY_STATS)) ||
        { streak: 0, record: 0, dernierJourComplet: null, totalEditions: 0 };
    } catch {
      return { streak: 0, record: 0, dernierJourComplet: null, totalEditions: 0 };
    }
  }
  function saveStats(s) {
    try { localStorage.setItem(KEY_STATS, JSON.stringify(s)); } catch {}
  }

  const etatJour = loadJour();
  etatJour.cible = etatJour.cible || { resolu: false, coups: null };
  etatJour.suite = etatJour.suite || { resolu: false, rate: false, essais: [] };
  etatJour.takuzu = etatJour.takuzu || { resolu: false, saisies: null };

  /* ---------- Données du jour ---------- */

  const donneesCible = generateCible(DATE);
  const donneesSuite = generateSuite(DATE);
  const donneesTakuzu = generateTakuzu(DATE);

  /* ---------- Masthead ---------- */

  document.getElementById('edition-num').textContent = 'N° ' + editionNumber();
  const dateAffichee = frDate();
  document.getElementById('edition-date').textContent =
    dateAffichee.charAt(0).toUpperCase() + dateAffichee.slice(1);

  /* ---------- Onglets ---------- */

  const onglets = document.querySelectorAll('.rubrique');
  const panneaux = {
    cible: document.getElementById('panneau-cible'),
    suite: document.getElementById('panneau-suite'),
    takuzu: document.getElementById('panneau-takuzu')
  };

  function ouvrirRubrique(nom) {
    onglets.forEach(o => {
      const actif = o.dataset.jeu === nom;
      o.classList.toggle('active', actif);
      o.setAttribute('aria-selected', actif ? 'true' : 'false');
    });
    Object.entries(panneaux).forEach(([k, p]) => p.classList.toggle('hidden', k !== nom));
  }

  onglets.forEach(o => o.addEventListener('click', () => ouvrirRubrique(o.dataset.jeu)));

  function majStatutOnglet(nom, statut) { // 'ok' | 'rate' | null
    const onglet = document.querySelector(`.rubrique[data-jeu="${nom}"] .statut`);
    if (!onglet) return;
    onglet.textContent = statut === 'ok' ? '✓' : statut === 'rate' ? '✗' : '·';
    onglet.className = 'statut' + (statut ? ' ' + statut : '');
  }

  function tamponner(nom, texte) {
    const panneau = panneaux[nom];
    if (!panneau || panneau.querySelector('.tampon')) return;
    const t = document.createElement('div');
    t.className = 'tampon';
    t.textContent = texte;
    panneau.querySelector('.zone-jeu').appendChild(t);
  }

  /* ---------- Streak & fin de journée ---------- */

  function verifierJourComplet() {
    const complet = etatJour.cible.resolu && etatJour.suite.resolu && etatJour.takuzu.resolu;
    if (!complet) return;
    const stats = loadStats();
    if (stats.dernierJourComplet === DATE) return; // déjà compté
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);
    stats.streak = (stats.dernierJourComplet === todayStr(hier)) ? stats.streak + 1 : 1;
    stats.record = Math.max(stats.record, stats.streak);
    stats.dernierJourComplet = DATE;
    stats.totalEditions += 1;
    saveStats(stats);
    majStreak();
  }

  function majStreak() {
    const stats = loadStats();
    document.getElementById('streak').textContent =
      stats.streak > 0 ? `Série : ${stats.streak} jour${stats.streak > 1 ? 's' : ''}` : 'Série : —';
  }

  /* ============================================================
     JEU 1 — LA CIBLE
     ============================================================ */

  (function initCible() {
    const { plaques, target } = donneesCible;
    const elCible = document.getElementById('cible-nombre');
    const elPlaques = document.getElementById('cible-plaques');
    const elOps = document.getElementById('cible-operateurs');
    const elHistorique = document.getElementById('cible-historique');
    const elMessage = document.getElementById('cible-message');
    const btnAnnuler = document.getElementById('cible-annuler');
    const btnReset = document.getElementById('cible-reset');

    elCible.textContent = target;

    // état : liste de plaques {valeur, vivante}, sélection en cours, pile d'historique
    let plateau, selection, operateur, historique, nbOps;

    function nouveauPlateau() {
      plateau = plaques.map((v, i) => ({ id: i, valeur: v, vivante: true }));
      selection = null; operateur = null; historique = []; nbOps = 0;
      elHistorique.innerHTML = '';
      elMessage.textContent = 'Combinez les plaques pour atteindre la cible.';
      rendre();
    }

    function rendre() {
      elPlaques.innerHTML = '';
      plateau.forEach(p => {
        if (!p.vivante) return;
        const b = document.createElement('button');
        b.className = 'plaque' + (selection === p.id ? ' selectionnee' : '');
        b.textContent = p.valeur;
        b.disabled = etatJour.cible.resolu;
        b.addEventListener('click', () => clicPlaque(p.id));
        elPlaques.appendChild(b);
      });
      elOps.querySelectorAll('button').forEach(b => {
        b.classList.toggle('selectionnee', operateur === b.dataset.op);
        b.disabled = etatJour.cible.resolu;
      });
      btnAnnuler.disabled = historique.length === 0 || etatJour.cible.resolu;
      btnReset.disabled = etatJour.cible.resolu;
    }

    function clicPlaque(id) {
      if (etatJour.cible.resolu) return;
      if (selection === null) { selection = id; rendre(); return; }
      if (selection === id) { selection = null; operateur = null; rendre(); return; }
      if (operateur === null) { selection = id; rendre(); return; }
      combiner(selection, operateur, id);
    }

    elOps.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        if (etatJour.cible.resolu || selection === null) return;
        operateur = b.dataset.op;
        rendre();
      });
    });

    function combiner(idA, op, idB) {
      const a = plateau.find(p => p.id === idA);
      const b = plateau.find(p => p.id === idB);
      let r;
      if (op === '+') r = a.valeur + b.valeur;
      else if (op === '-') r = a.valeur - b.valeur;
      else if (op === '×') r = a.valeur * b.valeur;
      else r = b.valeur !== 0 && a.valeur % b.valeur === 0 ? a.valeur / b.valeur : NaN;

      if (!Number.isInteger(r) || r <= 0) {
        elMessage.textContent = 'Opération refusée : seuls les résultats entiers et positifs comptent.';
        selection = null; operateur = null; rendre();
        return;
      }

      historique.push({ aId: a.id, bId: b.id, nouveau: null });
      a.vivante = false; b.vivante = false;
      const neuf = { id: 100 + nbOps, valeur: r, vivante: true };
      historique[historique.length - 1].nouveau = neuf.id;
      plateau.push(neuf);
      nbOps++;

      const ligne = document.createElement('div');
      ligne.className = 'ligne-calcul';
      ligne.textContent = `${a.valeur} ${op} ${b.valeur} = ${r}`;
      elHistorique.appendChild(ligne);

      selection = null; operateur = null;

      if (r === target) {
        etatJour.cible.resolu = true;
        etatJour.cible.coups = nbOps;
        saveJour(etatJour);
        elMessage.textContent = `Le compte est bon — en ${nbOps} opération${nbOps > 1 ? 's' : ''}.`;
        majStatutOnglet('cible', 'ok');
        tamponner('cible', 'RÉUSSI');
        verifierJourComplet();
      } else {
        const dist = Math.abs(r - target);
        elMessage.textContent = dist <= 10
          ? `${r} — vous brûlez, à ${dist} de la cible.`
          : `${r} — encore ${dist} d'écart.`;
      }
      rendre();
    }

    btnAnnuler.addEventListener('click', () => {
      const dernier = historique.pop();
      if (!dernier) return;
      plateau = plateau.filter(p => p.id !== dernier.nouveau);
      plateau.find(p => p.id === dernier.aId).vivante = true;
      plateau.find(p => p.id === dernier.bId).vivante = true;
      nbOps--;
      if (elHistorique.lastChild) elHistorique.removeChild(elHistorique.lastChild);
      selection = null; operateur = null;
      elMessage.textContent = 'Opération annulée.';
      rendre();
    });

    btnReset.addEventListener('click', nouveauPlateau);

    nouveauPlateau();

    if (etatJour.cible.resolu) {
      elMessage.textContent = `Déjà résolu aujourd'hui, en ${etatJour.cible.coups} opération${etatJour.cible.coups > 1 ? 's' : ''}.`;
      majStatutOnglet('cible', 'ok');
      tamponner('cible', 'RÉUSSI');
      rendre();
    }
  })();

  /* ============================================================
     JEU 2 — LA SUITE
     ============================================================ */

  (function initSuite() {
    const { visibles, reponse, indice } = donneesSuite;
    const elTermes = document.getElementById('suite-termes');
    const elInput = document.getElementById('suite-input');
    const elValider = document.getElementById('suite-valider');
    const elMessage = document.getElementById('suite-message');
    const elEssais = document.getElementById('suite-essais');
    const MAX_ESSAIS = 3;

    visibles.forEach(t => {
      const d = document.createElement('div');
      d.className = 'terme';
      d.textContent = t;
      elTermes.appendChild(d);
    });
    const mystere = document.createElement('div');
    mystere.className = 'terme mystere';
    mystere.textContent = '?';
    elTermes.appendChild(mystere);

    function rendreEssais() {
      elEssais.innerHTML = '';
      for (let i = 0; i < MAX_ESSAIS; i++) {
        const p = document.createElement('span');
        const essai = etatJour.suite.essais[i];
        p.className = 'point-essai' +
          (essai === undefined ? '' : essai === reponse ? ' bon' : ' mauvais');
        elEssais.appendChild(p);
      }
    }

    function terminer(gagne) {
      elInput.disabled = true;
      elValider.disabled = true;
      mystere.textContent = reponse;
      mystere.classList.remove('mystere');
      mystere.classList.add(gagne ? 'revele-bon' : 'revele-mauvais');
      if (gagne) {
        etatJour.suite.resolu = true;
        majStatutOnglet('suite', 'ok');
        tamponner('suite', 'RÉUSSI');
      } else {
        etatJour.suite.rate = true;
        majStatutOnglet('suite', 'rate');
        elMessage.textContent = `La réponse était ${reponse}. ${indice}`;
      }
      saveJour(etatJour);
      verifierJourComplet();
    }

    function soumettre() {
      const v = parseInt(elInput.value, 10);
      if (!Number.isInteger(v)) {
        elMessage.textContent = 'Entrez un nombre entier.';
        return;
      }
      etatJour.suite.essais.push(v);
      saveJour(etatJour);
      elInput.value = '';
      rendreEssais();

      if (v === reponse) {
        elMessage.textContent = `Exact — en ${etatJour.suite.essais.length} essai${etatJour.suite.essais.length > 1 ? 's' : ''}.`;
        terminer(true);
        return;
      }
      const restants = MAX_ESSAIS - etatJour.suite.essais.length;
      if (restants === 0) { terminer(false); return; }
      const direction = v < reponse ? 'plus grand' : 'plus petit';
      elMessage.textContent = restants === 1
        ? `Non — c'est ${direction}. Dernier indice : ${indice.toLowerCase()} (${restants} essai restant)`
        : `Non — c'est ${direction}. (${restants} essais restants)`;
    }

    elValider.addEventListener('click', soumettre);
    elInput.addEventListener('keydown', e => { if (e.key === 'Enter') soumettre(); });

    rendreEssais();

    // Restauration d'une partie en cours ou finie
    if (etatJour.suite.resolu) {
      elMessage.textContent = `Déjà résolu aujourd'hui, en ${etatJour.suite.essais.length} essai${etatJour.suite.essais.length > 1 ? 's' : ''}.`;
      terminer(true);
    } else if (etatJour.suite.rate || etatJour.suite.essais.length >= MAX_ESSAIS) {
      terminer(false);
    } else if (etatJour.suite.essais.length > 0) {
      const dernier = etatJour.suite.essais[etatJour.suite.essais.length - 1];
      const direction = dernier < reponse ? 'plus grand' : 'plus petit';
      elMessage.textContent = `Partie en cours — dernier essai : ${dernier} (c'est ${direction}).` +
        (etatJour.suite.essais.length >= 2 ? ` Indice : ${indice.toLowerCase()}` : '');
    }
  })();

  /* ============================================================
     JEU 3 — LA GRILLE (Takuzu)
     ============================================================ */

  (function initTakuzu() {
    const { puzzle, solution } = donneesTakuzu;
    const elGrille = document.getElementById('takuzu-grille');
    const elMessage = document.getElementById('takuzu-message');
    const btnVerifier = document.getElementById('takuzu-verifier');
    const btnEffacer = document.getElementById('takuzu-effacer');

    // saisies du joueur (null pour cases données)
    let saisies = etatJour.takuzu.saisies ||
      puzzle.map(r => r.map(() => null));

    const cellules = [];

    function valeurCase(r, c) {
      return puzzle[r][c] !== null ? puzzle[r][c] : saisies[r][c];
    }

    function rendre() {
      for (let r = 0; r < T_SIZE; r++) {
        for (let c = 0; c < T_SIZE; c++) {
          const cell = cellules[r * T_SIZE + c];
          const v = valeurCase(r, c);
          cell.className = 'case' +
            (puzzle[r][c] !== null ? ' donnee' : '') +
            (v === 0 ? ' bleu' : v === 1 ? ' rouge' : '');
          cell.setAttribute('aria-label',
            `Ligne ${r + 1}, colonne ${c + 1} : ${v === 0 ? 'bleu' : v === 1 ? 'rouge' : 'vide'}`);
        }
      }
      btnVerifier.disabled = etatJour.takuzu.resolu;
      btnEffacer.disabled = etatJour.takuzu.resolu;
    }

    function clicCase(r, c) {
      if (etatJour.takuzu.resolu || puzzle[r][c] !== null) return;
      const v = saisies[r][c];
      saisies[r][c] = v === null ? 0 : v === 0 ? 1 : null;
      etatJour.takuzu.saisies = saisies;
      saveJour(etatJour);
      cellules[r * T_SIZE + c].classList.remove('erreur');
      rendre();
      verifierVictoire();
    }

    function grilleCourante() {
      const g = [];
      for (let r = 0; r < T_SIZE; r++) {
        g.push([]);
        for (let c = 0; c < T_SIZE; c++) g[r].push(valeurCase(r, c));
      }
      return g;
    }

    // Victoire = grille complète qui respecte les trois règles.
    // (L'unicité étant garantie, c'est nécessairement LA solution —
    // mais on ne dépend plus d'une comparaison à une grille cachée.)
    function verifierVictoire() {
      const g = grilleCourante();
      for (let r = 0; r < T_SIZE; r++)
        for (let c = 0; c < T_SIZE; c++)
          if (g[r][c] === null) return;
      if (takuzuConflits(g).raisons.length > 0) return;
      etatJour.takuzu.resolu = true;
      saveJour(etatJour);
      elMessage.textContent = 'Grille parfaite.';
      majStatutOnglet('takuzu', 'ok');
      tamponner('takuzu', 'RÉUSSI');
      verifierJourComplet();
      rendre();
    }

    // Vérifier : l'encadrement signale les pions différents de la solution ;
    // le message, lui, explique les règles violées s'il y en a.
    btnVerifier.addEventListener('click', () => {
      cellules.forEach(c => c.classList.remove('erreur'));
      const g = grilleCourante();

      let differences = 0;
      for (let r = 0; r < T_SIZE; r++) {
        for (let c = 0; c < T_SIZE; c++) {
          if (g[r][c] !== null && g[r][c] !== solution[r][c]) {
            cellules[r * T_SIZE + c].classList.add('erreur');
            differences++;
          }
        }
      }

      const { raisons } = takuzuConflits(g);
      if (raisons.length > 0) {
        elMessage.textContent = 'Conflit : ' + raisons.join(' · ') + '.';
      } else if (differences > 0) {
        elMessage.textContent = `Aucune règle violée pour l'instant, mais ${differences} pion${differences > 1 ? 's' : ''} encadré${differences > 1 ? 's' : ''} ne mène${differences > 1 ? 'nt' : ''} pas à la solution.`;
      } else {
        const restantes = g.flat().filter(v => v === null).length;
        elMessage.textContent = restantes === 0
          ? 'Grille parfaite.'
          : `Tout est juste — encore ${restantes} case${restantes > 1 ? 's' : ''} à remplir.`;
      }
    });

    btnEffacer.addEventListener('click', () => {
      saisies = puzzle.map(r => r.map(() => null));
      etatJour.takuzu.saisies = saisies;
      saveJour(etatJour);
      cellules.forEach(c => c.classList.remove('erreur'));
      elMessage.textContent = 'Vos coups ont été effacés, les cases de départ restent.';
      rendre();
    });

    // Construction de la grille
    for (let r = 0; r < T_SIZE; r++) {
      for (let c = 0; c < T_SIZE; c++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.addEventListener('click', () => clicCase(r, c));
        elGrille.appendChild(cell);
        cellules.push(cell);
      }
    }

    rendre();

    if (etatJour.takuzu.resolu) {
      elMessage.textContent = 'Déjà résolue aujourd\u2019hui.';
      majStatutOnglet('takuzu', 'ok');
      tamponner('takuzu', 'RÉUSSI');
      rendre();
    } else {
      verifierVictoire();
    }
  })();

  /* ---------- Statuts initiaux, streak, countdown, partage ---------- */

  majStreak();
  if (etatJour.suite.rate) majStatutOnglet('suite', 'rate');

  // Compte à rebours vers la prochaine édition
  const elCompte = document.getElementById('compte-a-rebours');
  function majCompteARebours() {
    const demain = new Date();
    demain.setDate(demain.getDate() + 1);
    demain.setHours(0, 0, 0, 0);
    const reste = demain - new Date();
    if (reste <= 0) {
      elCompte.textContent = 'Nouvelle édition disponible — rechargez la page.';
      return;
    }
    const h = Math.floor(reste / 3600000);
    const m = Math.floor((reste % 3600000) / 60000);
    const s = Math.floor((reste % 60000) / 1000);
    elCompte.textContent =
      `Prochaine édition dans ${String(h).padStart(2, '0')} h ${String(m).padStart(2, '0')} min ${String(s).padStart(2, '0')} s`;
  }
  majCompteARebours();
  setInterval(majCompteARebours, 1000);

  // Partage
  document.getElementById('btn-partager').addEventListener('click', async function () {
    const stats = loadStats();
    const ligne = (etat, ok, detail) =>
      etat ? `✅ ${detail}` : ok === false ? '❌ raté' : '⬜ pas encore joué';

    let texte = `🗞️ Le Kiosque — Édition n°${editionNumber()} (${DATE})\n`;
    texte += `🎯 La Cible : ${etatJour.cible.resolu ? `✅ en ${etatJour.cible.coups} opération${etatJour.cible.coups > 1 ? 's' : ''}` : '⬜ pas encore'}\n`;
    texte += `🔢 La Suite : ${etatJour.suite.resolu ? `✅ ${etatJour.suite.essais.length}/3` : etatJour.suite.rate ? '❌ ratée' : '⬜ pas encore'}\n`;
    texte += `🁢 La Grille : ${etatJour.takuzu.resolu ? '✅ résolue' : '⬜ pas encore'}\n`;
    if (stats.streak > 0) texte += `🔥 Série : ${stats.streak} jour${stats.streak > 1 ? 's' : ''}\n`;
    texte += `Trois jeux neufs chaque matin →`;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Le Kiosque', text: texte, url: 'https://lekiosque.netlify.app' });
      } else {
        await navigator.clipboard.writeText(texte);
        this.textContent = 'Copié ✓';
        setTimeout(() => { this.textContent = 'Partager mon édition'; }, 2000);
      }
    } catch { /* partage annulé */ }
  });
}

/* ---------- Export pour tests (Node) ---------- */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    stringToSeed, mulberry32, generateCible, generateSuite,
    generateTakuzu, takuzuCountSolutions, takuzuConflits, T_SIZE
  };
}