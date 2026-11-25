-- Migration 026: Full Prototype Alignment (Categories, Sub-types, Sale/Rent, Featured, Blocker Username, Area Highlights, Audit Logs, News Seed)

-- 1. Listings enhancements: deal (sale/rent), rental_terms, is_featured, wider type/category/sub_type columns
ALTER TABLE listings ADD COLUMN IF NOT EXISTS deal VARCHAR(10) NOT NULL DEFAULT 'sale';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rental_terms TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE listings ALTER COLUMN type TYPE VARCHAR(100);
ALTER TABLE listings ALTER COLUMN category TYPE VARCHAR(100);
ALTER TABLE listings ALTER COLUMN sub_type TYPE VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_listings_deal ON listings(deal);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(is_featured);

-- 2. Users & Blocker Profiles enhancements: username, must_change_password, last_login_at, area_text
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(60);
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower
    ON users (LOWER(username))
    WHERE username IS NOT NULL;

ALTER TABLE blocker_profiles ADD COLUMN IF NOT EXISTS area_text VARCHAR(255);

-- 3. Payments: allow REFUNDED status
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check
    CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'));

-- 4. Partners: add certification_number and district_name
ALTER TABLE partners ADD COLUMN IF NOT EXISTS certification_number VARCHAR(100);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS district_name VARCHAR(100);

-- 5. Subscriptions: add alert_districts and subscriber_name/phone for admin-comped subscriptions
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS alert_districts TEXT DEFAULT 'All of Rwanda';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS subscriber_name VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS subscriber_phone VARCHAR(40);

-- 6. News Articles: add audience & is_pushed, update default author_name to Guraaha
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS audience VARCHAR(50) DEFAULT 'Everyone';
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS is_pushed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE news_articles ALTER COLUMN author_name SET DEFAULT 'Guraaha Insights team';

-- 7. Property Categories & Sub-types (Database-driven, Admin-managed)
CREATE TABLE IF NOT EXISTS property_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_rw VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    badge_class VARCHAR(40) NOT NULL DEFAULT 'b-land',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS property_subtypes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES property_categories(id) ON DELETE CASCADE,
    slug VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_rw VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_category_subtype_slug UNIQUE (category_id, slug)
);

-- Seed the 7 prototype categories
INSERT INTO property_categories (slug, name_en, name_rw, name_fr, badge_class, sort_order)
VALUES
    ('Commercial', 'Commercial', 'Ubucuruzi', 'Commercial', 'b-com', 1),
    ('Residential', 'Residential', ' guturamo', 'Résidentiel', 'b-res', 2),
    ('Land and Plots', 'Land and Plots', 'Ubutaka n''ibibanza', 'Terrains et parcelles', 'b-land', 3),
    ('Eco Tourism', 'Eco Tourism', 'Ubukerarugendo', 'Écotourisme', 'b-eco', 4),
    ('Industrial', 'Industrial', 'Inganda', 'Industriel', 'b-ind', 5),
    ('Luxury', 'Luxury', 'Inzu zihenze', 'Luxe', 'b-lux', 6),
    ('Real Estate Developments', 'Real Estate Developments', 'Imishinga y''imyubakire', 'Projets immobiliers', 'b-dev', 7)
ON CONFLICT (slug) DO UPDATE
SET
    name_en = EXCLUDED.name_en,
    name_rw = CASE WHEN EXCLUDED.slug = 'Residential' THEN 'Inzu zo guturamo' ELSE EXCLUDED.name_rw END,
    name_fr = EXCLUDED.name_fr,
    badge_class = EXCLUDED.badge_class;

UPDATE property_categories SET name_rw = 'Inzu zo guturamo' WHERE slug = 'Residential';

-- Seed prototype sub-types under Commercial and Residential
INSERT INTO property_subtypes (category_id, slug, name_en, name_rw, name_fr, sort_order)
SELECT c.id, s.slug, s.name_en, s.name_rw, s.name_fr, s.sort_order
FROM property_categories c
JOIN (
    VALUES
        ('Commercial', 'Offices', 'Offices', 'Ibiro', 'Bureaux', 1),
        ('Commercial', 'Shops', 'Shops', 'Amaduka', 'Boutiques', 2),
        ('Commercial', 'Warehouses', 'Warehouses', 'Ububiko (Stoke)', 'Entrepôts', 3),
        ('Commercial', 'Showrooms', 'Showrooms', 'Ahakorerwa imurikagurisha', 'Showrooms', 4),
        ('Residential', 'Apartments', 'Apartments', 'Apartema', 'Appartements', 1),
        ('Residential', 'Houses', 'Houses', 'Amazu', 'Maisons', 2),
        ('Residential', 'Penthouse', 'Penthouse', 'Inzu yo hejuru (Penthouse)', 'Penthouse', 3),
        ('Residential', 'Studios', 'Studios', 'Studio', 'Studios', 4),
        ('Residential', 'Townhouses', 'Townhouses', 'Inzu zegeranye (Townhouses)', 'Maisons de ville', 5)
) AS s(cat_slug, slug, name_en, name_rw, name_fr, sort_order)
ON c.slug = s.cat_slug
ON CONFLICT (category_id, slug) DO NOTHING;

