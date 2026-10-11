window.BioModera = (function () {
  const L = (s) => s.trim().split(/\s+/);

  const PALABRAS = L(`
    puta putas puto putos putita putito putazo putear puteada puteria putisima putamadre
    pendejo pendeja pendejos pendejas pendejada pendejadas pendejete
    cabron cabrona cabrones cabronazo
    chinga chingar chingada chingado chingados chingadera chingaderas chingon chingona chingones chingo chingas chingue chingatumadre
    culero culera culeros culeras culo culos culiao culiado
    verga vergas vergon vergota vergazo
    mierda mierdas mierdero
    hijueputa hijoeputa hijodeputa hijadeputa hijoputa malparido malparida gonorrea
    maricon maricones marica maricas marika joto jotos marimacha machorra sudaca
    zorra zorras follar follame folla joder jodete jodido jodida jodidos
    conyo conyos carajo carajos pinche pinches punyeta punyetas
    mamada mamadas mamon mamona mamones huevon huevona huevones
    gilipollas gilipolla capullo cojones tetas pene penes vagina porno porn pornografia
    idiota idiotas imbecil imbeciles estupido estupida estupidos retrasado retrasada subnormal mongolico
    cagar cagada cagadas cagon cagones pelotudo pelotuda boludo boluda
    hdp ptm ctm chtm lpm hdlgp
    fuck fucks fucker fuckers fucking fucked fuckin fck fuk fuq fuc fucc motherfucker motherfuckers motherfucking
    shit shits shitty shitting bullshit horseshit dipshit shithead shitface shitshow
    bitch bitches bitchy bitchass asshole assholes ass arse arsehole
    dick dicks dickhead cock cocks cocksucker pussy pussies cunt cunts whore whores slut sluts skank
    bastard bastards twat wanker bollocks prick douche douchebag jackass dumbass
    nigger niggers nigga niggas faggot faggots fag dyke tranny retard retarded chink spic kike gook wetback paki
    nude nudes hentai boobs tits titties penis dildo blowjob handjob cumshot jizz
    wtf stfu kys rapist pedophile paedophile pedofilo pedofilia
    caralho caralhos foda fodase foder fodido buceta bucetas cuzao viado merda babaca otario arrombado arrombada
    vagabunda punheta cacete filhodaputa fdp vsf pqp
    merde putain pute putes connard connards connasse salope salopes encule enculer enculee nique niquer niktamere ntm
    couille couilles batard batards foutre bordel branleur
    scheisse scheiss scheisskerl arschloch arsch wichser fotze fotzen hurensohn schlampe ficken fickdich kacke nutte hure schwuchtel spast
    cazzo cazzi stronzo stronza stronzi vaffanculo fanculo puttana puttane minchia coglione coglioni pompino bastardo frocio
    blyat blyad blya pidor pidar pidoras pizda pizdec yebat ebat mudak gandon zalupa
    orospu siktir sikerim yarrak amk amina gotveren
    kurwa kurwy pierdol pierdolic jebac jebany chuj skurwysyn
    madarchod behenchod bhenchod chutiya chutiye gandu randi bhosdi bhosdike harami
    klootzak godverdomme mongool
    putangina tangina
    sharmouta sharmuta kosomak
  `);

  const AMBIGUAS = new Set(L('dick dicks cock cocks ass fag tits arse'));

  const INOCENTES_PALABRA = new Set(L('putto penne mammon mammoth'));

  const SEPARABLES = new Set(L(`
    pendejo pendeja pendejos pendejas chingada chingado chingar chingadera cabron cabrona culero culera
    hijueputa hijodeputa hijadeputa hijoeputa gilipollas motherfucker motherfucking asshole bullshit
    cocksucker faggot nigger bastard
  `));

  const FUERTES = L(`
    pendej chingad chingar chingon chingatumadre mierd cabron hijueput hijoeput hijodeput hijadeput hijoput putamadre
    maricon gilipoll malparid culiao
    fuck motherfuck bitch asshole arsehole cocksuck dickhead nigger faggot bullshit horseshit dipshit shithead jackass dumbass
    wanker bollock caralho vaffanculo filhodaputa putain kurwa pierdol klootzak arschloch hurensohn wichser scheiss
    madarchod behenchod chutiya orospu siktir skurwysyn
  `);
  const INICIO = L('puta puto culo verga porn slut cunt whore pussy tetas');
  const FIN = L('puta puto verga porn slut cunt whore pussy');

  const INOCENTES_DENTRO = L(`
    shiitake shitake snigger vergara scunthorpe computa computo disputa disputo reputa reputo imputa imputo
  `);

  const FRASES = [
    ' matate ', ' suicidate ', ' muerete ', ' kill yourself ', ' kill your self ', ' go kill yourself ',
    ' te voy a matar ', ' i will kill you ', ' vete a la verga ', ' hijo de tu puta madre '
  ];

  const OTROS_ALFABETOS = [
    'сука', 'суки', 'сучка', 'блядь', 'бляд', 'блять', 'хуй', 'хуе', 'хуя', 'хуё', 'пизд', 'ебат', 'ебан', 'ебал', 'ебуч',
    'пидор', 'пидар', 'педик', 'мудак', 'мудил', 'залуп', 'гондон', 'гандон', 'шлюх', 'дерьмо', 'говно', 'ублюд', 'выеб', 'нахуй', 'курва',
    'μαλακ', 'γαμωτ', 'γαμησ', 'πουτσ', 'πουτανα', 'πουστ', 'αρχιδ', 'σκατα',
    'شرموط', 'عاهر', 'قحب', 'منيوك', 'منيك', 'عرص', 'كسمك', 'كسامك', 'ابنالكلب', 'ابنالشرموطة', 'طيز',
    'मादरचोद', 'बहनचोद', 'भेनचोद', 'चूतिया', 'चुतिया', 'गांडू', 'रंडी', 'हरामी', 'भोसड',
    '操你', '肏', '他妈的', '他媽的', '妈的', '媽的', '傻逼', '傻屄', '煞笔', '草泥马', '草泥馬', '婊子', '狗日', '王八蛋', '鸡巴', '雞巴', '贱人', '賤人', '你妈逼', '妈逼', '卧槽', '臥槽',
    'クソ', '死ね', 'ちんこ', 'ちんぽ', 'まんこ', 'うんこ', 'キチガイ', 'きちがい', 'くたばれ', 'ファック', 'ビッチ',
    '씨발', '씨바', 'ㅅㅂ', '개새끼', '병신', '좆같', '좆까', '지랄', '미친놈', '미친년', '창녀', '느금마',
    'เหี้ย', 'ไอ้เหี้ย', 'ควย', 'địt', 'đéo',
    '🖕'
  ];

  const INVISIBLES = /[\u00ad\u034f\u061c\u115f\u1160\u17b4\u17b5\u180e\u200b-\u200f\u202a-\u202e\u2060-\u206f\u3164\ufe00-\ufe0f\ufeff\uffa0]/g;
  const MARCAS = /[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]/g;

  const PARECIDAS = {
    'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x', 'і': 'i', 'ј': 'j', 'ѕ': 's',
    'к': 'k', 'т': 't', 'н': 'h', 'м': 'm', 'в': 'b', 'ӏ': 'l', 'ɑ': 'a', 'α': 'a', 'ο': 'o', 'ρ': 'p',
    'ν': 'v', 'ι': 'i', 'κ': 'k', 'τ': 't', 'υ': 'u', 'χ': 'x', 'ε': 'e', 'β': 'b', 'η': 'n', 'ɡ': 'g',
    'ı': 'i', 'ł': 'l', 'ø': 'o', 'đ': 'd', 'ħ': 'h', 'ß': 'ss', 'æ': 'ae', 'œ': 'oe'
  };
  const NUMEROS = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '6': 'g', '7': 't', '8': 'b', '9': 'g' };

  function base(texto) {
    return String(texto || '')
      .replace(INVISIBLES, '')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/ñ/g, 'ny')
      .normalize('NFD').replace(MARCAS, '')
      .replace(/[^\x00-\x7f]/g, (c) => PARECIDAS[c] || c);
  }

  function vistas(texto) {
    const b = base(texto);
    const simbolos = b.replace(/@/g, 'a').replace(/\$/g, 's').replace(/€/g, 'e');
    const numeros = simbolos.replace(/[013456789]/g, (d) => NUMEROS[d]);
    const numerosL = simbolos.replace(/1/g, 'l').replace(/[03456789]/g, (d) => NUMEROS[d])
      .replace(/[!|¡]/g, 'i').replace(/\+/g, 't');
    const raros = numeros.replace(/v/g, 'u').replace(/k/g, 'c');
    return [b, simbolos, numeros, numerosL, raros];
  }

  function corridas(s) {
    const letras = [], largos = [];
    for (let i = 0; i < s.length;) {
      let j = i;
      while (j < s.length && s[j] === s[i]) j++;
      letras.push(s[i]); largos.push(j - i); i = j;
    }
    return { letras: letras.join(''), largos };
  }
  const colapsar = (s) => corridas(s).letras;

  const INDICE = new Map();
  PALABRAS.forEach((w) => {
    const c = corridas(w);
    if (!INDICE.has(c.letras)) INDICE.set(c.letras, []);
    INDICE.get(c.letras).push(c.largos);
  });
  const SEPARABLES_COL = new Set(Array.from(SEPARABLES).map(colapsar));

  function malo(t, estricto) {
    if (INOCENTES_PALABRA.has(t)) return false;
    const c = corridas(t);
    const candidatas = INDICE.get(c.letras);
    if (!candidatas) return false;
    if (estricto && AMBIGUAS.has(t)) return false;
    return candidatas.some((largos) => c.largos.every((n, i) => n >= largos[i]));
  }

  const PLANAS = PALABRAS.filter((w) => w.length >= 4);
  function mascara(t) {
    const largo = t.length;
    return PLANAS.some((w) => {
      if (w.length !== largo) return false;
      let fijas = 0;
      for (let i = 0; i < largo; i++) {
        if (t[i] === '*' || t[i] === '#') continue;
        if (t[i] !== w[i]) return false;
        fijas++;
      }
      return fijas >= 2 && fijas < largo;
    });
  }

  function ventanas(tokens, estricto) {
    for (let i = 0; i < tokens.length; i++) {
      let junto = '', todasCortas = true, alguna = false;
      for (let j = i; j < tokens.length && j < i + 16; j++) {
        const t = tokens[j];
        if (t.length > 6 || /[*#]/.test(t)) break;
        junto += t;
        if (t.length <= 2) alguna = true; else todasCortas = false;
        if (junto.length > 16) break;
        if (j === i || junto.length < 4) continue;
        if (SEPARABLES_COL.has(colapsar(junto))) return true;
        if (todasCortas && malo(junto, estricto)) return true;
        if (alguna && junto.length >= 5 && malo(junto, estricto)) return true;
      }
    }
    return false;
  }

  function pegado(tokens) {
    let plano = tokens.join('').replace(/[*#]/g, '');
    INOCENTES_DENTRO.forEach((w) => { plano = plano.split(w).join('|'); });
    const col = colapsar(plano);
    if (FUERTES.some((r) => col.includes(colapsar(r)))) return true;
    if (INICIO.some((r) => col.startsWith(colapsar(r)))) return true;
    if (FIN.some((r) => col.endsWith(colapsar(r)))) return true;
    return false;
  }

  function revisarVista(v, estricto) {
    const tokens = v.match(/[a-z]+(?:[*#]+[a-z]+)*/g) || [];
    for (const t of tokens) {
      if (/[*#]/.test(t)) { if (mascara(t)) return true; continue; }
      if (t.length >= 3 && malo(t, estricto)) return true;
    }
    if (ventanas(tokens, estricto)) return true;
    const frase = ' ' + tokens.join(' ') + ' ';
    if (FRASES.some((f) => frase.includes(f))) return true;
    if (estricto && pegado(tokens)) return true;
    return false;
  }

  function otrosAlfabetos(texto) {
    const crudo = String(texto || '').replace(INVISIBLES, '').normalize('NFKC').toLowerCase();
    if (crudo.includes('🖕')) return true;
    const limpio = crudo.replace(/[\u064b-\u065f\u0640]/g, '').replace(/[\s\p{P}\p{S}_\d]+/gu, '');
    return OTROS_ALFABETOS.some((p) => limpio.includes(p));
  }

  function esOfensivo(texto, estricto) {
    if (!texto) return false;
    if (otrosAlfabetos(texto)) return true;
    return vistas(texto).some((v) => revisarVista(v, !!estricto));
  }

  function revisarTexto(texto, campo) {
    const ofensivo = esOfensivo(texto, campo === 'nombre');
    if (!ofensivo) return { ok: true };
    return {
      ok: false,
      motivo: campo === 'nombre'
        ? 'Ese nombre contiene palabras no permitidas. Elige uno respetuoso.'
        : 'Tu mensaje contiene lenguaje inapropiado. Cámbialo para poder enviarlo.'
    };
  }

  const TF_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4/dist/tf.min.js';
  const NSFW_URL = 'https://cdn.jsdelivr.net/npm/nsfwjs@4/dist/browser/nsfwjs.min.js';
  const PERMITIR_SI_FALLA = true;
  let modeloPromesa = null;

  function cargarScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.crossOrigin = 'anonymous'; s.onload = res; s.onerror = () => { s.remove(); rej(new Error('No se pudo cargar ' + src)); };
      document.head.appendChild(s);
    });
  }

  function conTiempo(p, ms, texto) {
    return Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error(texto)), ms))]);
  }

  async function cargarConReintento(src) {
    try { await cargarScript(src); } catch (e) { await new Promise((ok) => setTimeout(ok, 800)); await cargarScript(src); }
  }

  function cargarModelo() {
    if (!modeloPromesa) {
      modeloPromesa = conTiempo((async () => {
        if (!window.tf) await cargarConReintento(TF_URL);
        if (!window.nsfwjs) await cargarConReintento(NSFW_URL);
        return window.nsfwjs.load();
      })(), 30000, 'El modelo tardó demasiado en cargar');
      modeloPromesa.catch((e) => { console.error('[moderación] modelo', e); modeloPromesa = null; });
    }
    return modeloPromesa;
  }

  async function analizarImagen(dataUrl) {
    const img = new Image();
    img.src = dataUrl;
    try { await img.decode(); } catch (e) { console.error('[moderación] imagen', e); throw e; }
    const modelo = await cargarModelo();
    let pred;
    try { pred = await modelo.classify(img); } catch (e) { console.error('[moderación] clasificar', e); throw e; }
    const p = (n) => (pred.find((x) => x.className === n) || { probability: 0 }).probability;
    if (p('Porn') + p('Hentai') >= 0.45 || p('Sexy') >= 0.75) {
      return { ok: false, motivo: 'Esa imagen parece contener contenido inapropiado y no se puede subir.' };
    }
    return { ok: true };
  }

  async function revisarImagen(dataUrl) {
    aviso('Revisando la imagen…', 0);
    let r;
    try {
      r = await analizarImagen(dataUrl);
    } catch (e) {
      if (PERMITIR_SI_FALLA) { ocultarAviso(); return true; }
      aviso('No pudimos verificar la imagen. Revisa tu conexión e inténtalo de nuevo.');
      return false;
    }
    if (!r.ok) { aviso(r.motivo); return false; }
    ocultarAviso();
    return true;
  }

  let toast = null;
  let temporizador = null;

  function aviso(mensaje, ms) {
    if (!toast) {
      const st = document.createElement('style');
      st.textContent =
        '.bio-toast{position:fixed;left:50%;bottom:26px;transform:translate(-50%,20px);max-width:min(92vw,420px);' +
        'background:#3d4726;color:#faf6ea;padding:12px 18px;border-radius:12px;font:600 .9rem/1.4 Karla,system-ui,sans-serif;' +
        'box-shadow:0 12px 30px -10px rgba(0,0,0,.5);opacity:0;visibility:hidden;transition:all .2s ease;z-index:1200;text-align:center}' +
        '.bio-toast.show{opacity:1;visibility:visible;transform:translate(-50%,0)}' +
        '.bio-toast.error{background:#b4573a}';
      document.head.appendChild(st);
      toast = document.createElement('div');
      toast.className = 'bio-toast';
      toast.setAttribute('role', 'alert');
      document.body.appendChild(toast);
    }
    clearTimeout(temporizador);
    toast.textContent = mensaje;
    toast.classList.toggle('error', ms !== 0);
    toast.classList.add('show');
    if (ms !== 0) temporizador = setTimeout(ocultarAviso, ms || 4500);
  }

  function ocultarAviso() {
    if (toast) toast.classList.remove('show');
  }

  function precargar() { cargarModelo().catch(() => {}); }

  return { revisarTexto, esOfensivo, revisarImagen, aviso, ocultarAviso, precargar };
})();
