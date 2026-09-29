export const provinces = {
  "Kigali City": ["Gasabo", "Kicukiro", "Nyarugenge"],
  "Northern": ["Musanze", "Gicumbi", "Burera"],
  "Southern": ["Huye", "Muhanga", "Nyanza"],
  "Eastern": ["Rwamagana", "Kayonza", "Bugesera"],
  "Western": ["Rubavu", "Rusizi", "Karongi"]
};

export const sectorsByDistrict = {
  "Gasabo": ["Remera", "Kimironko", "Gisozi", "Kacyiru"],
  "Kicukiro": ["Gahanga", "Niboye", "Kigarama"],
  "Nyarugenge": ["Nyarugenge", "Nyamirambo", "Biryogo"],
  "Musanze": ["Muhoza", "Kinigi", "Cyuve"],
  "Rubavu": ["Gisenyi", "Rubavu", "Rugerero"],
  "Huye": ["Ngoma", "Tumba", "Mukura"],
  "Gicumbi": ["Byumba", "Kaniga"]
};

const U = 'https://images.unsplash.com/';
export const IMG = {
  1: U + 'photo-1629016943072-0bf0ce4e2608', // green plot with trees
  2: U + 'photo-1560493676-04071c5f467b', // crop rows at sunset
  3: U + 'photo-1580587771525-78b9dba3b914', // finished family house
  4: U + 'photo-1594760910270-8720de623883', // green field with houses
  5: U + 'photo-1512917774080-9991f1c4c750', // premium building w/ pool
  6: U + 'photo-1605146769289-440113cc3d00', // house shell / modern build
  7: U + 'photo-1511452885600-a3d2c9148a31', // commercial building
  8: U + 'photo-1609412058473-c199497c3c5d'  // terraced hillside
};

export const XTRA = [
  U + 'photo-1523217582562-09d0def993a6',
  U + 'photo-1600596542815-ffad4c1539a9',
  U + 'photo-1628624747186-a941c476b7ef'
];

