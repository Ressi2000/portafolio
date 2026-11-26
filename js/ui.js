(function(RQ){
"use strict";

const D = RQ.DATA;
const {
  ZONES, PLACES, VISITABLE, STATUS, ZONE_ORDER, zoneKey,
  FILTER_TECHS, CATS_DATA, SKILLS, EXPERIENCE, EDUCATION, EMAIL, LINKEDIN,
  ICONS, ACHIEVEMENTS, AVATAR_SKINS, BUGS_DATA, BOARD_NOTES, doorOf, esc
} = D;

function createUI(app, els){
  let activeTech = "all";
  let activeStatus = "all";
  const toastQueue = [];
  let toastActive = false;

  function copyText(text, btn, okLabel, fallbackEl){
    const done = () => {
      const prev = btn.textContent;
      btn.textContent = okLabel;
      setTimeout(() => { btn.textContent = prev; }, 1800);
    };
    const fallback = () => {
      if(fallbackEl){
        const s = window.getSelection(), r = document.createRange();
        r.selectNodeContents(fallbackEl);
        s.removeAllRanges(); s.addRange(r);
      }
      done();
    };
    try { navigator.clipboard.writeText(text).then(done, fallback); } catch(err){ fallback(); }
  }

  /* ---------- Toast Notifications ---------- */
  function pumpToast(){
    if(toastActive || !toastQueue.length) return;
    toastActive = true;
    const item = toastQueue.shift();
    els.toast.innerHTML =
      '<span class="toast-ico" aria-hidden="true">' + item.icon + '</span>' +
      '<div class="toast-body"><p class="eyebrow">' + esc(item.eyebrow || "Logro desbloqueado") + '</p><strong>' + esc(item.title) + '</strong><span>' + esc(item.desc) + '</span></div>';
    els.toast.hidden = false;
    els.toast.classList.add("show");
    setTimeout(() => {
      els.toast.classList.remove("show");
      setTimeout(() => {
        els.toast.hidden = true;
        toastActive = false;
        pumpToast();
      }, 260);
    }, item.ms || 3600);
  }

  function showToast(ach){
    toastQueue.push({icon: ach.icon, eyebrow: "Logro desbloqueado", title: ach.title, desc: ach.desc, ms: 3800});
    pumpToast();
  }

  function showNotice(icon, eyebrow, title, desc, ms){
    toastQueue.push({icon: icon || ICONS.star.replace("px-ico","px-ico lg"), eyebrow, title, desc, ms: ms || 4200});
    pumpToast();
  }

  function rewardsHtml(){
    const unlocked = app.state.caughtBugs.size >= BUGS_DATA.length;
    if(!unlocked){
      return '<div class="cv-block"><h3>Cacería de Bugs de Pirulina (' + app.state.caughtBugs.size + '/' + BUGS_DATA.length + ')</h3>' +
        '<p class="note">Encuentra los ' + BUGS_DATA.length + ' bichitos brillantes escondidos por el pueblo para desbloquear accesorios para tu avatar y el modo lluvia relajante.</p></div>';
    }
    return '<div class="cv-block"><h3>Recompensas desbloqueadas (3/3 Bugs)</h3>' +
      '<div class="chips">' +
      AVATAR_SKINS.map(sk => '<button class="chip' + (app.state.skin === sk.id ? ' active' : '') + '" type="button" data-skin="' + sk.id + '">' + esc(sk.label) + '</button>').join("") +
      '<button class="chip' + (app.state.weather === "rain" ? ' active' : '') + '" type="button" data-weather="toggle">' + (app.state.weather === "rain" ? 'Lluvia: ON' : 'Lluvia: OFF') + '</button>' +
      '</div></div>';
  }

  /* ---------- Lightbox ---------- */
  function openLightbox(src, caption){
    els.lbImg.src = src;
    els.lbImg.alt = caption || "";
    els.lbCap.textContent = caption || "";
    els.lbCap.hidden = !caption;
    els.lightbox.hidden = false;
    RQ.Audio.open();
    setTimeout(() => els.btnLbClose.focus(), 0);
  }
  function closeLightbox(){
    if(els.lightbox.hidden) return;
    els.lightbox.hidden = true;
    els.lbImg.src = "";
    RQ.Audio.close();
  }

  /* ---------- Cat Dialog ---------- */
  function openCat(c){
    const isNew = !app.state.petted.has(c.id);
    if(isNew){
      app.state.petted.add(c.id);
      app.save();
      app.updateCount();
    }
    c.state = "sit";
    c.timer = 4.5;
    RQ.World.spawnHeart(c.x, c.y);
    RQ.Audio.cat(c.id);
    app.checkAchievements();
    app.setHash(c.id);

    const quote = c.quotes[(Math.random() * c.quotes.length) | 0];
    const isFollowing = app.state.followingCat === c.id;
    let html = '<p class="eyebrow">Patio · Personal de la casa</p>';
    html += '<h2 id="dlgTitle">' + esc(c.name) + ' · ' + esc(c.role) + '</h2>';
    html += '<figure class="shot pet"><img src="' + c.img + '" alt="Foto de ' + esc(c.name) + '" width="420" height="420" data-zoom="1" data-cap="' + esc(c.name + ' · ' + c.role) + '" title="Clic para ampliar"><figcaption>Clic en la foto para ampliar</figcaption></figure>';
    html += '<p class="lede">' + esc(c.desc) + '</p>';
    html += '<p class="quote">“' + esc(quote) + '”</p>';
    html += '<ul class="points">' + c.points.map(p => '<li><span>' + esc(p) + '</span></li>').join("") + '</ul>';
    html += '<div class="row">' +
      '<button class="btn primary" type="button" data-act="follow" data-cat="' + esc(c.id) + '">' + (isFollowing ? 'Dejar descansar en el patio' : 'Dar snack (que me siga)') + '</button>' +
      '<button class="btn" type="button" data-act="close">Seguir explorando</button>' +
      '<button class="btn" type="button" data-act="link" data-hash="' + esc(c.id) + '">Copiar enlace</button></div>';
    if(app.state.petted.size === CATS_DATA.length) html += '<p class="note">Encontraste a los dos gatos del patio.</p>';
    els.dlgBox.innerHTML = html;
    els.dlgBox.scrollTop = 0;
    app.showOverlay(els.dlg);
  }

  /* ---------- Mini Cerberus Guardian Dialog ---------- */
  function openCerberus(g){
    g.state = "sit";
    g.timer = 4.5;
    RQ.World.spawnCyberHearts(g.x, g.y);
    RQ.Audio.bark();
    app.setHash(g.id);

    const quote = g.quotes[(Math.random() * g.quotes.length) | 0];
    const isFollowing = app.state.followingCat === g.id;
    let html = '<p class="eyebrow">Distrito Infraestructura · Guardián</p>';
    html += '<h2 id="dlgTitle">' + esc(g.name) + ' · ' + esc(g.role) + '</h2>';
    html += '<figure class="shot pet"><img src="' + g.img + '" alt="Ilustración de ' + esc(g.name) + '" width="420" height="420" data-zoom="1" data-cap="' + esc(g.name + ' · ' + g.role) + '" title="Clic para ampliar"><figcaption>Clic en la ilustración para ampliar</figcaption></figure>';
    html += '<p class="lede">' + esc(g.desc) + '</p>';
    html += '<p class="quote cyber-q">“' + esc(quote) + '”</p>';
    html += '<ul class="points">' + g.points.map(p => '<li><span>' + esc(p) + '</span></li>').join("") + '</ul>';
    html += '<div class="row">' +
      '<button class="btn primary" type="button" data-act="follow" data-cat="' + esc(g.id) + '">' + (isFollowing ? 'Volver a vigilar Infraestructura' : 'Llevar de patrulla conmigo') + '</button>' +
      '<button class="btn" type="button" data-act="open-cerberus">Ver Cerberus 2.0</button>' +
      '<button class="btn" type="button" data-act="link" data-hash="' + esc(g.id) + '">Copiar enlace</button>' +
      '<button class="btn" type="button" data-act="close">Cerrar</button></div>';
    els.dlgBox.innerHTML = html;
    els.dlgBox.scrollTop = 0;
    app.showOverlay(els.dlg);
  }

  /* ---------- Bulletin Board Dialog ---------- */
  function openBoard(){
    RQ.Audio.open();
    let html = '<p class="eyebrow">Cruce central · Tablón del pueblo</p>';
    html += '<h2 id="dlgTitle">Estado actual de Ressi</h2>';
    html += '<div class="row"><span class="status prod">Disponible para retos y proyectos</span></div>';
    html += '<p class="lede">' + esc(BOARD_NOTES.status) + '</p>';
    html += '<div class="cv-block"><h3>En qué estoy enfocada ahora</h3><ul class="points">' +
      BOARD_NOTES.focus.map(f => '<li><span>' + esc(f) + '</span></li>').join("") + '</ul></div>';
    html += rewardsHtml();
    html += '<div class="row"><button class="btn primary" type="button" data-act="close">Cerrar</button><button class="btn" type="button" data-act="mailbox">Escribirme en el buzón</button><button class="btn" type="button" data-act="cv">Ver CV</button></div>';
    els.dlgBox.innerHTML = html;
    els.dlgBox.scrollTop = 0;
    app.showOverlay(els.dlg);
  }

  /* ---------- Mailbox Contact Dialog ---------- */
  function openMailbox(){
    RQ.Audio.open();
    let html = '<p class="eyebrow">Oficina de correos · Buzón directo</p>';
    html += '<h2 id="dlgTitle">Déjame un mensaje</h2>';
    html += '<p>Escríbeme aquí y tu mensaje llegará directo a mi correo (' + esc(EMAIL) + ').</p>';
    html += '<form class="mail-form" id="mailForm">' +
      '<label>Tu nombre<input type="text" id="mfName" required placeholder="Ej. Ana Pérez" maxlength="80"></label>' +
      '<label>Tu correo (para responderte)<input type="email" id="mfEmail" required placeholder="tu@correo.com" maxlength="120"></label>' +
      '<label>Motivo<select id="mfTopic">' +
        '<option value="Propuesta laboral">Propuesta laboral</option>' +
        '<option value="Proyecto / Desarrollo web">Proyecto / Desarrollo web</option>' +
        '<option value="Colaboración / Networking">Colaboración / Networking</option>' +
        '<option value="Solo pasar a saludar">Solo pasar a saludar</option>' +
      '</select></label>' +
      '<label>Mensaje<textarea id="mfMsg" required rows="4" placeholder="Cuéntame en qué puedo ayudarte..."></textarea></label>' +
      '<p class="note" id="mfStatus" hidden></p>' +
      '<div class="row">' +
        '<button class="btn primary" type="submit" id="mfSubmit">Enviar mensaje</button>' +
        '<button class="btn" type="button" data-act="copymsg">Copiar mensaje</button>' +
        '<button class="btn" type="button" data-act="close">Cancelar</button>' +
      '</div>' +
    '</form>';
    els.dlgBox.innerHTML = html;
    els.dlgBox.scrollTop = 0;
    app.showOverlay(els.dlg, "#mfName");
  }

  /* ---------- Cat Snack Bowl Dialog ---------- */
  function openBowl(){
    RQ.Audio.open();
    const cur = app.state.followingCat;
    let html = '<p class="eyebrow">Patio · Cuenco de croquetas</p>';
    html += '<h2 id="dlgTitle">Invitar a un gato a explorar</h2>';
    html += '<p class="lede">Dale un snack a Pirulina o a Theo para que te siga caminando por todo el pueblo.</p>';
    html += '<div class="row">' + CATS_DATA.map(c =>
      '<button class="btn' + (cur === c.id ? ' primary' : '') + '" type="button" data-act="follow" data-cat="' + esc(c.id) + '">' +
        (cur === c.id ? '✓ ' + esc(c.name) + ' te sigue (descansar)' : 'Dar snack a ' + esc(c.name)) +
      '</button>'
    ).join("") + '</div>';
    html += '<div class="row"><button class="btn" type="button" data-act="close">Cerrar</button></div>';
    els.dlgBox.innerHTML = html;
    els.dlgBox.scrollTop = 0;
    app.showOverlay(els.dlg);
  }

  /* ---------- Place Dialog ---------- */
  function openPlace(b){
    const isNew = !app.state.visited.has(b.id);
    if(isNew){
      app.state.visited.add(b.id);
      app.save();
      app.updateCount();
      RQ.Audio.discover();
    } else {
      RQ.Audio.open();
    }
    app.checkAchievements();
    app.setHash(b.id);

    const z = ZONES[b.zone];
    let html = "";
    if(b.about){
      html += '<p class="eyebrow">Casa · Perfil</p>';
      html += '<h2 id="dlgTitle">' + esc(b.title) + '</h2>';
      html += '<p class="lede">' + esc(EDUCATION.degree) + ', ' + esc(EDUCATION.school) + ' (' + esc(EDUCATION.year) + ').</p>';
      html += '<p>Cuatro años desarrollando aplicaciones web para el Grupo Sindoni. Especialista de Desarrollo Web desde 2024. ' + esc(EDUCATION.extra) + '</p>';
      html += '<dl class="skills">' + SKILLS.map(s => '<div><dt>' + esc(s[0]) + '</dt><dd>' + esc(s[1]) + '</dd></div>').join("") + '</dl>';
      html += '<div class="contact"><p class="eyebrow">Contacto</p><p><span class="mono-sel" id="mail">' + EMAIL + '</span></p>';
      html += '<p><a href="' + LINKEDIN + '" target="_blank" rel="noopener">LinkedIn · ressi-figuera</a></p></div>';
      html += '<div class="row"><button class="btn primary" type="button" data-act="close">Cerrar</button><button class="btn" type="button" data-act="cv">Ver CV imprimible</button><button class="btn" type="button" data-act="copy">Copiar correo</button></div>';
    } else {
      html += '<p class="eyebrow">' + esc(z.name) + (b.role ? ' · ' + esc(b.role) : '') + '</p>';
      html += '<h2 id="dlgTitle">' + esc(b.title) + '</h2>';
      if(b.status) html += '<div class="row"><span class="status ' + b.status + '">' + STATUS[b.status] + '</span></div>';
      if(b.img) html += '<figure class="shot"><img src="' + b.img + '" alt="' + esc(b.caption) + '" width="1200" height="540" data-zoom="1" data-cap="' + esc(b.caption) + '" title="Clic para ampliar"><figcaption>' + esc(b.caption) + ' <span class="zoom-hint">(clic para ampliar)</span></figcaption></figure>';
      html += '<p class="lede">' + esc(b.summary) + '</p>';
      html += '<ul class="points">' + b.points.map(p => '<li><span>' + esc(p) + '</span></li>').join("") + '</ul>';
      if(b.stack && b.stack.length) html += '<ul class="stack" aria-label="Tecnologías">' + b.stack.map(s => '<li>' + esc(s) + '</li>').join("") + '</ul>';
      const left = VISITABLE.filter(p => !app.state.visited.has(p.id));
      html += '<div class="row"><button class="btn primary" type="button" data-act="close">Cerrar</button>';
      if(left.length) html += '<button class="btn" type="button" data-act="next">Ir al siguiente sin explorar</button>';
      html += '<button class="btn" type="button" data-act="link" data-hash="' + esc(b.id) + '">Copiar enlace</button>';
      html += '</div>';
      if(!left.length) html += '<p class="note">Exploraste los ' + VISITABLE.length + ' lugares del pueblo.</p>';
    }
    els.dlgBox.innerHTML = html;
    els.dlgBox.scrollTop = 0;
    app.showOverlay(els.dlg);
  }

  els.dlgBox.addEventListener("click", e => {
    const img = e.target.closest("img[data-zoom]");
    if(img){ openLightbox(img.src, img.dataset.cap || img.alt); return; }

    const skBtn = e.target.closest("button[data-skin]");
    if(skBtn){
      app.setSkin(skBtn.dataset.skin);
      openBoard();
      return;
    }
    const wBtn = e.target.closest("button[data-weather]");
    if(wBtn){
      app.setWeather(app.state.weather === "rain" ? "clear" : "rain");
      openBoard();
      return;
    }

    const btn = e.target.closest("button[data-act]");
    if(!btn) return;
    const act = btn.dataset.act;
    if(act === "close") app.hideOverlay(els.dlg);
    else if(act === "cv"){ els.dlg.hidden = true; openCV(); }
    else if(act === "mailbox"){ openMailbox(); }
    else if(act === "open-cerberus"){
      const cerb = PLACES.find(p => p.id === "cerberus");
      if(cerb) openPlace(cerb);
    }
    else if(act === "follow"){
      const cid = btn.dataset.cat;
      const next = app.state.followingCat === cid ? null : cid;
      app.setFollowingCat(next);
      app.hideOverlay(els.dlg);
    } else if(act === "copymsg"){
      const name = (document.getElementById("mfName")?.value || "").trim();
      const topic = (document.getElementById("mfTopic")?.value || "Contacto").trim();
      const msg = (document.getElementById("mfMsg")?.value || "").trim();
      const body = "Para: " + EMAIL + "\nAsunto: [Ressi Quest] " + topic + (name ? " · " + name : "") + "\n\n" + (msg || "¡Hola Ressi! Vi tu portafolio Ressi Quest y me gustaría conversar contigo.");
      copyText(body, btn, "Mensaje copiado");
      RQ.World.spawnPaperPlane(36*16 + 8, 16*16);
      RQ.Audio.paper();
    } else if(act === "next"){
      app.hideOverlay(els.dlg);
      const left = VISITABLE.filter(p => !app.state.visited.has(p.id));
      if(left.length){
        const dist = p => Math.hypot(doorOf(p).x - app.state.player.x, doorOf(p).y - app.state.player.y);
        left.sort((a, b) => dist(a) - dist(b));
        const dest = left[0];
        app.walkTo(doorOf(dest), dest);
      }
    } else if(act === "copy"){
      copyText(EMAIL, btn, "Correo copiado", document.getElementById("mail"));
    } else if(act === "link"){
      const url = location.href.split("#")[0] + "#" + btn.dataset.hash;
      copyText(url, btn, "Enlace copiado");
    }
  });

  els.dlgBox.addEventListener("submit", e => {
    const form = e.target.closest("#mailForm");
    if(!form) return;
    e.preventDefault();
    const name = (document.getElementById("mfName")?.value || "").trim();
    const fromEmail = (document.getElementById("mfEmail")?.value || "").trim();
    const topic = (document.getElementById("mfTopic")?.value || "Contacto").trim();
    const msg = (document.getElementById("mfMsg")?.value || "").trim();
    const subject = "[Ressi Quest] " + topic + (name ? " · " + name : "");
    const body = (msg || "¡Hola Ressi! Vi tu portafolio Ressi Quest y me gustaría conversar contigo.") +
      (name ? "\n\n— " + name + (fromEmail ? " (" + fromEmail + ")" : "") : "");

    const openMailto = () => {
      RQ.World.spawnPaperPlane(36*16 + 8, 16*16);
      RQ.Audio.paper();
      app.hideOverlay(els.dlg);
      showNotice(ICONS.star.replace("px-ico","px-ico lg"), "Buzón de Ressi", "Avión de papel enviado", "Se abrió tu cliente de correo con el mensaje listo.", 3800);
      window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    };

    if(location.protocol === "file:"){
      openMailto();
      return;
    }

    const submitBtn = document.getElementById("mfSubmit");
    const statusEl = document.getElementById("mfStatus");
    if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = "Enviando..."; }
    if(statusEl){ statusEl.hidden = false; statusEl.textContent = "Despegando sobre hacia el correo de Ressi..."; }

    fetch("https://formsubmit.co/ajax/" + encodeURIComponent(EMAIL), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        name: name || "Visitante de Ressi Quest",
        email: fromEmail || undefined,
        _replyto: fromEmail || undefined,
        _subject: subject,
        motivo: topic,
        mensaje: msg,
        _template: "table"
      })
    }).then(r => {
      if(!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(() => {
      RQ.World.spawnPaperPlane(36*16 + 8, 16*16);
      RQ.Audio.paper();
      app.hideOverlay(els.dlg);
      showNotice(ICONS.star.replace("px-ico","px-ico lg"), "Buzón de Ressi", "¡Mensaje enviado!", "Llegará directo al correo de Ressi. ¡Gracias por escribir!", 4400);
    }).catch(() => {
      openMailto();
    });
  });

  /* ---------- Projects List with Filters ---------- */
  function renderFilters(){
    const techPills = ['<button class="chip' + (activeTech === "all" ? " active" : "") + '" type="button" data-tech="all">Todas</button>']
      .concat(FILTER_TECHS.map(t => '<button class="chip' + (activeTech === t ? " active" : "") + '" type="button" data-tech="' + esc(t) + '">' + esc(t) + '</button>'))
      .join("");

    const statusKeys = Object.keys(STATUS);
    const statusPills = ['<button class="chip' + (activeStatus === "all" ? " active" : "") + '" type="button" data-status="all">Todos</button>']
      .concat(statusKeys.map(k => '<button class="chip st-' + k + (activeStatus === k ? " active" : "") + '" type="button" data-status="' + k + '">' + esc(STATUS[k]) + '</button>'))
      .join("");

    els.listFilters.innerHTML =
      '<div class="filter-row"><span class="filter-lbl">Stack</span><div class="chips">' + techPills + '</div></div>' +
      '<div class="filter-row"><span class="filter-lbl">Estado</span><div class="chips">' + statusPills + '</div></div>';
  }

  function renderListGroups(){
    const filtered = VISITABLE.filter(p => {
      if(activeTech !== "all"){
        const tags = (p.tags || []).concat(p.stack || []);
        const hit = tags.some(t => t.toLowerCase().includes(activeTech.toLowerCase()));
        if(!hit) return false;
      }
      if(activeStatus !== "all"){
        if(p.status !== activeStatus) return false;
      }
      return true;
    });

    els.listMeta.textContent = "Mostrando " + filtered.length + " de " + VISITABLE.length + " lugares";

    if(!filtered.length){
      els.groups.innerHTML = '<p class="note">Ningún proyecto coincide con esa combinación de filtros.</p>';
      return;
    }

    const groups = {};
    filtered.forEach(p => {
      const k = zoneKey(p.zone);
      (groups[k] = groups[k] || []).push(p);
    });

    els.groups.innerHTML = ZONE_ORDER.filter(k => groups[k]).map(zk =>
      '<div class="group"><h3>' + esc(ZONES[zk].name) + '</h3><ul>' +
      groups[zk].map(p => {
        const stBadge = p.status ? '<span class="mini-st ' + p.status + '">' + esc(STATUS[p.status]) + '</span>' : '<span class="mini-st done">Perfil</span>';
        const tags = (p.stack && p.stack.length) ? '<span class="pick-tags">' + p.stack.slice(0, 3).map(s => '<span>' + esc(s) + '</span>').join("") + '</span>' : '';
        return '<li><button class="pick" type="button" data-id="' + p.id + '">' +
          '<span class="pick-main"><span class="pick-title">' + esc(p.title) + '</span>' + tags + '</span>' +
          '<span class="pick-right">' + stBadge + (app.state.visited.has(p.id) ? '<span class="seen">VISTO</span>' : '') + '</span>' +
        '</button></li>';
      }).join("") +
      '</ul></div>'
    ).join("");
  }

  function openList(){
    RQ.Audio.open();
    renderFilters();
    renderListGroups();
    app.showOverlay(els.list, ".pick");
  }

  els.listFilters.addEventListener("click", e => {
    const t = e.target.closest("button[data-tech]");
    if(t){ activeTech = t.dataset.tech; renderFilters(); renderListGroups(); RQ.Audio.key(); return; }
    const s = e.target.closest("button[data-status]");
    if(s){ activeStatus = s.dataset.status; renderFilters(); renderListGroups(); RQ.Audio.key(); }
  });

  els.groups.addEventListener("click", e => {
    const b = e.target.closest(".pick");
    if(!b) return;
    const p = PLACES.find(x => x.id === b.dataset.id);
    els.list.hidden = true;
    app.teleport(p);
    openPlace(p);
  });

  /* ---------- CV / Perfil Ejecutivo + Hoja Imprimible ---------- */
  function buildPrintCV(){
    const featured = VISITABLE.filter(p => !p.about && p.status !== "build");
    const building = VISITABLE.filter(p => p.status === "build");
    els.printCV.innerHTML =
      '<header class="pcv-head">' +
        '<div><h1>Ressi Figuera</h1><p class="pcv-role">Ingeniera de Sistemas · Especialista de Desarrollo Web</p></div>' +
        '<div class="pcv-contact"><span>' + esc(EMAIL) + '</span><span>linkedin.com/in/ressi-figuera-534401317</span><span>Venezuela</span></div>' +
      '</header>' +
      '<section class="pcv-sec"><h2>Perfil Profesional</h2><p>Ingeniera de Sistemas con más de 4 años de experiencia diseñando y operando aplicaciones web empresariales, APIs REST, integraciones con SAP OData, automatización con IA generativa, observabilidad en Kubernetes (AKS) y análisis de ciberseguridad (OSINT, IoC y respuesta a incidentes).</p></section>' +
      '<section class="pcv-sec"><h2>Experiencia</h2>' +
        EXPERIENCE.map(ex =>
          '<article class="pcv-job"><div class="pcv-job-h"><strong>' + esc(ex.role) + '</strong> — ' + esc(ex.company) + '<span>' + esc(ex.period) + '</span></div>' +
          '<ul>' + ex.bullets.map(b => '<li>' + esc(b) + '</li>').join("") + '</ul></article>'
        ).join("") +
      '</section>' +
      '<section class="pcv-sec"><h2>Proyectos Destacados</h2><div class="pcv-grid">' +
        featured.map(p =>
          '<div class="pcv-proj"><strong>' + esc(p.title) + '</strong> <small>(' + esc(STATUS[p.status]) + ')</small><p>' + esc(p.summary) + '</p>' +
          (p.stack.length ? '<small class="pcv-stack">' + esc(p.stack.join(" · ")) + '</small>' : '') + '</div>'
        ).join("") +
      '</div></section>' +
      '<section class="pcv-sec"><h2>En Construcción</h2><p>' +
        building.map(p => '<strong>' + esc(p.title) + ':</strong> ' + esc(p.summary)).join(" · ") +
      '</p></section>' +
      '<section class="pcv-sec"><h2>Stack Técnico</h2><dl class="pcv-skills">' +
        SKILLS.map(s => '<div><dt>' + esc(s[0]) + ':</dt><dd>' + esc(s[1]) + '</dd></div>').join("") +
      '</dl></section>' +
      '<section class="pcv-sec"><h2>Educación</h2><p><strong>' + esc(EDUCATION.degree) + '</strong> — ' + esc(EDUCATION.school) + ' (' + esc(EDUCATION.year) + '). ' + esc(EDUCATION.extra) + '</p></section>';
  }

  function openCV(){
    RQ.Audio.open();
    app.setHash("cv");
    let html = '<p class="eyebrow">Resumen ejecutivo · Currículum</p>';
    html += '<h2 id="cvTitle">Ressi Figuera</h2>';
    html += '<p class="lede">Ingeniera de Sistemas · Especialista de Desarrollo Web (4+ años en Grupo Sindoni)</p>';
    html += '<div class="row"><button class="btn primary" type="button" data-cv="print">Imprimir / Guardar PDF</button><button class="btn" type="button" data-cv="copy">Copiar correo</button><a class="btn" href="' + LINKEDIN + '" target="_blank" rel="noopener">LinkedIn ↗</a></div>';

    html += '<div class="cv-block"><h3>Experiencia</h3>' +
      EXPERIENCE.map(ex =>
        '<article class="cv-item"><div class="cv-item-h"><strong>' + esc(ex.role) + '</strong><span class="cv-period">' + esc(ex.company) + ' · ' + esc(ex.period) + '</span></div>' +
        '<ul class="points">' + ex.bullets.map(b => '<li><span>' + esc(b) + '</span></li>').join("") + '</ul></article>'
      ).join("") + '</div>';

    html += '<div class="cv-block"><h3>Stack técnico</h3><dl class="skills">' +
      SKILLS.map(s => '<div><dt>' + esc(s[0]) + '</dt><dd>' + esc(s[1]) + '</dd></div>').join("") + '</dl></div>';

    html += '<div class="cv-block"><h3>Educación</h3><p><strong>' + esc(EDUCATION.degree) + '</strong> · ' + esc(EDUCATION.school) + ' (' + esc(EDUCATION.year) + ')</p><p class="note">' + esc(EDUCATION.extra) + '</p></div>';

    html += '<div class="cv-block"><h3>Contacto</h3><p><span class="mono-sel" id="cvMail">' + EMAIL + '</span></p></div>';
    html += '<div class="row"><button class="btn" type="button" data-cv="close">Volver al pueblo</button></div>';

    els.cvBox.innerHTML = html;
    els.cvBox.scrollTop = 0;
    app.showOverlay(els.cv);
  }

  els.cvBox.addEventListener("click", e => {
    const btn = e.target.closest("button[data-cv]");
    if(!btn) return;
    const act = btn.dataset.cv;
    if(act === "close") app.hideOverlay(els.cv);
    else if(act === "print") window.print();
    else if(act === "copy") copyText(EMAIL, btn, "Correo copiado", document.getElementById("cvMail"));
  });

  /* ---------- Achievements Modal ---------- */
  function openAchievements(){
    RQ.Audio.open();
    const totalSteps = VISITABLE.length + CATS_DATA.length;
    const doneSteps = app.state.visited.size + app.state.petted.size;
    const pct = Math.round((doneSteps / totalSteps) * 100);
    const unlocked = app.state.achievements.size;

    let html = '<p class="eyebrow">Progreso del pueblo</p>';
    html += '<h2 id="achTitle">Logros (' + unlocked + '/' + ACHIEVEMENTS.length + ')</h2>';
    html += '<div class="prog-wrap"><div class="prog-bar"><div class="prog-fill" style="width:' + pct + '%"></div></div><span class="prog-txt">' + pct + '% explorado (' + app.state.visited.size + '/' + VISITABLE.length + ' lugares · ' + app.state.petted.size + '/' + CATS_DATA.length + ' gatos)</span></div>';
    html += '<ul class="ach-list">' + ACHIEVEMENTS.map(a => {
      const ok = app.state.achievements.has(a.id);
      return '<li class="ach-item' + (ok ? ' unlocked' : '') + '">' +
        '<span class="ach-ico" aria-hidden="true">' + a.icon + '</span>' +
        '<div><strong>' + esc(a.title) + '</strong><p>' + esc(a.desc) + '</p></div>' +
        '<span class="ach-st">' + (ok ? 'OK' : '---') + '</span>' +
      '</li>';
    }).join("") + '</ul>';

    html += rewardsHtml();
    html += '<div class="row"><button class="btn primary" type="button" data-ach="close">Volver al pueblo</button>';
    if(app.state.achievements.has("town-legend")){
      html += '<button class="btn" type="button" data-ach="celebrate">Celebrar 100%</button>';
    }
    html += '</div>';
    els.achBox.innerHTML = html;
    els.achBox.scrollTop = 0;
    app.showOverlay(els.ach);
  }

  els.achBox.addEventListener("click", e => {
    const skBtn = e.target.closest("button[data-skin]");
    if(skBtn){ app.setSkin(skBtn.dataset.skin); openAchievements(); return; }
    const wBtn = e.target.closest("button[data-weather]");
    if(wBtn){ app.setWeather(app.state.weather === "rain" ? "clear" : "rain"); openAchievements(); return; }
    const btn = e.target.closest("button[data-ach]");
    if(!btn) return;
    if(btn.dataset.ach === "close") app.hideOverlay(els.ach);
    else if(btn.dataset.ach === "celebrate"){
      app.hideOverlay(els.ach);
      RQ.World.triggerCelebration(app.state.player);
    }
  });

  els.btnLbClose.addEventListener("click", closeLightbox);
  els.lightbox.addEventListener("pointerdown", e => { if(e.target === els.lightbox) closeLightbox(); });

  buildPrintCV();

  return {
    openPlace, openCat, openCerberus, openBoard, openMailbox, openBowl,
    openList, openCV, openAchievements,
    openLightbox, closeLightbox, showToast, showNotice
  };
}

RQ.createUI = createUI;
})(window.RQ = window.RQ || {});
