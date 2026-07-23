// Gemeinsame VK-Preisdaten für index.html (Browser) und api/commission.js (Node).
// Einzige Quelle der Wahrheit fuer CATEGORIES/ONETIME/AUTO_ONBOARDING.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PRICING_DATA = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  "use strict";

  const CATEGORIES = [
    { id:'basis', title:'Basis Servicevereinbarung', mode:'radio', items:[
      { id:'standard', label:'Standard', price:150, note:'Rabattmöglichkeiten: unter 75 User max. 30 %, unter 50 User max. 50 %' },
      { id:'premium', label:'Premium (inkl. Schwachstellenscan)', price:200 }
    ]},
    { id:'m365', title:'M365 Security', mode:'qty', items:[
      { id:'tpe', label:'Hornetsecurity Total Protection Enterprise', sub:'TPE — Plan 2', price:4.5, unit:'Mailbox' },
      { id:'tpeb', label:'Hornetsecurity Total Protection Enterprise Backup', sub:'TPEB — Plan 3', price:7, unit:'Mailbox' },
      { id:'sat', label:'Hornetsecurity Security Awareness Training', sub:'SAT', price:2, unit:'User' },
      { id:'tpca', label:'Hornetsecurity Total Protection Enterprise Backup', sub:'TPCA — Plan 4 new', price:12, unit:'Mailbox' },
      { id:'itdr', label:'managed Identity Protection & Response (ITDR)', sub:'pro M365 User / lizenziertem Postfach', price:2.9, unit:'Postfach' }
    ]},
    { id:'network', title:'Managed Network', mode:'qty', items:[
      { id:'ubi1', label:'managed Ubiquiti Network', sub:'1–9 Geräte', price:40, unit:'Netzwerk' },
      { id:'ubi2', label:'managed Ubiquiti Network', sub:'10–24 Geräte', price:75, unit:'Netzwerk' },
      { id:'ubi3', label:'managed Ubiquiti Network', sub:'25–49 Geräte', price:150, unit:'Netzwerk' }
    ]},
    { id:'workplace', title:'Workplace 365', mode:'qty', items:[
      { id:'wp365', label:'Workplace 365', price:59, unit:'User', sub:'Bundle aus M365 BP, Hornet Plan 4 new, managed Client' }
    ]},
    { id:'backup', title:'Managed Backup', mode:'qty', items:[
      { id:'vmlic', label:'Backup Lizenz pro VM', sub:'Hornet VM Backup', price:12, unit:'VM' },
      { id:'bstd', label:'managed Backup Standard', sub:'pro Backupserver, Veeam / Hornet VM Backup', price:150, unit:'Backupserver' },
      { id:'s3', label:'S3 Immutable Cloud', sub:'Deutsches RZ – Impossible Cloud Hamburg', price:20, unit:'TB' },
      { id:'terra', label:'Terra Backup Paket', sub:'5 VM / 500 GB', price:79, unit:'Paket' }
    ]},
    { id:'server', title:'Managed Server / Managed Client', mode:'qty', items:[
      { id:'server', label:'Managed Server', unit:'Server', note:'Rabattierung ab 5 Server 10 % / ab 10 Server 20 % / ab 25 Server 40 %',
        tiered:[ {max:4, price:50, label:'1–4 Server'}, {max:9, price:45, label:'5–9 Server'}, {max:24, price:40, label:'10–24 Server'}, {max:Infinity, price:30, label:'25+ Server'} ] },
      { id:'client', label:'Managed Client', price:9, unit:'Client' }
    ]},
    { id:'security', title:'Managed Security', mode:'qty', items:[
      { id:'fwbd', label:'managed Firewall — Black Dwarf Pro', sub:'max. 15 User', price:139, unit:'Firewall' },
      { id:'fwrc100', label:'managed Firewall — RC100', sub:'max. 25 User', price:199, unit:'Firewall' },
      { id:'fwrc100c', label:'managed Firewall — RC100 Cluster', sub:'max. 25 User', price:259, unit:'Firewall' },
      { id:'fwrc200', label:'managed Firewall — RC200', sub:'max. 50 User', price:229, unit:'Firewall' },
      { id:'fwrc200c', label:'managed Firewall — RC200 Cluster', sub:'max. 50 User', price:299, unit:'Firewall' },
      { id:'dns', label:'Blueshield DNS Filter', price:3.33, unit:'User' },
      { id:'edr', label:'managed Endpoint Detection & Response', price:6.9, unit:'Client / Server', note:'Rabattierung ab 50 Geräten möglich' },
      { id:'siem', label:'managed SIEM', sub:'Client / Server / Firewall, …', price:3.5, unit:'Einheit', note:'Rabattierung ab 50 Quellen möglich' }
    ]},
    { id:'monitoring', title:'Managed Monitoring', mode:'qty', items:[
      { id:'mon25', label:'25 Sensoren', price:50, unit:'Paket' },
      { id:'mon50', label:'50 Sensoren', price:75, unit:'Paket' },
      { id:'mon100', label:'100 Sensoren', price:100, unit:'Paket' }
    ]},
    { id:'serviceagreement', title:'Service Agreement', mode:'qty', items:[
      { id:'saUser', label:'Service Agreement — User', price:60, unit:'User' },
      { id:'saServer', label:'Service Agreement — Server', price:75, unit:'Server' }
    ]}
  ];

  const ONETIME = [
    { id:'support', label:'Support-Stunde (Stundenpaket)', price:125, unit:'Stunde' },
    { id:'onbDns', label:'Onboarding Blueshield DNS Filter', price:300, unit:'Pauschale' },
    { id:'onbS3', label:'Einrichtung Immutable S3 Storage', price:200, unit:'Pauschale' },
    { id:'onbServer', label:'Onboarding managed Server', dynamic:'server', cap:400 },
    { id:'onbClient', label:'Onboarding managed Client', dynamic:'client', cap:250 }
  ];

  // Onboarding-Pauschalen, die automatisch ausgelöst werden, sobald mindestens
  // eine der verknüpften Positionen (triggerIds) eine Anzahl > 0 hat.
  const AUTO_ONBOARDING = [
    { id:'onbP23', label:'Onboarding Hornetsecurity Plan 2 / Plan 3', price:800, triggerIds:['tpe','tpeb'] },
    { id:'onbSat', label:'Onboarding Hornetsecurity Security Awareness Training', price:500, triggerIds:['sat'] },
    { id:'onbP4', label:'Onboarding Hornetsecurity Plan 4', price:1300, triggerIds:['tpca'] },
    { id:'onbNetwork', label:'Onboarding Managed Network', price:200, triggerIds:['ubi1','ubi2','ubi3'] },
    { id:'onbBackup', label:'Onboarding Managed Backup', price:200, triggerIds:['vmlic','bstd','s3','terra'] },
    { id:'onbFirewall', label:'Onboarding Managed Firewall', price:200, triggerIds:['fwbd','fwrc100','fwrc100c','fwrc200','fwrc200c'] },
    { id:'onbEdr', label:'Onboarding managed Endpoint Detection & Response', price:800, triggerIds:['edr'] },
    { id:'onbItdr', label:'Onboarding managed ITDR', price:500, triggerIds:['itdr'] },
    { id:'onbSiem', label:'Onboarding managed SIEM', price:500, triggerIds:['siem'] },
    { id:'onbMonitoring', label:'Onboarding managed Monitoring', price:200, triggerIds:['mon25','mon50','mon100'] }
  ];

  return { CATEGORIES, ONETIME, AUTO_ONBOARDING };
}));
