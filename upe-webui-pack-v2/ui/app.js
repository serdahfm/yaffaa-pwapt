(() => {
  const $  = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  function makeExclusive(groupSelector) {
    const el = $(groupSelector);
    el.addEventListener('click', (e) => {
      const btn = e.target.closest('button'); if (!btn) return;
      $$(groupSelector+' .pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  }
  makeExclusive('#gear');
  makeExclusive('#format');
  makeExclusive('#explore');

  $('#openUiRoot').addEventListener('click', (e) => { e.preventDefault(); window.location.href = '/ui/'; });

  function exploreVal(){ return $('#explore .pill.active')?.dataset.explore || 'MS'; }

  async function compile() {
    const goal = $('#goal').value.trim(); if (!goal) return alert('Please describe your task.');
    const mode = $('#gear .pill.active')?.dataset.gear || 'turbo';
    const primary = $('#format .pill.active')?.dataset.format || 'md';
    const secondaries = $$('.sec:checked').map(x => x.value);
    const audience = $('#audience').value.trim();
    const timeframe = $('#timeframe').value.trim();
    const tone = $('#tone').value.trim();
    const seedVal = $('#seed').value.trim();
    const seed = seedVal ? parseInt(seedVal, 10) : undefined;
    const explore = exploreVal();

    const body = { v:"1.0.0", goal, yafaOn:true, mode, seed,
      artifact:{ primary, secondaries, layoutHints:{} },
      slots:{ audience, timeframe, tone, explore }
    };

    $('#status').textContent = 'Running...';
    $('#result').classList.add('hidden');

    const resp = await fetch('/upe/compile', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await resp.json();

    $('#status').textContent = '';
    $('#result').classList.remove('hidden');
    window._manifestId = data.manifestId;

    $('#resStatus').textContent = data.status || '(no status)';
    $('#manifestId').textContent = data.manifestId || '-';
    $('#resModel').textContent = data.model || '-';
    $('#resSeed').textContent = data.seed ?? '-';
    $('#engineeredPrompt').textContent = (data.bundle && data.bundle.engineeredPrompt) || '';
    $('#downstreamPrompt').textContent  = (data.bundle && data.bundle.downstreamEnforcer) || '';

    const d = $('#downloads'); d.innerHTML = '';
    ['md','docx','pdf','pptx','xlsx','html'].forEach(k => {
      const a = document.createElement('a');
      a.href = `/upe/runs/${data.manifestId}/artifact/${k}`;
      a.target = '_blank';
      a.textContent = `Download ${k.toUpperCase()}`;
      d.appendChild(a);
    });

    renderFollowups(data.manifestId);
    initConverter();
  }

  async function renderFollowups(runId){
    const f = $('#followups'); f.innerHTML='';
    let payload = {};
    try {
      payload = await fetch(`/upe/runs/${runId}/suggestions`).then(r => r.json());
    } catch(e){ console.warn('sugg fetch failed', e); }
    const items = (payload.suggestions || []);
    items.forEach(s => {
      const card = document.createElement('div'); card.className='card';
      const title = document.createElement('h4'); title.textContent = s.label; card.appendChild(title);
      const desc  = document.createElement('div'); desc.className='desc'; desc.textContent = s.rationale || ''; card.appendChild(desc);

      // dynamic input fields per suggestion
      const form = document.createElement('div');
      if (s.id === 'verify_claims') {
        const note = document.createElement('div'); note.textContent='Switch to Proof and re-run.'; form.appendChild(note);
      }
      if (s.id === 'transform_pdf') {
        const cb = document.createElement('label'); cb.innerHTML = `<input type="checkbox" checked> also include PDF`; form.appendChild(cb);
      }
      if (s.id === 'tighten_scope') {
        const row = document.createElement('div'); row.className='row';
        const w = document.createElement('input'); w.type='number'; w.placeholder='Max words'; w.value=180; w.style.flex='1';
        const sec = document.createElement('input'); sec.placeholder='Section'; sec.value='Executive Summary'; sec.style.flex='2';
        row.appendChild(w); row.appendChild(sec); form.appendChild(row);
      }
      card.appendChild(form);

      const actions = document.createElement('div'); actions.className='actions';
      const apply = document.createElement('button'); apply.className='primary'; apply.textContent='Apply';
      apply.onclick = async () => {
        // Build a new compile body from current screen + this suggestion
        const base = {
          v:"1.0.0",
          goal: $('#goal').value.trim(),
          yafaOn:true,
          mode: $('#gear .pill.active')?.dataset.gear || 'turbo',
          seed: undefined,
          artifact: { primary: $('#format .pill.active')?.dataset.format || 'md',
                      secondaries: $$('.sec:checked').map(x => x.value) },
          slots: {
            audience: $('#audience').value.trim(),
            timeframe: $('#timeframe').value.trim(),
            tone: $('#tone').value.trim(),
            explore: exploreVal()
          }
        };
        if (s.id === 'verify_claims') base.mode = 'proof';
        if (s.id === 'transform_pdf') {
          if (!base.artifact.secondaries.includes('pdf')) base.artifact.secondaries.push('pdf');
        }
        if (s.id === 'tighten_scope') {
          const inputs = form.querySelectorAll('input');
          const maxWords = parseInt(inputs[0].value || '180',10);
          const section = (inputs[1].value || 'Executive Summary').trim();
          const resp = await fetch('/upe/compile', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(base) });
          const d2 = await resp.json();
          await fetch(`/upe/runs/${d2.manifestId}/feedback`, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ runId: d2.manifestId, ops:[{ op:'limit', section, max_words:maxWords }] })
          });
          alert('Re-run + tighten applied. Manifest: '+d2.manifestId); return;
        }
        const r = await fetch('/upe/compile', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(base) });
        const d3 = await r.json();
        alert('Re-run complete. Manifest: '+d3.manifestId);
      };
      actions.appendChild(apply);
      card.appendChild(actions);
      f.appendChild(card);
    });
  }

  function initConverter(){
    const parent = $('#convertPills'); if (!parent) return;
    parent.onclick = async (e) => {
      const btn = e.target.closest('button'); if (!btn) return;
      const t = btn.dataset.t;
      if (!window._manifestId) return alert('Run once first.');
      try {
        const resp = await fetch(`/upe/runs/${window._manifestId}/transform`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ targets:[t] })
        });
        const data = await resp.json();
        if (data.status !== 'OK') alert('Convert failed: '+JSON.stringify(data));
        else alert('Added: '+(data.added||[]).join(', '));
      } catch (err){
        alert('Converter not enabled on server.');
      }
    };
  }

  $('#runBtn').addEventListener('click', compile);
  $('#applySabi').addEventListener('click', async () => {
    const txt = $('#sabiText').value.trim(); if (!txt) return alert('Describe an edit.');
    const runId = window._manifestId; if (!runId) return alert('Run once first.');
    const ops = [{ op:'focus', topic: txt }];
    const resp = await fetch(`/upe/runs/${runId}/feedback`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ runId, ops }) });
    const data = await resp.json();
    alert('Edits applied: '+JSON.stringify(data));
  });
})();