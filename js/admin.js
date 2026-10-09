/* ============================================================
   Idle Dice - ADMIN PANEL
   ------------------------------------------------------------
   Press the ` key (backtick) to open the admin panel.
   (The apostrophe ' key works too as a fallback.)
   Password: PASSCODE

   Controls the live game through its own engine API:
   - Luts.Upgrades  : currencies (Points, Chips, ...) + upgrades
   - Luts.Value     : game values / multipliers
   - Luts.Lock      : feature locks (autoRoll, ...)
   - Luts.Store     : save data (localStorage, prefix "Idle dice_")
   ============================================================ */
(function () {
    'use strict';
    if (window.__idleDiceAdmin) return;
    window.__idleDiceAdmin = true;

    var PASSWORD = 'PASSCODE';
    var unlocked = false;
    var open = false;
    var root = null;       // panel container
    var gateEl = null;      // password prompt

    /* ---------- helpers ---------- */
    function fmt(d) {
        try {
            if (d === null || d === undefined) return '0';
            if (typeof d === 'boolean') return d ? 'true' : 'false';
            if (typeof d === 'object' && d.toExponential) {
                var s = d.toString();
                if (s.length > 24) return d.toExponential(4);
                return s;
            }
            var s2 = String(d);
            if (s2.length > 24) return Number(d).toExponential(4);
            return s2;
        } catch (e) { return String(d); }
    }
    function dec(str) {
        try { return window.Decimal ? new Decimal(String(str)) : Number(str); }
        catch (e) { return Number(str); }
    }
    function esc(s) {
        var AMP = '&' + 'amp;', LT = '&' + 'lt;', GT = '&' + 'gt;', QU = '&' + 'quot;';
        return String(s).replace(/&/g, AMP).replace(/</g, LT).replace(/>/g, GT).replace(/"/g, QU);
    }
    function el(tag, cls, html) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html !== undefined) e.innerHTML = html;
        return e;
    }

    /* ---------- hotkey ---------- */
    document.addEventListener('keydown', function (e) {
        if (e.repeat) return;
        var t = e.target;
        var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
        if (typing) {
            if (e.key === 'Escape') t.blur();
            return;
        }
        var isToggleKey = (e.key === '`') || (e.key === "'") ||
                          (e.code === 'Backquote') || (e.code === 'Quote');
        if (isToggleKey) {
            e.preventDefault();
            toggle();
            return;
        }
        if (e.key === 'Escape' && open) close();
    }, true);

    function toggle() {
        if (gateEl) { gateEl.remove(); gateEl = null; return; }
        if (open) close(); else show();
    }

    /* ---------- password gate ---------- */
    function show() {
        if (root) { open = true; root.style.display = 'flex'; refresh(); return; }
        if (!unlocked) { passwordPrompt(); return; }
        build();
    }
    function close() {
        open = false;
        if (root) root.style.display = 'none';
    }

    function passwordPrompt() {
        injectCss();
        if (gateEl) { gateEl.remove(); gateEl = null; return; }
        gateEl = el('div', 'ida-gate');
        gateEl.innerHTML =
            '<div class="ida-gate-box">' +
            '<div class="ida-gate-title">ADMIN ACCESS</div>' +
            '<div class="ida-gate-sub">Enter admin password</div>' +
            '<input type="password" class="ida-gate-input" placeholder="Password" autocomplete="off">' +
            '<div class="ida-gate-err"></div>' +
            '<div class="ida-gate-row">' +
            '<button class="ida-btn">Unlock</button>' +
            '<button class="ida-btn ida-btn-dim">Cancel</button>' +
            '</div></div>';
        document.body.appendChild(gateEl);
        var input = gateEl.querySelector('.ida-gate-input');
        var err = gateEl.querySelector('.ida-gate-err');
        setTimeout(function () { input.focus(); }, 30);

        function tryUnlock() {
            if (input.value === PASSWORD) {
                unlocked = true;
                gateEl.remove(); gateEl = null;
                build();
            } else {
                err.textContent = 'Wrong password';
                input.value = '';
                input.focus();
            }
        }
        gateEl.querySelector('.ida-btn').onclick = tryUnlock;
        gateEl.querySelector('.ida-btn-dim').onclick = function () { gateEl.remove(); gateEl = null; };
        input.onkeydown = function (e) {
            if (e.key === 'Enter') tryUnlock();
            if (e.key === 'Escape') { gateEl.remove(); gateEl = null; }
            e.stopPropagation();
        };
    }

    /* ---------- main panel ---------- */
    var TABS = ['Currencies', 'Upgrades', 'Values', 'Locks', 'Game', 'Save Data', 'Console'];
    var activeTab = 'Currencies';

    function build() {
        if (root) { open = true; root.style.display = 'flex'; refresh(); return; }
        injectCss();

        root = el('div', 'ida-root');
        root.innerHTML =
            '<div class="ida-panel">' +
            '<div class="ida-head">' +
            '<span class="ida-logo">ADMIN PANEL</span>' +
            '<span class="ida-hint">` to close</span>' +
            '<button class="ida-x" title="Close">&times;</button>' +
            '</div>' +
            '<div class="ida-tabs"></div>' +
            '<div class="ida-body"></div>' +
            '<div class="ida-foot">' +
            '<span class="ida-status">Idle Dice admin - live</span>' +
            '</div>' +
            '</div>';
        document.body.appendChild(root);
        open = true;

        root.querySelector('.ida-x').onclick = close;

        var tabs = root.querySelector('.ida-tabs');
        TABS.forEach(function (name) {
            var b = el('button', 'ida-tab', esc(name));
            b.onclick = function () { activeTab = name; renderTabs(); render(); };
            b.dataset.name = name;
            tabs.appendChild(b);
        });
        renderTabs();
        render();
    }

    function renderTabs() {
        root.querySelectorAll('.ida-tab').forEach(function (b) {
            b.classList.toggle('active', b.dataset.name === activeTab);
        });
    }

    function refresh() { if (root && open) render(); }

    function render() {
        var body = root.querySelector('.ida-body');
        body.innerHTML = '';
        try {
            if (activeTab === 'Currencies') tabCurrencies(body);
            else if (activeTab === 'Upgrades') tabUpgrades(body);
            else if (activeTab === 'Values') tabValues(body);
            else if (activeTab === 'Locks') tabLocks(body);
            else if (activeTab === 'Game') tabGame(body);
            else if (activeTab === 'Save Data') tabSave(body);
            else if (activeTab === 'Console') tabConsole(body);
        } catch (err) {
            body.appendChild(el('div', 'ida-note', 'Error: ' + esc(err.message) +
                '<br><br>The game may still be loading. Close and reopen the panel to retry.'));
        }
    }

    /* ---------- upgrade level setter (uses the game's own math) ---------- */
    function setUpgradeLevel(name, lv) {
        var up = Luts.Upgrades.get(name);
        if (!up) return;
        lv = parseInt(lv, 10);
        if (isNaN(lv) || lv < 0) return;
        if (typeof up.maxLevel === 'number' && up.maxLevel > 0) lv = Math.min(lv, up.maxLevel);
        up.level = lv;
        // recalc value from level (same function the game's buy path uses)
        try { Luts.Upgrades.calcValue(up); } catch (e) {}
        // recalc price from level (mirrors the game's incremental price math)
        try {
            var f = up.priceIncreaseFactor;
            if (Array.isArray(up.price) && Array.isArray(up.initialPrice)) {
                for (var i = 0; i < up.price.length; i++) {
                    var fi = Array.isArray(f) ? f[i] : f;
                    up.price[i] = priceFor(up.initialPrice[i], fi, lv, up.priceIncreaseMethod);
                }
            } else if (up.initialPrice && up.initialPrice.times) {
                up.price = priceFor(up.initialPrice, f, lv, up.priceIncreaseMethod);
            }
        } catch (e) {}
        Luts.Upgrades.saveUpgrade(up);
        try { Luts.Events.onUpgrade.dispatch(up, 0); } catch (e) {}
        try { if (up.onUpgrade) up.onUpgrade.dispatch(up, 0); } catch (e) {}
    }
    function priceFor(initialPrice, factor, level, method) {
        var f = dec(factor);
        if (method === 1) return initialPrice.plus(f.times(level));
        return initialPrice.times(f.pow(level));
    }

    /* ================= CURRENCIES ================= */
    function tabCurrencies(body) {
        body.appendChild(el('div', 'ida-desc',
            'Live money control. Changes apply instantly - no reload needed.'));
        var names = Luts.Upgrades.currencyNames || [];
        names.forEach(function (name, i) {
            var cur = Luts.Upgrades.currency[i];
            var row = el('div', 'ida-row');
            row.appendChild(el('span', 'ida-name', esc(name)));
            row.appendChild(el('span', 'ida-val', fmt(cur)));
            var input = el('input', 'ida-input');
            input.placeholder = 'new amount (e.g. 1e30)';
            input.value = '';
            row.appendChild(input);
            row.appendChild(mkBtn('Set', function () {
                if (input.value === '') return;
                Luts.Upgrades.setCurrency(name, dec(input.value));
                refresh();
            }));
            row.appendChild(mkBtn('+1k', function () { Luts.Upgrades.changeCurrency(name, dec(1000)); refresh(); }));
            row.appendChild(mkBtn('+1M', function () { Luts.Upgrades.changeCurrency(name, dec(1e6)); refresh(); }));
            row.appendChild(mkBtn('x2', function () { Luts.Upgrades.changeCurrency(name, dec(cur)); refresh(); }));
            row.appendChild(mkBtn('x10', function () { Luts.Upgrades.changeCurrency(name, dec(cur).times(9)); refresh(); }));
            row.appendChild(mkBtn('MAX', function () { Luts.Upgrades.setCurrency(name, dec('1e308')); refresh(); }));
            body.appendChild(row);
        });
        body.appendChild(el('div', 'ida-desc',
            'Tip: Points (score), Chips (casino), Diamonds (shop), Skillpoints / LuckPoints / BonusPoints (upgrades), SlotSpins, DuelCups...'));
    }

    /* ================= UPGRADES ================= */
    function tabUpgrades(body) {
        body.appendChild(el('div', 'ida-desc',
            'Set any upgrade to any level for free (no currency is charged). Level, value and price are recalculated instantly using the game\'s own formulas.'));
        var idx = Luts.Upgrades.upgradesIndex || {};
        var names = Object.keys(idx);
        names.sort();
        if (!names.length) {
            body.appendChild(el('div', 'ida-note', 'No upgrades found.'));
            return;
        }
        var apply = el('div', 'ida-row ida-row-head');
        apply.appendChild(el('span', 'ida-name', 'Upgrade'));
        apply.appendChild(el('span', 'ida-val', 'Level'));
        body.appendChild(apply);
        names.forEach(function (name) {
            var up = idx[name];
            if (!up) return;
            var row = el('div', 'ida-row');
            row.appendChild(el('span', 'ida-name', esc(name)));
            row.appendChild(el('span', 'ida-val', String(up.level)));
            var input = el('input', 'ida-input');
            input.value = up.level;
            input.type = 'number';
            input.min = '0';
            row.appendChild(input);
            row.appendChild(mkBtn('Set', function () {
                try {
                    setUpgradeLevel(name, input.value);
                    refresh();
                } catch (e) { alert('Error: ' + e.message); }
            }));
            row.appendChild(mkBtn('+10', function () {
                input.value = (parseInt(input.value, 10) || 0) + 10;
            }));
            body.appendChild(row);
        });
    }

    /* ================= VALUES ================= */
    function tabValues(body) {
        body.appendChild(el('div', 'ida-desc',
            'Internal game values and multipliers (dice multipliers, card progression, ...). Set applies instantly. Advanced - only change if you know what it does.'));
        var vals = Luts.Value.values || [];
        if (!vals.length) {
            body.appendChild(el('div', 'ida-note', 'No values found.'));
            return;
        }
        var head = el('div', 'ida-row ida-row-head');
        head.appendChild(el('span', 'ida-name', 'Value'));
        head.appendChild(el('span', 'ida-val', 'Current'));
        body.appendChild(head);
        vals.forEach(function (v) {
            if (!v || !v.name) return;
            var row = el('div', 'ida-row');
            var label = v.displayName ? (v.name + ' (' + v.displayName + ')') : v.name;
            row.appendChild(el('span', 'ida-name', esc(label)));
            row.appendChild(el('span', 'ida-val', fmt(v.v)));
            var input = el('input', 'ida-input');
            input.placeholder = 'new value';
            row.appendChild(input);
            row.appendChild(mkBtn('Set', function () {
                if (input.value === '') return;
                try {
                    v.v = dec(input.value);
                    if (v.save) v.save();
                    if (v.onChange) v.onChange.dispatch(v);
                    refresh();
                } catch (e) { alert('Error: ' + e.message); }
            }));
            body.appendChild(row);
        });
    }

    /* ================= LOCKS ================= */
    function tabLocks(body) {
        body.appendChild(el('div', 'ida-desc',
            'Feature locks. Unlock All enables every locked feature (autoRoll, autoroll100, autoConvert, autoUpgrade, ...). Applies instantly.'));
        var bar = el('div', 'ida-bar');
        bar.appendChild(mkBtn('UNLOCK ALL', function () {
            (Luts.Lock.locks || []).forEach(function (l) { try { l.unlock(); } catch (e) {} });
            refresh();
        }));
        bar.appendChild(mkBtn('LOCK ALL', function () {
            (Luts.Lock.locks || []).forEach(function (l) { try { l.lock(); } catch (e) {} });
            refresh();
        }));
        body.appendChild(bar);
        var locks = Luts.Lock.locks || [];
        var head = el('div', 'ida-row ida-row-head');
        head.appendChild(el('span', 'ida-name', 'Lock'));
        head.appendChild(el('span', 'ida-val', 'State'));
        body.appendChild(head);
        locks.forEach(function (l) {
            if (!l || !l.name) return;
            var row = el('div', 'ida-row');
            row.appendChild(el('span', 'ida-name', esc(l.name)));
            var st = el('span', 'ida-val ' + (l.unlocked ? 'ida-ok' : 'ida-no'),
                l.unlocked ? 'UNLOCKED' : 'locked');
            row.appendChild(st);
            row.appendChild(mkBtn(l.unlocked ? 'Lock' : 'Unlock', function () {
                try { l.unlocked ? l.lock() : l.unlock(); } catch (e) {}
                refresh();
            }));
            body.appendChild(row);
        });
    }

    /* ================= GAME ================= */
    function tabGame(body) {
        body.appendChild(el('div', 'ida-desc', 'Game engine controls. All instant.'));

        function addRow(label, node) {
            var row = el('div', 'ida-row');
            row.appendChild(el('span', 'ida-name', label));
            row.appendChild(node);
            body.appendChild(row);
        }

        // pause
        addRow('Game Paused', mkBtn(Luts.gamePaused ? 'Resume (currently paused)' : 'Pause (currently running)', function () {
            Luts.gamePaused = !Luts.gamePaused; refresh();
        }));

        // saving
        addRow('Auto Saving', mkBtn((Luts.Store.savingEnabled !== false) ? 'ON - click to disable' : 'OFF - click to enable', function () {
            Luts.Store.savingEnabled = (Luts.Store.savingEnabled === false);
            refresh();
        }));

        // force save
        var fsBtn = mkBtn('FORCE SAVE NOW', function () {
            try {
                Luts.Store.sync();
                if (Luts.Value.saveAll) Luts.Value.saveAll();
                if (Luts.Lock.saveAll) Luts.Lock.saveAll();
                Luts.Store.sync();
                fsBtn.textContent = 'Saved!';
                setTimeout(function () { fsBtn.textContent = 'FORCE SAVE NOW'; }, 1200);
            } catch (e) { alert('Error: ' + e.message); }
        });
        var fsRow = el('div', 'ida-row');
        fsRow.appendChild(el('span', 'ida-name', 'Save'));
        fsRow.appendChild(fsBtn);
        body.appendChild(fsRow);

        // reload
        var rlBtn = mkBtn('RELOAD GAME', function () {
            try {
                Luts.Store.sync();
                if (Luts.Value.saveAll) Luts.Value.saveAll();
                if (Luts.Lock.saveAll) Luts.Lock.saveAll();
            } catch (e) {}
            setTimeout(function () { location.reload(); }, 150);
        });
        rlBtn.className = 'ida-btn ida-btn-danger';
        var rlRow = el('div', 'ida-row');
        rlRow.appendChild(el('span', 'ida-name', 'Reload'));
        rlRow.appendChild(rlBtn);
        body.appendChild(rlRow);
    }

    /* ================= SAVE DATA ================= */
    function tabSave(body) {
        body.appendChild(el('div', 'ida-desc',
            'Raw save editor - the complete save file as JSON. Edit anything, then Apply & Reload. Deleting a key here deletes it from the save. Export Base64 gives a code you can also paste into the game\'s own load prompt.'));

        var ta = el('textarea', 'ida-savebox');
        ta.spellcheck = false;
        ta.value = dumpSave();
        body.appendChild(ta);

        var bar = el('div', 'ida-bar');
        bar.appendChild(mkBtn('Apply & Reload', function () {
            try {
                var data = JSON.parse(ta.value);
                // block the game from overwriting our edits before reload
                Luts.Store.savingEnabled = false;
                var prefix = Luts.Name + '_';
                // write / update keys
                for (var k in data) {
                    if (Object.prototype.hasOwnProperty.call(data, k) && k !== 'trimmed') {
                        Luts.Storage.setItem(prefix + k, data[k]);
                    }
                }
                // delete prefixed keys that were removed from the JSON
                var existing = [];
                for (var i = 0; i < Luts.Storage.length; i++) {
                    var key = Luts.Storage.key(i);
                    if (key && key.indexOf(prefix) === 0) existing.push(key);
                }
                existing.forEach(function (key) {
                    var short = key.slice(prefix.length);
                    if (short !== 'trimmed' && !(short in data)) {
                        Luts.Storage.removeItem(key);
                    }
                });
                setTimeout(function () { location.reload(); }, 100);
            } catch (e) {
                alert('Invalid JSON: ' + e.message);
            }
        }));
        bar.appendChild(mkBtn('Reload JSON', function () { ta.value = dumpSave(); }));
        bar.appendChild(mkBtn('Export Base64', function () {
            try { ta.value = btoa(dumpSave(true)); }
            catch (e) { alert('Export failed: ' + e.message); }
        }));
        bar.appendChild(mkBtn('Import Base64', function () {
            try {
                ta.value = atob(ta.value.trim());
            } catch (e) { alert('Not valid base64.'); }
        }));
        bar.appendChild(mkBtnDanger('RESET SAVE', function () {
            if (confirm('Really delete ALL Idle Dice save data and start over?')) {
                Luts.Store.savingEnabled = false;
                clearGameStorage();
                location.reload();
            }
        }));
        body.appendChild(bar);
    }

    function dumpSave(forExport) {
        // flush pending writes first so the snapshot is complete
        try { Luts.Store.sync(); } catch (e) {}
        var out = {};
        var prefix = Luts.Name + '_';
        for (var i = 0; i < Luts.Storage.length; i++) {
            var key = Luts.Storage.key(i);
            if (key && key.indexOf(prefix) === 0) {
                var short = key.slice(prefix.length);
                if (short === 'trimmed') continue;
                out[short] = Luts.Storage.getItem(key);
            }
        }
        var json = JSON.stringify(out, null, 1);
        if (forExport) {
            // include the trimmed flag so the game's native import accepts it
            out.trimmed = '1';
            json = JSON.stringify(out);
        }
        return json;
    }

    function clearGameStorage() {
        var prefix = Luts.Name + '_';
        var keys = [];
        for (var i = 0; i < Luts.Storage.length; i++) {
            var key = Luts.Storage.key(i);
            if (key && key.indexOf(prefix) === 0) keys.push(key);
        }
        keys.forEach(function (k) { Luts.Storage.removeItem(k); });
    }

    /* ================= CONSOLE ================= */
    function tabConsole(body) {
        body.appendChild(el('div', 'ida-desc',
            'Run any JavaScript against the live game. Full access to the Luts API.'));
        body.appendChild(el('div', 'ida-desc',
            "Examples: Luts.Upgrades.setCurrency('Points', new Decimal('1e100')) &nbsp;|&nbsp; Luts.Lock.unlock('autoRoll') &nbsp;|&nbsp; Luts.gamePaused = true"));
        var ta = el('textarea', 'ida-consolebox');
        ta.spellcheck = false;
        ta.placeholder = "Luts.Upgrades.setCurrency('Chips', new Decimal('1e50'))";
        body.appendChild(ta);
        var out = el('div', 'ida-consoleout');
        body.appendChild(out);
        var bar = el('div', 'ida-bar');
        bar.appendChild(mkBtn('RUN', function () {
            out.textContent = '';
            try {
                var r = eval(ta.value);
                out.textContent = 'Result: ' + fmt(r);
            } catch (e) {
                out.textContent = 'Error: ' + e.message;
            }
        }));
        bar.appendChild(mkBtn('CLEAR', function () { ta.value = ''; out.textContent = ''; }));
        body.appendChild(bar);
    }

    /* ---------- widgets ---------- */
    function mkBtn(label, fn) {
        var b = el('button', 'ida-btn', esc(label));
        b.onclick = fn;
        return b;
    }
    function mkBtnDanger(label, fn) {
        var b = mkBtn(label, fn);
        b.className = 'ida-btn ida-btn-danger';
        return b;
    }

    /* ---------- css ---------- */
    function injectCss() {
        if (document.getElementById('ida-style')) return;
        var s = document.createElement('style');
        s.id = 'ida-style';
        s.textContent = [
            '.ida-gate{position:fixed;inset:0;background:rgba(5,10,18,.85);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:Verdana,Arial,sans-serif}',
            '.ida-gate-box{background:#0d1520;border:2px solid #2dd873;border-radius:12px;padding:28px 34px;width:320px;text-align:center;box-shadow:0 0 40px rgba(45,216,115,.35)}',
            '.ida-gate-title{color:#2dd873;font-size:20px;font-weight:bold;letter-spacing:2px}',
            '.ida-gate-sub{color:#8fa3b8;font-size:12px;margin:6px 0 14px}',
            '.ida-gate-input{width:100%;box-sizing:border-box;padding:9px 12px;border-radius:8px;border:1px solid #2a3a4d;background:#0a0f16;color:#e6f0ff;font-size:14px;outline:none;text-align:center}',
            '.ida-gate-input:focus{border-color:#2dd873}',
            '.ida-gate-err{color:#ff5c6c;font-size:11px;height:16px;margin-top:6px}',
            '.ida-gate-row{display:flex;gap:8px;justify-content:center;margin-top:8px}',
            '.ida-root{position:fixed;inset:0;z-index:99998;display:flex;align-items:flex-start;justify-content:center;pointer-events:none;font-family:Verdana,Arial,sans-serif}',
            '.ida-panel{pointer-events:auto;margin-top:4vh;width:680px;max-width:94vw;max-height:88vh;display:flex;flex-direction:column;background:rgba(10,16,24,.97);border:1px solid #233042;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,.6);overflow:hidden}',
            '.ida-head{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#0d1723;border-bottom:1px solid #233042}',
            '.ida-logo{color:#2dd873;font-weight:bold;font-size:13px;letter-spacing:2px}',
            '.ida-hint{color:#5c7086;font-size:10px;margin-left:auto}',
            '.ida-x{background:none;border:none;color:#8fa3b8;font-size:20px;cursor:pointer;line-height:1;padding:0 2px}',
            '.ida-x:hover{color:#ff5c6c}',
            '.ida-tabs{display:flex;flex-wrap:wrap;gap:2px;padding:8px 10px 0;background:#0d1723}',
            '.ida-tab{background:#131e2b;color:#8fa3b8;border:none;border-radius:6px 6px 0 0;padding:6px 12px;cursor:pointer;font-size:11px;font-family:inherit}',
            '.ida-tab.active{background:#1a2836;color:#2dd873;font-weight:bold}',
            '.ida-body{padding:12px 14px;overflow-y:auto;flex:1}',
            '.ida-foot{display:flex;gap:14px;align-items:center;padding:7px 14px;background:#0d1723;border-top:1px solid #233042}',
            '.ida-status{color:#5c7086;font-size:10px}',
            '.ida-desc{color:#8fa3b8;font-size:10.5px;line-height:1.5;margin-bottom:10px}',
            '.ida-note{color:#ffb454;font-size:11px;margin:10px 0}',
            '.ida-row{display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #16202c;flex-wrap:wrap}',
            '.ida-row-head{border-bottom:1px solid #2a3a4d}',
            '.ida-name{color:#cfe0f2;font-size:11px;min-width:170px;max-width:240px;word-break:break-all;flex:0 0 auto}',
            '.ida-val{color:#2dd873;font-size:11px;min-width:110px;font-family:monospace}',
            '.ida-ok{color:#2dd873}.ida-no{color:#5c7086}',
            '.ida-input{background:#0a0f16;border:1px solid #2a3a4d;border-radius:6px;color:#e6f0ff;padding:5px 8px;font-size:11px;width:150px;outline:none;font-family:monospace}',
            '.ida-input:focus{border-color:#2dd873}',
            '.ida-btn{background:#16233a;color:#7fd4ff;border:1px solid #2a4a6b;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:10.5px;font-family:inherit;white-space:nowrap}',
            '.ida-btn:hover{background:#1d3050;color:#aee6ff}',
            '.ida-btn-danger{background:#3a1620;color:#ff8f9a;border-color:#6b2a3a}',
            '.ida-btn-danger:hover{background:#4d1a28;color:#ffb3bb}',
            '.ida-bar{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}',
            '.ida-savebox,.ida-consolebox{width:100%;box-sizing:border-box;background:#0a0f16;border:1px solid #2a3a4d;border-radius:8px;color:#cfe0f2;font-family:monospace;font-size:11px;padding:10px;outline:none;resize:vertical}',
            '.ida-savebox{height:300px}.ida-consolebox{height:90px}',
            '.ida-consoleout{color:#ffb454;font-size:11px;font-family:monospace;white-space:pre-wrap;word-break:break-all;min-height:16px;margin-bottom:6px}'
        ].join('\n');
        document.head.appendChild(s);
    }
})();
