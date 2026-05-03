const STORAGE_KEY = 'carcassonneLeaderboardV2';
let games = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let mode = 'peak';
const $ = (id) => document.getElementById(id);

function today(){ return new Date().toISOString().slice(0,10); }
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(games)); }
function toast(msg){ const t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),1800); }

function addPlayerRow(name='', score=''){
  const row=document.createElement('div'); row.className='player-row';
  row.innerHTML=`<input class="pname" placeholder="Player name" value="${name}"><input class="pscore" type="number" inputmode="decimal" placeholder="Score" value="${score}"><button class="remove" title="Remove">×</button>`;
  row.querySelector('.remove').onclick=()=>row.remove();
  $('playerRows').appendChild(row);
}

function collectStats(){
  const stats={};
  for(const game of games){
    const sorted=[...game.players].sort((a,b)=>b.score-a.score);
    const topScore=sorted[0]?.score;
    for(const p of game.players){
      if(!stats[p.name]) stats[p.name]={name:p.name,games:0,total:0,peak:-Infinity,wins:0};
      stats[p.name].games++; stats[p.name].total+=p.score; stats[p.name].peak=Math.max(stats[p.name].peak,p.score);
      if(p.score===topScore) stats[p.name].wins++;
    }
  }
  return Object.values(stats).map(s=>({...s, average:s.total/s.games}));
}

function renderLeaderboard(){
  const board=$('leaderboard');
  const stats=collectStats();
  if(!stats.length){ board.innerHTML='<div class="empty">No records yet. Add your first conquest.</div>'; return; }
  const sorted=stats.sort((a,b)=>{
    if(mode==='peak') return b.peak-a.peak || b.average-a.average;
    if(mode==='average') return b.average-a.average || b.peak-a.peak;
    return b.wins-a.wins || b.average-a.average;
  });
  board.innerHTML=sorted.map((s,i)=>{
    const value=mode==='peak'?s.peak:mode==='average'?s.average.toFixed(1):s.wins;
    const label=mode==='peak'?'Best score':mode==='average'?'Avg score':'Wins';
    return `<div class="tile"><div class="rank-badge">#${i+1}</div><div><div class="tile-name">${escapeHtml(s.name)}</div><div class="tile-meta">${s.games} games played · Peak ${s.peak} · Avg ${s.average.toFixed(1)} · ${s.wins} wins</div></div><div><div class="tile-score">${value}</div><div class="tile-meta">${label}</div></div></div>`;
  }).join('');
}

function renderHistory(){
  const history=$('history');
  if(!games.length){ history.innerHTML='<div class="empty">No game history yet.</div>'; return; }
  history.innerHTML=[...games].reverse().map((g,idx)=>{
    const sorted=[...g.players].sort((a,b)=>b.score-a.score);
    return `<article class="game-card"><h3>${escapeHtml(g.name || 'Carcassonne')} — Game #${games.length-idx}</h3><p>${g.date} · ${g.players.length} players</p><div class="score-list">${sorted.map((p,i)=>`<div class="score-line"><span>${i===0?'🥇 ':''}${escapeHtml(p.name)}</span><strong>${p.score}</strong></div>`).join('')}</div></article>`;
  }).join('');
}

function render(){ renderLeaderboard(); renderHistory(); }
function escapeHtml(str){ return String(str).replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[c])); }

$('addPlayer').onclick=()=>addPlayerRow();
$('saveGame').onclick=()=>{
  const players=[...document.querySelectorAll('.player-row')].map(row=>({name:row.querySelector('.pname').value.trim(), score:Number(row.querySelector('.pscore').value)})).filter(p=>p.name && Number.isFinite(p.score));
  if(players.length<2){ toast('Add at least 2 players with scores.'); return; }
  games.push({date:$('gameDate').value || today(), name:$('gameName').value.trim() || 'Carcassonne', players});
  save(); render(); toast('Game saved. Leaderboard updated.');
};
$('clearAll').onclick=()=>{ if(confirm('Clear all records?')){ games=[]; save(); render(); toast('Records cleared.'); } };
document.querySelectorAll('.tab').forEach(btn=>btn.onclick=()=>{ document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); mode=btn.dataset.mode; renderLeaderboard(); });
$('gameDate').value=today();
['Anna','','',''].forEach(n=>addPlayerRow(n));
render();
if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{})); }