-- 8. Area Investment Highlights table (District / Sector highlights editable by Admin)
CREATE TABLE IF NOT EXISTS area_highlights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_name VARCHAR(100) UNIQUE NOT NULL,
    province_name VARCHAR(100) NOT NULL DEFAULT 'Kigali City',
    highlights_en TEXT NOT NULL,
    highlights_rw TEXT,
    highlights_fr TEXT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO area_highlights (district_name, province_name, highlights_en, highlights_rw, highlights_fr)
VALUES
    (
        'Gasabo',
        'Kigali City',
        'Kigali''s fastest-growing district: new tarmac feeder roads, fibre coverage and schools within 10 minutes. The master plan zones most of Remera, Kimironko and Kacyiru for medium-density residential and mixed use.',
        'Akarere gakura vuba muri Kigali: imihanda mishya ya kaburimbo, interineti yihuta (fibre) n''amashuri mu minota 10. Igishushanyo mbonera gishyira Remera, Kimironko na Kacyiru mu gace k''imiturire n''ubucuruzi.',
        'Le district à la croissance la plus rapide de Kigali : nouvelles routes asphaltées, fibre optique et écoles à moins de 10 minutes. Le plan directeur classe Remera, Kimironko et Kacyiru en zone résidentielle et mixte.'
    ),
    (
        'Bugesera',
        'Eastern',
        'Airport corridor: plot prices rising with the new international airport works. Industrial park and the Nyamata–Rilima road are the main growth drivers.',
        'Igice cy''ikibuga cy''indege: ibiciro by''ibibanza birazamuka kubera imirimo y''ikibuga gishya mpuzamahanga. Icyanya cy''inganda n''umuhanda Nyamata–Rilima nibyo bizamura iterambere.',
        'Corridor aéroportuaire : hausse des prix des parcelles grâce aux travaux du nouvel aéroport international. Le parc industriel et l''axe Nyamata–Rilima tirent la croissance.'
    ),
    (
        'Rubavu',
        'Western',
        'Lake Kivu tourism corridor with hotel, lodge and lakeside residential demand. Cross-border trade with Goma supports commercial rentals.',
        'Agace k''ubukerarugendo ku Kiyaga cya Kivu gafite amahoteri n''amazu yo guturamo ku nkombe. Ubucuruzi bwambukiranya umupaka na Goma butera inkunga ubukode bw''amaduka.',
        'Corridor touristique du lac Kivu avec une forte demande pour les hôtels, lodges et résidences au bord du lac. Le commerce transfrontalier avec Goma soutient les locations commerciales.'
    ),
    (
        'Karongi',
        'Western',
        'Lakeshore land set aside for low-density eco-tourism under the revised district master plan; fast-tracked permits for qualifying projects.',
        'Ubutaka bwo ku nkombe z''ikiyaga bwagenewe ubukerarugendo bubungabunga ibidukikije mu gishushanyo mbonera gishya; impushya zihuse ku mishinga yujuje ibisabwa.',
        'Terrains au bord du lac réservés à l''écotourisme à faible densité selon le plan directeur révisé ; permis accélérés pour les projets éligibles.'
    ),
    (
        'Musanze',
        'Northern',
        'Gateway to Volcanoes National Park: strong demand for tourism, farm land on volcanic soil and shops along the main road.',
        'Irembo ry''aho ingagi ziba muri Pariki y''Ibirunga: ahakenewe cyane ubukerarugendo, ubutaka bwera bw''amakoro n''amaduka ku muhanda mukuru.',
        'Porte d''entrée du Parc National des Volcans : forte demande pour le tourisme, les terres agricoles volcaniques et les commerces sur l''axe principal.'
    )
ON CONFLICT (district_name) DO NOTHING;

-- 9. Audit Logs table for Admin Overview "Recent activity (audit log)"
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO audit_logs (action)
SELECT v.action
FROM (
    VALUES
        ('Settings saved: VIP early-access window = 7 days'),
        ('Categories & sub-types initialized from official Guraaha catalog'),
        ('Platform ready for live listings and blocker verification')
) AS v(action)
WHERE NOT EXISTS (SELECT 1 FROM audit_logs LIMIT 1);

