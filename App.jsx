import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, PlusCircle, History, Trophy, Target, 
  TrendingUp, ShieldCheck, Plus, Trash2, Medal, Pencil, XCircle, Users, Activity 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

// --- Spanne en Kleure ---
const SONS = {
  LIAM: { id: 'liam', name: 'Liam', team: 'MagaliesKruin 1ste Span', color: '#10b981', glow: 'rgba(16, 185, 129, 0.2)' },
  DIVAN: { id: 'divan', name: 'Divan', team: 'Die Poort o/10', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.2)' }
};

const TRY_POINTS = 5;
const CONVERSION_POINTS = 2;
const PENALTY_POINTS = 3;

export default function App() {
  const [activeSon, setActiveSon] = useState('liam');
  const [view, setView] = useState('dashboard');
  const [matches, setMatches] = useState([]);
  const [editingMatch, setEditingMatch] = useState(null);

  // Laai data vanaf foon geheue
  useEffect(() => {
    const saved = localStorage.getItem('vorster_rugby_vFinal_3file');
    if (saved) setMatches(JSON.parse(saved));
  }, []);

  // Stoor data wanneer iets verander
  useEffect(() => {
    localStorage.setItem('vorster_rugby_vFinal_3file', JSON.stringify(matches));
  }, [matches]);

  const activeSonData = SONS[activeSon.toUpperCase()];
  const filteredMatches = useMemo(() => 
    matches.filter(m => m.sonId === activeSon).sort((a, b) => new Date(b.date) - new Date(a.date))
  , [matches, activeSon]);

  const stats = useMemo(() => {
    if (filteredMatches.length === 0) return null;
    const wins = filteredMatches.filter(m => parseInt(m.scoreUs) > parseInt(m.scoreThem)).length;
    const losses = filteredMatches.filter(m => parseInt(m.scoreUs) < parseInt(m.scoreThem)).length;
    const draws = filteredMatches.filter(m => parseInt(m.scoreUs) === parseInt(m.scoreThem)).length;
    
    const sonTries = filteredMatches.reduce((acc, m) => acc + (parseInt(m.sonTries) || 0), 0);
    const totalConvSucc = filteredMatches.reduce((acc, m) => acc + (parseInt(m.sonConvSucc) || 0), 0);
    const totalConvAtt = filteredMatches.reduce((acc, m) => acc + (parseInt(m.sonConvAtt) || 0), 0);
    const totalPenSucc = filteredMatches.reduce((acc, m) => acc + (parseInt(m.sonPenSucc) || 0), 0);
    
    const sonPoints = (sonTries * TRY_POINTS) + (totalConvSucc * CONVERSION_POINTS) + (totalPenSucc * PENALTY_POINTS);

    const teamScorers = {};
    teamScorers[activeSonData.name] = { tries: sonTries, points: sonPoints };
    filteredMatches.forEach(m => {
      (m.otherScorers || []).forEach(s => {
        if (!teamScorers[s.name]) teamScorers[s.name] = { tries: 0, points: 0 };
        teamScorers[s.name].tries += (parseInt(s.tries) || 0);
        teamScorers[s.name].points += (parseInt(s.tries) || 0) * TRY_POINTS;
      });
    });

    return {
      totalGames: filteredMatches.length, wins, losses, draws, sonPoints, sonTries,
      accuracy: totalConvAtt === 0 ? 0 : Math.round((totalConvSucc / totalConvAtt) * 100),
      winRate: Math.round((wins / filteredMatches.length) * 100),
      leaderboard: Object.entries(teamScorers).map(([n, d]) => ({ name: n, ...d })).sort((a, b) => b.points - a.points)
    };
  }, [filteredMatches, activeSonData.name]);

  const handleSave = (data) => {
    if (data.id) {
      setMatches(matches.map(m => m.id === data.id ? data : m));
    } else {
      setMatches([{ ...data, id: Date.now(), sonId: activeSon }, ...matches]);
    }
    setEditingMatch(null);
    setView('dashboard');
  };

  const handleDelete = (id) => {
    if (window.confirm("Is jy seker jy wil hierdie wedstryd uitvee?")) {
      setMatches(matches.filter(m => m.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-36 font-sans antialiased text-slate-900">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 px-6 py-6 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg transition-all" 
               style={{ backgroundColor: activeSonData.color, boxShadow: `0 8px 20px -4px ${activeSonData.color}66` }}>
            {activeSonData.name[0]}
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight leading-none mb-1">{activeSonData.name}</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeSonData.team}</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
          {Object.values(SONS).map(son => (
            <button key={son.id} onClick={() => { setActiveSon(son.id); setView('dashboard'); }} 
                    className={`px-5 py-2 rounded-lg text-xs font-black transition-all ${activeSon === son.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>
              {son.name}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 pt-6">
        {view === 'dashboard' ? (
          <div className="space-y-6 animate-in">
            {!stats ? (
              <div className="py-24 text-center opacity-40">
                <Trophy size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="font-bold tracking-tight italic text-slate-400 uppercase text-xs">Gereed vir die eerste wedstryd...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-[2rem] bg-slate-900 text-white shadow-2xl transition-transform active:scale-95 border border-slate-800">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 rounded-xl bg-white/10 text-white"><Target size={20}/></div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Totaal</span>
                    </div>
                    <p className="text-4xl font-black tracking-tighter mb-1">{stats.sonPoints}</p>
                    <p className="text-[10px] font-bold uppercase text-white/50">{stats.sonTries} Drieë</p>
                  </div>
                  <StatCard label="Wenne" value={`${stats.winRate}%`} sub={`${stats.wins} Wenne`} icon={<TrendingUp size={20} className="text-emerald-500"/>} />
                  <StatCard label="Skopper%" value={`${stats.accuracy}%`} sub="Doelskoppe" icon={<ShieldCheck size={20} className="text-blue-500"/>} />
                  <StatCard label="Rekord" value={`${stats.wins}-${stats.draws}-${stats.losses}`} sub="W-G-V" icon={<Activity size={20} className="text-slate-400"/>} />
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
                  <h3 className="text-[11px] font-black text-slate-400 uppercase mb-8 tracking-widest flex items-center gap-2 relative z-10"><Medal size={14}/> Speler Ranglys</h3>
                  <div className="space-y-4 relative z-10">
                    {stats.leaderboard.map((s, i) => (
                      <div key={s.name} className={`flex justify-between items-center p-4 rounded-2xl transition-all ${s.name === activeSonData.name ? 'bg-slate-50 border border-slate-200 shadow-inner scale-[1.02]' : ''}`}>
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm">{i+1}</span>
                          <span className="font-bold text-sm tracking-tight">{s.name}</span>
                        </div>
                        <span className="font-black text-sm tracking-tighter">{s.points} <span className="text-[9px] opacity-40 uppercase">pts</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : view === 'history' ? (
          <div className="space-y-4 animate-in">
            <h2 className="text-xl font-black px-2 mb-2 italic tracking-tight text-slate-400 uppercase text-xs">Wedstryd Log</h2>
            {filteredMatches.length === 0 ? (
              <p className="text-center py-20 text-slate-300 italic">Geen geskiedenis nie.</p>
            ) : (
              filteredMatches.map(m => (
                <div key={m.id} className="bg-white p-6 rounded-[2.25rem] shadow-sm border border-slate-50 flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black ${parseInt(m.scoreUs) > parseInt(m.scoreThem) ? 'bg-emerald-50 text-emerald-600' : parseInt(m.scoreUs) === parseInt(m.scoreThem) ? 'bg-slate-100 text-slate-400' : 'bg-red-50 text-red-600'}`}>
                      <span className="text-xl leading-none">{parseInt(m.scoreUs) > parseInt(m.scoreThem) ? 'W' : parseInt(m.scoreUs) === parseInt(m.scoreThem) ? 'G' : 'V'}</span>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-lg leading-tight mb-1">vs {m.opponent}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(m.date).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="text-3xl font-black tracking-tighter text-slate-800">{m.scoreUs} - {m.scoreThem}</p>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingMatch(m); setView('add'); }} className="p-2 text-slate-200 hover:text-slate-900 transition-colors"><Pencil size={18}/></button>
                      <button onClick={() => handleDelete(m.id)} className="p-2 text-slate-100 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <AddForm initialData={editingMatch} onSave={handleSave} onCancel={() => setView('dashboard')} color={activeSonData.color} sonName={activeSonData.name} />
        )}
      </main>

      {/* Premium Glass Nav */}
      <nav className="fixed bottom-8 left-8 right-8 h-20 bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] flex justify-around items-center z-50 px-8 border border-white">
        <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={24}/>} label="Stats" />
        <button onClick={() => { setEditingMatch(null); setView('add'); }} className="w-16 h-16 -mt-16 bg-slate-900 text-white rounded-[1.75rem] shadow-2xl flex items-center justify-center transform transition-all active:scale-90 hover:scale-110 hover:rotate-90 border-4 border-[#f8fafc]">
          <Plus size={36} strokeWidth={3} />
        </button>
        <NavButton active={view === 'history'} onClick={() => setView('history')} icon={<History size={24}/>} label="Logs" />
      </nav>
    </div>
  );
}

function StatCard({ label, value, sub, icon }) {
  return (
    <div className="p-7 rounded-[2.25rem] bg-white border border-white shadow-sm transition-transform active:scale-95">
      <div className="flex justify-between items-start mb-6">
        <div className="p-2.5 rounded-xl bg-slate-50">{icon}</div>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">{label}</span>
      </div>
      <p className="text-4xl font-black tracking-tighter mb-1.5 text-slate-800 leading-none">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{sub}</p>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-slate-900 scale-110' : 'text-slate-300'}`}>
      {icon}
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function AddForm({ initialData, onSave, onCancel, color, sonName }) {
  const [f, setF] = useState(initialData || { date: new Date().toISOString().split('T')[0], opponent: '', scoreUs: 0, scoreThem: 0, sonTries: 0, sonConvAtt: 0, sonConvSucc: 0, sonPenSucc: 0, otherScorers: [] });
  const [os, setOs] = useState({ name: '', tries: 0 });

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl p-8 sm:p-10 space-y-10 animate-in border border-slate-50 mb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black italic tracking-tighter text-slate-800">{initialData ? 'Update Wedstryd' : 'Nuwe Verslag'}</h2>
        <button onClick={onCancel} className="bg-slate-50 p-2.5 rounded-full text-slate-300 hover:text-red-500 transition-colors"><XCircle size={30}/></button>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input required placeholder="Teenstander Skool" className="w-full bg-slate-50 rounded-2xl p-5 font-bold outline-none border-2 border-slate-50 focus:border-slate-100 transition-all text-lg shadow-inner" value={f.opponent} onChange={e => setF({...f, opponent: e.target.value})} />
            <input type="date" className="w-full bg-slate-50 rounded-2xl p-5 font-bold outline-none border-2 border-slate-50 shadow-inner" value={f.date} onChange={e => setF({...f, date: e.target.value})} />
        </div>
        
        <div className="grid grid-cols-2 gap-6 p-10 bg-slate-900 rounded-[2.75rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="text-center relative z-10">
                <label className="text-[10px] font-black text-white/40 uppercase mb-3 block tracking-widest leading-none">Ons Span</label>
                <input type="number" className="w-full bg-transparent text-white text-center text-5xl font-black outline-none border-none tracking-tighter" value={f.scoreUs} onChange={e => setF({...f, scoreUs: e.target.value})} />
            </div>
            <div className="text-center relative z-10">
                <label className="text-[10px] font-black text-white/40 uppercase mb-3 block tracking-widest leading-none">Teenstander</label>
                <input type="number" className="w-full bg-transparent text-white/30 text-center text-5xl font-black outline-none border-none tracking-tighter" value={f.scoreThem} onChange={e => setF({...f, scoreThem: e.target.value})} />
            </div>
        </div>

        <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-6 border border-slate-100 shadow-inner">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{sonName} se Bydrae</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-[1.75rem] text-center shadow-sm border border-slate-100">
                    <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase">Drieë</label>
                    <input type="number" className="w-full bg-transparent p-2 text-center font-black text-3xl outline-none" value={f.sonTries} onChange={e => setF({...f, sonTries: e.target.value})} />
                </div>
                <div className="bg-white p-5 rounded-[1.75rem] text-center col-span-1 sm:col-span-2 shadow-sm border border-slate-100">
                    <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase">Doelskoppe (Slaag / Pogings)</label>
                    <div className="flex items-center gap-3 justify-center">
                        <input type="number" className="w-16 p-2 text-center font-black text-3xl outline-none" value={f.sonConvSucc} onChange={e => setF({...f, sonConvSucc: e.target.value})} />
                        <span className="text-slate-200 text-3xl font-light">/</span>
                        <input type="number" className="w-16 p-2 text-center font-black text-3xl outline-none" value={f.sonConvAtt} onChange={e => setF({...f, sonConvAtt: e.target.value})} />
                    </div>
                </div>
            </div>
            <div className="bg-white p-5 rounded-[1.75rem] text-center shadow-sm border border-slate-100">
                <label className="text-[9px] font-black text-slate-400 block mb-2 uppercase">Strafskoppe (Slaag)</label>
                <input type="number" className="w-full bg-transparent p-2 text-center font-black text-3xl outline-none" value={f.sonPenSucc} onChange={e => setF({...f, sonPenSucc: e.target.value})} />
            </div>
        </div>

        <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-6 border border-slate-100 shadow-inner">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Spanmaats (Drieë)</h3>
            <div className="flex flex-col sm:flex-row gap-4 items-end bg-white p-6 rounded-[2rem] shadow-sm">
                <div className="w-full sm:flex-1 space-y-2">
                    <label className="text-[9px] font-black text-slate-400 ml-1 uppercase tracking-widest">Speler Naam</label>
                    <input className="w-full bg-slate-50 rounded-xl p-4 font-bold outline-none shadow-inner" value={os.name} onChange={e => setOs({...os, name: e.target.value})} placeholder="Bv. Janse" />
                </div>
                <div className="w-full sm:w-20 space-y-2">
                    <label className="text-[9px] font-black text-slate-400 block text-center uppercase tracking-widest">Drieë</label>
                    <input type="number" className="w-full bg-slate-50 rounded-xl p-4 font-bold text-center outline-none shadow-inner" value={os.tries} onChange={e => setOs({...os, tries: e.target.value})} />
                </div>
                <button type="button" onClick={() => { if(os.name) { setF({...f, otherScorers: [...f.otherScorers, {...os, id: Date.now()}]}); setOs({name:'', tries:0}); }}} className="w-full sm:w-auto bg-slate-900 text-white p-4 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">
                    <Plus size={24} strokeWidth={3}/>
                </button>
            </div>
            <div className="flex flex-wrap gap-3">
                {f.otherScorers.map(s => (
                    <div key={s.id} className="flex items-center gap-3 bg-white border border-slate-200 py-3 pl-5 pr-3 rounded-2xl shadow-sm">
                        <span className="text-sm font-bold text-slate-700">{s.name} ({s.tries})</span>
                        <button onClick={() => setF({...f, otherScorers: f.otherScorers.filter(x => x.id !== s.id)})} className="text-slate-200 hover:text-red-500 transition-colors">
                            <XCircle size={20}/>
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <button onClick={() => onSave(f)} className="w-full py-6 rounded-[2rem] text-white font-black text-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:brightness-110 active:scale-95 transition-all sticky bottom-0 z-10" style={{ backgroundColor: color }}>
        {initialData ? 'Stoor Veranderinge' : 'Bevestig Verslag'}
      </button>
    </div>
  );
}
