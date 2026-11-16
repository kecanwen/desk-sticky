(() => {
  const STORAGE_KEY = "desk-sticky-notes-v1";
  const NOTE_SIZE = 220;
  const MAX_RED = 3;
  const MAX_OVERLAP = 0.45;
  const COLORS = ["red", "orange", "green"];
  const COLOR_LABEL = { red: "红", orange: "橙", green: "绿" };

  const wall = document.getElementById("wall");
  const drawer = document.getElementById("drawer");
  const drawerToggle = document.getElementById("drawerToggle");
  const drawerList = document.getElementById("drawerList");
  const newPad = document.getElementById("newPad");
  const demoteModal = document.getElementById("demoteModal");
  const demoteList = document.getElementById("demoteList");
  const demoteCancel = document.getElementById("demoteCancel");
  const toastEl = document.getElementById("toast");

  /** @type {Array<any>} */
  let notes = [];
  let topZ = 10;
  let pendingColor = null; // { id, color }
  let toastTimer = 0;

  function uid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : { notes: [] };
      notes = Array.isArray(data.notes) ? data.notes : [];
    } catch {
      notes = [];
    }
    notes.forEach((n) => {
      if (!COLORS.includes(n.color)) n.color = "orange";
      if (n.status !== "drawer") n.status = "wall";
      n.z = Number(n.z) || 10;
      n.rotation = Number.isFinite(n.rotation) ? n.rotation : rand(-5, 5);
      topZ = Math.max(topZ, n.z || 0);
    });
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes }));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function wallBounds() {
    const r = wall.getBoundingClientRect();
    return { width: Math.max(NOTE_SIZE, r.width), height: Math.max(NOTE_SIZE, r.height) };
  }

  function clampNote(n, bounds) {
    const maxX = Math.max(0, bounds.width - NOTE_SIZE);
    const maxY = Math.max(0, bounds.height - NOTE_SIZE);
    n.x = Math.min(maxX, Math.max(0, n.x));
    n.y = Math.min(maxY, Math.max(0, n.y));
  }

  function overlapRatio(a, b) {
    const w = Math.max(0, Math.min(a.x + NOTE_SIZE, b.x + NOTE_SIZE) - Math.max(a.x, b.x));
    const h = Math.max(0, Math.min(a.y + NOTE_SIZE, b.y + NOTE_SIZE) - Math.max(a.y, b.y));
    return (w * h) / (NOTE_SIZE * NOTE_SIZE);
  }

  function unspread() {
    const bounds = wallBounds();
    const wallNotes = notes.filter((n) => n.status === "wall");
    wallNotes.forEach((n) => clampNote(n, bounds));
    for (let iter = 0; iter < 50; iter += 1) {
      let moved = false;
      for (let i = 0; i < wallNotes.length; i += 1) {
        for (let j = i + 1; j < wallNotes.length; j += 1) {
          const a = wallNotes[i];
          const b = wallNotes[j];
          if (overlapRatio(a, b) <= MAX_OVERLAP) continue;
          const dx = b.x + NOTE_SIZE / 2 - (a.x + NOTE_SIZE / 2) || 12;
          const dy = b.y + NOTE_SIZE / 2 - (a.y + NOTE_SIZE / 2) || 8;
          const len = Math.hypot(dx, dy) || 1;
          b.x += (dx / len) * 18;
          b.y += (dy / len) * 18;
          clampNote(b, bounds);
          moved = true;
        }
      }
      if (!moved) break;
    }
  }

  function findFreeSpot() {
    const bounds = wallBounds();
    const wallNotes = notes.filter((n) => n.status === "wall");
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const x = rand(12, Math.max(12, bounds.width - NOTE_SIZE - 12));
      const y = rand(12, Math.max(12, bounds.height - NOTE_SIZE - 12));
      const probe = { x, y };
      if (wallNotes.every((n) => overlapRatio(n, probe) <= 0.2)) return { x, y };
    }
    return {
      x: rand(20, Math.max(20, bounds.width - NOTE_SIZE - 20)),
      y: rand(20, Math.max(20, bounds.height - NOTE_SIZE - 20)),
    };
  }

  function redNotes() {
    return notes.filter((n) => n.status === "wall" && n.color === "red");
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.remove("hidden");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.add("hidden"), 2200);
  }

  function bringToFront(note) {
    topZ += 1;
    note.z = topZ;
  }

  function canPaintRed(note) {
    if (note.color === "red") return true;
    return redNotes().length < MAX_RED;
  }

  function setColor(note, color, { skipDemote = false } = {}) {
    if (!COLORS.includes(color) || note.color === color) return;
    if (color === "red" && !canPaintRed(note)) {
      if (skipDemote) return;
      pendingColor = { id: note.id, color };
      openDemoteModal();
      return;
    }
    note.color = color;
    note.updatedAt = Date.now();
    save();
    render();
  }

  function openDemoteModal() {
    demoteList.replaceChildren();
    redNotes().forEach((n) => {
      const row = document.createElement("div");
      row.className = "demote-item";
      const title = document.createElement("span");
      title.textContent = n.text?.trim() || "（还没写字的红贴）";
      const toOrange = document.createElement("button");
      toOrange.type = "button";
      toOrange.className = "btn small";
      toOrange.textContent = "改成橙";
      toOrange.addEventListener("click", () => finishDemote(n, "orange"));
      const toGreen = document.createElement("button");
      toGreen.type = "button";
      toGreen.className = "btn small";
      toGreen.style.background = "#5e8a4e";
      toGreen.textContent = "改成绿";
      toGreen.addEventListener("click", () => finishDemote(n, "green"));
      row.append(title, toOrange, toGreen);
      demoteList.append(row);
    });
    demoteModal.classList.remove("hidden");
  }

  function closeDemoteModal() {
    demoteModal.classList.add("hidden");
    pendingColor = null;
  }

  function finishDemote(redNote, nextColor) {
    const pending = pendingColor;
    redNote.color = nextColor;
    redNote.updatedAt = Date.now();
    if (pending) {
      const target = notes.find((n) => n.id === pending.id);
      if (target) {
        target.color = pending.color;
        pendingColor = null;
        demoteModal.classList.add("hidden");
        if (target.status === "drawer") {
          stickBack(target);
          return;
        }
      }
    }
    pendingColor = null;
    demoteModal.classList.add("hidden");
    save();
    render();
  }

  function addNote() {
    const spot = findFreeSpot();
    const note = {
      id: uid(),
      text: "",
      detail: "",
      color: "orange",
      x: spot.x,
      y: spot.y,
      rotation: rand(-6, 6),
      z: ++topZ,
      status: "wall",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      completedAt: null,
    };
    notes.push(note);
    unspread();
    save();
    render();
    const el = wall.querySelector(`[data-id="${note.id}"] .note-text`);
    if (el) el.focus();
  }

  function peelOff(note) {
    note.status = "drawer";
    note.completedAt = Date.now();
    note.updatedAt = Date.now();
    save();
    render();
    drawer.classList.add("open");
    drawerToggle.setAttribute("aria-expanded", "true");
  }

  function stickBack(note) {
    const spot = findFreeSpot();
    note.status = "wall";
    note.x = Number.isFinite(note.x) ? note.x : spot.x;
    note.y = Number.isFinite(note.y) ? note.y : spot.y;
    note.completedAt = null;
    note.updatedAt = Date.now();
    bringToFront(note);
    unspread();
    save();
    render();
  }

  function bindDrag(el, note) {
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let origX = 0;
    let origY = 0;
    let pointerId = 0;

    const onMove = (event) => {
      if (!dragging || event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.hypot(dx, dy) > 3) moved = true;
      const bounds = wallBounds();
      note.x = origX + dx;
      note.y = origY + dy;
      clampNote(note, bounds);
      el.style.left = `${note.x}px`;
      el.style.top = `${note.y}px`;
      const overDrawer = event.clientX > window.innerWidth - (drawer.classList.contains("open") ? 340 : 72);
      drawer.classList.toggle("drop-ready", overDrawer);
    };

    const onUp = (event) => {
      if (!dragging || event.pointerId !== pointerId) return;
      dragging = false;
      el.classList.remove("dragging");
      try { el.releasePointerCapture(pointerId); } catch {}
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      const overDrawer = event.clientX > window.innerWidth - (drawer.classList.contains("open") ? 340 : 72);
      drawer.classList.remove("drop-ready");
      if (moved && overDrawer) {
        peelOff(note);
        return;
      }
      if (moved) {
        unspread();
        save();
        render();
      }
    };

    el.addEventListener("pointerdown", (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      if (event.target.closest("textarea, button")) return;
      dragging = true;
      moved = false;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      origX = note.x;
      origY = note.y;
      bringToFront(note);
      el.classList.add("dragging");
      el.style.zIndex = String(note.z);
      el.setPointerCapture(pointerId);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    });
  }

  function renderNote(note) {
    const el = document.createElement("article");
    el.className = `note ${note.color}`;
    el.dataset.id = note.id;
    el.style.left = `${note.x}px`;
    el.style.top = `${note.y}px`;
    el.style.zIndex = String(note.z || 10);
    el.style.transform = `rotate(${note.rotation || 0}deg)`;

    const inner = document.createElement("div");
    inner.className = "note-inner";

    const front = document.createElement("div");
    front.className = "face front";
    const frontText = document.createElement("textarea");
    frontText.className = "note-text";
    frontText.maxLength = 80;
    frontText.placeholder = "写下一句话";
    frontText.value = note.text || "";
    frontText.addEventListener("pointerdown", (e) => e.stopPropagation());
    frontText.addEventListener("input", () => {
      note.text = frontText.value;
      note.updatedAt = Date.now();
      save();
    });
    front.append(frontText, makeTools(note, "front"));

    const back = document.createElement("div");
    back.className = "face back";
    const detail = document.createElement("textarea");
    detail.className = "note-detail";
    detail.placeholder = "写下细节";
    detail.value = note.detail || "";
    detail.addEventListener("pointerdown", (e) => e.stopPropagation());
    detail.addEventListener("input", () => {
      note.detail = detail.value;
      note.updatedAt = Date.now();
      save();
    });
    back.append(detail, makeTools(note, "back"));

    inner.append(front, back);
    el.append(inner);
    bindDrag(el, note);
    return el;
  }

  function makeTools(note, side) {
    const tools = document.createElement("div");
    tools.className = "note-tools";
    tools.addEventListener("pointerdown", (e) => e.stopPropagation());

    COLORS.forEach((color) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `swatch ${color}${note.color === color ? " active" : ""}`;
      btn.title = COLOR_LABEL[color];
      btn.setAttribute("aria-label", `改成${COLOR_LABEL[color]}色`);
      btn.addEventListener("click", () => setColor(note, color));
      tools.append(btn);
    });

    const flip = document.createElement("button");
    flip.type = "button";
    flip.className = "tool-btn";
    flip.textContent = side === "front" ? "翻面" : "正面";
    flip.addEventListener("click", () => {
      const card = wall.querySelector(`[data-id="${note.id}"]`);
      if (card) {
        const on = card.classList.toggle("flipped");
        if (on) {
          const area = card.querySelector(".note-detail");
          if (area) area.focus();
        }
      }
    });

    const peel = document.createElement("button");
    peel.type = "button";
    peel.className = "tool-btn";
    peel.textContent = "揭下";
    peel.addEventListener("click", () => peelOff(note));

    tools.append(flip, peel);
    return tools;
  }

  function renderDrawer() {
    const done = notes
      .filter((n) => n.status === "drawer")
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    drawerList.replaceChildren();
    if (!done.length) {
      const empty = document.createElement("p");
      empty.className = "drawer-empty";
      empty.textContent = "抽屉还是空的。把墙上的贴揭下来，就会落到这里。";
      drawerList.append(empty);
      return;
    }
    done.forEach((note) => {
      const card = document.createElement("div");
      card.className = "drawer-card";
      const dot = document.createElement("i");
      dot.className = `dot ${note.color}`;
      const ttl = document.createElement("div");
      ttl.className = `ttl${note.text?.trim() ? "" : " empty"}`;
      ttl.textContent = note.text?.trim() || "（空白便利贴）";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "restore-btn";
      btn.textContent = "贴回墙上";
      btn.addEventListener("click", () => {
        if (note.color === "red" && !canPaintRed(note)) {
          pendingColor = { id: note.id, color: "red" };
          // stick back first as orange if red is full? Better ask to demote, keep in drawer until resolved.
          toast("红贴已经有 3 张了，先把墙上的一张改成橙或绿，再贴回来。");
          openDemoteModal();
          // After demote, pending would paint this note red — but it's still in drawer.
          // Simpler: stick back as-is only if allowed; otherwise prompt to change this note's color.
          return;
        }
        stickBack(note);
      });
      card.append(dot, ttl, btn);
      drawerList.append(card);
    });
  }

  function render() {
    const flipped = new Set(
      [...wall.querySelectorAll(".note.flipped")].map((n) => n.dataset.id)
    );
    wall.replaceChildren();
    notes
      .filter((n) => n.status === "wall")
      .forEach((note) => {
        const el = renderNote(note);
        if (flipped.has(note.id)) el.classList.add("flipped");
        wall.append(el);
      });
    renderDrawer();
  }

  newPad.addEventListener("click", addNote);
  drawerToggle.addEventListener("click", () => {
    const open = drawer.classList.toggle("open");
    drawerToggle.setAttribute("aria-expanded", String(open));
  });
  demoteCancel.addEventListener("click", closeDemoteModal);
  demoteModal.addEventListener("click", (event) => {
    if (event.target === demoteModal) closeDemoteModal();
  });
  window.addEventListener("resize", () => {
    unspread();
    save();
    render();
  });

  load();
  unspread();
  render();
})();
