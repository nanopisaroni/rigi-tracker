// Vercel Serverless Function — registro de proveedores para la Ronda RIGI de Tecnópolis.
//
// Guarda en Postgres (misma base que los sitios de libros, con tabla propia).
// El CUIT es la llave: si la misma empresa se registra dos veces, se actualiza
// la fila en lugar de duplicarla.
const { Pool } = require('pg');

const TABLA = 'proveedores_ronda';
const ORIGEN = 'ronda-tecnopolis-2026';

let pool;
let ready = false;

function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error('Falta DATABASE_URL/POSTGRES_URL');
    pool = new Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
      max: 1,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

async function ensureTable() {
  if (ready) return;
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS ${TABLA} (
      cuit        TEXT PRIMARY KEY,
      empresa     TEXT NOT NULL,
      rubro       TEXT,
      provincia   TEXT,
      email       TEXT NOT NULL,
      telefono    TEXT,
      proyecto    TEXT,
      mensaje     TEXT,
      origen      TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  ready = true;
}

const limpiar = (v, max = 200) =>
  typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '';

const soloDigitos = (v) => limpiar(v, 30).replace(/\D/g, '');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Solo POST' });
    return;
  }

  const b = req.body || {};

  // trampa para bots: si el campo oculto viene con algo, es basura
  if (limpiar(b._hp, 20)) {
    res.status(200).json({ ok: true });
    return;
  }

  const empresa = limpiar(b.empresa, 160);
  const cuit = soloDigitos(b.cuit);
  const rubro = limpiar(b.rubro, 80);
  const provincia = limpiar(b.provincia, 80);
  const email = limpiar(b.email, 160).toLowerCase();
  const telefono = limpiar(b.telefono, 40);
  const proyecto = limpiar(b.proyecto, 120);
  const mensaje = limpiar(b.mensaje, 600);

  const errores = [];
  if (empresa.length < 2) errores.push('empresa');
  if (cuit.length !== 11) errores.push('cuit');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) errores.push('email');
  if (!rubro) errores.push('rubro');
  if (!provincia) errores.push('provincia');
  if (errores.length) {
    res.status(400).json({ ok: false, error: 'Revisá estos campos: ' + errores.join(', ') });
    return;
  }

  try {
    await ensureTable();
    await getPool().query(
      `INSERT INTO ${TABLA}
         (cuit, empresa, rubro, provincia, email, telefono, proyecto, mensaje, origen)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (cuit) DO UPDATE SET
         empresa    = EXCLUDED.empresa,
         rubro      = EXCLUDED.rubro,
         provincia  = EXCLUDED.provincia,
         email      = EXCLUDED.email,
         telefono   = EXCLUDED.telefono,
         proyecto   = EXCLUDED.proyecto,
         mensaje    = EXCLUDED.mensaje,
         updated_at = now()`,
      [cuit, empresa, rubro, provincia, email, telefono, proyecto, mensaje, ORIGEN]
    );
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('proveedores:', e && e.message);
    res.status(500).json({ ok: false, error: 'No pudimos guardar el registro. Probá de nuevo.' });
  }
};