-- 10. Seed additional Homepage & Lotto settings
INSERT INTO settings (key, value, description)
VALUES
    ('lotto_prize_rwf', '250000', 'Monthly Guraaha Lotto prize amount in RWF'),
    ('home_featured_min', '3', 'Minimum number of Featured listings shown on the homepage'),
    ('home_latest_count', '6', 'Number of Latest listings shown on the homepage')
ON CONFLICT (key) DO NOTHING;

-- 11. Seed prototype news articles if news_articles has fewer than 3 articles
INSERT INTO news_articles (topic, title_en, title_rw, title_fr, summary, body_en, body_rw, body_fr, image_url, read_time, author_name, is_published)
SELECT * FROM (
    VALUES
    (
        'Land & plots',
        'Bugesera land prices up 22% in a year as airport works accelerate',
        'Ibiciro by''ubutaka i Bugesera byazamutseho 22% mu mwaka kubera ikibuga cy''indege',
        'Les prix des terrains à Bugesera en hausse de 22% en un an avec l''accélération de l''aéroport',
        'Plots along the Nyamata–Rilima corridor are now trading at 9,000–14,000 RWF per m², with the sharpest rises within 10 km of the airport site.',
        'Guraaha''s listing data for the last twelve months shows that asking prices for titled plots in Nyamata, Rilima and Mayange sectors rose on average 22%, with the fastest growth in plots of 600 to 1,000 m² suitable for residential building.

Buyers are increasingly asking for proof of the parcel''s zoning in the district master plan before unlocking contacts, which is why the Bugesera area page now shows the current land-use layer next to each listing.

## What it means for you
Sellers in Bugesera should expect quicker sales but also more document checks. Buyers should budget for a surveyor visit (around 60,000 RWF) and verify the UPI on the Land Information System before paying any deposit.',
        'Imibare ya Guraaha y''amezi 12 ashize igaragaza ko ibiciro by''ibibanza bifite ibyangombwa mu mirenge ya Nyamata, Rilima na Mayange byazamutseho 22% ku mpuzandengo, cyane cyane ibibanza bya metero kare 600 kugeza kuri 1,000.

Abaguzi barushaho gusaba kureba icyo ubutaka bwagenewe mu gishushanyo mbonera mbere yo gufungura nimero.',
        'Les données de Guraaha sur les douze derniers mois montrent que les prix demandés pour les parcelles titrées à Nyamata, Rilima et Mayange ont augmenté en moyenne de 22%.',
        'https://images.unsplash.com/photo-1486325212027-8081e485255e?q=60&auto=format&fit=crop&w=1200',
        '4 min',
        'Guraaha Insights team',
        TRUE
    ),
    (
        'Construction',
        'Cement and steel prices ease: what a 120 m² house costs to build this quarter',
        'Ibiciro bya sima n''ibyuma byagabanutse: ikiguzi cyo kubaka inzu ya 120 m² muri iki gihembwe',
        'Baisse des prix du ciment et de l''acier : combien coûte la construction d''une maison de 120 m² ce trimestre',
        'After two years of increases, bulk cement is down around 6% and reinforcement bar around 4%. Here is our updated finishing-level cost table.',
        'Builders we work with in Kigali, Musanze and Huye report that a basic-finish 120 m² three-bedroom house now costs roughly 28 to 34 million RWF excluding land, compared with 30 to 37 million at the start of the year.

Mid-range finishes (tiles throughout, aluminium windows, ceiling boards) add 8 to 12 million; upmarket finishes can double the base figure.

## Planning tip
Listings on Guraaha marked "House — under construction" now show the engineer''s estimate of remaining works so you can compare finishing a shell with buying a finished house.',
        'Abubatsi dukorana muri Kigali, Musanze na Huye batangaza ko inzu y''ibyumba bitatu ya 120 m² ubu itwara hagati ya miliyoni 28 na 34 RWF hatabariwemo ikibanza.',
        'Les constructeurs avec lesquels nous travaillons à Kigali, Musanze et Huye indiquent qu''une maison de 120 m² à trois chambres coûte désormais entre 28 et 34 millions RWF hors terrain.',
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=60&auto=format&fit=crop&w=1200',
        '3 min',
        'Guraaha Insights team',
        TRUE
    ),
    (
        'Policy & law',
        'Land transfer (mutation) explained: steps, fees and the documents a notary will ask for',
        'Ihererekanya ry''ubutaka (Mutation) risobanuye: intambwe, amafaranga n''ibyangombwa noteri asaba',
        'Le transfert foncier (mutation) expliqué : étapes, frais et documents demandés par le notaire',
        'A plain-language guide to moving a title from seller to buyer, including the common mistakes that stall a transfer for months.',
        'The transfer starts with a notarised sale agreement, followed by the application for mutation at the district land office, then payment of the applicable fees and issuance of the new title in the buyer''s name.

Most delays come from three causes: a spouse''s consent missing, the parcel still carrying a mortgage, or the seller''s ID not matching the title.

## Use a certified notary
Guraaha''s partner directory lists notaries by district with their certification number, so you can book one before the handshake.',
        'Ihererekanya ritangirana n''amasezerano y''ubugure akorerwa imbere ya noteri, hagakurikiraho gusaba mutation ku biro by''ubutaka by''akarere.',
        'Le transfert commence par un acte de vente notarié, suivi de la demande de mutation au bureau foncier du district, puis du paiement des frais.',
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=60&auto=format&fit=crop&w=1200',
        '5 min',
        'Guraaha Insights team',
        TRUE
    ),
    (
        'Auctions',
        'Cyamunara this month: 31 properties go under the hammer in Kigali, Musanze and Rubavu',
        'Cyamunara muri uku kwezi: imitungo 31 igiye gutezwa cyamunara i Kigali, Musanze na Rubavu',
        'Cyamunara ce mois-ci : 31 biens mis aux enchères à Kigali, Musanze et Rubavu',
        'Judicial auctions can be 20 to 40% below market, but the rules are strict. Here is the calendar and what to check before bidding.',
        'Thirty-one properties, mostly residential plots and partly built houses, are scheduled for auction over the next three weeks. Reserve prices and viewing dates are available on each listing.

Bidders must deposit a guarantee before the sale and pay the balance within the period set by the bailiff; late payment forfeits the deposit.

## Our advice
Always inspect in person and confirm the occupant situation. Auction listings on Guraaha carry a verified-documents badge once our team has checked the file.',
        'Imitungo 31 irimo ibibanza byo guturamo n''amazu ataruzura neza iteganyijwe gutezwa cyamunara mu byumweru bitatu biri imbere.',
        'Trente et un biens, principalement des parcelles résidentielles et des maisons en cours de finition, sont programmés aux enchères au cours des trois prochaines semaines.',
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=60&auto=format&fit=crop&w=1200',
        '2 min',
        'Guraaha Insights team',
        TRUE
    ),
    (
        'Market',
        'Apartments overtake plots as the most-searched category in Kigali City',
        'Apartema zaciye ku bibanza mu bishakishwa cyane mu Mujyi wa Kigali',
        'Les appartements dépassent les parcelles comme catégorie la plus recherchée à Kigali',
        'For the first time, searches for apartments and studios in Gasabo and Kicukiro exceed searches for residential plots. Rental yields of 8 to 11% are driving investors.',
        'Our October search data shows apartments at 31% of Kigali searches versus 27% for plots, with townhouses the fastest-growing category from a small base.

Investors cite predictable rental demand from professionals, lower maintenance and the ability to buy a single unit rather than a whole plot.

## New categories
Guraaha now lists Apartments, Studios, Townhouses and Penthouses as separate sub-types under Residential, so you can filter exactly what you want.',
        'Imibare y''ibishakishwa muri Kigali igaragaza ko apartema zigeze kuri 31% ugereranyije na 27% by''ibibanza.',
        'Nos données de recherche montrent que les appartements représentent 31% des recherches à Kigali contre 27% pour les parcelles.',
        'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=60&auto=format&fit=crop&w=1200',
        '3 min',
        'Guraaha Insights team',
        TRUE
    ),
    (
        'Guraaha',
        'Introducing the VIP Room: see hidden deals 7 days before everyone else',
        'Menya Icyumba cya VIP: reba amahirwe ahishe iminsi 7 mbere y''abandi bose',
        'Découvrez le Salon VIP : accédez aux offres exclusives 7 jours avant tout le monde',
        'VIP subscribers now get early access to below-market and discreet sales, free contact unlocks on those deals, and instant alerts.',
        'Some sellers want a fast, quiet sale and will accept a lower price for it. Until now those deals were traded by word of mouth. The VIP Room brings them onto Guraaha, verified by our team, for subscribers only.

Every VIP deal shows the public price, the VIP price and the reason for the discount, and it moves to the public site after seven days if unsold.

## Pricing
2,500 RWF per week or 8,000 RWF per month, payable by MoMo. Cancel any time.',
        'Abagurisha bamwe baba bashaka kugurisha vuba kandi mu ibanga bagatanga igiciro kiri hasi. Icyumba cya VIP kibagezaho ayo mahirwe yagenzuwe n''ikipe ya Guraaha.',
        'Certains vendeurs souhaitent une vente rapide et discrète à prix réduit. Le Salon VIP les réunit sur Guraaha, vérifiés par notre équipe.',
        'https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=60&auto=format&fit=crop&w=1200',
        '2 min',
        'Guraaha Insights team',
        TRUE
    )
) AS seed_news(topic, title_en, title_rw, title_fr, summary, body_en, body_rw, body_fr, image_url, read_time, author_name, is_published)
WHERE (SELECT COUNT(*) FROM news_articles) < 3;