export const initialListings = [
  {
    id: 1,
    title: "Residential plot with mountain view",
    type: "plot",
    price: 18500000,
    size: "600 m²",
    upi: "1/02/09/04/432",
    prov: "Kigali City",
    dist: "Gasabo",
    sect: "Remera",
    cell: "Rukiri I",
    vill: "Amajyambere",
    blocker: "Habimana J. · K7X2PM",
    blockerPhone: "+250 788 456 210",
    ownerPhone: "+250 722 903 114",
    cls: "t1",
    ic: "🌄",
    vip: false,
    status: "approved",
    desc: "Flat, titled plot in a fast-growing Remera neighbourhood. Water and electricity at the boundary; 5 minutes from the main road."
  },
  {
    id: 2,
    title: "Fertile farm land, 2 hectares",
    type: "land",
    price: 9200000,
    size: "20,000 m²",
    upi: "4/07/01/02/118",
    prov: "Northern",
    dist: "Musanze",
    sect: "Muhoza",
    cell: "Ruhengeri",
    vill: "Kigombe",
    blocker: "Habimana J. · K7X2PM",
    blockerPhone: "+250 788 456 210",
    ownerPhone: "+250 722 903 115",
    cls: "t3",
    ic: "🌿",
    vip: false,
    status: "approved",
    desc: "Volcanic-soil farmland ideal for potatoes and vegetables, with year-round stream access and road frontage."
  },
  {
    id: 3,
    title: "4-bedroom family house, finished",
    type: "house",
    price: 62000000,
    size: "280 m² built",
    upi: "1/02/07/11/067",
    prov: "Kigali City",
    dist: "Gasabo",
    sect: "Kimironko",
    cell: "Bibare",
    vill: "Karisimbi",
    blocker: "Uwera A. · M3Q8RT",
    blockerPhone: "+250 788 998 123",
    ownerPhone: "+250 722 112 334",
    cls: "t2",
    ic: "🏡",
    vip: false,
    status: "approved",
    desc: "Modern finished house with annex, paved compound, and water tank. Quiet cell near Kimironko market."
  },
  {
    id: 4,
    title: "Lakeside plot, 800 m²",
    type: "plot",
    price: 14000000,
    size: "800 m²",
    upi: "3/01/02/09/221",
    prov: "Western",
    dist: "Rubavu",
    sect: "Gisenyi",
    cell: "Mbugangari",
    vill: "Rukoko",
    blocker: "Divine K. · P9W4LN",
    blockerPhone: "+250 783 221 990",
    ownerPhone: "+250 728 554 112",
    cls: "t1",
    ic: "🌊",
    vip: false,
    status: "approved",
    desc: "Rare plot 400 m from Lake Kivu shoreline, in the tourism development corridor of Rubavu."
  },
  {
    id: 5,
    title: "Commercial corner plot — CBD edge",
    type: "plot",
    price: 145000000,
    size: "1,200 m²",
    upi: "1/01/01/03/009",
    prov: "Kigali City",
    dist: "Nyarugenge",
    sect: "Nyarugenge",
    cell: "Biryogo",
    vill: "Isoko",
    blocker: "Uwera A. · M3Q8RT",
    blockerPhone: "+250 788 998 123",
    ownerPhone: "+250 722 887 441",
    cls: "t4",
    ic: "🏢",
    vip: false,
    status: "approved",
    desc: "Corner plot zoned commercial at the CBD edge — suitable for mixed-use development."
  },
  {
    id: 6,
    title: "House under construction, 70% done",
    type: "house",
    price: 28000000,
    size: "180 m² built",
    upi: "2/05/03/01/154",
    prov: "Southern",
    dist: "Huye",
    sect: "Ngoma",
    cell: "Butare",
    vill: "Matyazo",
    blocker: "Nsengimana P. · Q2Z7VB",
    blockerPhone: "+250 785 110 994",
    ownerPhone: "+250 721 663 881",
    cls: "t2",
    ic: "🧱",
    vip: false,
    status: "approved",
    desc: "Roofed structure on titled land near Huye campus — finish it your way. Price reflects remaining works."
  },
  {
    id: 7,
    title: "Auction opportunity — warehouse plot",
    type: "plot",
    price: 88000000,
    size: "2,400 m²",
    upi: "1/03/06/02/077",
    prov: "Kigali City",
    dist: "Kicukiro",
    sect: "Gahanga",
    cell: "Karembure",
    vill: "Nunga",
    blocker: "Divine K. · P9W4LN",
    blockerPhone: "+250 783 221 990",
    ownerPhone: "+250 725 441 332",
    cls: "t3",
    ic: "🏗️",
    vip: false,
    status: "approved",
    desc: "Below-market industrial plot from a judicial auction (Cyamunara) — documentation verified."
  },
  {
    id: 8,
    title: "Terraced hillside land, 1 ha",
    type: "land",
    price: 6500000,
    size: "10,000 m²",
    upi: "4/02/08/05/301",
    prov: "Northern",
    dist: "Gicumbi",
    sect: "Byumba",
    cell: "Gacurabwenge",
    vill: "Nyarutovu",
    blocker: "Habimana J. · K7X2PM",
    blockerPhone: "+250 788 456 210",
    ownerPhone: "+250 722 009 554",
    cls: "t1",
    ic: "⛰️",
    vip: false,
    status: "approved",
    desc: "Terraced agricultural land with eucalyptus boundary; suits tea, horticulture, or future subdivision."
  }
];

export const initialBlockerQueue = [
  { id: 'bq1', name: 'Uwase Marie', nid: '1 1998 8 001421 1 09', area: 'Kacyiru, Gasabo', agreement: true },
  { id: 'bq2', name: 'Nsengimana Paul', nid: '1 1991 8 003310 1 42', area: 'Huye town', agreement: true }
];

export const initialListingQueue = [
  { id: 'lq1', property: 'Farm land 2 ha — Musanze', blocker: 'Habimana J. (K7X2PM)', doc: 'title_scan.pdf' },
  { id: 'lq2', property: 'Commercial plot — Nyarugenge', blocker: 'Uwera A. (M3Q8RT)', doc: 'upi_cert.pdf' }
];

export const certifiedPartners = [
  { id: 1, name: 'Jean-Bosco N.', role: 'Surveyor', district: 'Gasabo District', cert: 'Cert. RW-SUR-0142', icon: '📐', desc: 'Land measurement & UPI boundary verification' },
  { id: 2, name: 'Me. Claudine U.', role: 'Notary', district: 'Kicukiro District', cert: 'Cert. RW-NOT-0089', icon: '⚖️', desc: 'Sale agreements & land title transfer' },
  { id: 3, name: 'Eric M.', role: 'Engineer', district: 'Musanze District', cert: 'Cert. RW-ENG-0311', icon: '🏗️', desc: 'Construction assessment & house valuation' },
  { id: 4, name: 'Divine K.', role: 'Surveyor', district: 'Rubavu District', cert: 'Cert. RW-SUR-0277', icon: '📐', desc: 'Topographic surveys for plots & farms' }
];

