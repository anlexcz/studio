(function(root) {
  'use strict';
  const draftKey = 'metrobus.outro.draft.v1';
  function parseCsv(text) {
    text = String(text).replace(/^\uFEFF/, '');
    const firstLine = text.split(/\r?\n/, 1)[0];
    const delimiter = firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';
    const rows = []; let row = [], field = '', quoted = false, closed = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') { quoted = false; closed = true; }
        else field += c;
      } else if (c === '"') {
        if (field || closed) throw new Error('Neplatné uvozovky v CSV.');
        quoted = true;
      } else if (c === delimiter || c === '\n' || c === '\r') {
        row.push(field); field = ''; closed = false;
        if (c !== delimiter) { if (row.some(v => v.trim())) rows.push(row); row = []; if (c === '\r' && text[i + 1] === '\n') i++; }
      } else {
        if (closed && c.trim()) throw new Error('Text za uzavřenými uvozovkami v CSV.');
        if (!closed) field += c;
      }
    }
    if (quoted) throw new Error('Neuzavřené uvozovky v CSV.');
    row.push(field); if (row.some(v => v.trim())) rows.push(row);
    return rows;
  }
  function importSupporters(text, filename) {
    const rows = parseCsv(text);
    if (rows.length < 2) throw new Error('Export neobsahuje žádné podporovatele.');
    const header = rows[0].map(s => s.trim());
    const indexes = ['Jméno', 'Handle', 'Předplatné'].map(s => header.indexOf(s));
    if (indexes.some(i => i < 0)) throw new Error('Chybí sloupce Jméno, Handle nebo Předplatné.');
    if (new Set(header).size !== header.length) throw new Error('CSV má opakované názvy sloupců.');
    const supporters = rows.slice(1).map((row, i) => {
      if (row.length !== header.length) throw new Error(`Řádek ${i + 2} má jiný počet sloupců.`);
      const handle = row[indexes[1]].trim();
      const name = row[indexes[0]].trim() || handle;
      const tier = row[indexes[2]].trim().toLowerCase();
      if (!name) throw new Error(`Řádek ${i + 2} nemá jméno ani přezdívku.`);
      if (!['standard', 'midibus'].includes(tier)) throw new Error(`Řádek ${i + 2}: neznámé předplatné ${tier}.`);
      return { name, handle, tier };
    });
    const match = /^podporovatele-metrobuscz-(\d{4}-\d{2}-\d{2})\.csv$/i.exec(filename || '');
    const date = match ? match[1] : new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/Prague',year:'numeric',month:'2-digit',day:'2-digit' }).format(new Date());
    const parsedDate = new Date(date + 'T00:00:00Z');
    if (!Number.isFinite(parsedDate.valueOf()) || parsedDate.toISOString().slice(0,10) !== date) throw new Error('Datum v názvu CSV není platné.');
    const source = `podporovatele-metrobuscz-${date}.csv`;
    const quote = s => '"' + String(s).replace(/"/g, '""') + '"';
    const csv = ['Jméno,Handle,Předplatné', ...supporters.map(s => [s.name,s.handle,s.tier === 'standard' ? 'Standard' : 'Midibus'].map(quote).join(','))].join('\n') + '\n';
    return { supporters, source, date, csv };
  }
  function canonical(value) {
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k)+':'+canonical(value[k])).join(',') + '}';
    return JSON.stringify(value);
  }
  function validate(settings) {
    if (!settings || settings.schemaVersion !== 1) throw new Error('Neznámá verze nastavení.');
    if (!Array.isArray(settings.guests) || settings.guests.length > 8 || settings.guests.some(v => typeof v !== 'string' || !v.trim() || v.length > 80)) throw new Error('Účinkující: nejvýše 8 jmen, každé do 80 znaků.');
    if (!Array.isArray(settings.easterEggs) || settings.easterEggs.length > 100 || settings.easterEggs.some(v => typeof v !== 'string' || !v.trim() || v.length > 180)) throw new Error('Hlášky: nejvýše 100 textů, každý do 180 znaků.');
    for (const key of ['titleTop','titleBottom','guestsTitle','ctaLeadTitle','forendorsText','forendorsLink','socialsTitle','supportersTitle','supportersSubtitle','supportersThanks','footer']) {
      if (typeof settings[key] !== 'string' || settings[key].length > 200) throw new Error(`Neplatný text: ${key}.`);
    }
    if (!Array.isArray(settings.socials) || settings.socials.length !== 3) throw new Error('Nastavení musí obsahovat tři sociální bannery.');
    if (!(settings.easterEggRotateMs >= 3000 && settings.easterEggRotateMs <= 120000)) throw new Error('Interval hlášek musí být 3–120 sekund.');
    return settings;
  }
  // Send only settings and a cleaned, optional CSV in one atomic commit.
  async function publish({settings, original, upload, token, fetcher = root.fetch.bind(root)}) {
    validate(settings);
    if (!token) throw new Error('Pro uložení zadej GitHub token.');
    const base = 'https://api.github.com/repos/anlexcz/studio';
    async function request(path, method = 'GET', body) {
      const response = await fetcher(base + path, {
        method, cache:'no-store', headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,'Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},
        ...(body ? {body:JSON.stringify(body)} : {})
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) throw new Error('GitHub odmítl přístup. Zkontroluj platnost tokenu a Contents: Read and write pro studio.');
        if (response.status === 409 || response.status === 422) throw new Error('Repozitář se mezitím změnil. Obnov nastavení a zkus uložení znovu.');
        throw new Error(`GitHub: HTTP ${response.status}. Nastavení se nepodařilo uložit.`);
      }
      return response.json();
    }
    const ref = await request('/git/ref/heads/main');
    const head = ref.object.sha;
    const remote = await request('/contents/outro/settings.json?ref='+head);
    const binary = root.atob(remote.content.replace(/\s/g,''));
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const remoteSettings = JSON.parse(new TextDecoder().decode(bytes));
    if (canonical(remoteSettings) !== canonical(original)) throw new Error('Na GitHubu je novější nastavení. Obnov stránku, aby se nepřepsaly cizí změny.');
    const commit = await request('/git/commits/'+head);
    const treeEntries = [{path:'outro/settings.json',mode:'100644',type:'blob',content:JSON.stringify(settings,null,2)+'\n'}];
    if (upload) {
      // Resolve duplicate root exports and reject accidentally older data.
      const currentTree = await request('/git/trees/'+commit.tree.sha+'?recursive=1');
      const dated = currentTree.tree.filter(e => /^(?:outro\/)?podporovatele-metrobuscz-\d{4}-\d{2}-\d{2}\.csv$/.test(e.path));
      const latest = dated.map(e => /\d{4}-\d{2}-\d{2}/.exec(e.path)[0]).sort().at(-1);
      if (latest && upload.date < latest) throw new Error('Export je starší než aktuální seznam. Nahraj novější export.');
      if (dated.some(e => e.path === upload.source)) treeEntries.push({path:upload.source,mode:'100644',type:'blob',sha:null});
      treeEntries.push({path:'outro/'+upload.source,mode:'100644',type:'blob',content:upload.csv});
    }
    const tree = await request('/git/trees','POST',{base_tree:commit.tree.sha,tree:treeEntries});
    const next = await request('/git/commits','POST',{message:'Update outro settings'+(upload ? ' and supporter export' : ''),tree:tree.sha,parents:[head]});
    await request('/git/refs/heads/main','PATCH',{sha:next.sha,force:false});
    return {sha:next.sha,url:'https://github.com/anlexcz/studio/commit/'+next.sha};
  }
  const api = {draftKey,parseCsv,importSupporters,canonical,validate,publish};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OutroData = api;
})(typeof window !== 'undefined' ? window : globalThis);
