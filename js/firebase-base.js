window.BIO_FIREBASE = {
  apiKey: 'AIzaSyB3CYbVDm8h3WzSrsuBCkDvyXkBHOgIlWc',
  authDomain: 'bionyssa-bc317.firebaseapp.com',
  projectId: 'bionyssa-bc317',
  storageBucket: 'bionyssa-bc317.firebasestorage.app',
  messagingSenderId: '1091663971591',
  appId: '1:1091663971591:web:3221e97fd883051bc031a2'
};
window.BioFirebase = (function () {
  var base = 'https://www.gstatic.com/firebasejs/12.19.0/', listo = null, listoAuth = null;
  function configurado() {
    var c = window.BIO_FIREBASE || {};
    return !!(c.apiKey && c.appId) && !/^PEGA/.test(c.apiKey) && !/^PEGA/.test(c.appId);
  }
  function soloAuth() {
    if (!listoAuth) {
      listoAuth = Promise.all([
        import(base + 'firebase-app.js'),
        import(base + 'firebase-auth.js')
      ]).then(function (m) {
        var app = m[0].initializeApp(window.BIO_FIREBASE);
        return { app: app, auth: m[1].getAuth(app), fa: m[1] };
      });
      listoAuth.catch(function () { listoAuth = null; });
    }
    return listoAuth;
  }
  function nucleo() {
    if (!listo) {
      listo = Promise.all([soloAuth(), import(base + 'firebase-firestore.js')]).then(function (m) {
        var a = m[0], ff = m[1], db;
        try {
          db = ff.initializeFirestore(a.app, {
            localCache: ff.persistentLocalCache({ tabManager: ff.persistentMultipleTabManager() })
          });
        } catch (e) { db = ff.getFirestore(a.app); }
        return { app: a.app, auth: a.auth, fa: a.fa, db: db, ff: ff };
      });
      listo.catch(function () { listo = null; });
    }
    return listo;
  }
  async function usar(fn) {
    if (!configurado()) throw { code: 'bio/no-config' };
    var m = await soloAuth();
    return fn(m.auth, m.fa);
  }
  return {
    configurado: configurado,
    nucleo: nucleo,
    auth: soloAuth,
    enviarReset: function (correo) {
      return usar(function (a, f) {
        return f.sendPasswordResetEmail(a, correo, { url: new URL('/paginas/login.html', location.href).href });
      });
    },
    verificarCodigo: function (codigo) { return usar(function (a, f) { return f.verifyPasswordResetCode(a, codigo); }); },
    confirmarReset: function (codigo, clave) { return usar(function (a, f) { return f.confirmPasswordReset(a, codigo, clave); }); },
    entrar: async function (correo, clave) {
      try {
        return await usar(async function (a, f) {
          var r = await f.signInWithEmailAndPassword(a, correo, clave);
          return { nombre: r.user.displayName || '' };
        });
      } catch (e) {
        var sinCuenta = ['auth/invalid-credential', 'auth/invalid-login-credentials', 'auth/user-not-found', 'auth/wrong-password', 'auth/invalid-email'];
        if (e && sinCuenta.indexOf(e.code) > -1) return null;
        return { error: (e && e.code) || 'error' };
      }
    },
    sincronizar: async function (correo, clave, nombre) {
      if (!configurado()) return { ok: false, codigo: 'bio/no-config' };
      try {
        return await usar(async function (a, f) {
          try {
            await f.signInWithEmailAndPassword(a, correo, clave);
            return { ok: true, nuevo: false };
          } catch (e) {
            if (e.code !== 'auth/user-not-found' && e.code !== 'auth/invalid-credential' && e.code !== 'auth/invalid-login-credentials') throw e;
            try {
              var r = await f.createUserWithEmailAndPassword(a, correo, clave);
              if (nombre) { try { await f.updateProfile(r.user, { displayName: nombre }); } catch (x) {} }
              return { ok: true, nuevo: true };
            } catch (e2) {
              if (e2.code === 'auth/email-already-in-use') return { ok: false, codigo: 'existe' };
              throw e2;
            }
          }
        });
      } catch (e) { return { ok: false, codigo: (e && e.code) || 'error' }; }
    }
  };
})();