export const i18n = {
  en: {
    nav_home: "Home",
    nav_browse: "Browse",
    nav_membership: "Membership",
    nav_partners: "Partners",
    nav_blocker: "Become a Blocker",
    hero_title: "Find land. Find home. Guraaha!",
    hero_sub: "Verified plots, land and houses across every province, district and sector of Rwanda — posted by approved local agents.",
    search: "Search",
    st1: "Listings",
    st2: "Verified blockers",
    st3: "Contacts unlocked",
    feat: "Featured listings",
    how: "How GuraAha works",
    h1t: "Search by location",
    h1p: "Drill down Province → District → Sector → Cell → Village to find land where you want it.",
    h2t: "View full details",
    h2p: "Photos, size, UPI number, price and the neighbourhood's investment highlights — all free.",
    h3t: "Unlock contact via MoMo",
    h3p: "Pay 100 RWF for the agent's number or 200 RWF for the owner's — instantly by mobile money.",
    h4t: "Meet & buy safely",
    h4p: "Every agent is identity-verified with a unique code. Certified surveyors & notaries in our directory."
  },
  rw: {
    nav_home: "Ahabanza",
    nav_browse: "Reba amatangazo",
    nav_membership: "Abanyamuryango",
    nav_partners: "Abafatanyabikorwa",
    nav_blocker: "Ba Umukommissiyoneri",
    hero_title: "Shaka ubutaka. Shaka inzu. Guraaha!",
    hero_sub: "Ubutaka n'amazu byemejwe mu ntara zose, uturere n'imirenge y'u Rwanda — bitangazwa n'abakommissiyoneri bemewe.",
    search: "Shakisha",
    st1: "Amatangazo",
    st2: "Abakommissiyoneri bemewe",
    st3: "Nimero zabonetse",
    feat: "Amatangazo akomeye",
    how: "Uko GuraAha ikora",
    h1t: "Shakisha aho biherereye",
    h1p: "Reba Intara → Akarere → Umurenge → Akagari → Umudugudu ushake ubutaka aho ubyifuza.",
    h2t: "Reba amakuru yose",
    h2p: "Amafoto, ingano, nimero ya UPI, igiciro n'amahirwe y'ishoramari — byose ku buntu.",
    h3t: "Fungura nimero ukoresheje MoMo",
    h3p: "Ishyura 100 RWF ubone nimero y'umukommissiyoneri cyane 200 RWF ubone iy'nyirabyo — kuri MoMo.",
    h4t: "Huza kandi ugure utekanye",
    h4p: "Buri mukommissiyoneri ari ku rutonde ku kode yihariye. Aba-noteri n'abapima ubutaka bemewe."
  },
  fr: {
    nav_home: "Accueil",
    nav_browse: "Annonces",
    nav_membership: "Abonnements",
    nav_partners: "Partenaires",
    nav_blocker: "Devenir agent",
    hero_title: "Trouvez un terrain. Trouvez une maison. Guraaha!",
    hero_sub: "Parcelles, terrains et maisons vérifiés dans chaque province, district et secteur du Rwanda — publiés par des agents agréés.",
    search: "Rechercher",
    st1: "Annonces",
    st2: "Agents vérifiés",
    st3: "Contacts débloqués",
    feat: "Annonces en vedette",
    how: "Comment fonctionne GuraAha",
    h1t: "Recherche par lieu",
    h1p: "Parcourez Province → District → Secteur → Cellule → Village pour trouver des biens.",
    h2t: "Voir tous les détails",
    h2p: "Photos, superficie, numéro UPI, prix et points forts du quartier — gratuitement.",
    h3t: "Débloquer le contact via MoMo",
    h3p: "Payez 100 RWF pour le numéro de l'agent ou 200 RWF pour celui du propriétaire par MoMo.",
    h4t: "Rencontrez et achetez en confiance",
    h4p: "Chaque agent est vérifié avec un code unique. Géomètres et notaires certifiés dans notre annuaire."
  }
};
