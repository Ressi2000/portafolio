(function(RQ){
"use strict";

const D = RQ.DATA;
const { VISITABLE, STATUS, CATS_DATA, CERBERUS_DATA, SKILLS, EMAIL, LINKEDIN, ACHIEVEMENTS, BUGS_DATA, AVATAR_SKINS } = D;

function createTerminal(app, els){
  const hist = [];
  let hIdx = 0;
  let booted = false;

  function tPrint(text, cls){
    const d = document.createElement("div");
    if(cls) d.className = cls;
    d.textContent = text;
    els.termOut.appendChild(d);
    els.termOut.scrollTop = els.termOut.scrollHeight;
  }

  function findPlace(arg){
    if(!arg) return null;
    const n = parseInt(arg, 10);
    if(!isNaN(n) && n >= 1 && n <= VISITABLE.length) return VISITABLE[n - 1];
    const a = arg.toLowerCase();
    return VISITABLE.find(p => p.id === a) || VISITABLE.find(p => p.title.toLowerCase().includes(a)) || null;
  }

  const CMDS = {
    help(){
      [
        "help              esta ayuda",
        "whoami            quién soy",
        "neofetch          ficha del sistema y perfil",
        "ls                lista de proyectos",
        "cat <n|id>        detalle de un proyecto",
        "open <n|id>       abre la ficha del proyecto",
        "tp <n|id>         teletransporte a la puerta",
        "nmap              escaneo de servicios del pueblo",
        "obra              lo que estoy construyendo",
        "skills            stack técnico",
        "cv                abre el perfil / CV imprimible",
        "logros            medallas desbloqueadas",
        "gatos / meow      el personal de la casa",
        "follow <gato|off> invita a Pirulina o Theo a seguirte",
        "bugs              progreso de los 3 bugs de QA",
        "skin <estilo>     accesorio del avatar (normal/obra/hacker/corona)",
        "rain              activa o desactiva la lluvia",
        "time [auto|day|sunset|night]  iluminación del pueblo",
        "sound [on|off]    activa o silencia el audio",
        "contacto          cómo escribirme",
        "progreso          lugares explorados",
        "clear / exit      limpia o vuelve al pueblo",
        "Tip: usa Tab para autocompletar comandos y proyectos."
      ].forEach(l => tPrint(l, l.startsWith("Tip:") ? "dim" : ""));
    },
    whoami(){
      tPrint("Ressi Figuera");
      tPrint("Ingeniera de Sistemas · Especialista de Desarrollo Web");
      tPrint("Desarrollo web, integraciones SAP, automatización y ciberseguridad.", "dim");
    },
    neofetch(){
      app.markFlag("hacker");
      const art = [
        "  .-----------.   ressi@quest",
        "  |  ______   |   -----------------------",
        "  | |  __  |  |   OS:      RESSI-OS v5.0 (tty1)",
        "  | | |__| |  |   Rol:     Especialista Dev Web (4+ años)",
        "  | |  _  <   |   Empresa: Grupo Sindoni",
        "  | |_| \\_\\   |   Stack:   Laravel · React · Python · SAP",
        "  |   >_      |   Sec:     OSINT · IoC · Forense",
        "  '-----------'   Mapa:    " + app.state.visited.size + "/" + VISITABLE.length + " lugares · " + app.state.petted.size + "/" + CATS_DATA.length + " gatos",
        "    [===|===]     Logros:  " + app.state.achievements.size + "/" + ACHIEVEMENTS.length + " · Clima: " + (app.state.timeMode === "night" ? "Noche" : app.state.timeMode === "sunset" ? "Atardecer" : "Día") + (app.state.timePref === "auto" ? " (auto)" : "")
      ];
      art.forEach((line, i) => tPrint(line, i === 0 || i === 1 ? "hi" : ""));
    },
    nmap(){
      app.markFlag("hacker");
      tPrint("Starting RessiNmap 5.0 ( https://ressi.quest ) ...", "dim");
      tPrint("PORT       STATE      SERVICE        PROYECTO");
      VISITABLE.filter(p => !p.about).forEach(p => {
        const port = String((p.port || 80) + "/tcp").padEnd(10, " ");
        const st = (p.status === "prod" ? "open" : p.status === "build" ? "filtered" : "open*").padEnd(10, " ");
        const id = p.id.padEnd(14, " ");
        tPrint(port + " " + st + " " + id + " " + p.title + " [" + STATUS[p.status] + "]");
      });
      tPrint("Scan completo: 13 servicios activos, 2 gatos vigilando el firewall.", "dim");
    },
    ls(){
      VISITABLE.forEach((p, i) => {
        const st = p.status ? "[" + STATUS[p.status] + "]" : "[perfil]";
        tPrint(String(i + 1).padStart(2, " ") + "  " + p.id.padEnd(14, " ") + " " + p.title + "  " + st + (app.state.visited.has(p.id) ? "  *" : ""));
      });
      tPrint("* = ya explorado", "dim");
    },
    cat(arg){
      const p = findPlace(arg);
      if(!p){ tPrint("cat: " + (arg || "") + ": no existe. Usa ls.", "dim"); RQ.Audio.error(); return; }
      if(p.about){ CMDS.whoami(); return; }
      tPrint("== " + p.title + " ==  [" + STATUS[p.status] + "]", "hi");
      tPrint(p.summary);
      p.points.forEach(x => tPrint("  > " + x));
      if(p.stack.length) tPrint("stack: " + p.stack.join(", "), "dim");
    },
    open(arg){
      const p = findPlace(arg);
      if(!p){ tPrint("open: " + (arg || "") + ": no existe. Usa ls.", "dim"); RQ.Audio.error(); return; }
      els.term.hidden = true;
      app.teleport(p);
      app.openPlace(p);
    },
    tp(arg){
      const p = findPlace(arg);
      if(!p){ tPrint("tp: destino desconocido. Usa ls.", "dim"); RQ.Audio.error(); return; }
      app.teleport(p);
      tPrint("Teletransporte a " + p.title + "... listo.");
      app.hideOverlay(els.term);
    },
    obra(){
      VISITABLE.filter(p => p.status === "build").forEach(p => tPrint("[en obra] " + p.title + ": " + p.summary));
    },
    skills(){
      SKILLS.forEach(s => tPrint(s[0].padEnd(18, " ") + s[1]));
    },
    gatos(){
      CATS_DATA.forEach(c => tPrint(c.name.padEnd(10, " ") + c.role + ". " + c.desc));
      tPrint("Están en el patio, detrás del garaje.", "dim");
    },
    meow(){
      app.markFlag("hacker");
      const c = CATS_DATA[(Math.random() * CATS_DATA.length) | 0];
      const q = c.quotes[(Math.random() * c.quotes.length) | 0];
      RQ.Audio.cat(c.id);
      tPrint(c.name + " (" + c.role + "): " + q, "hi");
    },
    woof(){
      app.markFlag("hacker");
      const q = CERBERUS_DATA.quotes[(Math.random() * CERBERUS_DATA.quotes.length) | 0];
      RQ.Audio.bark();
      tPrint(CERBERUS_DATA.name + " (" + CERBERUS_DATA.role + "): " + q, "hi");
    },
    follow(arg){
      const a = (arg || "").trim().toLowerCase();
      if(!a || a === "off" || a === "none" || a === "patio"){
        app.setFollowingCat(null);
        tPrint("Tus acompañantes volvieron a sus puestos.");
        return;
      }
      if(a.includes("cerb") || a === "mini" || a === "lobo"){
        app.setFollowingCat(CERBERUS_DATA.id);
        tPrint(CERBERUS_DATA.name + " dejó el perímetro y ahora patrulla contigo.");
        return;
      }
      const c = CATS_DATA.find(x => x.id === a || x.name.toLowerCase().startsWith(a));
      if(!c){ tPrint("follow: elige pirulina, theo, cerberus o off.", "dim"); RQ.Audio.error(); return; }
      app.setFollowingCat(c.id);
      tPrint(c.name + " aceptó el snack y ahora te sigue por el pueblo.");
    },
    bugs(){
      tPrint("Bugs escapados de QA: " + app.state.caughtBugs.size + "/" + BUGS_DATA.length, "hi");
      BUGS_DATA.forEach(b => {
        const ok = app.state.caughtBugs.has(b.id);
        tPrint((ok ? "[ATRAPADO] " : "[SUELTO]   ") + b.name, ok ? "" : "dim");
      });
      if(app.state.caughtBugs.size < BUGS_DATA.length){
        tPrint("Pista: busca destellos verde-menta cerca de Plaza GesRutas, Infraestructura y Zona en Obra.", "dim");
      }
    },
    skin(arg){
      const a = (arg || "").trim().toLowerCase();
      const valid = AVATAR_SKINS.map(s => s.id);
      if(!a || !valid.includes(a)){
        tPrint("Uso: skin <" + valid.join("|") + ">  (actual: " + app.state.skin + ")", "dim");
        return;
      }
      app.setSkin(a);
      tPrint("Estilo del avatar cambiado a: " + a + ".");
    },
    rain(arg){
      const a = (arg || "").trim().toLowerCase();
      let next = app.state.weather === "rain" ? "clear" : "rain";
      if(a === "on" || a === "rain" || a === "lluvia") next = "rain";
      else if(a === "off" || a === "clear" || a === "no") next = "clear";
      app.setWeather(next);
      tPrint("Clima: " + (next === "rain" ? "lluvia relajante activada." : "cielo despejado."));
    },
    logros(){
      ACHIEVEMENTS.forEach(a => {
        const ok = app.state.achievements.has(a.id);
        tPrint((ok ? "[OK] " : "[  ] ") + a.title.padEnd(20, " ") + a.desc, ok ? "hi" : "dim");
      });
      tPrint("Total: " + app.state.achievements.size + "/" + ACHIEVEMENTS.length, "dim");
    },
    time(arg){
      const a = (arg || "").trim().toLowerCase();
      const order = ["auto","day","sunset","night"];
      let next = order[(order.indexOf(app.state.timePref) + 1) % order.length];
      if(a === "auto") next = "auto";
      else if(a === "day" || a === "dia" || a === "día") next = "day";
      else if(a === "sunset" || a === "tarde" || a === "atardecer") next = "sunset";
      else if(a === "night" || a === "noche") next = "night";
      app.setTimeMode(next);
      const label = app.state.timeMode === "night" ? "noche" : app.state.timeMode === "sunset" ? "atardecer" : "día";
      if(next === "auto"){
        const hh = String(new Date().getHours()).padStart(2, "0");
        const mm = String(new Date().getMinutes()).padStart(2, "0");
        tPrint("Modo automático activado (hora local " + hh + ":" + mm + " → " + label + ").");
      } else {
        tPrint("Iluminación fijada en modo " + label + ".");
      }
    },
    sound(arg){
      const a = (arg || "").trim().toLowerCase();
      let next = !RQ.Audio.isEnabled();
      if(a === "on" || a === "1" || a === "si" || a === "sí") next = true;
      else if(a === "off" || a === "0" || a === "no") next = false;
      app.setAudio(next);
      tPrint("Audio chiptune: " + (next ? "ON" : "OFF") + ".");
    },
    cv(){
      els.term.hidden = true;
      app.openCV();
    },
    contacto(){
      tPrint("correo:   " + EMAIL);
      tPrint("linkedin: " + LINKEDIN);
    },
    progreso(){
      tPrint("Explorado " + app.state.visited.size + "/" + VISITABLE.length + " · Gatos " + app.state.petted.size + "/" + CATS_DATA.length + " · Logros " + app.state.achievements.size + "/" + ACHIEVEMENTS.length);
    },
    matrix(){
      app.markFlag("hacker");
      tPrint("Iniciando traza de paquetes en tty1...", "dim");
      const glyphs = "01RESSI#SAP$AKS*OSINT";
      for(let r = 0; r < 5; r++){
        let line = "";
        for(let c = 0; c < 46; c++) line += glyphs[(Math.random() * glyphs.length) | 0];
        tPrint(line, "hi");
      }
      tPrint("Señal estabilizada. Todo bajo control.", "dim");
    },
    fireworks(){
      tPrint("Lanzando fuegos artificiales sobre el pueblo...");
      app.hideOverlay(els.term);
      RQ.World.triggerCelebration(app.state.player);
    },
    clear(){ els.termOut.innerHTML = ""; },
    exit(){ app.hideOverlay(els.term); },
    history(){ hist.forEach((h, i) => tPrint(String(i + 1).padStart(3, " ") + "  " + h)); },
    sudo(){
      app.markFlag("hacker");
      tPrint("ressi no está en el archivo sudoers. Este incidente será reportado a Pirulina (QA).");
    }
  };

  CMDS.contact = CMDS.contacto;
  CMDS.dir = CMDS.ls;
  CMDS.cls = CMDS.clear;
  CMDS.ayuda = CMDS.help;
  CMDS.quit = CMDS.exit;
  CMDS.cats = CMDS.gatos;
  CMDS.achievements = CMDS.logros;
  CMDS.sfx = CMDS.sound;
  CMDS.hora = CMDS.time;
  CMDS.weather = CMDS.rain;
  CMDS.lluvia = CMDS.rain;
  CMDS.guau = CMDS.woof;

  const PRIMARY_CMDS = ["help","whoami","neofetch","ls","cat","open","tp","nmap","obra","skills","cv","logros","gatos","meow","woof","follow","bugs","skin","rain","time","sound","contacto","progreso","matrix","fireworks","history","sudo","clear","exit"];

  function autocomplete(){
    const val = els.termIn.value;
    const parts = val.split(/\s+/);
    if(parts.length <= 1){
      const prefix = parts[0].toLowerCase();
      const matches = PRIMARY_CMDS.filter(c => c.startsWith(prefix));
      if(matches.length === 1){
        els.termIn.value = matches[0] + (["cat","open","tp","time","sound","skin","follow"].includes(matches[0]) ? " " : "");
      } else if(matches.length > 1){
        tPrint("ressi@quest:~$ " + val, "dim");
        tPrint(matches.join("  "), "dim");
      }
    } else {
      const cmd = parts[0].toLowerCase();
      const arg = parts[1].toLowerCase();
      let pool = [];
      if(["cat","open","tp"].includes(cmd)) pool = VISITABLE.map(p => p.id);
      else if(cmd === "time" || cmd === "hora") pool = ["auto","day","sunset","night"];
      else if(cmd === "sound" || cmd === "sfx") pool = ["on","off"];
      else if(cmd === "skin") pool = AVATAR_SKINS.map(s => s.id);
      else if(cmd === "follow") pool = ["pirulina","theo","cerberus","off"];
      else if(cmd === "rain" || cmd === "weather" || cmd === "lluvia") pool = ["on","off"];
      const matches = pool.filter(x => x.startsWith(arg));
      if(matches.length === 1){
        els.termIn.value = cmd + " " + matches[0];
      } else if(matches.length > 1){
        tPrint("ressi@quest:~$ " + val, "dim");
        tPrint(matches.join("  "), "dim");
      }
    }
  }

  function open(){
    if(!booted){
      booted = true;
      tPrint("RESSI-OS v5.0 (tty1)", "hi");
      tPrint("Último acceso: Grupo Sindoni · 4+ años de servicio.", "dim");
      tPrint("Escribe help o neofetch. Usa Tab para autocompletar.");
      tPrint(" ");
    }
    app.showOverlay(els.term, "#termIn");
    app.setHash("terminal");
  }

  els.termForm.addEventListener("submit", e => {
    e.preventDefault();
    const raw = els.termIn.value.trim();
    els.termIn.value = "";
    tPrint("ressi@quest:~$ " + raw, "dim");
    if(!raw) return;
    hist.push(raw);
    hIdx = hist.length;
    const [cmd, ...rest] = raw.split(/\s+/);
    const fn = CMDS[cmd.toLowerCase()];
    if(fn){
      RQ.Audio.key();
      fn(rest.join(" "));
    } else {
      RQ.Audio.error();
      tPrint(cmd + ": comando no encontrado. Escribe help.");
    }
  });

  els.termIn.addEventListener("keydown", e => {
    if(e.key === "ArrowUp"){
      if(hIdx > 0){ hIdx--; els.termIn.value = hist[hIdx]; }
      e.preventDefault();
    } else if(e.key === "ArrowDown"){
      if(hIdx < hist.length){ hIdx++; els.termIn.value = hist[hIdx] || ""; }
      e.preventDefault();
    } else if(e.key === "Tab"){
      e.preventDefault();
      autocomplete();
    } else if(e.key.length === 1){
      RQ.Audio.key();
    }
  });

  return { open, tPrint };
}

RQ.createTerminal = createTerminal;
})(window.RQ = window.RQ || {});
