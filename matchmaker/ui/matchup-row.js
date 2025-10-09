// Matchup Row Web Component
// Encapsulates the provided UI (away/home search, vs, specials, date field)
// and exposes clean getters/setters + events.
//
// Usage:
//   import './matchup-row.js';
//   const el = document.querySelector('matchup-row');
//   el.curatedTeams = [ 'Arizona State', 'Hawaii', ... ];
//   el.parseTeamString = async (s) => ({ code: 'ASU', name: 'Arizona State' });
//   el.icons = [{icon: './img/sunny.svg', state: 'Day'}, {icon: './img/moon_stars.svg', state: 'Night'}];
//   el.addEventListener('rowchange', (e) => console.log(e.detail));

const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
  <link rel="stylesheet" href="css/theme-dark.css" />
  <style>
    :host{ display:block }
    /* Ensure our container inherits your existing layout classes */
    /* Minimal safe defaults if external CSS fails */
    .main-col-container{ width:calc(1280px*.85); margin:0 auto; border-radius:2rem; border:1px solid rgba(255,255,255,.2); display: flex; flex-direction: column; align-items: center; justify-content: center;}
    .main-row-container{ display:flex; gap:1rem; justify-content:center; align-items:stretch; margin:.5rem 0 1rem; }
    .awayteam-container,.hometeam-container{ width:25%; display:flex; flex-direction:column; align-items:center; }
    .vs-container{ width:8%; display:flex; flex-direction:column; align-items:center; }
    .bottom-row-container{ display:flex; align-items:center; justify-content:center; gap:1.5rem; width:100%; max-width:50%; margin:.5rem auto 0; padding:0; border-top:1px solid rgba(255,255,255,.15) }

    /* Flip animation support if the theme file isn't present */
    .specials-container { perspective: 800px; }
    .icon-rotator{ display:inline-block; width:3rem; height:3rem; transform: rotateX(0deg); transition: transform 240ms ease; backface-visibility:hidden; -webkit-backface-visibility:hidden; }
    .specials-icon{ width:100%; height:100%; display:block; outline:none!important; border:none!important; box-shadow:none!important; -webkit-tap-highlight-color:transparent; cursor:pointer; }

    /* Inline dropdown table (shadow-safe) */
    .shot-search-bar{ position:relative; width:100%; }
    table.custom-table{ position:absolute; top:calc(100% + .25rem); left:0; right:0; z-index:1000; display:none; width:100%; max-height:16rem; overflow:auto; background:#192129; border:1px solid rgba(217,217,217,.12); border-radius:.5rem; box-shadow:0 8px 24px rgba(0,0,0,.2); margin:0; border-collapse:collapse; table-layout:fixed; }
    table.custom-table.is-open{ display:table; }
    table.custom-table thead th{ position:sticky; top:0; background:#192129; color:rgba(235,235,235,.9); font-weight:800; font-size:16px; text-align:left; padding:12px 15px; user-select:none; z-index:1; }
    table.custom-table tbody td{ color:rgba(235,235,235,.6); font-weight:400; font-size:1.25rem; text-align:left; vertical-align:middle; padding:1rem 15px; background:transparent; border-bottom:1px solid rgba(217,217,217,.1); }
    table.custom-table tbody tr:hover td{ color:rgba(235,235,235,.9); background:rgba(217,217,217,.05); border-bottom-color:rgba(147,91,162,.9); }
    /* keyboard navigation highlight */
    table.custom-table tbody tr.is-active td{ color:rgba(235,235,235,.95); background:rgba(217,217,217,.08); border-bottom-color:rgba(147,91,162,.9); }

    .swap-row{ width:3.5rem; height:3.5rem; opacity:.4; content:url("./img/swap_horiz.svg"); cursor:pointer; margin-top:3.2rem; }
    .swap-row:hover{ opacity:.8 }
    .swap-row:active{ transform: scale(.95) }

    .shot-search-bar input[type="text"]{ width:22rem; height:3rem; padding:0 1rem 0 2.5rem; border:1px solid #5E5E5E; border-radius:10px; background: rgba(82,82,82,.1) url("./img/search_icon_24.png") no-repeat 5% 4px / 24px; font-family: Gilroy, system-ui, sans-serif; margin-left: 1rem;}
    .shot-search-bar input[type="text"]::placeholder{ color:rgba(218,218,218,.5); }

    .tricode-row{ padding-top:2rem; padding-bottom:.5rem; font-weight:700; font-size:5rem; opacity:.85; letter-spacing:1.2px; }
    .school-row{ padding-top:1rem; padding-bottom:1.5rem; font-weight:400; font-size:1.5rem; opacity:.5; letter-spacing:1.2px; }

    .specials-text-bar input[type="text"]{ box-sizing:content-box; width: calc(8ch + 2rem); padding-inline:.75rem 1rem; height:2.5rem; border:1px solid #5E5E5E; border-radius:10px; background-color:rgba(82,82,82,.1); font-family: Gilroy, system-ui, sans-serif; }
  </style>
  <div class="main-col-container">
    <div class="main-row-container">
      <div class="awayteam-container">
        <div class="title-row">Away Team</div>
        <div class="shot-search-bar">
          <input id="awaysearchbar" type="text" placeholder="Search Away Teams...">
          <table class="custom-table" id="shotstableaway">
            <thead><tr><th scope="col">Away Teams</th></tr></thead>
            <tbody id="shottablebodyaway"></tbody>
          </table>
        </div>
        <div class="tricode-row" id="tricode-row-away"></div>
        <div class="school-row" id="school-row-away"></div>
      </div>
      <div class="vs-container">
        <div class="swap-row" id="swapbtn"></div>
        <div class="vs-row">vs</div>
      </div>
      <div class="hometeam-container">
        <div class="title-row">Home Team</div>
        <div class="shot-search-bar">
          <input id="homesearchbar" type="text" placeholder="Search Home Teams...">
          <table class="custom-table" id="shotstablehome">
            <thead><tr><th scope="col">Home Teams</th></tr></thead>
            <tbody id="shottablebodyhome"></tbody>
          </table>
        </div>
        <div class="tricode-row" id="tricode-row-home"></div>
        <div class="school-row" id="school-row-home"></div>
      </div>
    </div>
    <div class="bottom-row-container">
      <div class="specials-container-spacer">
        <div class="specials-container">
          <span class="icon-rotator" id="tod-rotator">
            <img class="specials-icon" id="tod-icon" src="./img/sunny.svg" alt="Time of Day">
          </span>
          <div class="specials-title">Time of Day</div>
        </div>
      </div>
      <div class="specials-container-spacer">
        <div class="specials-field-main-container">
          <div class="specials-field-icon-txt-combo">
            <div class="specials-field-icon"></div>
            <div class="specials-text-bar">
              <input id="cal-text-input" type="text" placeholder="Ex: 1025">
            </div>
          </div>
          <div class="specials-title">Game Date</div>
        </div>
      </div>
    </div>
  </div>
`;

export class MatchupRow extends HTMLElement {
  static get is() { return 'matchup-row'; }

  static get observedAttributes(){ return ['away-tricode','away-school','home-tricode','home-school']; }

  constructor(){
    super();
    this._icons = [
      { icon: './img/sunny.svg', state: 'Day' },
      { icon: './img/moon_stars.svg', state: 'Night' },
    ];
    this._iconIndex = 0;
    this._curatedTeams = [];
    this._specialsData = null;
    this._structureData = null;
    this._parseTeamString = null; // user-supplied async function

    const root = this.attachShadow({ mode: 'open' });
    root.appendChild(TEMPLATE.content.cloneNode(true));

    // Cache nodes
    this.$ = (sel) => root.querySelector(sel);
    this._els = {
      awayInput: this.$('#awaysearchbar'),
      homeInput: this.$('#homesearchbar'),
      awayTri:   this.$('#tricode-row-away'),
      awaySch:   this.$('#school-row-away'),
      homeTri:   this.$('#tricode-row-home'),
      homeSch:   this.$('#school-row-home'),
      awayTable: this.$('#shotstableaway'),
      awayBody:  this.$('#shottablebodyaway'),
      homeTable: this.$('#shotstablehome'),
      homeBody:  this.$('#shottablebodyhome'),
      swapBtn:   this.$('#swapbtn'),
      rotWrap:   this.$('#tod-rotator'),
      rotImg:    this.$('#tod-icon'),
      calInput:  this.$('#cal-text-input')
    };
  }

  connectedCallback(){
    const { awayInput, homeInput, awayTable, awayBody, homeTable, homeBody, swapBtn, rotWrap, rotImg, calInput } = this._els;

    // track keyboard nav index per dropdown
    this._nav = { away: -1, home: -1 };

    // INPUT -> suggestions
    const onInputAway = (e)=> this._onInput('away', e);
    const onInputHome = (e)=> this._onInput('home', e);
    awayInput.addEventListener('input', onInputAway);
    homeInput.addEventListener('input', onInputHome);

    // keyboard navigation
    awayInput.addEventListener('keydown', (e)=> this._onKey('away', e));
    homeInput.addEventListener('keydown', (e)=> this._onKey('home', e));

    // click to pick (delegated inside shadow)
    awayBody.addEventListener('click', (e)=>{
      const tr = e.target.closest('tr[data-val]');
      if(tr) this._pick('away', tr.dataset.val);
    });
    homeBody.addEventListener('click', (e)=>{
      const tr = e.target.closest('tr[data-val]');
      if(tr) this._pick('home', tr.dataset.val);
    });

    // outside click closes (use composedPath + capture)
    this._outsideHandler = (e)=>{ if(!this._isInside(e)) this._closeTables(); };
    document.addEventListener('pointerdown', this._outsideHandler, true);

    // swap teams
    swapBtn.addEventListener('click', async ()=>{
      const a = this.awaySearch, h = this.homeSearch;
      this.awaySearch = h; this.homeSearch = a;
      await this._hydrateTeam('away', h);
      await this._hydrateTeam('home', a);
      this._emit();
    });

    // Icon flipper
    ;['outline','outline-color','outline-style','outline-width','box-shadow']
      .forEach(p => rotImg.style.removeProperty(p));
    rotWrap.addEventListener('click', ()=>{
      if(this._busy) return;
      this._busy = true;
      rotWrap.style.transform = 'rotateX(90deg)';
      setTimeout(()=>{
        this._iconIndex = (this._iconIndex + 1) % this._icons.length;
        rotImg.src = this._icons[this._iconIndex]?.icon ?? '';
        rotWrap.style.transform = 'rotateX(0deg)';
        setTimeout(()=>{ this._busy = false; this._emit(); }, 120);
      }, 120);
    });

    calInput.addEventListener('input', ()=> this._emit());

    // Initial placeholder-based width sizing for cal input
    this._sizeCalWidth();
  }

  /* ---------- Public properties / API ---------- */
  get curatedTeams(){ return this._curatedTeams; }
  set curatedTeams(v){
    this._curatedTeams = Array.isArray(v) ? v : [];
    // If a dropdown is open, refresh it with the new dataset
    const av = (this._els.awayInput?.value || '').trim();
    const hv = (this._els.homeInput?.value || '').trim();
    if (this._els.awayTable?.classList.contains('is-open')) this._renderSuggestions('away', av);
    if (this._els.homeTable?.classList.contains('is-open')) this._renderSuggestions('home', hv);
  }

  get specialsData(){ return this._specialsData; }
  set specialsData(v){ this._specialsData = v; }

  get structureData(){ return this._structureData; }
  set structureData(v){ this._structureData = v; }

  // optional async mapper supplied by host code
  get parseTeamString(){ return this._parseTeamString; }
  set parseTeamString(fn){ this._parseTeamString = typeof fn === 'function' ? fn : null; }

  get icons(){ return this._icons.map(x => ({...x})); }
  set icons(arr){
    if(Array.isArray(arr) && arr.length){
      this._icons = arr.map(x => ({ icon: x.icon, state: x.state }));
      this._iconIndex = 0;
      this._els.rotImg.src = this._icons[0]?.icon ?? '';
      this._emit();
    }
  }
  get currentIcon(){ return { index: this._iconIndex, ...this._icons[this._iconIndex] }; }
  set currentIconIndex(i){ if(Number.isInteger(i) && this._icons[i]){ this._iconIndex = i; this._els.rotImg.src = this._icons[i].icon; this._emit(); } }

  // Simple value getters/setters
  get awaySearch(){ return this._els.awayInput.value || ''; }
  set awaySearch(v){ this._els.awayInput.value = String(v||''); }

  get homeSearch(){ return this._els.homeInput.value || ''; }
  set homeSearch(v){ this._els.homeInput.value = String(v||''); }

  get awayTricode(){ return this._els.awayTri.textContent || ''; }
  set awayTricode(v){ this._els.awayTri.textContent = String(v||''); }

  get awaySchool(){ return this._els.awaySch.textContent || ''; }
  set awaySchool(v){ this._els.awaySch.textContent = String(v||''); }

  get homeTricode(){ return this._els.homeTri.textContent || ''; }
  set homeTricode(v){ this._els.homeTri.textContent = String(v||''); }

  get homeSchool(){ return this._els.homeSch.textContent || ''; }
  set homeSchool(v){ this._els.homeSch.textContent = String(v||''); }

  get calText(){ return this._els.calInput.value || ''; }
  set calText(v){ this._els.calInput.value = String(v||''); this._emit(); }

  // Aggregate state
  get value(){
    const ic = this.currentIcon;
    return {
      awaysearchbar: this.awaySearch,
      homesearchbar: this.homeSearch,
      'tricode-row-away': this.awayTricode,
      'school-row-away': this.awaySchool,
      'tricode-row-home': this.homeTricode,
      'school-row-home': this.homeSchool,
      icons: this.icons,
      currentIcon: { icon: ic.icon, state: ic.state, index: ic.index },
      'cal-text-input': this.calText,
    };
  }

  set value(v={}){
    if('awaysearchbar' in v) this.awaySearch = v.awaysearchbar;
    if('homesearchbar' in v) this.homeSearch = v.homesearchbar;
    if('tricode-row-away' in v) this.awayTricode = v['tricode-row-away'];
    if('school-row-away' in v) this.awaySchool = v['school-row-away'];
    if('tricode-row-home' in v) this.homeTricode = v['tricode-row-home'];
    if('school-row-home' in v) this.homeSchool = v['school-row-home'];
    if('icons' in v && Array.isArray(v.icons)) this.icons = v.icons;
    if('currentIcon' in v && Number.isInteger(v.currentIcon?.index)) this.currentIconIndex = v.currentIcon.index;
    if('cal-text-input' in v) this.calText = v['cal-text-input'];
    this._emit();
  }

  attributeChangedCallback(name, oldV, newV){
    if(oldV === newV) return;
    switch(name){
      case 'away-tricode': this.awayTricode = newV; break;
      case 'away-school':  this.awaySchool  = newV; break;
      case 'home-tricode': this.homeTricode = newV; break;
      case 'home-school':  this.homeSchool  = newV; break;
    }
  }

  /* ---------- Private helpers ---------- */
  _sanitize(s){ return String(s||'').toLowerCase().replace(/\s+/g,' ').trim(); }

  async _hydrateTeam(side, input){
    // side: 'away' | 'home'
    const setter = side === 'away' ?
      ((t)=>{ this.awayTricode = t.code||''; this.awaySchool = t.name||''; }) :
      ((t)=>{ this.homeTricode = t.code||''; this.homeSchool = t.name||''; });

    let info = null;
    try{
      if(typeof this._parseTeamString === 'function') info = await this._parseTeamString(input);
    }catch(err){ console.warn('parseTeamString error', err); }

    if(!info){
      // Fallback heuristic: assume input like "Arizona State" and we leave code unchanged
      info = { code: side === 'away' ? this.awayTricode : this.homeTricode, name: input };
    }
    setter(info);
    this._emit();
    return info;
  }

  _sizeCalWidth(){
    const el = this._els.calInput;
    const extra = '2rem';
    const len = (el.placeholder || '').length;
    const w = `calc(${len}ch + ${extra})`;
    el.style.width = w; el.style.minWidth = w; el.style.maxWidth = w;
  }

  /* ---- dropdown helpers (native, no jQuery) ---- */
  _onInput(side, e){
    const v = this._sanitize(e.target.value);
    e.target.value = v;
    this._renderSuggestions(side, v);
  }

  _renderSuggestions(side, query){
    const table = side === 'away' ? this._els.awayTable : this._els.homeTable;
    const body  = side === 'away' ? this._els.awayBody  : this._els.homeBody;

    body.innerHTML = '';
    const q = (query||'').toLowerCase().trim();
    if(!q){ table.classList.remove('is-open'); return; }

    const list = (Array.isArray(this._curatedTeams) ? this._curatedTeams : [])
      .filter(s => String(s).toLowerCase().includes(q))
      .slice(0, 100);

    if(!list.length){ table.classList.remove('is-open'); return; }

    body.innerHTML = list.map((s,i)=>
      `<tr data-val="${String(s).replaceAll('"','&quot;')}" data-index="${i}"><td>${s}</td></tr>`
    ).join('');

    table.style.removeProperty('display');
    table.classList.add('is-open');
    this._nav[side] = -1;
  }

  _onKey(side, e){
    const table = side === 'away' ? this._els.awayTable : this._els.homeTable;
    const body  = side === 'away' ? this._els.awayBody  : this._els.homeBody;
    const rows = [...body.querySelectorAll('tr')];

    if(e.key === 'Escape'){ this._closeTables(); return; }

    if(!table.classList.contains('is-open')){
      if(e.key === 'ArrowDown' && (e.target.value||'').trim()){
        this._renderSuggestions(side, e.target.value);
        e.preventDefault();
      }
      return;
    }

    if(e.key === 'ArrowDown'){ this._moveActive(side, +1, rows); e.preventDefault(); }
    else if(e.key === 'ArrowUp'){ this._moveActive(side, -1, rows); e.preventDefault(); }
    else if(e.key === 'Enter'){
      const i = this._nav[side];
      if(i >= 0 && rows[i]){ this._pick(side, rows[i].dataset.val); e.preventDefault(); }
    }
  }

  _moveActive(side, delta, rows){
    let i = this._nav[side] ?? -1;
    i = Math.max(0, Math.min((rows.length - 1), i + delta));
    rows.forEach(r => r.classList.remove('is-active'));
    if(rows[i]){
      rows[i].classList.add('is-active');
      rows[i].scrollIntoView({ block: 'nearest' });
      this._nav[side] = i;
    }
  }

  _pick(side, text){
    if(side === 'away'){ this._els.awayInput.value = text; this._hydrateTeam('away', text); }
    else { this._els.homeInput.value = text; this._hydrateTeam('home', text); }
    this._closeTables();
  }

  _isInside(event){
    const path = event.composedPath ? event.composedPath() : [];
    return path.includes(this) || path.includes(this.shadowRoot);
  }

  _closeTables(){
    this._els.awayTable.classList.remove('is-open');
    this._els.homeTable.classList.remove('is-open');
  }

  _emit(){ this.dispatchEvent(new CustomEvent('rowchange', { detail: this.value })); }
}

if(!customElements.get(MatchupRow.is)){
  customElements.define(MatchupRow.is, MatchupRow);
}
