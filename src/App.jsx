import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import {
  ShoppingCart, Clock, Settings, Plus, Minus, Trash2,
  CheckCircle, Edit3, X, Save, ArrowRight, RotateCcw,
  Loader2, WifiOff, Wifi, AlertTriangle, Tag, Palette, Package,
  Monitor, Tablet, Smartphone, Calendar, Hash, Lock, FileText,
  Maximize2, Minimize2
} from "lucide-react";

const PIN_CODE = "2550";
const PIN_STORAGE_KEY = "pin_unlocked_until";
const PIN_DURATION_MS = 2 * 60 * 60 * 1000; // 2 heures
const SUMUP_COMMISSION = 0.0175; // 1,75 %

function isPinUnlocked() {
  const until = parseInt(localStorage.getItem(PIN_STORAGE_KEY), 10);
  return Number.isFinite(until) && Date.now() < until;
}
function unlockPin() {
  localStorage.setItem(PIN_STORAGE_KEY, String(Date.now() + PIN_DURATION_MS));
}

// ── Journal des ventes : append-only, jamais effacé automatiquement ──
const SALES_JOURNAL_KEY = "sales_journal";
function readSalesJournal() {
  try { return JSON.parse(localStorage.getItem(SALES_JOURNAL_KEY) || "[]"); }
  catch { return []; }
}
function appendSalesJournal(entry) {
  try {
    const journal = readSalesJournal();
    journal.push(entry);
    localStorage.setItem(SALES_JOURNAL_KEY, JSON.stringify(journal));
  } catch {}
}
function markSalesJournalSynced(orderNumbers) {
  try {
    const wanted = new Set(orderNumbers.map(String));
    const journal = readSalesJournal().map(e =>
      wanted.has(String(e.order_number)) && e.status !== "synced" ? { ...e, status: "synced" } : e
    );
    localStorage.setItem(SALES_JOURNAL_KEY, JSON.stringify(journal));
  } catch {}
}
function salesJournalEntryFromTx(tx, status) {
  return {
    datetime: new Date().toISOString(),
    order_number: tx.order_number || "",
    items: (tx.items || []).map(i => ({ name:i.name, emoji:i.emoji, price:i.price, qty:i.qty })),
    total: tx.total,
    payment_method: tx.payment_method,
    status,
  };
}
function txTabletPrefix(tx) {
  const n = (tx.order_number || "").trim();
  return n ? n[0].toUpperCase() : "?";
}

const DEFAULTS = { primary:"#003B8E", accent:"#F5A623", background:"#F4F6FB" };
const EMOJI_SIZE_DEFAULT = 72;
const EMOJI_SIZE_OPTIONS = [
  { label:"Petit",      value:40  },
  { label:"Moyen",      value:56  },
  { label:"Grand",      value:72  },
  { label:"Très grand", value:96  },
  { label:"Géant",      value:128 },
];

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
function toCents(amount)  { return Math.round(amount * 100); }
function fromCents(cents) { return cents / 100; }
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

const LETTERS = Array.from({ length:26 }, (_, i) => String.fromCharCode(65+i));

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

