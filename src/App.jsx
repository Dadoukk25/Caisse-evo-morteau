import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import {
  ShoppingCart, Clock, Settings, Plus, Minus, Trash2,
  CheckCircle, Edit3, X, Save, ArrowRight, RotateCcw,
  Loader2, WifiOff, AlertTriangle, Tag, Palette, Package,
  Monitor, Tablet, Smartphone
} from "lucide-react";

const DEFAULTS = { primary:"#003B8E", accent:"#F5A623", background:"#F4F6FB" };

function hexToRgb(hex) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}
function lighten(hex, pct=0.9) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  const m=v=>Math.round(v+(255-v)*pct);
  return `#${m(r).toString(16).padStart(2,'0')}${m(g).toString(16).padStart(2,'0')}${m(b).toString(16).padStart(2,'0')}`;
}
function darken(hex, pct=0.15) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  const m=v=>Math.round(v*(1-pct));
  return `#${m(r).toString(16).padStart(2,'0')}${m(g).toString(16).padStart(2,'0')}${m(b).toString(16).padStart(2,'0')}`;
}

const QUICK_AMOUNTS = [0.10, 0.20, 0.50, 1, 2, 5, 10, 20, 50];
function formatPrice(p) { return Number(p).toFixed(2).replace(".",",")+" €"; }
function formatTime(d)  { return new Date(d).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}); }
function formatDate(d)  { return new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"}); }

const DEVICES = [
  { key:"desktop",        label:"Ordinateur",      sublabel:"Grand écran, souris & clavier", Icon:Monitor    },
  { key:"ipad",           label:"iPad",             sublabel:"Tablette Apple",               Icon:Tablet     },
  { key:"android-tablet", label:"Tablette Android", sublabel:"Tablette sous Android",        Icon:Tablet     },
  { key:"iphone",         label:"iPhone",           sublabel:"Téléphone Apple",              Icon:Smartphone },
  { key:"android-phone",  label:"Android",          sublabel:"Téléphone sous Android",       Icon:Smartphone },
];

function DeviceSelector({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{
      minHeight:"100vh", background:DEFAULTS.background,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      fontFamily:"'Segoe UI',system-ui,sans-serif", padding:"24px"
    }}>
      <div style={{ textAlign:"center", marginBottom:48 }}>
        <div style={{ fontSize:56, marginBottom:16 }}>🏆</div>
        <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:DEFAULTS.primary }}>
          <span style={{ color:DEFAULTS.accent }}>ÉVOLUTION</span> DE MORTEAU
        </h1>
        <p style={{ margin:"10px 0 0", color:"#888", fontSize:15 }}>
          Sélectionnez votre type d'appareil pour une interface optimisée
        </p>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:16, justifyContent:"center", maxWidth:900 }}>
        {DEVICES.map(({ key, label, sublabel, Icon }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            onMouseEnter={() => setHovered(key)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:14,
              padding:"28px 36px", borderRadius:20,
              border:`2px solid ${hovered===key ? DEFAULTS.primary : "#E0E4F0"}`,
              background: hovered===key ? DEFAULTS.primary : "white",
              color: hovered===key ? "white" : "#1a1a2e",
              cursor:"pointer", transition:"all 0.18s", minWidth:150,
              boxShadow: hovered===key ? "0 8px 28px rgba(0,59,142,0.25)" : "0 2px 8px rgba(0,0,0,0.06)"
            }}
          >
            <Icon size={40}/>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontWeight:700, fontSize:16 }}>{label}</div>
              <div style={{ fontSize:12, opacity:0.72, marginTop:4 }}>{sublabel}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ModeSelector({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  const MODES = [
    { key:"rendu",     label:"Je rends la monnaie",      sublabel:"Calculette avec rendu de monnaie",     icon:"💶" },
    { key:"sans_rendu", label:"Je ne rends pas la monnaie", sublabel:"Encaissement direct, sans calcul", icon:"⚡" },
  ];
  return (
    <div style={{
      minHeight:"100vh", background:DEFAULTS.background,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      fontFamily:"'Segoe UI',system-ui,sans-serif", padding:"24px"
    }}>
      <div style={{ textAlign:"center", marginBottom:48 }}>
        <div style={{ fontSize:56, marginBottom:16 }}>🏆</div>
        <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:DEFAULTS.primary }}>
          <span style={{ color:DEFAULTS.accent }}>ÉVOLUTION</span> DE MORTEAU
        </h1>
        <p style={{ margin:"10px 0 0", color:"#888", fontSize:15 }}>
          Rendez-vous la monnaie sur ce point de vente ?
        </p>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:16, justifyContent:"center", maxWidth:700 }}>
        {MODES.map(({ key, label, sublabel, icon }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            onMouseEnter={() => setHovered(key)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:14,
              padding:"32px 40px", borderRadius:20,
              border:`2px solid ${hovered===key ? DEFAULTS.primary : "#E0E4F0"}`,
              background: hovered===key ? DEFAULTS.primary : "white",
              color: hovered===key ? "white" : "#1a1a2e",
              cursor:"pointer", transition:"all 0.18s", minWidth:220,
              boxShadow: hovered===key ? "0 8px 28px rgba(0,59,142,0.25)" : "0 2px 8px rgba(0,0,0,0.06)"
            }}
          >
            <span style={{ fontSize:40 }}>{icon}</span>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontWeight:700, fontSize:16 }}>{label}</div>
              <div style={{ fontSize:12, opacity:0.72, marginTop:4 }}>{sublabel}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [device, setDevice]              = useState(null);
  const [changeMode, setChangeMode]      = useState(null); // "rendu" | "sans_rendu"
  const [mobileTab, setMobileTab]        = useState("produits");
  const [tab, setTab]                    = useState("caisse");
  const [settingsTab, setSettingsTab]    = useState("apparence");
  const [products, setProducts]          = useState([]);
  const [categories, setCategories]      = useState([]);
  const [transactions, setTransactions]  = useState([]);
  const [loading, setLoading]            = useState(true);
  const [dbError, setDbError]            = useState(false);

  const [cart, setCart]                  = useState([]);
  const [selectedCat, setSelectedCat]   = useState("Tous");
  const [amountGiven, setAmountGiven]    = useState(0);
  const [encaisseStep, setEncaisseStep]  = useState("saisie");

  const [editingProduct, setEditingProduct]  = useState(null);
  const [newProduct, setNewProduct]          = useState({ name:"", price:"", category:"", emoji:"🛒" });
  const [showAddForm, setShowAddForm]        = useState(false);
  const [deleteConfirm, setDeleteConfirm]    = useState(null);
  const [saving, setSaving]                  = useState(false);

  const [deleteTxConfirm, setDeleteTxConfirm]         = useState(null);
  const [clearHistoryConfirm, setClearHistoryConfirm] = useState(false);
  const [historyView, setHistoryView]                 = useState("liste"); // "liste" | "articles"
  const [selectedArticle, setSelectedArticle]          = useState(null); // nom de l'article sélectionné
  const [articleDateFilter, setArticleDateFilter]      = useState("tout"); // "tout" | "YYYY-MM-DD"

  const [newCatName, setNewCatName]              = useState("");
  const [deleteCatConfirm, setDeleteCatConfirm]  = useState(null);
  const [savingCat, setSavingCat]                = useState(false);

  const [colors, setColors]           = useState({ primary:DEFAULTS.primary, accent:DEFAULTS.accent, background:DEFAULTS.background });
  const [savingColors, setSavingColors] = useState(false);

  const isMobile = device === "iphone" || device === "android-phone";
  const isTablet = device === "ipad" || device === "android-tablet";

  const C = {
    primary:      colors.primary,
    primaryDark:  darken(colors.primary, 0.15),
    primaryLight: lighten(colors.primary, 0.9),
    accent:       colors.accent,
    background:   colors.background,
  };

  useEffect(() => {
    Promise.all([loadProducts(), loadTransactions(), loadCategories(), loadColors()])
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const ch = supabase.channel("tx-changes")
      .on("postgres_changes", { event:"*", schema:"public", table:"transactions" }, () => loadTransactions())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  async function loadProducts() {
    const { data, error } = await supabase.from("products").select("*").order("category").order("name");
    if (error) { setDbError(true); return; }
    setProducts(data);
  }
  async function loadTransactions() {
    const { data, error } = await supabase.from("transactions").select("*").order("created_at",{ascending:false}).limit(1000);
    if (error) { setDbError(true); return; }
    setTransactions(data);
  }
  async function loadCategories() {
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (error) { setDbError(true); return; }
    setCategories(data);
  }
  async function loadColors() {
    const { data, error } = await supabase.from("settings").select("*");
    if (error || !data) return;
    const map = {};
    data.forEach(r => { map[r.key] = r.value; });
    setColors({
      primary:    map["color_primary"]    || DEFAULTS.primary,
      accent:     map["color_accent"]     || DEFAULTS.accent,
      background: map["color_background"] || DEFAULTS.background,
    });
  }
  async function saveColors() {
    setSavingColors(true);
    await Promise.all([
      supabase.from("settings").upsert({ key:"color_primary",    value:colors.primary    }, { onConflict:"key" }),
      supabase.from("settings").upsert({ key:"color_accent",     value:colors.accent     }, { onConflict:"key" }),
      supabase.from("settings").upsert({ key:"color_background", value:colors.background }, { onConflict:"key" }),
    ]);
    setSavingColors(false);
  }
  function resetColors() { setColors({ primary:DEFAULTS.primary, accent:DEFAULTS.accent, background:DEFAULTS.background }); }

  const catNames     = categories.map(c => c.name);
  const catTabs      = ["Tous", ...catNames];
  const filtered     = selectedCat === "Tous" ? products : products.filter(p => p.category === selectedCat);
  const cartTotal    = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const change       = amountGiven - cartTotal;
  const canEncaisser = cart.length > 0 && amountGiven >= cartTotal;
  const quickAmounts = changeMode === "rendu" ? QUICK_AMOUNTS.filter(a => a >= 1) : QUICK_AMOUNTS;

  useEffect(() => {
    if (catNames.length > 0 && !newProduct.category)
      setNewProduct(p => ({ ...p, category: catNames[0] }));
  }, [categories]);

  function addToCart(p) {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      return ex ? prev.map(i => i.id===p.id ? {...i,qty:i.qty+1} : i) : [...prev, {...p,qty:1}];
    });
  }
  function updateQty(id, delta) { setCart(prev => prev.map(i => i.id===id?{...i,qty:i.qty+delta}:i).filter(i=>i.qty>0)); }
  function clearCart() { setCart([]); setAmountGiven(0); setEncaisseStep("saisie"); }
  function goToConfirmation() { if (canEncaisser) setEncaisseStep("confirmation"); }
  function annulerConfirmation() { setEncaisseStep("saisie"); }

  async function confirmerRemise() {
    const tx = { items:cart.map(i=>({id:i.id,name:i.name,emoji:i.emoji,price:i.price,qty:i.qty})), total:cartTotal, given:amountGiven, change };
    const { error } = await supabase.from("transactions").insert([tx]);
    if (error) { alert("Erreur lors de l'enregistrement : " + error.message); return; }
    clearCart();
    await loadTransactions();
  }
  async function encaisserDirect() {
    if (cart.length === 0) return;
    const tx = { items:cart.map(i=>({id:i.id,name:i.name,emoji:i.emoji,price:i.price,qty:i.qty})), total:cartTotal, given:cartTotal, change:0 };
    const { error } = await supabase.from("transactions").insert([tx]);
    if (error) { alert("Erreur lors de l'enregistrement : " + error.message); return; }
    clearCart();
    await loadTransactions();
  }
  async function deleteTransaction(id) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) { alert("Erreur : "+error.message); return; }
    setDeleteTxConfirm(null); await loadTransactions();
  }
  async function clearAllHistory() {
    const { error } = await supabase.from("transactions").delete().neq("id", 0);
    if (error) { alert("Erreur : "+error.message); return; }
    setClearHistoryConfirm(false); await loadTransactions();
  }
  async function addProduct() {
    if (!newProduct.name || !newProduct.price || !newProduct.category) return;
    setSaving(true);
    const { error } = await supabase.from("products").insert([{...newProduct, price:parseFloat(newProduct.price)}]);
    if (error) { alert("Erreur : "+error.message); setSaving(false); return; }
    setNewProduct({ name:"", price:"", category:catNames[0]||"", emoji:"🛒" });
    setShowAddForm(false); setSaving(false); await loadProducts();
  }
  async function saveEdit() {
    if (!editingProduct.name || !editingProduct.price) return;
    setSaving(true);
    const { error } = await supabase.from("products").update({
      name:editingProduct.name, price:parseFloat(editingProduct.price),
      category:editingProduct.category, emoji:editingProduct.emoji,
    }).eq("id", editingProduct.id);
    if (error) { alert("Erreur : "+error.message); setSaving(false); return; }
    setEditingProduct(null); setSaving(false); await loadProducts();
  }
  async function deleteProduct(id) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { alert("Erreur : "+error.message); return; }
    setCart(prev => prev.filter(i => i.id!==id));
    setDeleteConfirm(null); await loadProducts();
  }
  async function addCategory() {
    const name = newCatName.trim();
    if (!name) return;
    setSavingCat(true);
    const { error } = await supabase.from("categories").insert([{ name }]);
    if (error) { alert("Erreur : "+error.message); setSavingCat(false); return; }
    setNewCatName(""); setSavingCat(false); await loadCategories();
  }
  async function deleteCategory(id, name) {
    const linked = products.filter(p => p.category === name);
    if (linked.length > 0) { alert(`Impossible de supprimer "${name}" : ${linked.length} article(s) l'utilisent encore.`); setDeleteCatConfirm(null); return; }
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { alert("Erreur : "+error.message); return; }
    setDeleteCatConfirm(null); await loadCategories();
  }

  const today     = new Date().toDateString();
  const txToday   = transactions.filter(t => new Date(t.created_at).toDateString() === today);
  const totalJour = txToday.reduce((s,t) => s+Number(t.total), 0);

  // Liste des jours distincts présents dans l'historique (pour le filtre)
  const availableDates = Array.from(new Set(transactions.map(t => {
    const d = new Date(t.created_at);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }))).sort().reverse();

  // Stats agrégées par article (nom), sur les transactions filtrées par date
  const txForArticleStats = articleDateFilter === "tout"
    ? transactions
    : transactions.filter(t => {
        const d = new Date(t.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        return key === articleDateFilter;
      });

  const articleStatsMap = {};
  txForArticleStats.forEach(t => {
    (t.items||[]).forEach(item => {
      if (!articleStatsMap[item.name]) {
        articleStatsMap[item.name] = { name:item.name, emoji:item.emoji, qty:0, total:0 };
      }
      articleStatsMap[item.name].qty   += item.qty;
      articleStatsMap[item.name].total += item.price * item.qty;
    });
  });
  const articleStatsList = Object.values(articleStatsMap).sort((a,b) => b.total - a.total);
  const selectedArticleStats = selectedArticle ? articleStatsMap[selectedArticle] : null;

  const qtySize = isMobile ? 42 : isTablet ? 34 : 28;

  const S = {
    app:         { minHeight:"100vh", background:C.background, fontFamily:"'Segoe UI',system-ui,sans-serif", color:"#1a1a2e" },
    header:      { background:C.primary, padding:`0 ${isMobile?"12px":"24px"}`, display:"flex", alignItems:"center", justifyContent:"space-between", height:isMobile?56:60, boxShadow:`0 2px 12px rgba(${hexToRgb(C.primary)},0.3)` },
    logo:        { display:"flex", alignItems:"center", gap:isMobile?8:12, color:"white", fontWeight:700, fontSize:isMobile?15:18 },
    nav:         { display:"flex", gap:isMobile?2:4 },
    navBtn: a => ({ display:"flex", alignItems:"center", gap:isMobile?0:8, padding:isMobile?"10px 12px":isTablet?"10px 16px":"8px 18px", borderRadius:8, border:"none", cursor:"pointer", fontSize:isMobile?13:14, fontWeight:a?600:400, background:a?"rgba(255,255,255,0.15)":"transparent", color:a?"white":"rgba(255,255,255,0.7)", transition:"all 0.15s" }),
    content:     { padding:isMobile?"12px":"24px", maxWidth:1400, margin:"0 auto" },
    caisseGrid:  isMobile
      ? { display:"flex", flexDirection:"column", gap:16 }
      : { display:"grid", gridTemplateColumns:isTablet?"1fr 420px":"1fr 400px", gap:20, alignItems:"start" },
    card:        { background:"white", borderRadius:16, border:"1px solid #E8EAF0", overflow:"hidden" },
    cardHeader:  { padding:isMobile?"12px 16px":"16px 20px", borderBottom:"1px solid #F0F2F8", display:"flex", alignItems:"center", justifyContent:"space-between" },
    cardTitle:   { fontWeight:700, fontSize:isMobile?14:15, color:C.primaryDark },
    catTabs:     { display:"flex", gap:isMobile?6:8, padding:isMobile?"10px 12px":"12px 20px", borderBottom:"1px solid #F0F2F8", flexWrap:"wrap" },
    catTab: a => ({ padding:isMobile?"9px 14px":isTablet?"8px 16px":"6px 16px", borderRadius:20, border:`1.5px solid ${a?C.primary:"#E0E4F0"}`, background:a?C.primary:"white", color:a?"white":"#555", fontSize:isMobile?14:13, fontWeight:a?600:400, cursor:"pointer" }),
    productGrid: { display:"grid", gridTemplateColumns:isMobile?"repeat(3,1fr)":isTablet?"repeat(auto-fill,minmax(155px,1fr))":"repeat(auto-fill,minmax(140px,1fr))", gap:isMobile?10:12, padding:isMobile?12:20 },
    productBtn:  { background:"white", border:"1.5px solid #E8EAF0", borderRadius:14, padding:isMobile?"14px 8px":isTablet?"18px 12px":"16px 10px", cursor:"pointer", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:isMobile?6:8, transition:"all 0.12s" },
    cartItems:   { padding:isMobile?"10px 12px":"12px 16px", maxHeight:isMobile?220:260, overflowY:"auto" },
    cartItem:    { display:"flex", alignItems:"center", gap:isMobile?8:10, padding:"10px 0", borderBottom:"1px solid #F4F6FB" },
    qtyBtn:      { width:qtySize, height:qtySize, borderRadius:8, border:`1.5px solid ${C.primary}`, background:"white", color:C.primary, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:isMobile?16:14 },
    totalSection:{ padding:isMobile?"12px 14px":"14px 16px", borderTop:"2px solid #F0F2F8", background:C.primaryLight },
    monnaieSection:{ padding:isMobile?"12px":"14px 16px" },
    quickGrid:   { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:isMobile?10:8, marginBottom:12 },
    quickBtn:    { padding:isMobile?"15px 6px":isTablet?"13px 6px":"10px 6px", background:"white", border:`1.5px solid ${C.primary}`, borderRadius:10, color:C.primary, fontWeight:700, fontSize:isMobile?16:isTablet?14:13, cursor:"pointer", textAlign:"center", transition:"all 0.12s" },
    changeDisplay: ok => ({ background:ok?"#EDFBF0":"#FFF0F0", border:`1.5px solid ${ok?"#5CB872":"#E55"}`, borderRadius:10, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }),
    statsBar:    { background:C.primary, borderRadius:16, padding:isMobile?"16px":"24px 28px", marginBottom:20, color:"white", display:"flex", flexDirection:isMobile?"column":"row", alignItems:isMobile?"flex-start":"center", justifyContent:"space-between", gap:isMobile?16:0 },
    txCard:      { background:"white", borderRadius:14, border:"1px solid #E8EAF0", padding:isMobile?"12px 14px":"16px 20px", marginBottom:12 },
    settingsRow: { display:"flex", alignItems:"center", padding:isMobile?"12px 16px":"14px 20px", borderBottom:"1px solid #F0F2F8", gap:12 },
    input:       { width:"100%", padding:isMobile?"12px":"9px 12px", borderRadius:8, border:"1.5px solid #D0D6E8", fontSize:isMobile?15:14, outline:"none", boxSizing:"border-box", background:"white" },
    select:      { width:"100%", padding:isMobile?"12px":"9px 12px", borderRadius:8, border:"1.5px solid #D0D6E8", fontSize:isMobile?15:14, outline:"none", background:"white" },
    iconBtn: c  => ({ width:isMobile?38:32, height:isMobile?38:32, borderRadius:8, border:`1.5px solid ${c}20`, background:`${c}10`, color:c, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }),
    overlay:     { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 },
    modal:       { background:"white", borderRadius:16, padding:isMobile?20:32, maxWidth:420, width:"90%", textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" },
    subTabBar:   { display:"flex", gap:4, marginBottom:24, background:"white", borderRadius:12, padding:6, border:"1px solid #E8EAF0", width:"fit-content", flexWrap:"wrap" },
    subTab: a => ({ display:"flex", alignItems:"center", gap:8, padding:isMobile?"10px 14px":"10px 20px", borderRadius:8, border:"none", cursor:"pointer", fontSize:isMobile?13:14, fontWeight:a?600:500, background:a?C.primary:"transparent", color:a?"white":"#666", transition:"all 0.15s" }),
  };

  if (!device) return <DeviceSelector onSelect={setDevice} />;
  if (!changeMode) return <ModeSelector onSelect={setChangeMode} />;

  if (loading) return (
    <div style={{...S.app, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16}}>
      <Loader2 size={40} style={{color:C.primary, animation:"spin 1s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{color:"#888", fontSize:15}}>Connexion à la base de données…</p>
    </div>
  );
  if (dbError) return (
    <div style={{...S.app, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16}}>
      <WifiOff size={40} style={{color:"#CC3333"}}/>
      <p style={{color:"#CC3333", fontSize:15, fontWeight:600}}>Impossible de se connecter à Supabase.</p>
      <p style={{color:"#888", fontSize:13}}>Vérifie tes variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.</p>
    </div>
  );

  const currentDevice = DEVICES.find(d => d.key === device);
  const DeviceIcon = currentDevice?.Icon;

  return (
    <div style={S.app}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Modals ── */}
      {deleteTxConfirm && (
        <div style={S.overlay}><div style={S.modal}>
          <AlertTriangle size={40} style={{color:"#CC3333", marginBottom:16}}/>
          <h3 style={{margin:"0 0 8px", fontSize:18}}>Supprimer cette transaction ?</h3>
          <p style={{color:"#888", fontSize:14, margin:"0 0 24px"}}>Cette action est irréversible.</p>
          <div style={{display:"flex", gap:12, justifyContent:"center"}}>
            <button style={{padding:"10px 24px", background:"#CC3333", color:"white", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer"}} onClick={() => deleteTransaction(deleteTxConfirm)}>Supprimer</button>
            <button style={{padding:"10px 24px", background:"white", color:"#666", border:"1.5px solid #D0D6E8", borderRadius:8, fontSize:14, cursor:"pointer"}} onClick={() => setDeleteTxConfirm(null)}>Annuler</button>
          </div>
        </div></div>
      )}
      {clearHistoryConfirm && (
        <div style={S.overlay}><div style={S.modal}>
          <AlertTriangle size={40} style={{color:"#CC3333", marginBottom:16}}/>
          <h3 style={{margin:"0 0 8px", fontSize:18}}>Vider tout l'historique ?</h3>
          <p style={{color:"#888", fontSize:14, margin:"0 0 24px"}}>Toutes les transactions seront supprimées définitivement.</p>
          <div style={{display:"flex", gap:12, justifyContent:"center"}}>
            <button style={{padding:"10px 24px", background:"#CC3333", color:"white", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer"}} onClick={clearAllHistory}>Tout supprimer</button>
            <button style={{padding:"10px 24px", background:"white", color:"#666", border:"1.5px solid #D0D6E8", borderRadius:8, fontSize:14, cursor:"pointer"}} onClick={() => setClearHistoryConfirm(false)}>Annuler</button>
          </div>
        </div></div>
      )}
      {deleteCatConfirm && (
        <div style={S.overlay}><div style={S.modal}>
          <AlertTriangle size={40} style={{color:"#CC3333", marginBottom:16}}/>
          <h3 style={{margin:"0 0 8px", fontSize:18}}>Supprimer "{deleteCatConfirm.name}" ?</h3>
          <p style={{color:"#888", fontSize:14, margin:"0 0 24px"}}>Cette action est irréversible.</p>
          <div style={{display:"flex", gap:12, justifyContent:"center"}}>
            <button style={{padding:"10px 24px", background:"#CC3333", color:"white", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer"}} onClick={() => deleteCategory(deleteCatConfirm.id, deleteCatConfirm.name)}>Supprimer</button>
            <button style={{padding:"10px 24px", background:"white", color:"#666", border:"1.5px solid #D0D6E8", borderRadius:8, fontSize:14, cursor:"pointer"}} onClick={() => setDeleteCatConfirm(null)}>Annuler</button>
          </div>
        </div></div>
      )}

      {/* ── HEADER ── */}
      <header style={S.header}>
        <div style={S.logo}>
          <span style={{fontSize:isMobile?22:28}}>🏆</span>
          <div>
            <span style={{color:C.accent}}>ÉVOLUTION</span>
            <span style={{color:"white", marginLeft:isMobile?4:6}}>{isMobile?"MORTEAU":"DE MORTEAU"}</span>
            {!isMobile && <div style={{fontSize:11, fontWeight:400, color:"rgba(255,255,255,0.6)", letterSpacing:"0.1em"}}>CAISSE ENREGISTREUSE</div>}
          </div>
        </div>
        <nav style={S.nav}>
          {[
            {key:"caisse",     label:"Caisse",     icon:<ShoppingCart size={16}/>},
            {key:"historique", label:"Historique", icon:<Clock size={16}/>},
            {key:"parametres", label:"Paramètres", icon:<Settings size={16}/>},
          ].map(t => (
            <button key={t.key} style={S.navBtn(tab===t.key)} onClick={() => setTab(t.key)}>
              {t.icon}{!isMobile && t.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={S.content}>

        {/* ══════════════════════════ CAISSE */}
        {tab === "caisse" && (
          <>
            {/* Onglets mobile Produits / Panier */}
            {isMobile && (
              <div style={{display:"flex", gap:0, marginBottom:16, background:"white", borderRadius:12, padding:4, border:"1px solid #E8EAF0", boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
                {[
                  {key:"produits", label:"Produits", icon:<ShoppingCart size={15}/>},
                  {key:"panier",   label:`Panier${cart.length>0?" ("+cart.length+")":""}`, icon:<Tag size={15}/>},
                ].map(t => (
                  <button key={t.key}
                    style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"13px", borderRadius:9, border:"none", cursor:"pointer", fontSize:14, fontWeight:mobileTab===t.key?700:500, background:mobileTab===t.key?C.primary:"transparent", color:mobileTab===t.key?"white":"#666", transition:"all 0.15s"}}
                    onClick={() => setMobileTab(t.key)}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            )}

            <div style={S.caisseGrid}>

              {/* ── PANNEAU PRODUITS ── */}
              {(!isMobile || mobileTab === "produits") && (
                <div style={S.card}>
                  <div style={S.cardHeader}>
                    <span style={S.cardTitle}>Articles</span>
                    <span style={{fontSize:13, color:"#888"}}>{filtered.length} articles</span>
                  </div>
                  <div style={S.catTabs}>
                    {catTabs.map(c => <button key={c} style={S.catTab(selectedCat===c)} onClick={() => setSelectedCat(c)}>{c}</button>)}
                  </div>
                  <div style={S.productGrid}>
                    {filtered.map(p => (
                      <button key={p.id} style={S.productBtn} onClick={() => addToCart(p)}
                        onMouseEnter={e => { e.currentTarget.style.borderColor=C.primary; e.currentTarget.style.background=C.primaryLight; e.currentTarget.style.transform="translateY(-2px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor="#E8EAF0"; e.currentTarget.style.background="white"; e.currentTarget.style.transform="none"; }}
                      >
                        <span style={{fontSize:isMobile?28:32, lineHeight:1}}>{p.emoji}</span>
                        <span style={{fontSize:isMobile?12:13, fontWeight:600, color:"#2a2a3e", lineHeight:1.3}}>{p.name}</span>
                        <span style={{fontSize:isMobile?13:14, fontWeight:700, color:C.primary}}>{formatPrice(p.price)}</span>
                      </button>
                    ))}
                  </div>
                  {/* Barre panier sticky (mobile) */}
                  {isMobile && cart.length > 0 && (
                    <div
                      style={{padding:"14px 16px", background:C.primary, display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer"}}
                      onClick={() => setMobileTab("panier")}
                    >
                      <span style={{color:"white", fontWeight:600, fontSize:14}}>
                        {cart.reduce((s,i)=>s+i.qty,0)} article{cart.reduce((s,i)=>s+i.qty,0)>1?"s":""}
                      </span>
                      <div style={{display:"flex", alignItems:"center", gap:10}}>
                        <span style={{color:"white", fontWeight:800, fontSize:18}}>{formatPrice(cartTotal)}</span>
                        <ArrowRight size={18} color="white"/>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── PANNEAU PANIER + PAIEMENT ── */}
              {(!isMobile || mobileTab === "panier") && (
                <div style={{display:"flex", flexDirection:"column", gap:16}}>
                  <div style={S.card}>
                    <div style={S.cardHeader}>
                      <span style={S.cardTitle}>Ticket en cours</span>
                      {cart.length > 0 && (
                        <button style={{border:"none", fontSize:12, padding:"4px 10px", borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", gap:4, background:"#FFF0F0", color:"#CC3333"}} onClick={clearCart}>
                          <Trash2 size={13}/> Vider
                        </button>
                      )}
                    </div>
                    {cart.length === 0 ? (
                      <div style={{padding:"32px 16px", textAlign:"center", color:"#AAB"}}>
                        <ShoppingCart size={36} style={{margin:"0 auto 12px", opacity:0.3, display:"block"}}/>
                        <p style={{margin:0, fontSize:14}}>Panier vide — {isMobile?"touchez":"cliquez"} sur un article</p>
                        {isMobile && (
                          <button style={{marginTop:16, padding:"12px 24px", background:C.primary, color:"white", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer"}} onClick={() => setMobileTab("produits")}>
                            ← Voir les produits
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={S.cartItems}>
                        {cart.map(item => (
                          <div key={item.id} style={S.cartItem}>
                            <span style={{fontSize:18}}>{item.emoji}</span>
                            <span style={{flex:1, fontSize:isMobile?15:14, fontWeight:500}}>{item.name}</span>
                            <button style={S.qtyBtn} onClick={() => updateQty(item.id,-1)}><Minus size={isMobile?14:12}/></button>
                            <span style={{fontSize:15, fontWeight:700, minWidth:20, textAlign:"center"}}>{item.qty}</span>
                            <button style={S.qtyBtn} onClick={() => updateQty(item.id,1)}><Plus size={isMobile?14:12}/></button>
                            <span style={{fontSize:14, fontWeight:600, color:C.primary, minWidth:60, textAlign:"right"}}>{formatPrice(item.price*item.qty)}</span>
                            <button style={{...S.iconBtn("#CC3333"), border:"none"}} onClick={() => setCart(prev=>prev.filter(i=>i.id!==item.id))}><X size={13}/></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={S.totalSection}>
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                        <span style={{fontSize:isMobile?16:15, fontWeight:600, color:C.primaryDark}}>TOTAL À RÉGLER</span>
                        <span style={{fontSize:isMobile?24:22, fontWeight:800, color:C.primaryDark}}>{formatPrice(cartTotal)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={S.card}>
                    {changeMode === "sans_rendu" ? (
                      /* ── Mode sans rendu de monnaie : encaissement direct ── */
                      <>
                        <div style={S.cardHeader}>
                          <span style={S.cardTitle}>Encaissement</span>
                          <span style={{fontSize:12, color:"#AAB", background:"#F0F2F8", padding:"3px 10px", borderRadius:20}}>Sans rendu de monnaie</span>
                        </div>
                        <div style={{padding:isMobile?"16px":"20px"}}>
                          <button
                            style={{width:"100%", padding:isMobile?"20px":"18px", background:cart.length>0?C.accent:"#C8D0E8", color:cart.length>0?"#1a1000":"white", border:"none", borderRadius:12, fontSize:isMobile?18:17, fontWeight:800, cursor:cart.length>0?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", gap:10}}
                            onClick={encaisserDirect}
                            onMouseEnter={e => { if(cart.length>0) e.currentTarget.style.background=darken(C.accent,0.1); }}
                            onMouseLeave={e => { if(cart.length>0) e.currentTarget.style.background=cart.length>0?C.accent:"#C8D0E8"; }}
                          >
                            <CheckCircle size={20}/> Encaisser {formatPrice(cartTotal)}
                          </button>
                        </div>
                      </>
                    ) : encaisseStep === "saisie" ? (
                      <>
                        <div style={S.cardHeader}>
                          <span style={S.cardTitle}>Encaissement — Étape 1/2</span>
                          <span style={{fontSize:12, color:"#AAB", background:"#F0F2F8", padding:"3px 10px", borderRadius:20}}>Saisie du règlement</span>
                        </div>
                        <div style={S.monnaieSection}>
                          <div style={{fontSize:13, fontWeight:600, color:"#555", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.05em"}}>Somme reçue</div>
                          <div style={S.quickGrid}>
                            {quickAmounts.map(a => (
                              <button key={a} style={S.quickBtn}
                                onClick={() => setAmountGiven(prev => Math.round((prev+a)*100)/100)}
                                onMouseEnter={e => { e.currentTarget.style.background=C.primary; e.currentTarget.style.color="white"; }}
                                onMouseLeave={e => { e.currentTarget.style.background="white"; e.currentTarget.style.color=C.primary; }}
                              >
                                {a<1 ? `${Math.round(a*100)} c` : `${a} €`}
                              </button>
                            ))}
                          </div>
                          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:10}}>
                            <div style={{flex:1, background:"#F4F6FB", borderRadius:10, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                              <span style={{fontSize:13, color:"#666"}}>Reçu</span>
                              <span style={{fontSize:20, fontWeight:800, color:"#333"}}>{formatPrice(amountGiven)}</span>
                            </div>
                            <button style={{border:"1.5px solid #CC660030", background:"#FFF5E6", padding:"10px 14px", borderRadius:10, fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", color:"#CC6600"}} onClick={() => setAmountGiven(0)}>✕ Effacer</button>
                          </div>
                          {amountGiven > 0 && (
                            <div style={S.changeDisplay(change>=0)}>
                              <span style={{fontSize:14, fontWeight:600, color:change>=0?"#2E7D32":"#C62828"}}>{change>=0?"Monnaie à rendre":"⚠️ Manque"}</span>
                              <span style={{fontSize:20, fontWeight:800, color:change>=0?"#2E7D32":"#C62828"}}>{formatPrice(Math.abs(change))}</span>
                            </div>
                          )}
                          <button
                            style={{width:"100%", padding:isMobile?"18px":"16px", background:canEncaisser?C.accent:"#C8D0E8", color:canEncaisser?"#1a1000":"white", border:"none", borderRadius:12, fontSize:isMobile?18:17, fontWeight:800, cursor:canEncaisser?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", gap:10}}
                            onClick={goToConfirmation}
                            onMouseEnter={e => { if(canEncaisser) e.currentTarget.style.background=darken(C.accent,0.1); }}
                            onMouseLeave={e => { if(canEncaisser) e.currentTarget.style.background=C.accent; }}
                          >
                            <ArrowRight size={20}/> Valider le calcul
                          </button>
                        </div>
                      </>
                    ) : (
                      <div>
                        <div style={{background:C.primary, borderRadius:"14px 14px 0 0", padding:"18px 20px 14px"}}>
                          <div style={{fontSize:12, color:"rgba(255,255,255,0.65)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4}}>Étape 2/2 — Remise de monnaie</div>
                          <div style={{color:"white", fontSize:15, fontWeight:600}}>Total : {formatPrice(cartTotal)} · Reçu : {formatPrice(amountGiven)}</div>
                        </div>
                        <div style={{padding:"32px 20px 24px", textAlign:"center", background:change===0?"#F0FBF4":"#F0F8FF", borderBottom:"1px solid #E8EAF0"}}>
                          {change === 0 ? (
                            <><div style={{fontSize:isMobile?52:48, marginBottom:8}}>✅</div><div style={{fontSize:16, color:"#2E7D32", fontWeight:600, marginBottom:4}}>Compte exact</div><div style={{fontSize:13, color:"#888"}}>Aucune monnaie à rendre</div></>
                          ) : (
                            <><div style={{fontSize:13, color:"#555", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12}}>Monnaie à rendre</div>
                            <div style={{fontSize:isMobile?58:72, fontWeight:900, color:C.primaryDark, lineHeight:1, letterSpacing:"-2px", marginBottom:6}}>{formatPrice(change)}</div>
                            <div style={{fontSize:14, color:"#888"}}>{formatPrice(amountGiven)} − {formatPrice(cartTotal)} = <strong style={{color:C.primary}}>{formatPrice(change)}</strong></div></>
                          )}
                        </div>
                        <div style={{padding:"12px 20px", borderBottom:"1px solid #F0F2F8", maxHeight:130, overflowY:"auto"}}>
                          {cart.map(item => (
                            <div key={item.id} style={{display:"flex", justifyContent:"space-between", fontSize:13, padding:"4px 0", color:"#555"}}>
                              <span>{item.emoji} {item.name} ×{item.qty}</span>
                              <span style={{fontWeight:600, color:"#333"}}>{formatPrice(item.price*item.qty)}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{padding:"16px 20px", display:"flex", flexDirection:"column", gap:10}}>
                          <button
                            style={{width:"100%", padding:isMobile?"20px":"18px", background:C.primary, color:"white", border:"none", borderRadius:12, fontSize:isMobile?18:17, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10}}
                            onClick={confirmerRemise}
                            onMouseEnter={e => { e.currentTarget.style.background=C.primaryDark; }}
                            onMouseLeave={e => { e.currentTarget.style.background=C.primary; }}
                          >
                            <CheckCircle size={22}/> Monnaie remise — Terminer
                          </button>
                          <button style={{width:"100%", padding:"11px", background:"white", color:"#666", border:"1.5px solid #D0D6E8", borderRadius:10, fontSize:14, fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8}} onClick={annulerConfirmation}>
                            <RotateCcw size={14}/> Corriger le montant reçu
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════ HISTORIQUE */}
        {tab === "historique" && (
          <div>
            <div style={S.statsBar}>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:12, opacity:0.75, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6}}>CA du jour</div>
                <div style={{fontSize:isMobile?24:32, fontWeight:800, color:C.accent}}>{formatPrice(totalJour)}</div>
              </div>
              <div style={{display:"flex", gap:isMobile?16:32, alignItems:"center", flexWrap:"wrap"}}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:12, opacity:0.75, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6}}>Transactions aujourd'hui</div>
                  <div style={{fontSize:22, fontWeight:800, color:C.accent}}>{txToday.length}</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:12, opacity:0.75, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6}}>Panier moyen</div>
                  <div style={{fontSize:22, fontWeight:800, color:C.accent}}>{txToday.length>0?formatPrice(totalJour/txToday.length):"–"}</div>
                </div>
                {transactions.length > 0 && (
                  <button style={{display:"flex", alignItems:"center", gap:8, padding:"10px 16px", background:"rgba(255,255,255,0.15)", color:"white", border:"1.5px solid rgba(255,255,255,0.3)", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer"}}
                    onClick={() => setClearHistoryConfirm(true)}>
                    <Trash2 size={14}/> Vider l'historique
                  </button>
                )}
              </div>
            </div>
            {/* Sous-onglets Historique : Liste / Par article */}
            <div style={S.subTabBar}>
              {[
                {key:"liste",    label:"Liste des transactions", icon:<Clock size={15}/>},
                {key:"articles", label:"Par article",            icon:<Tag size={15}/>},
              ].map(t => (
                <button key={t.key} style={S.subTab(historyView===t.key)} onClick={() => { setHistoryView(t.key); setSelectedArticle(null); }}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {historyView === "liste" && (
            <>
            {transactions.length === 0 ? (
              <div style={{textAlign:"center", padding:"60px 20px", color:"#AAB"}}>
                <Clock size={48} style={{margin:"0 auto 16px", opacity:0.3, display:"block"}}/>
                <p style={{fontSize:16}}>Aucune transaction pour l'instant</p>
              </div>
            ) : (
              transactions.map((tx, i) => (
                <div key={tx.id} style={S.txCard}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
                    <div style={{fontSize:isMobile?12:13, color:"#888", display:"flex", alignItems:"center", gap:5, flexWrap:"wrap"}}>
                      <Clock size={14}/> {formatDate(tx.created_at)} {formatTime(tx.created_at)}
                      <span style={{marginLeft:8, background:"#F0F2F8", padding:"2px 10px", borderRadius:20, fontSize:12, color:"#666"}}>#{transactions.length-i}</span>
                    </div>
                    <div style={{display:"flex", alignItems:"center", gap:12}}>
                      <span style={{fontSize:isMobile?16:18, fontWeight:800, color:C.primaryDark}}>{formatPrice(tx.total)}</span>
                      <button style={{...S.iconBtn("#CC3333"), border:"none"}} onClick={() => setDeleteTxConfirm(tx.id)}><Trash2 size={14}/></button>
                    </div>
                  </div>
                  <div style={{fontSize:13, color:"#555", borderTop:"1px solid #F0F2F8", paddingTop:10, display:"flex", flexWrap:"wrap", gap:"4px 12px"}}>
                    {(tx.items||[]).map((item,j) => <span key={j}>{item.emoji} {item.name} ×{item.qty}</span>)}
                  </div>
                  <div style={{marginTop:10, display:"flex", gap:16, fontSize:12, color:"#888", flexWrap:"wrap"}}>
                    <span>Reçu : <strong style={{color:"#333"}}>{formatPrice(tx.given)}</strong></span>
                    <span>Monnaie rendue : <strong style={{color:"#333"}}>{formatPrice(tx.change)}</strong></span>
                  </div>
                </div>
              ))
            )}
            </>
            )}

            {historyView === "articles" && (
              <div>
                {/* Filtre par date */}
                <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:16, flexWrap:"wrap"}}>
                  <span style={{fontSize:13, color:"#666", fontWeight:600}}>Filtrer par jour :</span>
                  <select
                    style={{...S.select, width:"auto", minWidth:160}}
                    value={articleDateFilter}
                    onChange={e => { setArticleDateFilter(e.target.value); setSelectedArticle(null); }}
                  >
                    <option value="tout">Toute la période</option>
                    {availableDates.map(d => (
                      <option key={d} value={d}>{new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"})}</option>
                    ))}
                  </select>
                </div>

                {selectedArticle && selectedArticleStats ? (
                  /* ── Détail d'un article sélectionné ── */
                  <div>
                    <button
                      style={{display:"flex", alignItems:"center", gap:6, marginBottom:16, padding:"8px 14px", background:"white", border:"1.5px solid #D0D6E8", borderRadius:8, fontSize:13, color:"#666", cursor:"pointer"}}
                      onClick={() => setSelectedArticle(null)}
                    >
                      ← Retour à la liste des articles
                    </button>
                    <div style={S.statsBar}>
                      <div style={{display:"flex", alignItems:"center", gap:14}}>
                        <span style={{fontSize:40}}>{selectedArticleStats.emoji}</span>
                        <div>
                          <div style={{fontSize:12, opacity:0.75, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4}}>Article</div>
                          <div style={{fontSize:isMobile?20:26, fontWeight:800}}>{selectedArticleStats.name}</div>
                        </div>
                      </div>
                      <div style={{display:"flex", gap:isMobile?16:32, alignItems:"center", flexWrap:"wrap"}}>
                        <div style={{textAlign:"center"}}>
                          <div style={{fontSize:12, opacity:0.75, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6}}>Quantité vendue</div>
                          <div style={{fontSize:isMobile?22:28, fontWeight:800, color:C.accent}}>{selectedArticleStats.qty}</div>
                        </div>
                        <div style={{textAlign:"center"}}>
                          <div style={{fontSize:12, opacity:0.75, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6}}>Chiffre d'affaires</div>
                          <div style={{fontSize:isMobile?22:28, fontWeight:800, color:C.accent}}>{formatPrice(selectedArticleStats.total)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Liste cliquable des articles ── */
                  articleStatsList.length === 0 ? (
                    <div style={{textAlign:"center", padding:"60px 20px", color:"#AAB"}}>
                      <Tag size={48} style={{margin:"0 auto 16px", opacity:0.3, display:"block"}}/>
                      <p style={{fontSize:16}}>Aucune vente sur cette période</p>
                    </div>
                  ) : (
                    <div style={S.card}>
                      {articleStatsList.map(stat => (
                        <button
                          key={stat.name}
                          style={{...S.settingsRow, width:"100%", background:"transparent", border:"none", borderBottom:"1px solid #F0F2F8", cursor:"pointer", textAlign:"left"}}
                          onClick={() => setSelectedArticle(stat.name)}
                          onMouseEnter={e => e.currentTarget.style.background="#F8FAFF"}
                          onMouseLeave={e => e.currentTarget.style.background="transparent"}
                        >
                          <span style={{fontSize:24, width:36, textAlign:"center"}}>{stat.emoji}</span>
                          <span style={{flex:1, fontWeight:600, fontSize:14}}>{stat.name}</span>
                          <span style={{fontSize:13, color:"#888"}}>{stat.qty} vendu(s)</span>
                          <span style={{fontWeight:700, color:C.primary, fontSize:14, minWidth:80, textAlign:"right"}}>{formatPrice(stat.total)}</span>
                        </button>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════ PARAMÈTRES */}
        {tab === "parametres" && (
          <div>
            {/* Appareil actuel + bouton changer */}
            <div style={{...S.card, marginBottom:20, padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12}}>
              <div style={{display:"flex", alignItems:"center", gap:12}}>
                {DeviceIcon && <DeviceIcon size={22} style={{color:C.primary}}/>}
                <div>
                  <div style={{fontWeight:700, fontSize:15, color:C.primaryDark}}>{currentDevice?.label}</div>
                  <div style={{fontSize:12, color:"#888", marginTop:2}}>{currentDevice?.sublabel} — appareil sélectionné</div>
                </div>
              </div>
              <button
                style={{display:"flex", alignItems:"center", gap:8, padding:"10px 18px", background:"white", color:C.primary, border:`1.5px solid ${C.primary}`, borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer"}}
                onClick={() => setDevice(null)}
              >
                <RotateCcw size={14}/> Changer d'appareil
              </button>
            </div>

            {/* Mode encaissement actuel + bouton changer */}
            <div style={{...S.card, marginBottom:20, padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12}}>
              <div style={{display:"flex", alignItems:"center", gap:12}}>
                <span style={{fontSize:22}}>{changeMode === "rendu" ? "💶" : "⚡"}</span>
                <div>
                  <div style={{fontWeight:700, fontSize:15, color:C.primaryDark}}>{changeMode === "rendu" ? "Je rends la monnaie" : "Je ne rends pas la monnaie"}</div>
                  <div style={{fontSize:12, color:"#888", marginTop:2}}>Mode d'encaissement actif</div>
                </div>
              </div>
              <button
                style={{display:"flex", alignItems:"center", gap:8, padding:"10px 18px", background:"white", color:C.primary, border:`1.5px solid ${C.primary}`, borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer"}}
                onClick={() => setChangeMode(null)}
              >
                <RotateCcw size={14}/> Changer de mode
              </button>
            </div>

            {/* Sous-onglets */}
            <div style={S.subTabBar}>
              {[
                {key:"apparence",  label:"Apparence",  icon:<Palette size={15}/>},
                {key:"categories", label:"Catégories", icon:<Tag size={15}/>},
                {key:"articles",   label:"Articles",   icon:<Package size={15}/>},
              ].map(t => (
                <button key={t.key} style={S.subTab(settingsTab===t.key)} onClick={() => setSettingsTab(t.key)}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* ── Apparence ── */}
            {settingsTab === "apparence" && (
              <div>
                <div style={{marginBottom:16}}>
                  <h2 style={{margin:0, fontSize:20, fontWeight:700, color:C.primaryDark}}>Apparence</h2>
                  <p style={{margin:"4px 0 0", color:"#888", fontSize:14}}>Personnalise les couleurs de l'application</p>
                </div>
                <div style={S.card}>
                  <div style={{padding:"20px", display:"grid", gridTemplateColumns:isMobile?"1fr":isTablet?"1fr 1fr":"1fr 1fr 1fr", gap:20}}>
                    {[
                      {label:"Couleur principale", key:"primary",    hint:"Header, boutons, onglets"},
                      {label:"Couleur accent",     key:"accent",     hint:"Bouton valider, stats CA"},
                      {label:"Couleur de fond",    key:"background", hint:"Arrière-plan de l'app"},
                    ].map(item => (
                      <div key={item.key}>
                        <label style={{fontSize:13, fontWeight:600, color:"#444", display:"block", marginBottom:4}}>{item.label}</label>
                        <p style={{fontSize:12, color:"#999", margin:"0 0 10px"}}>{item.hint}</p>
                        <div style={{display:"flex", alignItems:"center", gap:10}}>
                          <div style={{position:"relative", width:48, height:48, borderRadius:10, overflow:"hidden", border:"2px solid #E0E4F0", flexShrink:0}}>
                            <input type="color" value={colors[item.key]}
                              onChange={e => setColors(prev => ({...prev, [item.key]:e.target.value}))}
                              style={{position:"absolute", inset:"-8px", width:"calc(100% + 16px)", height:"calc(100% + 16px)", cursor:"pointer", border:"none", padding:0}}
                            />
                          </div>
                          <input style={{...S.input, fontFamily:"monospace", fontSize:13, margin:0}}
                            value={colors[item.key]}
                            onChange={e => { if(/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setColors(prev=>({...prev,[item.key]:e.target.value})); }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{margin:"0 20px 20px", padding:16, background:C.background, borderRadius:12, border:"1px solid #E8EAF0"}}>
                    <div style={{fontSize:12, color:"#888", fontWeight:600, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.06em"}}>Aperçu</div>
                    <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"center"}}>
                      <div style={{background:C.primary, color:"white", padding:"8px 16px", borderRadius:8, fontSize:13, fontWeight:600}}>Bouton principal</div>
                      <div style={{background:C.accent, color:"#1a1000", padding:"8px 16px", borderRadius:8, fontSize:13, fontWeight:600}}>Bouton accent</div>
                      <div style={{background:C.primaryLight, color:C.primaryDark, padding:"8px 16px", borderRadius:8, fontSize:13, fontWeight:600}}>Total à régler</div>
                      <div style={{border:`1.5px solid ${C.primary}`, color:C.primary, padding:"6px 14px", borderRadius:20, fontSize:13, fontWeight:600}}>Onglet actif</div>
                    </div>
                  </div>
                  <div style={{padding:"0 20px 20px", display:"flex", gap:10}}>
                    <button style={{display:"flex", alignItems:"center", gap:6, padding:"10px 20px", background:C.primary, color:"white", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer"}}
                      onClick={saveColors} disabled={savingColors}>
                      {savingColors ? <Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/> : <Save size={14}/>} Enregistrer
                    </button>
                    <button style={{display:"flex", alignItems:"center", gap:6, padding:"10px 16px", background:"white", color:"#666", border:"1.5px solid #D0D6E8", borderRadius:8, fontSize:14, cursor:"pointer"}}
                      onClick={resetColors}>
                      <RotateCcw size={14}/> Réinitialiser
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Catégories ── */}
            {settingsTab === "categories" && (
              <div>
                <div style={{marginBottom:16}}>
                  <h2 style={{margin:0, fontSize:20, fontWeight:700, color:C.primaryDark}}>Catégories</h2>
                  <p style={{margin:"4px 0 0", color:"#888", fontSize:14}}>{categories.length} catégorie(s)</p>
                </div>
                <div style={S.card}>
                  <div style={{padding:"14px 20px", borderBottom:"1px solid #F0F2F8", display:"flex", gap:10, alignItems:"center"}}>
                    <Tag size={18} style={{color:C.primary, flexShrink:0}}/>
                    <input style={{...S.input, margin:0}} placeholder="Nouvelle catégorie (ex: Apéro, Dessert…)"
                      value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key==="Enter" && addCategory()}/>
                    <button style={{display:"flex", alignItems:"center", gap:6, padding:"9px 16px", background:C.primary, color:"white", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0}}
                      onClick={addCategory} disabled={savingCat}>
                      {savingCat ? <Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/> : <Plus size={13}/>} Ajouter
                    </button>
                  </div>
                  {categories.length === 0 ? (
                    <div style={{padding:"20px", textAlign:"center", color:"#AAB", fontSize:14}}>Aucune catégorie</div>
                  ) : (
                    categories.map(cat => (
                      <div key={cat.id} style={{...S.settingsRow, background:deleteCatConfirm?.id===cat.id?"#FFF8F8":"transparent"}}>
                        <Tag size={16} style={{color:C.primary, flexShrink:0}}/>
                        <span style={{flex:1, fontWeight:600, fontSize:14}}>{cat.name}</span>
                        <span style={{fontSize:12, color:"#AAB"}}>{products.filter(p=>p.category===cat.name).length} article(s)</span>
                        {deleteCatConfirm?.id === cat.id ? (
                          <div style={{display:"flex", gap:6, alignItems:"center"}}>
                            <span style={{fontSize:12, color:"#CC3333", fontWeight:600}}>Supprimer ?</span>
                            <button style={{...S.iconBtn("#CC3333"), border:"none", background:"#CC3333", color:"white"}} onClick={() => deleteCategory(deleteCatConfirm.id, deleteCatConfirm.name)}><CheckCircle size={14}/></button>
                            <button style={{...S.iconBtn("#666"), border:"none"}} onClick={() => setDeleteCatConfirm(null)}><X size={14}/></button>
                          </div>
                        ) : (
                          <button style={S.iconBtn("#CC3333")} onClick={() => setDeleteCatConfirm(cat)}><Trash2 size={14}/></button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── Articles ── */}
            {settingsTab === "articles" && (
              <div>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
                  <div>
                    <h2 style={{margin:0, fontSize:20, fontWeight:700, color:C.primaryDark}}>Articles</h2>
                    <p style={{margin:"4px 0 0", color:"#888", fontSize:14}}>{products.length} article(s) configuré(s)</p>
                  </div>
                  <button style={{display:"flex", alignItems:"center", gap:8, padding:"10px 18px", background:C.primary, color:"white", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer"}}
                    onClick={() => { setShowAddForm(!showAddForm); setEditingProduct(null); }}>
                    <Plus size={16}/> Ajouter un article
                  </button>
                </div>

                {showAddForm && (
                  <div style={{...S.card, marginBottom:20}}>
                    <div style={S.cardHeader}><span style={S.cardTitle}>Nouvel article</span></div>
                    <div style={{display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:12, padding:"16px 20px"}}>
                      {[
                        {label:"Emoji", key:"emoji", placeholder:"🛒", type:"text"},
                        {label:"Nom *", key:"name",  placeholder:"Ex: Hot-dog", type:"text"},
                        {label:"Prix (€) *", key:"price", placeholder:"0.00", type:"number"},
                      ].map(f => (
                        <div key={f.key}>
                          <label style={{fontSize:12, color:"#666", fontWeight:600, display:"block", marginBottom:6}}>{f.label}</label>
                          <input style={S.input} type={f.type} step={f.type==="number"?"0.10":undefined}
                            value={newProduct[f.key]} placeholder={f.placeholder}
                            onChange={e => setNewProduct(p=>({...p,[f.key]:e.target.value}))}/>
                        </div>
                      ))}
                      <div>
                        <label style={{fontSize:12, color:"#666", fontWeight:600, display:"block", marginBottom:6}}>Catégorie</label>
                        <select style={S.select} value={newProduct.category} onChange={e => setNewProduct(p=>({...p,category:e.target.value}))}>
                          {catNames.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{padding:"0 20px 20px", display:"flex", gap:10}}>
                      <button style={{display:"flex", alignItems:"center", gap:6, padding:"10px 20px", background:C.primary, color:"white", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer"}}
                        onClick={addProduct} disabled={saving}>
                        {saving ? <Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/> : <Save size={14}/>} Enregistrer
                      </button>
                      <button style={{padding:"10px 16px", background:"white", color:"#666", border:"1.5px solid #D0D6E8", borderRadius:8, fontSize:14, cursor:"pointer"}} onClick={() => setShowAddForm(false)}>Annuler</button>
                    </div>
                  </div>
                )}

                <div style={S.card}>
                  {products.map(p => (
                    editingProduct?.id === p.id ? (
                      <div key={p.id} style={{padding:"12px 20px", borderBottom:"1px solid #F0F2F8", background:"#F8FAFF"}}>
                        <div style={{display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"80px 1fr 120px 150px", gap:10, alignItems:"center"}}>
                          <input style={{...S.input, textAlign:"center", fontSize:20}} value={editingProduct.emoji} onChange={e => setEditingProduct(p=>({...p,emoji:e.target.value}))}/>
                          <input style={S.input} value={editingProduct.name} onChange={e => setEditingProduct(p=>({...p,name:e.target.value}))}/>
                          <input style={S.input} type="number" step="0.10" value={editingProduct.price} onChange={e => setEditingProduct(p=>({...p,price:e.target.value}))}/>
                          <select style={S.select} value={editingProduct.category} onChange={e => setEditingProduct(p=>({...p,category:e.target.value}))}>
                            {catNames.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                        <div style={{display:"flex", gap:8, marginTop:10}}>
                          <button style={{display:"flex", alignItems:"center", gap:5, padding:"7px 14px", background:C.primary, color:"white", border:"none", borderRadius:7, fontSize:13, fontWeight:600, cursor:"pointer"}}
                            onClick={saveEdit} disabled={saving}>
                            {saving ? <Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/> : <Save size={13}/>} Enregistrer
                          </button>
                          <button style={{padding:"7px 12px", background:"white", border:"1.5px solid #D0D6E8", borderRadius:7, fontSize:13, cursor:"pointer", color:"#666"}} onClick={() => setEditingProduct(null)}>Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <div key={p.id} style={{...S.settingsRow, background:deleteConfirm===p.id?"#FFF8F8":"transparent"}}>
                        <span style={{fontSize:24, width:36, textAlign:"center"}}>{p.emoji}</span>
                        <span style={{flex:1, fontWeight:600, fontSize:14}}>{p.name}</span>
                        <span style={{fontSize:12, background:C.primaryLight, color:C.primary, padding:"3px 10px", borderRadius:20, fontWeight:500}}>{p.category}</span>
                        <span style={{fontWeight:700, color:C.primary, fontSize:14, minWidth:60, textAlign:"right"}}>{formatPrice(p.price)}</span>
                        {deleteConfirm === p.id ? (
                          <div style={{display:"flex", gap:6, alignItems:"center"}}>
                            <span style={{fontSize:12, color:"#CC3333", fontWeight:600}}>Supprimer ?</span>
                            <button style={{...S.iconBtn("#CC3333"), border:"none", background:"#CC3333", color:"white"}} onClick={() => deleteProduct(p.id)}><CheckCircle size={14}/></button>
                            <button style={{...S.iconBtn("#666"), border:"none"}} onClick={() => setDeleteConfirm(null)}><X size={14}/></button>
                          </div>
                        ) : (
                          <div style={{display:"flex", gap:6}}>
                            <button style={S.iconBtn(C.primary)} onClick={() => { setEditingProduct({...p}); setShowAddForm(false); }}><Edit3 size={14}/></button>
                            <button style={S.iconBtn("#CC3333")} onClick={() => setDeleteConfirm(p.id)}><Trash2 size={14}/></button>
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
