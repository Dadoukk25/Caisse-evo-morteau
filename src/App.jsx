import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import {
  ShoppingCart, Clock, Settings, Plus, Minus, Trash2,
  CheckCircle, Edit3, X, Save, ArrowRight, RotateCcw,
  Loader2, WifiOff, AlertTriangle
} from "lucide-react";

const EVO_BLUE      = "#003B8E";
const EVO_BLUE_DARK = "#002870";
const EVO_BLUE_LIGHT= "#E8F0FB";
const EVO_GOLD      = "#F5A623";

const QUICK_AMOUNTS = [0.10, 0.20, 0.50, 1, 2, 5, 10, 20, 50];

function formatPrice(p) {
  return Number(p).toFixed(2).replace(".", ",") + " €";
}
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const S = {
  app:        { minHeight:"100vh", background:"#F4F6FB", fontFamily:"'Segoe UI',system-ui,sans-serif", color:"#1a1a2e" },
  header:     { background:EVO_BLUE, padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", height:60, boxShadow:"0 2px 12px rgba(0,59,142,0.3)" },
  logo:       { display:"flex", alignItems:"center", gap:12, color:"white", fontWeight:700, fontSize:18 },
  nav:        { display:"flex", gap:4 },
  navBtn: a => ({ display:"flex", alignItems:"center", gap:8, padding:"8px 18px", borderRadius:8, border:"none", cursor:"pointer", fontSize:14, fontWeight:a?600:400, background:a?"rgba(255,255,255,0.15)":"transparent", color:a?"white":"rgba(255,255,255,0.7)", transition:"all 0.15s" }),
  content:    { padding:"24px", maxWidth:1400, margin:"0 auto" },
  caisseGrid: { display:"grid", gridTemplateColumns:"1fr 400px", gap:20, alignItems:"start" },
  card:       { background:"white", borderRadius:16, border:"1px solid #E8EAF0", overflow:"hidden" },
  cardHeader: { padding:"16px 20px", borderBottom:"1px solid #F0F2F8", display:"flex", alignItems:"center", justifyContent:"space-between" },
  cardTitle:  { fontWeight:700, fontSize:15, color:EVO_BLUE_DARK },
  catTabs:    { display:"flex", gap:8, padding:"12px 20px", borderBottom:"1px solid #F0F2F8", flexWrap:"wrap" },
  catTab: a => ({ padding:"6px 16px", borderRadius:20, border:`1.5px solid ${a?EVO_BLUE:"#E0E4F0"}`, background:a?EVO_BLUE:"white", color:a?"white":"#555", fontSize:13, fontWeight:a?600:400, cursor:"pointer" }),
  productGrid:{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:12, padding:20 },
  productBtn: { background:"white", border:"1.5px solid #E8EAF0", borderRadius:14, padding:"16px 10px", cursor:"pointer", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:8, transition:"all 0.12s" },
  cartItems:  { padding:"12px 16px", maxHeight:260, overflowY:"auto" },
  cartItem:   { display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid #F4F6FB" },
  qtyBtn:     { width:28, height:28, borderRadius:8, border:`1.5px solid ${EVO_BLUE}`, background:"white", color:EVO_BLUE, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:14 },
  totalSection:{ padding:"14px 16px", borderTop:"2px solid #F0F2F8", background:EVO_BLUE_LIGHT },
  monnaieSection:{ padding:"14px 16px" },
  quickAmountsGrid:{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 },
  quickBtn:   { padding:"10px 6px", background:"white", border:`1.5px solid ${EVO_BLUE}`, borderRadius:10, color:EVO_BLUE, fontWeight:700, fontSize:13, cursor:"pointer", textAlign:"center", transition:"all 0.12s" },
  changeDisplay: ok => ({ background:ok?"#EDFBF0":"#FFF0F0", border:`1.5px solid ${ok?"#5CB872":"#E55"}`, borderRadius:10, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }),
  statsBar:   { background:EVO_BLUE, borderRadius:16, padding:"24px 28px", marginBottom:20, color:"white", display:"flex", alignItems:"center", justifyContent:"space-between" },
  txCard:     { background:"white", borderRadius:14, border:"1px solid #E8EAF0", padding:"16px 20px", marginBottom:12 },
  settingsRow:{ display:"flex", alignItems:"center", padding:"14px 20px", borderBottom:"1px solid #F0F2F8", gap:12 },
  input:      { width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #D0D6E8", fontSize:14, outline:"none", boxSizing:"border-box", background:"white" },
  select:     { width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #D0D6E8", fontSize:14, outline:"none", background:"white" },
  iconBtn: c  => ({ width:32, height:32, borderRadius:8, border:`1.5px solid ${c}20`, background:`${c}10`, color:c, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }),
  // Modal overlay
  overlay:    { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 },
  modal:      { background:"white", borderRadius:16, padding:32, maxWidth:420, width:"90%", textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" },
};

export default function App() {
  const [tab, setTab]                   = useState("caisse");
  const [products, setProducts]         = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [dbError, setDbError]           = useState(false);

  const [cart, setCart]                 = useState([]);
  const [selectedCat, setSelectedCat]  = useState("Tous");
  const [amountGiven, setAmountGiven]   = useState(0);
  const [encaisseStep, setEncaisseStep] = useState("saisie");

  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct]         = useState({ name:"", price:"", category:"Restauration", emoji:"🛒" });
  const [showAddForm, setShowAddForm]       = useState(false);
  const [deleteConfirm, setDeleteConfirm]   = useState(null);
  const [saving, setSaving]                 = useState(false);

  // Historique : confirmation suppression
  const [deleteTxConfirm, setDeleteTxConfirm]   = useState(null); // id transaction à supprimer
  const [clearHistoryConfirm, setClearHistoryConfirm] = useState(false);

  useEffect(() => {
    Promise.all([loadProducts(), loadTransactions()])
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("transactions-changes")
      .on("postgres_changes", { event:"*", schema:"public", table:"transactions" }, () => loadTransactions())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function loadProducts() {
    const { data, error } = await supabase.from("products").select("*").order("category").order("name");
    if (error) { setDbError(true); return; }
    setProducts(data);
  }

  async function loadTransactions() {
    const { data, error } = await supabase.from("transactions").select("*").order("created_at", { ascending:false }).limit(200);
    if (error) { setDbError(true); return; }
    setTransactions(data);
  }

  const categories   = ["Tous", ...Array.from(new Set(products.map(p => p.category)))];
  const filtered     = selectedCat === "Tous" ? products : products.filter(p => p.category === selectedCat);
  const cartTotal    = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const change       = amountGiven - cartTotal;
  const canEncaisser = cart.length > 0 && amountGiven >= cartTotal;

  function addToCart(p) {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      return ex ? prev.map(i => i.id === p.id ? { ...i, qty:i.qty+1 } : i)
                : [...prev, { ...p, qty:1 }];
    });
  }
  function updateQty(id, delta) {
    setCart(prev => prev.map(i => i.id===id ? {...i,qty:i.qty+delta} : i).filter(i=>i.qty>0));
  }
  function clearCart() { setCart([]); setAmountGiven(0); setEncaisseStep("saisie"); }

  function goToConfirmation() { if (canEncaisser) setEncaisseStep("confirmation"); }
  function annulerConfirmation() { setEncaisseStep("saisie"); }

  async function confirmerRemise() {
    const tx = {
      items:  cart.map(i => ({ id:i.id, name:i.name, emoji:i.emoji, price:i.price, qty:i.qty })),
      total:  cartTotal,
      given:  amountGiven,
      change: change,
    };
    const { error } = await supabase.from("transactions").insert([tx]);
    if (error) { alert("Erreur lors de l'enregistrement. Réessaie."); return; }
    clearCart();
  }

  // ── Supprimer une transaction ─────────────────────────────────────────────
  async function deleteTransaction(id) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) { alert("Erreur : " + error.message); return; }
    setDeleteTxConfirm(null);
    await loadTransactions();
  }

  // ── Vider tout l'historique ───────────────────────────────────────────────
  async function clearAllHistory() {
    const { error } = await supabase.from("transactions").delete().neq("id", 0);
    if (error) { alert("Erreur : " + error.message); return; }
    setClearHistoryConfirm(false);
    await loadTransactions();
  }

  // ── CRUD produits ─────────────────────────────────────────────────────────
  async function addProduct() {
    if (!newProduct.name || !newProduct.price) return;
    setSaving(true);
    const { error } = await supabase.from("products").insert([{ ...newProduct, price:parseFloat(newProduct.price) }]);
    if (error) { alert("Erreur : " + error.message); setSaving(false); return; }
    setNewProduct({ name:"", price:"", category:"Restauration", emoji:"🛒" });
    setShowAddForm(false);
    setSaving(false);
    await loadProducts();
  }

  async function saveEdit() {
    if (!editingProduct.name || !editingProduct.price) return;
    setSaving(true);
    const { error } = await supabase.from("products").update({
      name:     editingProduct.name,
      price:    parseFloat(editingProduct.price),
      category: editingProduct.category,
      emoji:    editingProduct.emoji,
    }).eq("id", editingProduct.id);
    if (error) { alert("Erreur : " + error.message); setSaving(false); return; }
    setEditingProduct(null);
    setSaving(false);
    await loadProducts();
  }

  async function deleteProduct(id) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { alert("Erreur : " + error.message); return; }
    setCart(prev => prev.filter(i => i.id !== id));
    setDeleteConfirm(null);
    await loadProducts();
  }

  const today     = new Date().toDateString();
  const txToday   = transactions.filter(t => new Date(t.created_at).toDateString() === today);
  const totalJour = txToday.reduce((s,t) => s + Number(t.total), 0);

  if (loading) return (
    <div style={{ ...S.app, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
      <Loader2 size={40} style={{ color:EVO_BLUE, animation:"spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color:"#888", fontSize:15 }}>Connexion à la base de données…</p>
    </div>
  );

  if (dbError) return (
    <div style={{ ...S.app, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
      <WifiOff size={40} style={{ color:"#CC3333" }} />
      <p style={{ color:"#CC3333", fontSize:15, fontWeight:600 }}>Impossible de se connecter à Supabase.</p>
      <p style={{ color:"#888", fontSize:13 }}>Vérifie tes variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.</p>
    </div>
  );

  return (
    <div style={S.app}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Modal suppression transaction ── */}
      {deleteTxConfirm && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <AlertTriangle size={40} style={{ color:"#CC3333", marginBottom:16 }} />
            <h3 style={{ margin:"0 0 8px", fontSize:18, color:"#1a1a2e" }}>Supprimer cette transaction ?</h3>
            <p style={{ color:"#888", fontSize:14, margin:"0 0 24px" }}>Cette action est irréversible. La transaction sera définitivement supprimée.</p>
            <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
              <button style={{ padding:"10px 24px", background:"#CC3333", color:"white", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer" }}
                onClick={() => deleteTransaction(deleteTxConfirm)}>
                Supprimer
              </button>
              <button style={{ padding:"10px 24px", background:"white", color:"#666", border:"1.5px solid #D0D6E8", borderRadius:8, fontSize:14, cursor:"pointer" }}
                onClick={() => setDeleteTxConfirm(null)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal vider l'historique ── */}
      {clearHistoryConfirm && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <AlertTriangle size={40} style={{ color:"#CC3333", marginBottom:16 }} />
            <h3 style={{ margin:"0 0 8px", fontSize:18, color:"#1a1a2e" }}>Vider tout l'historique ?</h3>
            <p style={{ color:"#888", fontSize:14, margin:"0 0 24px" }}>Toutes les transactions seront supprimées définitivement. Le CA sera remis à zéro.</p>
            <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
              <button style={{ padding:"10px 24px", background:"#CC3333", color:"white", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer" }}
                onClick={clearAllHistory}>
                Tout supprimer
              </button>
              <button style={{ padding:"10px 24px", background:"white", color:"#666", border:"1.5px solid #D0D6E8", borderRadius:8, fontSize:14, cursor:"pointer" }}
                onClick={() => setClearHistoryConfirm(false)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header style={S.header}>
        <div style={S.logo}>
          <span style={{ fontSize:28 }}>⚽</span>
          <div>
            <span style={{ color:EVO_GOLD }}>ÉVOLUTION</span>
            <span style={{ color:"white", marginLeft:6 }}>DE MORTEAU</span>
            <div style={{ fontSize:11, fontWeight:400, color:"rgba(255,255,255,0.6)", letterSpacing:"0.1em" }}>CAISSE ENREGISTREUSE</div>
          </div>
        </div>
        <nav style={S.nav}>
          {[
            { key:"caisse",     label:"Caisse",     icon:<ShoppingCart size={16}/> },
            { key:"historique", label:"Historique", icon:<Clock size={16}/> },
            { key:"parametres", label:"Paramètres", icon:<Settings size={16}/> },
          ].map(t => (
            <button key={t.key} style={S.navBtn(tab===t.key)} onClick={() => setTab(t.key)}>
              {t.icon}{t.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={S.content}>

        {/* ═══════════════════════════════════════════════════════ CAISSE */}
        {tab === "caisse" && (
          <div style={S.caisseGrid}>
            <div style={S.card}>
              <div style={S.cardHeader}>
                <span style={S.cardTitle}>Articles</span>
                <span style={{ fontSize:13, color:"#888" }}>{filtered.length} articles</span>
              </div>
              <div style={S.catTabs}>
                {categories.map(c => (
                  <button key={c} style={S.catTab(selectedCat===c)} onClick={() => setSelectedCat(c)}>{c}</button>
                ))}
              </div>
              <div style={S.productGrid}>
                {filtered.map(p => (
                  <button key={p.id} style={S.productBtn} onClick={() => addToCart(p)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=EVO_BLUE; e.currentTarget.style.background=EVO_BLUE_LIGHT; e.currentTarget.style.transform="translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor="#E8EAF0"; e.currentTarget.style.background="white"; e.currentTarget.style.transform="none"; }}
                  >
                    <span style={{ fontSize:32, lineHeight:1 }}>{p.emoji}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:"#2a2a3e", lineHeight:1.3 }}>{p.name}</span>
                    <span style={{ fontSize:14, fontWeight:700, color:EVO_BLUE }}>{formatPrice(p.price)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardTitle}>Ticket en cours</span>
                  {cart.length > 0 && (
                    <button style={{ border:"none", fontSize:12, padding:"4px 10px", borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", gap:4, background:"#FFF0F0", color:"#CC3333" }} onClick={clearCart}>
                      <Trash2 size={13}/> Vider
                    </button>
                  )}
                </div>
                {cart.length === 0 ? (
                  <div style={{ padding:"32px 16px", textAlign:"center", color:"#AAB" }}>
                    <ShoppingCart size={36} style={{ margin:"0 auto 12px", opacity:0.3, display:"block" }}/>
                    <p style={{ margin:0, fontSize:14 }}>Panier vide — cliquez sur un article</p>
                  </div>
                ) : (
                  <div style={S.cartItems}>
                    {cart.map(item => (
                      <div key={item.id} style={S.cartItem}>
                        <span style={{ fontSize:18 }}>{item.emoji}</span>
                        <span style={{ flex:1, fontSize:14, fontWeight:500 }}>{item.name}</span>
                        <button style={S.qtyBtn} onClick={() => updateQty(item.id,-1)}><Minus size={12}/></button>
                        <span style={{ fontSize:15, fontWeight:700, minWidth:20, textAlign:"center" }}>{item.qty}</span>
                        <button style={S.qtyBtn} onClick={() => updateQty(item.id,1)}><Plus size={12}/></button>
                        <span style={{ fontSize:14, fontWeight:600, color:EVO_BLUE, minWidth:60, textAlign:"right" }}>{formatPrice(item.price*item.qty)}</span>
                        <button style={{ ...S.iconBtn("#CC3333"), border:"none" }} onClick={() => setCart(prev=>prev.filter(i=>i.id!==item.id))}>
                          <X size={13}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={S.totalSection}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:15, fontWeight:600, color:EVO_BLUE_DARK }}>TOTAL À RÉGLER</span>
                    <span style={{ fontSize:22, fontWeight:800, color:EVO_BLUE_DARK }}>{formatPrice(cartTotal)}</span>
                  </div>
                </div>
              </div>

              <div style={S.card}>
                {encaisseStep === "saisie" ? (
                  <>
                    <div style={S.cardHeader}>
                      <span style={S.cardTitle}>Encaissement — Étape 1/2</span>
                      <span style={{ fontSize:12, color:"#AAB", background:"#F0F2F8", padding:"3px 10px", borderRadius:20 }}>Saisie du règlement</span>
                    </div>
                    <div style={S.monnaieSection}>
                      <div style={{ fontSize:13, fontWeight:600, color:"#555", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.05em" }}>Somme reçue</div>
                      <div style={S.quickAmountsGrid}>
                        {QUICK_AMOUNTS.map(a => (
                          <button key={a} style={S.quickBtn}
                            onClick={() => setAmountGiven(prev => Math.round((prev+a)*100)/100)}
                            onMouseEnter={e => { e.currentTarget.style.background=EVO_BLUE; e.currentTarget.style.color="white"; }}
                            onMouseLeave={e => { e.currentTarget.style.background="white"; e.currentTarget.style.color=EVO_BLUE; }}
                          >
                            {a < 1 ? `${Math.round(a*100)} c` : `${a} €`}
                          </button>
                        ))}
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                        <div style={{ flex:1, background:"#F4F6FB", borderRadius:10, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:13, color:"#666" }}>Reçu</span>
                          <span style={{ fontSize:20, fontWeight:800, color:"#333" }}>{formatPrice(amountGiven)}</span>
                        </div>
                        <button style={{ border:"1.5px solid #CC660030", background:"#FFF5E6", padding:"10px 14px", borderRadius:10, fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", color:"#CC6600" }}
                          onClick={() => setAmountGiven(0)}>
                          ✕ Effacer
                        </button>
                      </div>
                      {amountGiven > 0 && (
                        <div style={S.changeDisplay(change>=0)}>
                          <span style={{ fontSize:14, fontWeight:600, color:change>=0?"#2E7D32":"#C62828" }}>
                            {change>=0 ? "Monnaie à rendre" : "⚠️ Manque"}
                          </span>
                          <span style={{ fontSize:20, fontWeight:800, color:change>=0?"#2E7D32":"#C62828" }}>
                            {formatPrice(Math.abs(change))}
                          </span>
                        </div>
                      )}
                      <button style={{ width:"100%", padding:"16px", background:canEncaisser?EVO_GOLD:"#C8D0E8", color:canEncaisser?"#1a1000":"white", border:"none", borderRadius:12, fontSize:17, fontWeight:800, cursor:canEncaisser?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}
                        onClick={goToConfirmation}
                        onMouseEnter={e => { if(canEncaisser) e.currentTarget.style.background="#e09800"; }}
                        onMouseLeave={e => { if(canEncaisser) e.currentTarget.style.background=canEncaisser?EVO_GOLD:"#C8D0E8"; }}
                      >
                        <ArrowRight size={20}/> Valider le calcul
                      </button>
                    </div>
                  </>
                ) : (
                  <div>
                    <div style={{ background:EVO_BLUE, borderRadius:"14px 14px 0 0", padding:"18px 20px 14px" }}>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.65)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Étape 2/2 — Remise de monnaie</div>
                      <div style={{ color:"white", fontSize:15, fontWeight:600 }}>Total : {formatPrice(cartTotal)} · Reçu : {formatPrice(amountGiven)}</div>
                    </div>
                    <div style={{ padding:"32px 20px 24px", textAlign:"center", background:change===0?"#F0FBF4":"#F0F8FF", borderBottom:"1px solid #E8EAF0" }}>
                      {change === 0 ? (
                        <>
                          <div style={{ fontSize:48, marginBottom:8 }}>✅</div>
                          <div style={{ fontSize:16, color:"#2E7D32", fontWeight:600, marginBottom:4 }}>Compte exact</div>
                          <div style={{ fontSize:13, color:"#888" }}>Aucune monnaie à rendre</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize:13, color:"#555", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Monnaie à rendre</div>
                          <div style={{ fontSize:72, fontWeight:900, color:EVO_BLUE_DARK, lineHeight:1, letterSpacing:"-2px", marginBottom:6 }}>{formatPrice(change)}</div>
                          <div style={{ fontSize:14, color:"#888" }}>{formatPrice(amountGiven)} − {formatPrice(cartTotal)} = <strong style={{ color:EVO_BLUE }}>{formatPrice(change)}</strong></div>
                        </>
                      )}
                    </div>
                    <div style={{ padding:"12px 20px", borderBottom:"1px solid #F0F2F8", maxHeight:130, overflowY:"auto" }}>
                      {cart.map(item => (
                        <div key={item.id} style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"4px 0", color:"#555" }}>
                          <span>{item.emoji} {item.name} ×{item.qty}</span>
                          <span style={{ fontWeight:600, color:"#333" }}>{formatPrice(item.price*item.qty)}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:10 }}>
                      <button style={{ width:"100%", padding:"18px", background:EVO_BLUE, color:"white", border:"none", borderRadius:12, fontSize:17, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}
                        onClick={confirmerRemise}
                        onMouseEnter={e => { e.currentTarget.style.background=EVO_BLUE_DARK; }}
                        onMouseLeave={e => { e.currentTarget.style.background=EVO_BLUE; }}
                      >
                        <CheckCircle size={22}/> Monnaie remise — Terminer
                      </button>
                      <button style={{ width:"100%", padding:"11px", background:"white", color:"#666", border:"1.5px solid #D0D6E8", borderRadius:10, fontSize:14, fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
                        onClick={annulerConfirmation}>
                        <RotateCcw size={14}/> Corriger le montant reçu
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ HISTORIQUE */}
        {tab === "historique" && (
          <div>
            {/* Stats bar */}
            <div style={S.statsBar}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:12, opacity:0.75, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>CA du jour</div>
                <div style={{ fontSize:32, fontWeight:800, color:EVO_GOLD }}>{formatPrice(totalJour)}</div>
              </div>
              <div style={{ display:"flex", gap:32, alignItems:"center" }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:12, opacity:0.75, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Transactions aujourd'hui</div>
                  <div style={{ fontSize:22, fontWeight:800, color:EVO_GOLD }}>{txToday.length}</div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:12, opacity:0.75, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Panier moyen</div>
                  <div style={{ fontSize:22, fontWeight:800, color:EVO_GOLD }}>
                    {txToday.length > 0 ? formatPrice(totalJour/txToday.length) : "–"}
                  </div>
                </div>
                {/* Bouton vider historique */}
                {transactions.length > 0 && (
                  <button
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px", background:"rgba(255,255,255,0.15)", color:"white", border:"1.5px solid rgba(255,255,255,0.3)", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer" }}
                    onClick={() => setClearHistoryConfirm(true)}
                  >
                    <Trash2 size={14}/> Vider l'historique
                  </button>
                )}
              </div>
            </div>

            {transactions.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 20px", color:"#AAB" }}>
                <Clock size={48} style={{ margin:"0 auto 16px", opacity:0.3, display:"block" }}/>
                <p style={{ fontSize:16 }}>Aucune transaction pour l'instant</p>
              </div>
            ) : (
              transactions.map((tx, i) => (
                <div key={tx.id} style={S.txCard}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ fontSize:13, color:"#888", display:"flex", alignItems:"center", gap:5 }}>
                      <Clock size={14}/>
                      {formatDate(tx.created_at)} {formatTime(tx.created_at)}
                      <span style={{ marginLeft:8, background:"#F0F2F8", padding:"2px 10px", borderRadius:20, fontSize:12, color:"#666" }}>
                        #{transactions.length - i}
                      </span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ fontSize:18, fontWeight:800, color:EVO_BLUE_DARK }}>{formatPrice(tx.total)}</span>
                      {/* Bouton supprimer transaction */}
                      <button
                        style={{ ...S.iconBtn("#CC3333"), border:"none" }}
                        onClick={() => setDeleteTxConfirm(tx.id)}
                        title="Supprimer cette transaction"
                      >
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize:13, color:"#555", borderTop:"1px solid #F0F2F8", paddingTop:10, display:"flex", flexWrap:"wrap", gap:"4px 12px" }}>
                    {(tx.items||[]).map((item,j) => (
                      <span key={j}>{item.emoji} {item.name} ×{item.qty}</span>
                    ))}
                  </div>
                  <div style={{ marginTop:10, display:"flex", gap:16, fontSize:12, color:"#888" }}>
                    <span>Reçu : <strong style={{ color:"#333" }}>{formatPrice(tx.given)}</strong></span>
                    <span>Monnaie rendue : <strong style={{ color:"#333" }}>{formatPrice(tx.change)}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════ PARAMÈTRES */}
        {tab === "parametres" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:EVO_BLUE_DARK }}>Gestion des articles</h2>
                <p style={{ margin:"4px 0 0", color:"#888", fontSize:14 }}>{products.length} articles configurés</p>
              </div>
              <button style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", background:EVO_BLUE, color:"white", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer" }}
                onClick={() => { setShowAddForm(!showAddForm); setEditingProduct(null); }}>
                <Plus size={16}/> Ajouter un article
              </button>
            </div>

            {showAddForm && (
              <div style={{ ...S.card, marginBottom:20 }}>
                <div style={S.cardHeader}><span style={S.cardTitle}>Nouvel article</span></div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, padding:"16px 20px" }}>
                  {[
                    { label:"Emoji", key:"emoji", placeholder:"🛒", type:"text" },
                    { label:"Nom *", key:"name", placeholder:"Ex: Hot-dog", type:"text" },
                    { label:"Prix (€) *", key:"price", placeholder:"0.00", type:"number" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize:12, color:"#666", fontWeight:600, display:"block", marginBottom:6 }}>{f.label}</label>
                      <input style={S.input} type={f.type} step={f.type==="number"?"0.10":undefined}
                        value={newProduct[f.key]} placeholder={f.placeholder}
                        onChange={e => setNewProduct(p => ({ ...p, [f.key]:e.target.value }))}/>
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize:12, color:"#666", fontWeight:600, display:"block", marginBottom:6 }}>Catégorie</label>
                    <select style={S.select} value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category:e.target.value }))}>
                      {["Restauration","Billetterie","Boutique"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ padding:"0 20px 20px", display:"flex", gap:10 }}>
                  <button style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 20px", background:EVO_BLUE, color:"white", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer" }}
                    onClick={addProduct} disabled={saving}>
                    {saving ? <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }}/> : <Save size={14}/>} Enregistrer
                  </button>
                  <button style={{ padding:"10px 16px", background:"white", color:"#666", border:"1.5px solid #D0D6E8", borderRadius:8, fontSize:14, cursor:"pointer" }}
                    onClick={() => setShowAddForm(false)}>
                    Annuler
                  </button>
                </div>
              </div>
            )}

            <div style={S.card}>
              {products.map(p => (
                editingProduct?.id === p.id ? (
                  <div key={p.id} style={{ padding:"12px 20px", borderBottom:"1px solid #F0F2F8", background:"#F8FAFF" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"80px 1fr 120px 150px", gap:10, alignItems:"center" }}>
                      <input style={{ ...S.input, textAlign:"center", fontSize:20 }} value={editingProduct.emoji} onChange={e => setEditingProduct(p => ({ ...p, emoji:e.target.value }))}/>
                      <input style={S.input} value={editingProduct.name} onChange={e => setEditingProduct(p => ({ ...p, name:e.target.value }))}/>
                      <input style={S.input} type="number" step="0.10" value={editingProduct.price} onChange={e => setEditingProduct(p => ({ ...p, price:e.target.value }))}/>
                      <select style={S.select} value={editingProduct.category} onChange={e => setEditingProduct(p => ({ ...p, category:e.target.value }))}>
                        {["Restauration","Billetterie","Boutique"].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div style={{ display:"flex", gap:8, marginTop:10 }}>
                      <button style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px", background:EVO_BLUE, color:"white", border:"none", borderRadius:7, fontSize:13, fontWeight:600, cursor:"pointer" }}
                        onClick={saveEdit} disabled={saving}>
                        {saving ? <Loader2 size={13} style={{ animation:"spin 1s linear infinite" }}/> : <Save size={13}/>} Enregistrer
                      </button>
                      <button style={{ padding:"7px 12px", background:"white", border:"1.5px solid #D0D6E8", borderRadius:7, fontSize:13, cursor:"pointer", color:"#666" }}
                        onClick={() => setEditingProduct(null)}>
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={p.id} style={{ ...S.settingsRow, background:deleteConfirm===p.id?"#FFF8F8":"transparent" }}>
                    <span style={{ fontSize:24, width:36, textAlign:"center" }}>{p.emoji}</span>
                    <span style={{ flex:1, fontWeight:600, fontSize:14 }}>{p.name}</span>
                    <span style={{ fontSize:12, background:EVO_BLUE_LIGHT, color:EVO_BLUE, padding:"3px 10px", borderRadius:20, fontWeight:500 }}>{p.category}</span>
                    <span style={{ fontWeight:700, color:EVO_BLUE, fontSize:14, minWidth:60, textAlign:"right" }}>{formatPrice(p.price)}</span>
                    {deleteConfirm === p.id ? (
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <span style={{ fontSize:12, color:"#CC3333", fontWeight:600 }}>Supprimer ?</span>
                        <button style={{ ...S.iconBtn("#CC3333"), border:"none", background:"#CC3333", color:"white" }} onClick={() => deleteProduct(p.id)}><CheckCircle size={14}/></button>
                        <button style={{ ...S.iconBtn("#666"), border:"none" }} onClick={() => setDeleteConfirm(null)}><X size={14}/></button>
                      </div>
                    ) : (
                      <div style={{ display:"flex", gap:6 }}>
                        <button style={S.iconBtn(EVO_BLUE)} onClick={() => { setEditingProduct({...p}); setShowAddForm(false); }}><Edit3 size={14}/></button>
                        <button style={S.iconBtn("#CC3333")} onClick={() => setDeleteConfirm(p.id)}><Trash2 size={14}/></button>
                      </div>
                    )}
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
