import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Trophy, 
  Target, 
  TrendingUp, 
  Calendar,
  MapPin,
  XCircle,
  BarChart3,
  ShieldCheck,
  Plus,
  Trash2,
  Medal,
  Pencil,
  CheckCircle2
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

// --- Configuration ---
const SONS = {
  LIAM: { id: 'liam', name: 'Liam', team: 'MagaliesKruin 1st Team', color: '#059669' },
  DIVAN: { id: 'divan', name: 'Divan', team: 'Die Poort U/10', color: '#2563eb' }
};

const TRY_POINTS = 5;
const CONVERSION_POINTS = 2;
const PENALTY_POINTS = 3;

const calculatePoints = (tries, convs, pens) => 
  (tries * TRY_POINTS) + (convs * CONVERSION_POINTS) + (pens * PENALTY_POINTS);

const getSuccessRate = (made, att) => att === 0 ? 0 : Math.round((made / att) * 100);

const getResultLabel = (us, them) => {
  if (us > them) return 'Win';
  if (us < them) return 'Loss';
  return 'Draw';
};

export default function App() {
  const [activeSon, setActiveSon] = useState('liam');
  const [view, setView] = useState('dashboard');
  const [matches, setMatches] = useState([]);
  const [editingMatch, setEditingMatch] = useState(null);

  // Load from local browser storage
  useEffect(() => {
    const saved = localStorage.getItem('vorster_rugby_v5');
    if (saved) setMatches(JSON.parse(saved));
  }, []);

  // Save to local browser storage
  useEffect(() => {
    localStorage.setItem('vorster_rugby_v5', JSON.stringify(matches));
  }, [matches]);

  const activeSonData = SONS[activeSon.toUpperCase()];
  
  const filteredMatches = useMemo(() => 
    matches
      .filter(m => m.sonId === activeSon)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  , [matches, activeSon]);

  const stats = useMemo(() => {
    if (filteredMatches.length === 0) return null;
    
    const wins = filteredMatches.filter(m => m.scoreUs > m.scoreThem).length;
    const losses = filteredMatches.filter(m => m.scoreUs < m.scoreThem).length;
    const draws = filteredMatches.filter(m => m.scoreUs === m.scoreThem).length;
    const sonPoints = filteredMatches.reduce((acc, m) => acc + calculatePoints(m.sonTries, m.sonConvSucc, m.sonPenSucc), 0);
    const sonTries = filteredMatches.reduce((acc, m) => acc + m.sonTries, 0);
    const totalConvAtt = filteredMatches.reduce((acc, m) => acc + m.sonConvAtt, 0);
    const totalConvSucc = filteredMatches.reduce((acc, m) => acc + m.sonConvSucc, 0);
    const totalPenAtt = filteredMatches.reduce((acc, m) => acc + m.sonPenAtt, 0);
    const totalPenSucc = filteredMatches.reduce((acc, m) => acc + m.sonPenSucc, 0);

    const teamScorers = {};
    teamScorers[activeSonData.name] = { tries: sonTries, points: sonPoints };
    
    filteredMatches.forEach(m => {
      (m.otherScorers || []).forEach(s => {
        if (!teamScorers[s.name]) teamScorers[s.name] = { tries: 0, points: 0 };
        teamScorers[s.name].tries += (s.tries || 0);
        teamScorers[s.name].points += calculatePoints(s.tries, s.convs, s.pens);
      });
    });

    return {
      totalGames: filteredMatches.length, wins, losses, draws,
      sonPoints, sonTries,
      overallRate: getSuccessRate(totalConvSucc + totalPenSucc, totalConvAtt + totalPenAtt),
      winRate: ((wins / filteredMatches.length) * 100).toFixed(0),
      leaderboard: Object.entries(teamScorers).map(([n, d]) => ({ name: n, ...d })).sort((a, b) => b.points - a.points)
    };
  }, [filteredMatches, activeSonData.name]);

  const handleSaveMatch = (data) => {
    if (data.id) {
      setMatches(matches.map(m => m.id === data.id ? data : m));
    } else {
      setMatches([{ ...data, id: Date.now(), sonId: activeSon }, ...matches]);
    }
    setEditingMatch(null);
    setView('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans antialiased">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: activeSonData.color }}>{activeSonData.name[0]}</div>
          <div>
            <h1 className="font-black text-lg leading-tight">{activeSonData.name}</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeSonData.team}</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {Object.values(SONS).map(son => (
            <button key={son.id} onClick={() => { setActiveSon(son.id); setView('dashboard'); }} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${activeSon === son.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>{son.name}</button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4">
        {view === 'dashboard' && <Dashboard stats={stats} sonData={activeSonData} />}
        {view === 'history' && <MatchHistory matches={filteredMatches} onDelete={(id) => setMatches(matches.filter(m => m.id !== id))} onEdit={(m) => { setEditingMatch(m); setView('add'); }} color={activeSonData.color} />}
        {view === 'add' && <AddMatchForm initialData={editingMatch} onSave={handleSaveMatch} onCancel={() => setView('dashboard')} sonName={activeSonData.name} color={activeSonData.color} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center z-50">
        <NavBtn active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={20} />} label="Stats" color={activeSonData.color} />
        <NavBtn active={view === 'add'} onClick={() => { setEditingMatch(null); setView('add'); }} icon={<PlusCircle size={28} />} label="Add" color={activeSonData.color} isCenter />
        <NavBtn active={view === 'history'} onClick={() => setView('history')} icon={<History size={20} />} label="History" color={activeSonData.color} />
      </nav>
    </div>
  );
}

// --- Components ---

function NavBtn({ active, onClick, icon, label, color, isCenter }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${isCenter ? '-mt-12' : ''}`}>
      <div className={`p-3 rounded-2xl transition-all ${isCenter ? 'bg-slate-900 text-white shadow-2xl scale-110' : active ? 'text-white' : 'text-slate-400'}`} style={!isCenter && active ? { backgroundColor: color } : {}}>{icon}</div>
      {!isCenter && <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${active ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>}
    </button>
  );
}

function Dashboard({ stats, sonData }) {
  if (!stats) return <div className="py-20 text-center"><Trophy size={48} className="mx-auto text-slate-200 mb-4"/><p className="text-slate-400 font-bold italic">No matches recorded yet for {sonData.name}.</p></div>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Points" value={stats.sonPoints} sub={`${stats.sonTries} Tries`} icon={<Target size={16}/>} color={sonData.color} highlight />
        <StatCard label="Win Rate" value={`${stats.winRate}%`} sub={`${stats.wins} Wins`} icon={<TrendingUp size={16}/>} />
        <StatCard label="Goal Kicking" value={`${stats.overallRate}%`} sub="Accuracy" icon={<ShieldCheck size={16}/>} />
        <StatCard label="Record" value={`${stats.wins}-${stats.draws}-${stats.losses}`} sub="W-D-L" icon={<Trophy size={16}/>} />
      </div>
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 italic tracking-widest">Season Leaderboard</h3>
        <div className="space-y-3">
          {stats.leaderboard.map((s, i) => (
            <div key={s.name} className={`flex items-center justify-between p-4 rounded-2xl ${s.name === sonData.name ? 'bg-slate-900 text-white' : 'bg-slate-50'}`}>
              <span className="font-bold text-sm tracking-tight">{i + 1}. {s.name}</span>
              <span className="font-black text-sm tracking-tight">{s.points} <span className="text-[9px] opacity-60 uppercase">pts</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, highlight }) {
  return (
    <div className={`p-6 rounded-3xl border border-slate-200 transition-all ${highlight ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-900 shadow-sm'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl ${highlight ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400'}`}>{icon}</div>
        <span className={`text-[9px] font-black uppercase tracking-widest ${highlight ? 'text-white/40' : 'text-slate-300'}`}>{label}</span>
      </div>
      <p className="text-4xl font-black leading-none tracking-tighter">{value}</p>
      <p className={`text-[10px] font-bold mt-2 uppercase ${highlight ? 'text-white/60' : 'text-slate-400'}`}>{sub}</p>
    </div>
  );
}

function MatchHistory({ matches, onDelete, onEdit }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black px-2 tracking-tight italic">Match History</h2>
      {matches.map(m => (
        <div key={m.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center justify-between group shadow-sm">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black ${m.scoreUs > m.scoreThem ? 'bg-emerald-50 text-emerald-600' : m.scoreUs === m.scoreThem ? 'bg-slate-50 text-slate-400' : 'bg-red-50 text-red-600'}`}>
              <span className="text-[9px] uppercase mb-1">{getResultLabel(m.scoreUs, m.scoreThem)}</span>
              <span className="text-xl">{m.scoreUs > m.scoreThem ? 'W' : m.scoreUs === m.scoreThem ? 'D' : 'L'}</span>
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-lg">vs {m.opponent}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(m.date).toLocaleDateString('en-GB')}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <p className="text-3xl font-black tracking-tighter">{m.scoreUs} - {m.scoreThem}</p>
            <div className="flex gap-2">
              <button onClick={() => onEdit(m)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><Pencil size={18}/></button>
              <button onClick={() => { if(window.confirm('Delete this game?')) onDelete(m.id); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AddMatchForm({ initialData, onSave, onCancel, sonName, color }) {
  const [f, setF] = useState(initialData || { date: new Date().toISOString().split('T')[0], opponent: '', scoreUs: 0, scoreThem: 0, sonTries: 0, sonConvAtt: 0, sonConvSucc: 0, sonPenAtt: 0, sonPenSucc: 0, otherScorers: [] });
  const [scorer, setScorer] = useState({ name: '', tries: 0, convs: 0, pens: 0 });

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden max-w-2xl mx-auto">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center" style={{ borderTop: `12px solid ${color}` }}>
        <h2 className="text-2xl font-black">{initialData ? 'Edit Match' : 'New Match'}</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-red-500"><XCircle size={28}/></button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSave(f); }} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Opponent</label>
            <input required className="w-full bg-slate-50 rounded-2xl p-4 font-bold border-none" value={f.opponent} onChange={e => setF({...f, opponent: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
            <input type="date" className="w-full bg-slate-50 rounded-2xl p-4 font-bold border-none" value={f.date} onChange={e => setF({...f, date: e.target.value})} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 bg-slate-900 p-8 rounded-[2rem]">
          <div className="text-center"><label className="text-[10px] font-black text-white/40 uppercase mb-2 block">Our Team</label><input type="number" className="w-full bg-white/10 rounded-2xl p-4 font-black text-3xl text-center text-white" value={f.scoreUs} onChange={e => setF({...f, scoreUs: parseInt(e.target.value)||0})} /></div>
          <div className="text-center"><label className="text-[10px] font-black text-white/40 uppercase mb-2 block">Opponent</label><input type="number" className="w-full bg-white/10 rounded-2xl p-4 font-black text-3xl text-center text-white" value={f.scoreThem} onChange={e => setF({...f, scoreThem: parseInt(e.target.value)||0})} /></div>
        </div>
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sonName}'s Stats</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-2xl text-center"><label className="text-[9px] font-black block mb-1">TRIES</label><input type="number" className="w-full bg-white rounded-xl p-2 text-center font-black" value={f.sonTries} onChange={e => setF({...f, sonTries: parseInt(e.target.value)||0})} /></div>
            <div className="bg-slate-50 p-3 rounded-2xl text-center col-span-2"><label className="text-[9px] font-black block mb-1">CONVERSIONS (MADE/ATT)</label><div className="flex gap-2"><input type="number" className="w-full bg-white rounded-xl p-2 text-center font-black" value={f.sonConvSucc} onChange={e => setF({...f, sonConvSucc: parseInt(e.target.value)||0})} /><input type="number" className="w-full bg-white rounded-xl p-2 text-center font-black" value={f.sonConvAtt} onChange={e => setF({...f, sonConvAtt: parseInt(e.target.value)||0})} /></div></div>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl text-center col-span-2"><label className="text-[9px] font-black block mb-1">PENALTY KICKS (MADE/ATT)</label><div className="flex gap-2"><input type="number" className="w-full bg-white rounded-xl p-2 text-center font-black" value={f.sonPenSucc} onChange={e => setF({...f, sonPenSucc: parseInt(e.target.value)||0})} /><input type="number" className="w-full bg-white rounded-xl p-2 text-center font-black" value={f.sonPenAtt} onChange={e => setF({...f, sonPenAtt: parseInt(e.target.value)||0})} /></div></div>
        </div>
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Scorers</h3>
          <div className="flex gap-2 items-end">
            <div className="flex-1"><label className="text-[9px] font-black ml-1 uppercase">Name</label><input className="w-full bg-slate-50 rounded-xl p-3 font-bold" value={scorer.name} onChange={e => setScorer({...scorer, name: e.target.value})} /></div>
            <div className="w-16"><label className="text-[9px] font-black ml-1 uppercase text-center block">Tries</label><input type="number" className="w-full bg-slate-50 rounded-xl p-3 font-bold text-center" value={scorer.tries} onChange={e => setScorer({...scorer, tries: parseInt(e.target.value)||0})} /></div>
            <button type="button" onClick={() => { if (scorer.name) { setF({...f, otherScorers: [...f.otherScorers, {...scorer, id: Date.now()}]}); setScorer({name:'', tries:0, convs:0, pens:0}); } }} className="bg-slate-900 text-white p-4 rounded-xl shadow-lg"><Plus size={18}/></button>
          </div>
          {f.otherScorers.map(s => <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-100 shadow-sm"><span>{s.name} ({s.tries} Tries)</span><button onClick={() => setF({...f, otherScorers: f.otherScorers.filter(o => o.id !== s.id)})} className="text-red-300 hover:text-red-500"><Trash2 size={16}/></button></div>)}
        </div>
        <button type="submit" className="w-full py-5 rounded-3xl text-white font-black text-xl shadow-2xl transition-all active:scale-95 sticky bottom-0" style={{ backgroundColor: color }}>Save to Device</button>
      </form>
    </div>
  );
}
