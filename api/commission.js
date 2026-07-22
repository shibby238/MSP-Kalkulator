// Vercel Serverless Function: berechnet die Provision serverseitig.
// EK-Preise, Provisionssatz und Marge verlassen diese Function NIE –
// die Antwort an den Client enthält ausschließlich den fertigen Betrag.
const { createClient } = require('@supabase/supabase-js');
const { CATEGORIES } = require('../pricing-data.js');

function tierFor(item, q) {
  if (!item.tiered) return null;
  for (const t of item.tiered) if (q <= t.max) return t;
  return item.tiered[item.tiered.length - 1];
}

function vkUnitPrice(item, q) {
  return item.tiered ? tierFor(item, q).price : item.price;
}

function buildEkLookup(flatCosts, tieredCosts) {
  const flat = {};
  (flatCosts || []).forEach(row => { flat[row.item_id] = Number(row.ek_price) || 0; });

  const tiered = {};
  (tieredCosts || []).forEach(row => {
    const list = tiered[row.item_id] || (tiered[row.item_id] = []);
    list.push({ max: row.max === null ? Infinity : Number(row.max), price: Number(row.ek_price) || 0 });
  });
  Object.values(tiered).forEach(list => list.sort((a, b) => a.max - b.max));

  return function ekUnitPrice(item, q) {
    if (item.tiered) {
      const tiers = tiered[item.id];
      if (!tiers || !tiers.length) return 0;
      for (const t of tiers) if (q <= t.max) return t.price;
      return tiers[tiers.length - 1].price;
    }
    return flat[item.id] || 0;
  };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    res.status(500).json({ error: 'Server nicht konfiguriert' });
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData || !userData.user) {
    res.status(401).json({ error: 'Ungültige Sitzung' });
    return;
  }

  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .select('commission_rate')
    .eq('id', userData.user.id)
    .single();

  if (partnerError || !partner) {
    res.status(403).json({ error: 'Kein Partnerkonto hinterlegt' });
    return;
  }

  const body = req.body || {};
  const selections = body.selections || {};
  const adjust = body.adjust || {};

  const [{ data: flatCosts }, { data: tieredCosts }] = await Promise.all([
    supabase.from('item_costs').select('item_id, ek_price'),
    supabase.from('item_costs_tiered').select('item_id, max, ek_price')
  ]);

  const ekUnitPrice = buildEkLookup(flatCosts, tieredCosts);

  // Nur die monatlich wiederkehrenden Positionen (CATEGORIES) fließen in die
  // Provision ein, keine einmaligen Onboarding-Pauschalen (ONETIME/AUTO_ONBOARDING).
  let vkTotal = 0;
  let ekTotal = 0;

  CATEGORIES.forEach(cat => {
    cat.items.forEach(item => {
      const q = Number(selections[item.id]) || 0;
      if (q <= 0) return;
      const pct = Number(adjust[item.id]) || 0;
      const adjFactor = 1 + (pct / 100);
      vkTotal += q * vkUnitPrice(item, q) * adjFactor;
      ekTotal += q * ekUnitPrice(item, q);
    });
  });

  const rate = Number(partner.commission_rate) || 0;
  const commission = Math.max(0, (vkTotal - ekTotal) * rate);

  res.status(200).json({ commission: Math.round(commission * 100) / 100 });
};