function TabletNameSetup({ onSubmit, onCheckPrefix }) {
  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("A");
  const [checking, setChecking] = useState(false);
  const [collision, setCollision] = useState(null); // { name } d'une autre tablette active
  const trimmed = name.trim();

  async function handleContinue() {
    if (!trimmed) return;
    setChecking(true);
    let other = null;
    try { other = onCheckPrefix ? await onCheckPrefix(prefix, trimmed) : null; }
    catch { other = null; }
    setChecking(false);
    if (other) { setCollision(other); return; }
    onSubmit(trimmed, prefix);
  }
  return (
    <div style={{
      minHeight:"100vh", background:DEFAULTS.background,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      fontFamily:"'Segoe UI',system-ui,sans-serif", padding:"24px"
    }}>
      <div style={{ textAlign:"center", marginBottom:32 }}>
        <div style={{ fontSize:56, marginBottom:16 }}>🏷️</div>
        <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:DEFAULTS.primary }}>
          <span style={{ color:DEFAULTS.accent }}>ÉVOLUTION</span> DE MORTEAU
        </h1>
        <p style={{ margin:"10px 0 0", color:"#888", fontSize:15 }}>
          Donnez un nom à cette tablette (ex : "Caisse entrée", "Bar")
        </p>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:14, width:"100%", maxWidth:360 }}>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && trimmed && !checking) handleContinue(); }}
          placeholder="Nom de la tablette"
          style={{ padding:"16px 18px", borderRadius:14, border:"1.5px solid #E0E4F0", fontSize:16, outline:"none", boxSizing:"border-box" }}
        />
        <div>
          <label style={{ fontSize:13, fontWeight:600, color:"#666", display:"block", marginBottom:6 }}>
            Lettre des numéros de commande (ex : {prefix}1, {prefix}2…)
          </label>
          <select
            value={prefix}
            onChange={e => { setPrefix(e.target.value); setCollision(null); }}
            style={{ width:"100%", padding:"14px 18px", borderRadius:14, border:"1.5px solid #E0E4F0", fontSize:16, outline:"none", boxSizing:"border-box", background:"white" }}
          >
            {LETTERS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        {collision && (
          <div style={{ background:"#FFF4E5", border:"1.5px solid #F5A623", borderRadius:14, padding:"12px 14px", fontSize:13, color:"#8A5A00" }}>
            <div style={{ marginBottom:10 }}>
              ⚠️ La lettre {prefix} est déjà utilisée par la tablette « {collision.name} ». Choisissez une autre lettre.
            </div>
            <button
              onClick={() => onSubmit(trimmed, prefix)}
              style={{ padding:"8px 14px", background:"white", color:"#8A5A00", border:"1.5px solid #F5A623", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer" }}
            >
              Utiliser quand même
            </button>
          </div>
        )}
        <button
          disabled={!trimmed || checking}
          onClick={handleContinue}
          style={{
            padding:"16px", background:(trimmed && !checking)?DEFAULTS.primary:"#C8D0E8", color:"white", border:"none",
            borderRadius:14, fontSize:16, fontWeight:700, cursor:(trimmed && !checking)?"pointer":"default",
            display:"flex", alignItems:"center", justifyContent:"center", gap:10
          }}
        >
          {checking ? <Loader2 size={18} style={{ animation:"spin 1s linear infinite" }}/> : <>Continuer <ArrowRight size={18}/></>}
        </button>
      </div>
    </div>
  );
}

function EventSelector({ events, activeEventId, onSelect }) {
  const [hovered, setHovered] = useState(null);
  const options = [{ id:null, name:"Tous les produits", emoji:"🛍️" }, ...events.map(e => ({ id:e.id, name:e.name, emoji:"🎉" }))];
  return (
    <div style={{
      minHeight:"100vh", background:DEFAULTS.background,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      fontFamily:"'Segoe UI',system-ui,sans-serif", padding:"24px"
    }}>
      <div style={{ textAlign:"center", marginBottom:48 }}>
        <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
        <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:DEFAULTS.primary }}>
          <span style={{ color:DEFAULTS.accent }}>ÉVOLUTION</span> DE MORTEAU
        </h1>
        <p style={{ margin:"10px 0 0", color:"#888", fontSize:15 }}>
          Quel événement souhaitez-vous encaisser ?
        </p>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:16, justifyContent:"center", maxWidth:900 }}>
        {options.map(opt => {
          const optKey = opt.id ?? "none";
          const isActive = String(opt.id ?? "") === String(activeEventId ?? "");
          const isHovered = hovered === optKey;
          return (
            <button
              key={optKey}
              onClick={() => onSelect(opt.id)}
              onMouseEnter={() => setHovered(optKey)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position:"relative",
                display:"flex", flexDirection:"column", alignItems:"center", gap:14,
                padding:"28px 36px", borderRadius:20,
                border:`2px solid ${(isHovered||isActive) ? DEFAULTS.primary : "#E0E4F0"}`,
                background: isHovered ? DEFAULTS.primary : isActive ? lighten(DEFAULTS.primary,0.9) : "white",
                color: isHovered ? "white" : "#1a1a2e",
                cursor:"pointer", transition:"all 0.18s", minWidth:160,
                boxShadow: isHovered ? "0 8px 28px rgba(0,59,142,0.25)" : "0 2px 8px rgba(0,0,0,0.06)"
              }}
            >
              {isActive && (
                <span style={{ position:"absolute", top:-10, right:-10, fontSize:10, fontWeight:700, background:DEFAULTS.primary, color:"white", padding:"3px 9px", borderRadius:20 }}>
                  ACTUEL
                </span>
              )}
              <span style={{ fontSize:40 }}>{opt.emoji}</span>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontWeight:700, fontSize:16 }}>{opt.name}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PinModal({ C, onSuccess, onCancel }) {
  const [entry, setEntry] = useState("");
  const [error, setError] = useState(false);

  function press(d) {
    setError(false);
    setEntry(prev => {
      const next = (prev + d).slice(0, 4);
      if (next.length === 4) {
        if (next === PIN_CODE) { setTimeout(() => onSuccess(), 120); }
        else { setTimeout(() => { setError(true); setEntry(""); }, 120); }
      }
      return next;
    });
  }
  function back() { setError(false); setEntry(prev => prev.slice(0, -1)); }

  const keyBtn = {
    fontSize: 24, fontWeight: 700, padding: "18px 0", borderRadius: 12,
    border: "1.5px solid #E0E4F0", background: "white", color: "#1a1a2e", cursor: "pointer",
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000 }}>
      <div style={{ background:"white", borderRadius:16, padding:28, width:"90%", maxWidth:340, textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
        <Lock size={34} style={{ color:C.primary, marginBottom:12 }}/>
        <h3 style={{ margin:"0 0 4px", fontSize:18 }}>Accès aux Paramètres</h3>
        <p style={{ margin:"0 0 18px", color:"#888", fontSize:13 }}>Saisissez le code PIN à 4 chiffres</p>
        <div style={{ display:"flex", gap:12, justifyContent:"center", marginBottom:14 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width:16, height:16, borderRadius:"50%",
              background: entry.length > i ? C.primary : "transparent",
              border:`2px solid ${error ? "#CC3333" : C.primary}`,
            }}/>
          ))}
        </div>
        {error && <p style={{ color:"#CC3333", fontSize:13, fontWeight:600, margin:"0 0 12px" }}>Code PIN incorrect</p>}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {["1","2","3","4","5","6","7","8","9"].map(d => (
            <button key={d} style={keyBtn} onClick={() => press(d)}>{d}</button>
          ))}
          <button style={{ ...keyBtn, border:"none", background:"transparent", fontSize:14, color:"#888" }} onClick={onCancel}>Annuler</button>
          <button style={keyBtn} onClick={() => press("0")}>0</button>
          <button style={{ ...keyBtn, fontSize:16 }} onClick={back}>⌫</button>
        </div>
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
  const [tabletFilter, setTabletFilter]                = useState("tout"); // "tout" | lettre de préfixe
  const [exportingPdf, setExportingPdf]               = useState(false);

  const [pinModalOpen, setPinModalOpen]              = useState(false);
  const [pinPendingAction, setPinPendingAction]      = useState(null);
  const [showPendingModal, setShowPendingModal]      = useState(false);
  const [paymentMethod, setPaymentMethod]           = useState("especes"); // "especes" | "cb"

  const [newCatName, setNewCatName]              = useState("");
  const [deleteCatConfirm, setDeleteCatConfirm]  = useState(null);
  const [savingCat, setSavingCat]                = useState(false);

  const [colors, setColors]           = useState({ primary:DEFAULTS.primary, accent:DEFAULTS.accent, background:DEFAULTS.background });
  const [emojiSize, setEmojiSize]     = useState(EMOJI_SIZE_DEFAULT);
  const [savingColors, setSavingColors] = useState(false);

  const [tabletName, setTabletName]           = useState(() => localStorage.getItem("tablet_name") || "");
  const [tabletNameDraft, setTabletNameDraft] = useState(() => localStorage.getItem("tablet_name") || "");
  const [renamingTablet, setRenamingTablet]   = useState(false);
  const [tablets, setTablets]                 = useState([]);

  const [tabletPrefix, setTabletPrefix]           = useState(() => localStorage.getItem("tablet_prefix") || "A");
  const [tabletPrefixDraft, setTabletPrefixDraft] = useState(() => localStorage.getItem("tablet_prefix") || "A");
  const [prefixCollision, setPrefixCollision]     = useState(null); // { letter, name } d'une autre tablette
  const [checkingPrefix, setCheckingPrefix]       = useState(false);
  const [orderCounter, setOrderCounter]           = useState(() => {
    const v = parseInt(localStorage.getItem("order_counter"), 10);
    return Number.isFinite(v) ? v : 0;
  });
  const [orderConfirm, setOrderConfirm]           = useState(null); // { number, total }
  const [resetTabletCounterConfirm, setResetTabletCounterConfirm] = useState(false);
  const [eventCounterResetMsg, setEventCounterResetMsg] = useState(null);

  const [events, setEvents]                 = useState([]);
  const [eventProducts, setEventProducts]   = useState([]); // rows { event_id, product_id }
  const [activeEventId, setActiveEventId]   = useState(() => localStorage.getItem("active_event_id") || null);
  const [eventStepDone, setEventStepDone]   = useState(false);
  const [newEventName, setNewEventName]     = useState("");
  const [savingEvent, setSavingEvent]       = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingEventName, setEditingEventName] = useState("");
  const [deleteEventConfirm, setDeleteEventConfirm] = useState(null); // { id, name }
  const [expandedEventId, setExpandedEventId] = useState(null);

  const [isOnline, setIsOnline]                   = useState(navigator.onLine);
  const [supabaseReachable, setSupabaseReachable] = useState(true);
  const [pendingTransactions, setPendingTransactions] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pending_transactions") || "[]"); }
    catch { return []; }
  });

  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [isFullscreen, setIsFullscreen]     = useState(false);

  const isMobile = device === "iphone" || device === "android-phone";
  const isTablet = device === "ipad" || device === "android-tablet";

  // Flux de démarrage terminé : device, tablette, événement et mode de rendu choisis
  const startupDone = !!(device && tabletName && eventStepDone && changeMode);

  // Le plein écran n'est pas supporté sur Safari iOS → on masquera le bouton
  const fullscreenSupported =
    typeof document !== "undefined" && !!document.fullscreenEnabled;

  const C = {
    primary:      colors.primary,
    primaryDark:  darken(colors.primary, 0.15),
    primaryLight: lighten(colors.primary, 0.9),
    accent:       colors.accent,
    background:   colors.background,
  };

  useEffect(() => {
    Promise.all([loadProducts(), loadTransactions(), loadCategories(), loadColors(), loadEvents(), loadEventProducts()])
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const ch = supabase.channel("tx-changes")
      .on("postgres_changes", { event:"*", schema:"public", table:"transactions" }, () => loadTransactions())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  useEffect(() => {
    function handleOnline() { setIsOnline(true); syncPendingTransactions(); }
    function handleOffline() { setIsOnline(false); }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if (navigator.onLine) syncPendingTransactions();
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [tabletName, device]);

  useEffect(() => {
    if (tabletName && device) pingTablet(tabletName, pendingTransactions.length);
  }, [tabletName, device]);

  useEffect(() => {
    if (settingsTab === "tablettes") loadTablets();
  }, [settingsTab]);

  // Re-demande le PIN automatiquement à l'expiration des 2 heures
  useEffect(() => {
    if (tab !== "parametres") return;
    const check = () => {
      if (!isPinUnlocked()) { setTab("caisse"); setPinModalOpen(true); }
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [tab]);

  // ── Wake Lock : empêche la mise en veille de l'écran ──
  useEffect(() => {
    if (!startupDone) return;
    if (!("wakeLock" in navigator)) return; // non supporté → on ignore silencieusement

    let wakeLock = null;
    let cancelled = false;

    async function requestWakeLock() {
      try {
        wakeLock = await navigator.wakeLock.request("screen");
        if (cancelled) { try { await wakeLock.release(); } catch {} return; }
        setWakeLockActive(true);
        wakeLock.addEventListener?.("release", () => setWakeLockActive(false));
      } catch (e) {
        console.log("Wake Lock non supporté");
        setWakeLockActive(false);
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") requestWakeLock();
    }

    requestWakeLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      try { wakeLock && wakeLock.release(); } catch {}
      setWakeLockActive(false);
    };
  }, [startupDone]);

  // ── Suivi de l'état plein écran ──
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    handleFullscreenChange();
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
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
    const es = parseInt(map["emoji_size"], 10);
    setEmojiSize(EMOJI_SIZE_OPTIONS.some(o => o.value === es) ? es : EMOJI_SIZE_DEFAULT);
  }
  async function saveColors() {
    setSavingColors(true);
    await Promise.all([
      supabase.from("settings").upsert({ key:"color_primary",    value:colors.primary    }, { onConflict:"key" }),
      supabase.from("settings").upsert({ key:"color_accent",     value:colors.accent     }, { onConflict:"key" }),
      supabase.from("settings").upsert({ key:"color_background", value:colors.background }, { onConflict:"key" }),
      supabase.from("settings").upsert({ key:"emoji_size",       value:String(emojiSize) }, { onConflict:"key" }),
    ]);
    setSavingColors(false);
  }
  function resetColors() { setColors({ primary:DEFAULTS.primary, accent:DEFAULTS.accent, background:DEFAULTS.background }); setEmojiSize(EMOJI_SIZE_DEFAULT); }

  async function pingTablet(name, pendingCount) {
    if (!name) return;
    try {
      // NB : nécessite la colonne "order_prefix" (text) sur la table Supabase "tablets".
      const { error } = await supabase.from("tablets").upsert({
        name, device_type:device, last_sync:new Date().toISOString(), pending_count:pendingCount,
        order_prefix: localStorage.getItem("tablet_prefix") || "A",
      }, { onConflict:"name" });
      if (error) throw error;
    } catch { /* ping non-bloquant */ }
  }

  // Vérifie si une autre tablette active (last_sync < 24h) utilise déjà cette lettre.
  // Renvoie { name } de la tablette en conflit, ou null (dont : hors ligne, erreur, colonne absente).
  async function checkPrefixCollision(letter, selfName) {
    if (!navigator.onLine) return null;
    try {
      const { data, error } = await supabase
        .from("tablets")
        .select("name, order_prefix, last_sync")
        .eq("order_prefix", letter);
      if (error || !data) return null;
      const cutoff = Date.now() - 24 * 3600 * 1000;
      const other = data.find(t =>
        t.name && t.name !== selfName &&
        t.last_sync && new Date(t.last_sync).getTime() > cutoff
      );
      return other ? { name: other.name } : null;
    } catch {
      return null;
    }
  }

  async function loadTablets() {
    const { data, error } = await supabase.from("tablets").select("*").order("name");
    if (error) return;
    setTablets(data || []);
  }

  async function loadEvents() {
    const { data, error } = await supabase.from("events").select("*").order("name");
    if (error) return;
    setEvents(data || []);
  }
  async function loadEventProducts() {
    const { data, error } = await supabase.from("event_products").select("*");
    if (error) return;
    setEventProducts(data || []);
  }

  function handleTabletNameSubmit(name, prefix) {
    localStorage.setItem("tablet_name", name);
    setTabletName(name);
    setTabletNameDraft(name);
    if (prefix) {
      localStorage.setItem("tablet_prefix", prefix);
      setTabletPrefix(prefix);
      setTabletPrefixDraft(prefix);
    }
  }

  function savePrefix(newPrefix) {
    localStorage.setItem("tablet_prefix", newPrefix);
    setTabletPrefix(newPrefix);
    setTabletPrefixDraft(newPrefix);
    if (tabletName) pingTablet(tabletName, pendingTransactions.length);
  }

  async function changePrefix(newPrefix) {
    setTabletPrefixDraft(newPrefix);
    setPrefixCollision(null);
    setCheckingPrefix(true);
    const other = await checkPrefixCollision(newPrefix, tabletName);
    setCheckingPrefix(false);
    if (other) { setPrefixCollision({ letter:newPrefix, name:other.name }); return; }
    savePrefix(newPrefix);
  }

  function forcePrefix(newPrefix) {
    setPrefixCollision(null);
    savePrefix(newPrefix);
  }

  function selectEvent(id) {
    if (id) localStorage.setItem("active_event_id", id);
    else localStorage.removeItem("active_event_id");
    setActiveEventId(id);
    setEventStepDone(true);
  }

  function nextOrderNumber() {
    const next = orderCounter + 1;
    localStorage.setItem("order_counter", String(next));
    setOrderCounter(next);
    return `${tabletPrefix}${next}`;
  }

  function resetTabletCounter() {
    localStorage.setItem("order_counter", "0");
    setOrderCounter(0);
    setResetTabletCounterConfirm(false);
  }

  function resetEventCounter() {
    localStorage.setItem("order_counter", "1");
    setOrderCounter(1);
    setEventCounterResetMsg("Compteur réinitialisé sur cette tablette.");
    setTimeout(() => setEventCounterResetMsg(null), 2500);
  }

  async function addEvent() {
    const name = newEventName.trim();
    if (!name) return;
    setSavingEvent(true);
    const { error } = await supabase.from("events").insert([{ name }]);
    if (error) { alert("Erreur : "+error.message); setSavingEvent(false); return; }
    setNewEventName(""); setSavingEvent(false); await loadEvents();
  }
  async function renameEvent(id, name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { error } = await supabase.from("events").update({ name:trimmed }).eq("id", id);
    if (error) { alert("Erreur : "+error.message); return; }
    setEditingEventId(null); setEditingEventName(""); await loadEvents();
  }
  async function deleteEvent(id) {
    await supabase.from("event_products").delete().eq("event_id", id);
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { alert("Erreur : "+error.message); return; }
    if (String(activeEventId) === String(id)) selectEvent(null);
    setDeleteEventConfirm(null);
    await Promise.all([loadEvents(), loadEventProducts()]);
  }
  async function toggleEventProduct(eventId, productId, checked) {
    if (checked) {
      const { error } = await supabase.from("event_products").insert([{ event_id:eventId, product_id:productId }]);
      if (error) { alert("Erreur : "+error.message); return; }
    } else {
      const { error } = await supabase.from("event_products").delete().eq("event_id", eventId).eq("product_id", productId);
      if (error) { alert("Erreur : "+error.message); return; }
    }
    await loadEventProducts();
  }

  async function renameTablet(newName) {
    const trimmed = newName.trim();
    if (!trimmed || renamingTablet) return;
    setRenamingTablet(true);
    const oldName = tabletName;
    localStorage.setItem("tablet_name", trimmed);
    setTabletName(trimmed);
    try {
      if (oldName && oldName !== trimmed) {
        const { data } = await supabase.from("tablets")
          .update({ name:trimmed, device_type:device, last_sync:new Date().toISOString() })
          .eq("name", oldName).select();
        if (!data || data.length === 0) await pingTablet(trimmed, pendingTransactions.length);
      } else {
        await pingTablet(trimmed, pendingTransactions.length);
      }
      await loadTablets();
    } finally {
      setRenamingTablet(false);
    }
  }

  function queuePendingTransaction(tx) {
    setPendingTransactions(prev => {
      const updated = [...prev, { id:Date.now()+"-"+Math.random().toString(36).slice(2), tx, queued_at:new Date().toISOString() }];
      localStorage.setItem("pending_transactions", JSON.stringify(updated));
      return updated;
    });
  }

  async function submitTransaction(tx) {
    try {
      const { error } = await supabase.from("transactions").insert([tx]);
      if (error) throw error;
      setSupabaseReachable(true);
      await loadTransactions();
      await pingTablet(tabletName, pendingTransactions.length);
      return true;
    } catch {
      setSupabaseReachable(false);
      queuePendingTransaction(tx);
      return false;
    }
  }

  async function syncPendingTransactions() {
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem("pending_transactions") || "[]"); } catch { stored = []; }
    if (stored.length === 0) return;
    try {
      const { error } = await supabase.from("transactions").insert(stored.map(p => p.tx));
      if (error) throw error;
      markSalesJournalSynced(stored.map(p => p.tx.order_number));
      localStorage.removeItem("pending_transactions");
      setPendingTransactions([]);
      setSupabaseReachable(true);
      await loadTransactions();
      await pingTablet(tabletName, 0);
    } catch {
      setSupabaseReachable(false);
    }
  }

  const catNames     = categories.map(c => c.name);
  const activeEventProductIds = new Set(
    eventProducts.filter(ep => String(ep.event_id) === String(activeEventId)).map(ep => ep.product_id)
  );
  const eventFilteredProducts = activeEventId ? products.filter(p => activeEventProductIds.has(p.id)) : products;
  const catTabs      = ["Tous", ...Array.from(new Set(eventFilteredProducts.map(p => p.category)))];
  const filtered     = selectedCat === "Tous" ? eventFilteredProducts : eventFilteredProducts.filter(p => p.category === selectedCat);
  const cartTotal    = Math.round(cart.reduce((s,i) => s + Math.round(i.price*100) * i.qty, 0)) / 100;
  const change       = Math.round((amountGiven - cartTotal) * 100) / 100;
  const canEncaisser = cart.length > 0 && amountGiven >= cartTotal;
  const quickAmounts = changeMode === "rendu" ? QUICK_AMOUNTS.filter(a => a >= 0.5) : QUICK_AMOUNTS;
  const activeEvent  = activeEventId ? events.find(e => String(e.id) === String(activeEventId)) : null;

  useEffect(() => {
    if (catNames.length > 0 && !newProduct.category)
      setNewProduct(p => ({ ...p, category: catNames[0] }));
  }, [categories]);

  useEffect(() => { setSelectedCat("Tous"); }, [activeEventId]);

  function addToCart(p) {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      return ex ? prev.map(i => i.id===p.id ? {...i,qty:i.qty+1} : i) : [...prev, {...p,qty:1}];
    });
  }
  function updateQty(id, delta) { setCart(prev => prev.map(i => i.id===id?{...i,qty:i.qty+delta}:i).filter(i=>i.qty>0)); }
  function clearCart() { setCart([]); setAmountGiven(0); setEncaisseStep("saisie"); setPaymentMethod("especes"); }
  function goToConfirmation() { if (canEncaisser) setEncaisseStep("confirmation"); }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  function selectTab(key) {
    if (key === "parametres" && !isPinUnlocked()) { setPinModalOpen(true); return; }
    setTab(key);
  }
  function requirePin(action) {
    if (isPinUnlocked()) { action(); return; }
    setPinPendingAction(() => action);
    setPinModalOpen(true);
  }
  function annulerConfirmation() { setEncaisseStep("saisie"); }

  async function confirmerRemise() {
    const orderNumber = nextOrderNumber();
    const tx = { items:cart.map(i=>({id:i.id,name:i.name,emoji:i.emoji,price:i.price,qty:i.qty})), total:cartTotal, given:amountGiven, change, order_number:orderNumber, payment_method:"especes" };
    const synced = await submitTransaction(tx);
    appendSalesJournal(salesJournalEntryFromTx(tx, synced ? "synced" : "pending"));
    setOrderConfirm({ number:orderNumber, total:cartTotal });
    clearCart();
  }
  async function confirmerCB() {
    if (cart.length === 0) return;
    const orderNumber = nextOrderNumber();
    const tx = { items:cart.map(i=>({id:i.id,name:i.name,emoji:i.emoji,price:i.price,qty:i.qty})), total:cartTotal, given:cartTotal, change:0, order_number:orderNumber, payment_method:"cb" };
    const synced = await submitTransaction(tx);
    appendSalesJournal(salesJournalEntryFromTx(tx, synced ? "synced" : "pending"));
    setOrderConfirm({ number:orderNumber, total:cartTotal });
    clearCart();
  }
  async function encaisserDirect() {
    if (cart.length === 0) return;
    const orderNumber = nextOrderNumber();
    const tx = { items:cart.map(i=>({id:i.id,name:i.name,emoji:i.emoji,price:i.price,qty:i.qty})), total:cartTotal, given:cartTotal, change:0, order_number:orderNumber, payment_method:"especes" };
    const synced = await submitTransaction(tx);
    appendSalesJournal(salesJournalEntryFromTx(tx, synced ? "synced" : "pending"));
    setOrderConfirm({ number:orderNumber, total:cartTotal });
    clearCart();
  }
  async function deleteTransaction(id) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) { alert("Erreur : "+error.message); return; }
    setDeleteTxConfirm(null); await loadTransactions();
  }
  async function clearAllHistory() {
    const { error } = await supabase.from("transactions").delete().gt("created_at", "1970-01-01");
    if (error) { alert("Erreur : "+error.message); return; }
    setClearHistoryConfirm(false); await loadTransactions();
  }

  async function exportHistoriquePDF() {
    setExportingPdf(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const eur = n => Number(n || 0).toFixed(2).replace(".", ",") + " EUR";
      const rows = filteredTx;
      const now = new Date();
      const doc = new jsPDF();

      let periode;
      if (articleDateFilter !== "tout") {
        periode = formatDate(articleDateFilter);
      } else if (rows.length > 0) {
        const times = rows.map(t => new Date(t.created_at).getTime());
        periode = `${formatDate(new Date(Math.min(...times)))} - ${formatDate(new Date(Math.max(...times)))}`;
      } else {
        periode = "aucune donnee";
      }

      const caTotal      = rows.reduce((s, t) => s + Number(t.total), 0);
      const nbTx         = rows.length;
      const totalCB      = rows.filter(t => t.payment_method === "cb").reduce((s, t) => s + Number(t.total), 0);
      const totalEspeces = rows.filter(t => t.payment_method !== "cb").reduce((s, t) => s + Number(t.total), 0);
      const commission   = Math.round(totalCB * SUMUP_COMMISSION * 100) / 100;
      const netCB        = Math.round((totalCB - commission) * 100) / 100;

      // ── En-tête ──
      doc.setFontSize(18); doc.setFont(undefined, "bold");
      doc.text("EVOLUTION DE MORTEAU", 14, 18);
      doc.setFontSize(10); doc.setFont(undefined, "normal");
      doc.text(`Rapport genere le ${formatDate(now)} a ${formatTime(now)}`, 14, 25);
      doc.text(`Periode couverte : ${periode}`, 14, 30);
      let headBottom = 34;
      if (tabletFilter !== "tout") { doc.text(`Filtre tablette : ${tabletFilter}`, 14, 35); headBottom = 39; }

      // ── Synthèse ──
      autoTable(doc, {
        startY: headBottom + 2,
        head: [["Synthese de la periode", ""]],
        body: [
          ["Chiffre d'affaires total", eur(caTotal)],
          ["Nombre de transactions", String(nbTx)],
          ["Total Especes", eur(totalEspeces)],
          ["Total CB", eur(totalCB)],
        ],
        theme: "grid",
        headStyles: { fillColor: [0, 59, 142] },
      });

      // ── SumUp ──
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 6,
        head: [["SumUp (CB)", ""]],
        body: [
          ["Montant total CB", eur(totalCB)],
          ["Commission SumUp (1,75%)", "- " + eur(commission)],
          ["Net CB apres commission", eur(netCB)],
        ],
        theme: "grid",
        headStyles: { fillColor: [0, 59, 142] },
      });

      // ── CA par catégorie ──
      const prodById = {};
      products.forEach(p => { prodById[p.id] = p; });
      const catMap = {};
      rows.forEach(t => (t.items || []).forEach(it => {
        const cat = prodById[it.id]?.category || "Autre";
        catMap[cat] = (catMap[cat] || 0) + it.price * it.qty;
      }));
      const catRows = Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([c, v]) => [c, eur(v)]);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 6,
        head: [["CA par categorie", "Montant"]],
        body: catRows.length ? catRows : [["-", eur(0)]],
        theme: "striped",
        headStyles: { fillColor: [0, 59, 142] },
      });

      // ── CA par article ──
      const artRows = articleStatsList.map(a => [a.name, String(a.qty), eur(a.total)]);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 6,
        head: [["Article", "Qte", "CA"]],
        body: artRows.length ? artRows : [["-", "0", eur(0)]],
        theme: "striped",
        headStyles: { fillColor: [0, 59, 142] },
      });

      // ── CA par tablette ──
      const tabMap = {};
      rows.forEach(t => {
        const p = txTabletPrefix(t);
        if (!tabMap[p]) tabMap[p] = { ca: 0, nb: 0 };
        tabMap[p].ca += Number(t.total);
        tabMap[p].nb += 1;
      });
      const tabRows = Object.entries(tabMap).sort((a, b) => b[1].ca - a[1].ca)
        .map(([p, v]) => [p, String(v.nb), eur(v.ca)]);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 6,
        head: [["Tablette", "Transactions", "CA"]],
        body: tabRows.length ? tabRows : [["-", "0", eur(0)]],
        theme: "striped",
        headStyles: { fillColor: [0, 59, 142] },
      });

      doc.save(`rapport-caisse-${dayKey(now)}.pdf`);
    } catch (e) {
      alert("Erreur lors de la generation du PDF : " + e.message);
    } finally {
      setExportingPdf(false);
    }
  }

  function exportSalesJournalCSV() {
    const journal = readSalesJournal();
    if (journal.length === 0) { alert("Le journal des ventes est vide."); return; }
    const esc = v => {
      const s = String(v ?? "");
      return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const header = ["Date", "Heure", "N° commande", "Articles", "Total", "Mode paiement", "Statut sync"];
    const lines = journal.map(e => {
      const d = new Date(e.datetime);
      const articles = (e.items || []).map(it => `${it.qty}x ${it.name}`).join(" | ");
      const mode = e.payment_method === "cb" ? "CB" : "Espèces";
      const statut = e.status === "synced" ? "Synchronisé" : "En attente";
      return [
        formatDate(d),
        formatTime(d),
        e.order_number || "",
        articles,
        Number(e.total || 0).toFixed(2).replace(".", ","),
        mode,
        statut,
      ].map(esc).join(";");
    });
    const csv = "﻿" + [header.join(";"), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journal-ventes-${dayKey(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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

  const dayKey = d0 => {
    const d = new Date(d0);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const today     = new Date().toDateString();

  // Liste des jours distincts présents dans l'historique (pour le filtre)
  const availableDates = Array.from(new Set(transactions.map(t => dayKey(t.created_at)))).sort().reverse();

  // Tablettes détectées depuis le préfixe des numéros de commande
  const historyTablets = Array.from(new Set(
    transactions.map(txTabletPrefix).filter(p => p && p !== "?")
  )).sort();

  const matchesTabletFilter = t => tabletFilter === "tout" || txTabletPrefix(t) === tabletFilter;
  const matchesDateFilter   = t => articleDateFilter === "tout" || dayKey(t.created_at) === articleDateFilter;

  // Transactions filtrées (date + tablette) — partagées liste / par article / export PDF
  const filteredTx = transactions.filter(t => matchesDateFilter(t) && matchesTabletFilter(t));

  // Stats du jour (filtrées par tablette uniquement)
  const txToday   = transactions.filter(t => new Date(t.created_at).toDateString() === today && matchesTabletFilter(t));
  const totalJour = txToday.reduce((s,t) => s+Number(t.total), 0);

  const articleStatsMap = {};
  filteredTx.forEach(t => {
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
  if (!tabletName) return <TabletNameSetup onSubmit={handleTabletNameSubmit} onCheckPrefix={checkPrefixCollision} />;

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

  if (!eventStepDone) return <EventSelector events={events} activeEventId={activeEventId} onSelect={selectEvent} />;
  if (!changeMode) return <ModeSelector onSelect={setChangeMode} />;

  const currentDevice = DEVICES.find(d => d.key === device);
  const DeviceIcon = currentDevice?.Icon;

  return (
    <div style={S.app}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Bouton plein écran (masqué si non supporté, ex. Safari iOS) ── */}
      {startupDone && fullscreenSupported && (
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Quitter le plein écran" : "Passer en plein écran"}
          style={{
            position:"fixed", bottom:20, left:20, zIndex:9999,
            width:44, height:44, borderRadius:"50%",
            border:"none", cursor:"pointer",
            background:"rgba(0,0,0,0.3)", color:"white",
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:0, lineHeight:0
          }}
        >
          {isFullscreen ? <Minimize2 size={20}/> : <Maximize2 size={20}/>}
        </button>
      )}

      {/* ── Modals ── */}
      {pinModalOpen && (
        <PinModal
          C={C}
          onSuccess={() => {
            unlockPin();
            setPinModalOpen(false);
            if (pinPendingAction) { const act = pinPendingAction; setPinPendingAction(null); act(); }
            else { setTab("parametres"); }
          }}
          onCancel={() => { setPinModalOpen(false); setPinPendingAction(null); }}
        />
      )}
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
      {showPendingModal && pendingTransactions.length > 0 && (
        <div style={S.overlay}><div style={{...S.modal, textAlign:"left", maxWidth:460}}>
          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:6}}>
            <AlertTriangle size={26} style={{color:"#CC3333", flexShrink:0}}/>
            <h3 style={{margin:0, fontSize:18}}>Ventes en attente de synchronisation</h3>
          </div>
          <p style={{color:"#888", fontSize:13, margin:"0 0 16px"}}>
            {pendingTransactions.length} vente(s) enregistrée(s) localement, pas encore envoyée(s) au serveur.
          </p>
          <div style={{maxHeight:340, overflowY:"auto", display:"flex", flexDirection:"column", gap:10}}>
            {pendingTransactions.map(p => (
              <div key={p.id} style={{border:"1.5px solid #E0E4F0", borderRadius:10, padding:"10px 12px"}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6, fontSize:12, color:"#888"}}>
                  <span style={{display:"flex", alignItems:"center", gap:5}}>
                    <Clock size={13}/> {formatTime(p.queued_at)}
                    {p.tx?.order_number && (
                      <span style={{background:C.primaryLight, color:C.primary, padding:"1px 8px", borderRadius:20, fontSize:11, fontWeight:700}}>{p.tx.order_number}</span>
                    )}
                  </span>
                  <span style={{fontWeight:800, color:"#1a1a2e", fontSize:14}}>{formatPrice(p.tx?.total || 0)}</span>
                </div>
                <div style={{fontSize:13, color:"#555"}}>
                  {(p.tx?.items || []).map((it, k) => (
                    <div key={k} style={{display:"flex", justifyContent:"space-between"}}>
                      <span>{it.emoji ? it.emoji + " " : ""}{it.qty}× {it.name}</span>
                      <span>{formatPrice(it.price * it.qty)}</span>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:11, color:"#999", marginTop:4}}>
                  {p.tx?.payment_method === "cb" ? "CB" : "Espèces"}
                </div>
              </div>
            ))}
          </div>
          <div style={{display:"flex", gap:12, justifyContent:"flex-end", marginTop:18}}>
            <button style={{padding:"10px 24px", background:C.primary, color:"white", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer"}} onClick={() => setShowPendingModal(false)}>Fermer</button>
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
      {deleteEventConfirm && (
        <div style={S.overlay}><div style={S.modal}>
          <AlertTriangle size={40} style={{color:"#CC3333", marginBottom:16}}/>
          <h3 style={{margin:"0 0 8px", fontSize:18}}>Supprimer l'événement "{deleteEventConfirm.name}" ?</h3>
          <p style={{color:"#888", fontSize:14, margin:"0 0 24px"}}>Cette action est irréversible. Les articles associés seront dissociés.</p>
          <div style={{display:"flex", gap:12, justifyContent:"center"}}>
            <button style={{padding:"10px 24px", background:"#CC3333", color:"white", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer"}} onClick={() => deleteEvent(deleteEventConfirm.id)}>Supprimer</button>
            <button style={{padding:"10px 24px", background:"white", color:"#666", border:"1.5px solid #D0D6E8", borderRadius:8, fontSize:14, cursor:"pointer"}} onClick={() => setDeleteEventConfirm(null)}>Annuler</button>
          </div>
        </div></div>
      )}
      {resetTabletCounterConfirm && (
        <div style={S.overlay}><div style={S.modal}>
          <AlertTriangle size={40} style={{color:"#CC3333", marginBottom:16}}/>
          <h3 style={{margin:"0 0 8px", fontSize:18}}>Réinitialiser le compteur de commandes ?</h3>
          <p style={{color:"#888", fontSize:14, margin:"0 0 24px"}}>Le prochain numéro repartira de {tabletPrefix}1, sur cette tablette uniquement.</p>
          <div style={{display:"flex", gap:12, justifyContent:"center"}}>
            <button style={{padding:"10px 24px", background:"#CC3333", color:"white", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer"}} onClick={resetTabletCounter}>Réinitialiser</button>
            <button style={{padding:"10px 24px", background:"white", color:"#666", border:"1.5px solid #D0D6E8", borderRadius:8, fontSize:14, cursor:"pointer"}} onClick={() => setResetTabletCounterConfirm(false)}>Annuler</button>
          </div>
        </div></div>
      )}
      {orderConfirm && (
        <div style={S.overlay}><div style={S.modal}>
          <CheckCircle size={40} style={{color:"#2E7D32", marginBottom:16}}/>
          <div style={{fontSize:12, color:"#888", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8}}>Étape 2/2 — Confirmation</div>
          <h3 style={{margin:"0 0 4px", fontSize:15, color:"#555", fontWeight:600}}>Numéro de commande</h3>
          <div style={{fontSize:48, fontWeight:900, color:C.primaryDark, margin:"8px 0 16px", letterSpacing:"-1px"}}>{orderConfirm.number}</div>
          <p style={{color:"#888", fontSize:14, margin:"0 0 24px"}}>Total encaissé : {formatPrice(orderConfirm.total)}</p>
          <button style={{padding:"12px 28px", background:C.primary, color:"white", border:"none", borderRadius:10, fontSize:15, fontWeight:700, cursor:"pointer"}} onClick={() => setOrderConfirm(null)}>
            Nouvelle vente
          </button>
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
        <div style={{display:"flex", alignItems:"center", gap:isMobile?8:16}}>
          <div title="Événement actif" style={{
            display:"flex", alignItems:"center", gap:6, padding:isMobile?"5px 8px":"6px 12px",
            borderRadius:20, background:"rgba(255,255,255,0.15)", color:"white",
            fontSize:12, fontWeight:600, whiteSpace:"nowrap"
          }}>
            <span style={{fontSize:14}}>{activeEvent ? "🎉" : "🛍️"}</span>
            {!isMobile && <span>{activeEvent ? activeEvent.name : "Tous les produits"}</span>}
          </div>
          {wakeLockActive && (
            <div title="Mise en veille de l'écran désactivée" style={{
              display:"flex", alignItems:"center", gap:6, padding:isMobile?"5px 8px":"6px 12px",
              borderRadius:20, background:"rgba(255,255,255,0.15)", color:"white",
              fontSize:12, fontWeight:600, whiteSpace:"nowrap"
            }}>
              <span style={{
                width:8, height:8, borderRadius:"50%", background:"#3BD671",
                display:"inline-block", boxShadow:"0 0 6px #3BD671", flexShrink:0
              }}/>
              {!isMobile && <span>Écran actif</span>}
            </div>
          )}
          {pendingTransactions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPendingModal(true)}
              title={`${pendingTransactions.length} vente(s) en attente de synchronisation`}
              style={{
                display:"flex", alignItems:"center", gap:6, padding:isMobile?"5px 8px":"6px 12px",
                borderRadius:20, background:"#CC3333", color:"white", border:"none",
                fontSize:12, fontWeight:700, whiteSpace:"nowrap", cursor:"pointer"
              }}
            >
              <AlertTriangle size={14}/>
              <span style={{background:"white", color:"#CC3333", borderRadius:10, padding:"1px 7px", fontSize:11, fontWeight:800}}>
                {pendingTransactions.length}
              </span>
              {!isMobile && <span>en attente</span>}
            </button>
          )}
          {(!isOnline || !supabaseReachable || pendingTransactions.length > 0) ? (
            <div
              title={!isOnline ? "Aucune connexion réseau" : !supabaseReachable ? "Serveur injoignable" : "Synchronisation en attente"}
              style={{
                display:"flex", alignItems:"center", gap:6, padding:isMobile?"5px 8px":"6px 12px",
                borderRadius:20, background:"rgba(255,255,255,0.15)", color:"#FFD9A0",
                fontSize:12, fontWeight:600, whiteSpace:"nowrap"
              }}
            >
              <WifiOff size={14}/>
              {!isMobile && <span>{!isOnline || !supabaseReachable ? "Hors ligne" : "Synchronisation…"}</span>}
              {pendingTransactions.length > 0 && (
                <span style={{background:"#F5A623", color:"#1a1000", borderRadius:10, padding:"1px 7px", fontSize:11, fontWeight:800}}>
                  {pendingTransactions.length}
                </span>
              )}
            </div>
          ) : (
            !isMobile && (
              <div title="Connecté" style={{display:"flex", alignItems:"center", gap:6, color:"rgba(255,255,255,0.55)", fontSize:12}}>
                <Wifi size={14}/>
              </div>
            )
          )}
          <nav style={S.nav}>
            {[
              {key:"caisse",     label:"Caisse",     icon:<ShoppingCart size={16}/>},
              {key:"historique", label:"Historique", icon:<Clock size={16}/>},
              {key:"parametres", label:"Paramètres", icon:<Settings size={16}/>},
            ].map(t => (
              <button key={t.key} style={S.navBtn(tab===t.key)} onClick={() => selectTab(t.key)}>
                {t.icon}{!isMobile && t.label}
              </button>
            ))}
          </nav>
        </div>
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
                        <span style={{fontSize:emojiSize, lineHeight:1}}>{p.emoji}</span>
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
                          {/* Choix du mode de paiement */}
                          <div style={{fontSize:13, fontWeight:600, color:"#555", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.05em"}}>Mode de paiement</div>
                          <div style={{display:"flex", gap:10, marginBottom:16}}>
                            {[
                              {key:"especes", label:"Espèces", icon:"💵"},
                              {key:"cb",      label:"CB",      icon:"💳"},
                            ].map(m => {
                              const active = paymentMethod === m.key;
                              return (
                                <button key={m.key}
                                  onClick={() => { setPaymentMethod(m.key); setAmountGiven(m.key === "cb" ? cartTotal : 0); }}
                                  style={{
                                    flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                                    padding:isMobile?"16px":"14px", borderRadius:12, cursor:"pointer",
                                    border:`2px solid ${active ? C.primary : "#E0E4F0"}`,
                                    background: active ? C.primaryLight : "white",
                                    color: active ? C.primaryDark : "#666",
                                    fontSize:isMobile?16:15, fontWeight:active?700:500,
                                  }}
                                >
                                  <span style={{fontSize:20}}>{m.icon}</span> {m.label}
                                </button>
                              );
                            })}
                          </div>

                          {paymentMethod === "cb" ? (
                            /* ── Paiement par CB : montant exact, pas de calculette ── */
                            <>
                              <div style={{background:"#F4F6FB", borderRadius:10, padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
                                <span style={{fontSize:13, color:"#666"}}>Montant CB</span>
                                <span style={{fontSize:22, fontWeight:800, color:C.primaryDark}}>{formatPrice(cartTotal)}</span>
                              </div>
                              <button
                                style={{width:"100%", padding:isMobile?"18px":"16px", background:cart.length>0?C.primary:"#C8D0E8", color:"white", border:"none", borderRadius:12, fontSize:isMobile?18:17, fontWeight:800, cursor:cart.length>0?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", gap:10}}
                                onClick={confirmerCB}
                                onMouseEnter={e => { if(cart.length>0) e.currentTarget.style.background=C.primaryDark; }}
                                onMouseLeave={e => { if(cart.length>0) e.currentTarget.style.background=C.primary; }}
                              >
                                <CheckCircle size={20}/> Encaisser par CB
                              </button>
                            </>
                          ) : (
                            <>
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
                            </>
                          )}
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
                    onClick={() => requirePin(() => setClearHistoryConfirm(true))}>
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

            {/* ── Filtres partagés (date + tablette) + export PDF ── */}
            <div style={{display:"flex", alignItems:"flex-end", gap:12, marginBottom:20, flexWrap:"wrap"}}>
              <div>
                <label style={{fontSize:12, color:"#666", fontWeight:600, display:"block", marginBottom:6}}>Par jour</label>
                <select
                  style={{...S.select, width:"auto", minWidth:170}}
                  value={articleDateFilter}
                  onChange={e => { setArticleDateFilter(e.target.value); setSelectedArticle(null); }}
                >
                  <option value="tout">Toute la période</option>
                  {availableDates.map(d => (
                    <option key={d} value={d}>{new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"})}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{fontSize:12, color:"#666", fontWeight:600, display:"block", marginBottom:6}}>Par tablette</label>
                <select
                  style={{...S.select, width:"auto", minWidth:170}}
                  value={tabletFilter}
                  onChange={e => { setTabletFilter(e.target.value); setSelectedArticle(null); }}
                >
                  <option value="tout">Toutes les tablettes</option>
                  {historyTablets.map(p => (
                    <option key={p} value={p}>Tablette {p}</option>
                  ))}
                </select>
              </div>
              <button
                style={{display:"flex", alignItems:"center", gap:8, padding:"9px 18px", background:C.primary, color:"white", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:exportingPdf?"default":"pointer", opacity:exportingPdf?0.7:1, whiteSpace:"nowrap"}}
                onClick={exportHistoriquePDF}
                disabled={exportingPdf || filteredTx.length === 0}
              >
                {exportingPdf ? <Loader2 size={15} style={{animation:"spin 1s linear infinite"}}/> : <FileText size={15}/>} Exporter PDF
              </button>
              <button
                style={{display:"flex", alignItems:"center", gap:8, padding:"9px 18px", background:"white", color:C.primary, border:`1.5px solid ${C.primary}`, borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap"}}
                onClick={exportSalesJournalCSV}
                title="Exporte le journal local de toutes les ventes (fonctionne hors ligne)"
              >
                <Save size={15}/> Export secours (CSV)
              </button>
            </div>

            {historyView === "liste" && (
            <>
            {filteredTx.length === 0 ? (
              <div style={{textAlign:"center", padding:"60px 20px", color:"#AAB"}}>
                <Clock size={48} style={{margin:"0 auto 16px", opacity:0.3, display:"block"}}/>
                <p style={{fontSize:16}}>{transactions.length === 0 ? "Aucune transaction pour l'instant" : "Aucune transaction pour ces filtres"}</p>
              </div>
            ) : (
              filteredTx.map((tx, i) => (
                <div key={tx.id} style={S.txCard}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
                    <div style={{fontSize:isMobile?12:13, color:"#888", display:"flex", alignItems:"center", gap:5, flexWrap:"wrap"}}>
                      <Clock size={14}/> {formatDate(tx.created_at)} {formatTime(tx.created_at)}
                      <span style={{marginLeft:8, background:"#F0F2F8", padding:"2px 10px", borderRadius:20, fontSize:12, color:"#666"}}>#{filteredTx.length-i}</span>
                      {tx.order_number && (
                        <span style={{background:C.primaryLight, color:C.primary, padding:"2px 10px", borderRadius:20, fontSize:12, fontWeight:700}}>{tx.order_number}</span>
                      )}
                      <span title={tx.payment_method === "cb" ? "Payé par CB" : "Payé en espèces"} style={{fontSize:14}}>
                        {tx.payment_method === "cb" ? "💳" : "💵"}
                      </span>
                    </div>
                    <div style={{display:"flex", alignItems:"center", gap:12}}>
                      <span style={{fontSize:isMobile?16:18, fontWeight:800, color:C.primaryDark}}>{formatPrice(tx.total)}</span>
                      <button style={{...S.iconBtn("#CC3333"), border:"none"}} onClick={() => requirePin(() => setDeleteTxConfirm(tx.id))}><Trash2 size={14}/></button>
                    </div>
                  </div>
                  <div style={{fontSize:13, color:"#555", borderTop:"1px solid #F0F2F8", paddingTop:10, display:"flex", flexWrap:"wrap", gap:"4px 12px"}}>
                    {(tx.items||[]).map((item,j) => <span key={j}>{item.emoji} {item.name} ×{item.qty}</span>)}
                  </div>
                  <div style={{marginTop:10, display:"flex", gap:16, fontSize:12, color:"#888", flexWrap:"wrap"}}>
                    <span>Mode : <strong style={{color:"#333"}}>{tx.payment_method === "cb" ? "CB 💳" : "Espèces 💵"}</strong></span>
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

            {/* Événement actif + bouton changer */}
            <div style={{...S.card, marginBottom:20, padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12}}>
              <div style={{display:"flex", alignItems:"center", gap:12}}>
                <span style={{fontSize:22}}>{activeEvent ? "🎉" : "🛍️"}</span>
                <div>
                  <div style={{fontWeight:700, fontSize:15, color:C.primaryDark}}>{activeEvent ? activeEvent.name : "Tous les produits"}</div>
                  <div style={{fontSize:12, color:"#888", marginTop:2}}>Événement actif</div>
                </div>
              </div>
              <button
                style={{display:"flex", alignItems:"center", gap:8, padding:"10px 18px", background:"white", color:C.primary, border:`1.5px solid ${C.primary}`, borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer"}}
                onClick={() => setEventStepDone(false)}
              >
                <RotateCcw size={14}/> Changer d'événement
              </button>
            </div>

            {/* Sous-onglets */}
            <div style={S.subTabBar}>
              {[
                {key:"apparence",   label:"Apparence",   icon:<Palette size={15}/>},
                {key:"categories",  label:"Catégories",  icon:<Tag size={15}/>},
                {key:"articles",    label:"Articles",    icon:<Package size={15}/>},
                {key:"tablettes",   label:"Tablettes",   icon:<Tablet size={15}/>},
                {key:"evenements",  label:"Événements",  icon:<Calendar size={15}/>},
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
                  <p style={{margin:"4px 0 0", color:"#888", fontSize:14}}>Personnalise les couleurs et la taille des emojis de l'application</p>
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
                    <label style={{fontSize:13, fontWeight:600, color:"#444", display:"block", marginBottom:4}}>Taille des emojis des articles</label>
                    <p style={{fontSize:12, color:"#999", margin:"0 0 10px"}}>Taille des logos affichés sur les cartes articles en caisse</p>
                    <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                      {EMOJI_SIZE_OPTIONS.map(opt => {
                        const active = emojiSize === opt.value;
                        return (
                          <button key={opt.value} onClick={() => setEmojiSize(opt.value)}
                            style={{display:"flex", flexDirection:"column", alignItems:"center", gap:6, padding:"10px 14px", minWidth:88,
                              borderRadius:10, border:`1.5px solid ${active?C.primary:"#D0D6E8"}`, background:active?C.primaryLight:"white",
                              color:active?C.primaryDark:"#555", fontSize:13, fontWeight:active?600:400, cursor:"pointer"}}>
                            <span style={{fontSize:Math.min(opt.value, 40), lineHeight:1}}>🛒</span>
                            <span>{opt.label}</span>
                            <span style={{fontSize:11, color:"#999"}}>{opt.value}px</span>
                          </button>
                        );
                      })}
                    </div>
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

            {/* ── Tablettes ── */}
            {settingsTab === "tablettes" && (
              <div>
                <div style={{marginBottom:16}}>
                  <h2 style={{margin:0, fontSize:20, fontWeight:700, color:C.primaryDark}}>Tablettes</h2>
                  <p style={{margin:"4px 0 0", color:"#888", fontSize:14}}>{tablets.length} tablette(s) enregistrée(s)</p>
                </div>
                <div style={{...S.card, marginBottom:20}}>
                  <div style={S.cardHeader}><span style={S.cardTitle}>Renommer cette tablette</span></div>
                  <div style={{padding:"14px 20px", display:"flex", gap:10, alignItems:"center", flexWrap:"wrap"}}>
                    <Tablet size={18} style={{color:C.primary, flexShrink:0}}/>
                    <input
                      style={{...S.input, margin:0, flex:1, minWidth:180}}
                      placeholder="Nom de cette tablette"
                      value={tabletNameDraft}
                      onChange={e => setTabletNameDraft(e.target.value)}
                      onKeyDown={e => e.key==="Enter" && renameTablet(tabletNameDraft)}
                    />
                    <button
                      style={{display:"flex", alignItems:"center", gap:6, padding:"9px 16px", background:C.primary, color:"white", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap"}}
                      onClick={() => renameTablet(tabletNameDraft)}
                      disabled={renamingTablet || !tabletNameDraft.trim()}
                    >
                      {renamingTablet ? <Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/> : <Save size={13}/>} Renommer
                    </button>
                  </div>
                </div>

                <div style={{...S.card, marginBottom:20}}>
                  <div style={S.cardHeader}><span style={S.cardTitle}>Numéro de commande de cette tablette</span></div>
                  <div style={{padding:"14px 20px", display:"flex", gap:10, alignItems:"center", flexWrap:"wrap"}}>
                    <Hash size={18} style={{color:C.primary, flexShrink:0}}/>
                    <div style={{flex:1, minWidth:180}}>
                      <label style={{fontSize:12, color:"#666", fontWeight:600, display:"block", marginBottom:6}}>Lettre</label>
                      <select
                        style={{...S.select, width:140}}
                        value={tabletPrefixDraft}
                        disabled={checkingPrefix}
                        onChange={e => changePrefix(e.target.value)}
                      >
                        {LETTERS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div style={{fontSize:13, color:"#888"}}>
                      Prochain numéro : <strong style={{color:C.primary}}>{tabletPrefix}{orderCounter+1}</strong>
                    </div>
                    <button
                      style={{display:"flex", alignItems:"center", gap:6, padding:"9px 16px", background:"#FFF0F0", color:"#CC3333", border:"1.5px solid #CC333330", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap"}}
                      onClick={() => setResetTabletCounterConfirm(true)}
                    >
                      <RotateCcw size={13}/> Réinitialiser le compteur
                    </button>
                  </div>
                  {prefixCollision && (
                    <div style={{margin:"0 20px 16px", background:"#FFF4E5", border:"1.5px solid #F5A623", borderRadius:10, padding:"12px 14px", fontSize:13, color:"#8A5A00", display:"flex", gap:12, alignItems:"center", flexWrap:"wrap"}}>
                      <span style={{flex:1, minWidth:220}}>
                        ⚠️ La lettre {prefixCollision.letter} est déjà utilisée par la tablette « {prefixCollision.name} ». Choisissez une autre lettre.
                      </span>
                      <button
                        style={{padding:"8px 14px", background:"white", color:"#8A5A00", border:"1.5px solid #F5A623", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap"}}
                        onClick={() => forcePrefix(prefixCollision.letter)}
                      >
                        Utiliser quand même
                      </button>
                    </div>
                  )}
                </div>

                <div style={S.card}>
                  {tablets.length === 0 ? (
                    <div style={{padding:"20px", textAlign:"center", color:"#AAB", fontSize:14}}>Aucune tablette synchronisée pour l'instant</div>
                  ) : (
                    tablets.map(t => {
                      const isCurrent = t.name === tabletName;
                      const stale = !t.last_sync || (Date.now() - new Date(t.last_sync).getTime() > 24*3600*1000);
                      const devInfo = DEVICES.find(d => d.key === t.device_type);
                      const TInfoIcon = devInfo?.Icon;
                      return (
                        <div key={t.id} style={{...S.settingsRow, background:isCurrent?C.primaryLight:"transparent"}}>
                          {TInfoIcon ? <TInfoIcon size={20} style={{color:C.primary, flexShrink:0}}/> : <Tablet size={20} style={{color:"#AAB", flexShrink:0}}/>}
                          <div style={{flex:1, minWidth:0}}>
                            <div style={{display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"}}>
                              <span style={{fontWeight:700, fontSize:14}}>{t.name}</span>
                              {isCurrent && (
                                <span style={{fontSize:11, fontWeight:700, background:C.primary, color:"white", padding:"2px 9px", borderRadius:20}}>Cette tablette</span>
                              )}
                              {stale && (
                                <span style={{fontSize:11, fontWeight:700, background:"#FFF0F0", color:"#CC3333", padding:"2px 9px", borderRadius:20}}>Non synchronisée +24h</span>
                              )}
                            </div>
                            <div style={{fontSize:12, color:"#888", marginTop:2}}>
                              {devInfo?.label || t.device_type || "Appareil inconnu"} · Dernière sync : {t.last_sync ? `${formatDate(t.last_sync)} ${formatTime(t.last_sync)}` : "jamais"}
                              {t.pending_count > 0 && <> · {t.pending_count} en attente</>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ── Événements ── */}
            {settingsTab === "evenements" && (
              <div>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10}}>
                  <div>
                    <h2 style={{margin:0, fontSize:20, fontWeight:700, color:C.primaryDark}}>Événements</h2>
                    <p style={{margin:"4px 0 0", color:"#888", fontSize:14}}>{events.length} événement(s) configuré(s)</p>
                  </div>
                  <button
                    style={{display:"flex", alignItems:"center", gap:6, padding:"9px 16px", background:"#FFF0F0", color:"#CC3333", border:"1.5px solid #CC333330", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap"}}
                    onClick={resetEventCounter}
                  >
                    <RotateCcw size={13}/> Réinitialiser le compteur (cette tablette)
                  </button>
                </div>

                {eventCounterResetMsg && (
                  <div style={{marginBottom:16, padding:"10px 16px", background:"#EDFBF0", border:"1.5px solid #5CB872", borderRadius:10, color:"#2E7D32", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:8}}>
                    <CheckCircle size={16}/> {eventCounterResetMsg}
                  </div>
                )}

                <div style={{...S.card, marginBottom:20}}>
                  <div style={S.cardHeader}><span style={S.cardTitle}>Nouvel événement</span></div>
                  <div style={{padding:"14px 20px", display:"flex", gap:10, alignItems:"center"}}>
                    <Calendar size={18} style={{color:C.primary, flexShrink:0}}/>
                    <input style={{...S.input, margin:0}} placeholder="Nom de l'événement (ex : Fête de la musique)"
                      value={newEventName} onChange={e => setNewEventName(e.target.value)} onKeyDown={e => e.key==="Enter" && addEvent()}/>
                    <button style={{display:"flex", alignItems:"center", gap:6, padding:"9px 16px", background:C.primary, color:"white", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0}}
                      onClick={addEvent} disabled={savingEvent}>
                      {savingEvent ? <Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/> : <Plus size={13}/>} Ajouter
                    </button>
                  </div>
                </div>

                {events.length === 0 ? (
                  <div style={{...S.card, padding:"20px", textAlign:"center", color:"#AAB", fontSize:14}}>Aucun événement</div>
                ) : (
                  events.map(ev => {
                    const evProductIds = new Set(eventProducts.filter(ep => String(ep.event_id)===String(ev.id)).map(ep => ep.product_id));
                    const isExpanded = expandedEventId === ev.id;
                    const isEditing = editingEventId === ev.id;
                    return (
                      <div key={ev.id} style={{...S.card, marginBottom:14}}>
                        <div style={{...S.settingsRow, borderBottom:isExpanded?"1px solid #F0F2F8":"none"}}>
                          <Calendar size={18} style={{color:C.primary, flexShrink:0}}/>
                          {isEditing ? (
                            <input
                              style={{...S.input, margin:0, flex:1}}
                              value={editingEventName}
                              autoFocus
                              onChange={e => setEditingEventName(e.target.value)}
                              onKeyDown={e => e.key==="Enter" && renameEvent(ev.id, editingEventName)}
                            />
                          ) : (
                            <span style={{flex:1, fontWeight:600, fontSize:14}}>{ev.name}</span>
                          )}
                          <span style={{fontSize:12, color:"#AAB"}}>{evProductIds.size} article(s)</span>
                          {isEditing ? (
                            <div style={{display:"flex", gap:6}}>
                              <button style={S.iconBtn(C.primary)} onClick={() => renameEvent(ev.id, editingEventName)}><Save size={14}/></button>
                              <button style={S.iconBtn("#666")} onClick={() => { setEditingEventId(null); setEditingEventName(""); }}><X size={14}/></button>
                            </div>
                          ) : deleteEventConfirm?.id === ev.id ? (
                            <div style={{display:"flex", gap:6, alignItems:"center"}}>
                              <span style={{fontSize:12, color:"#CC3333", fontWeight:600}}>Supprimer ?</span>
                              <button style={{...S.iconBtn("#CC3333"), border:"none", background:"#CC3333", color:"white"}} onClick={() => deleteEvent(ev.id)}><CheckCircle size={14}/></button>
                              <button style={{...S.iconBtn("#666"), border:"none"}} onClick={() => setDeleteEventConfirm(null)}><X size={14}/></button>
                            </div>
                          ) : (
                            <div style={{display:"flex", gap:6}}>
                              <button style={S.iconBtn(C.primary)} onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}>
                                <Package size={14}/>
                              </button>
                              <button style={S.iconBtn(C.primary)} onClick={() => { setEditingEventId(ev.id); setEditingEventName(ev.name); }}><Edit3 size={14}/></button>
                              <button style={S.iconBtn("#CC3333")} onClick={() => setDeleteEventConfirm(ev)}><Trash2 size={14}/></button>
                            </div>
                          )}
                        </div>
                        {isExpanded && (
                          <div style={{padding:"12px 20px 16px"}}>
                            <p style={{margin:"0 0 10px", fontSize:12, color:"#888"}}>Sélectionnez les articles disponibles pour cet événement :</p>
                            {products.length === 0 ? (
                              <p style={{fontSize:13, color:"#AAB"}}>Aucun article dans le catalogue.</p>
                            ) : (
                              <div style={{display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(220px,1fr))", gap:8}}>
                                {products.map(p => {
                                  const checked = evProductIds.has(p.id);
                                  return (
                                    <label key={p.id} style={{display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:8, border:`1.5px solid ${checked?C.primary:"#E8EAF0"}`, background:checked?C.primaryLight:"white", cursor:"pointer", fontSize:13}}>
                                      <input type="checkbox" checked={checked} onChange={e => toggleEventProduct(ev.id, p.id, e.target.checked)}/>
                                      <span>{p.emoji}</span>
                                      <span style={{flex:1, fontWeight:600}}>{p.name}</span>
                                      <span style={{color:"#888"}}>{formatPrice(p.price)}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
