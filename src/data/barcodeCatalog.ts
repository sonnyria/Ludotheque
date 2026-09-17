export interface CatalogGame {
  title: string;
  console: string;
  releaseYear?: number;
  publisher?: string;
  developer?: string;
  genre?: string;
  synopsis?: string;
  coverUrl?: string;
  barcode?: string;
  estimatedValue?: number;
}

// Base de données de jeux vidéo physiques vérifiés avec codes-barres officiels (EAN-13 et UPC-12)
export const BARCODE_CATALOG: Record<string, CatalogGame> = {
  // --- NINTENDO SWITCH ---
  '0045496420079': {
    title: 'The Legend of Zelda: Breath of the Wild',
    console: 'Nintendo Switch',
    releaseYear: 2017,
    publisher: 'Nintendo',
    developer: 'Nintendo EPD',
    genre: 'Action-Aventure',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Fc%2Fc6%2FThe_Legend_of_Zelda_Breath_of_the_Wild.jpg',
    estimatedValue: 40,
    synopsis: 'Aventure en monde ouvert réinventant la saga Zelda dans un royaume d\'Hyrule majestueux.'
  },
  '0045496420383': {
    title: 'Mario Kart 8 Deluxe',
    console: 'Nintendo Switch',
    releaseYear: 2017,
    publisher: 'Nintendo',
    developer: 'Nintendo EPD',
    genre: 'Course',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Fb%2Fba%2FMario-Kart-8-Deluxe-Logo.png',
    estimatedValue: 38,
    synopsis: 'La version ultime du jeu de course légendaire avec 48 circuits et tous les personnages.'
  },
  '0045496590741': {
    title: 'Super Mario Odyssey',
    console: 'Nintendo Switch',
    releaseYear: 2017,
    publisher: 'Nintendo',
    developer: 'Nintendo EPD',
    genre: 'Plates-formes / Aventure',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F8%2F8d%2FSuper_Mario_Odyssey.jpg',
    estimatedValue: 35,
    synopsis: 'Voyagez à travers des royaumes 3D captivants aux côtés de Cappy pour sauver la princesse Peach.'
  },
  '045496420871': {
    title: 'Super Mario Odyssey',
    console: 'Nintendo Switch',
    releaseYear: 2017,
    publisher: 'Nintendo',
    developer: 'Nintendo EPD',
    genre: 'Plates-formes / Aventure',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F8%2F8d%2FSuper_Mario_Odyssey.jpg',
    estimatedValue: 35,
    synopsis: 'Voyagez à travers des royaumes 3D captivants aux côtés de Cappy pour sauver la princesse Peach.'
  },
  '0045496428457': {
    title: 'Metroid Dread',
    console: 'Nintendo Switch',
    releaseYear: 2021,
    publisher: 'Nintendo',
    developer: 'MercurySteam',
    genre: 'Metroidvania',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Ff%2Ff7%2FMetroid_Dread_Banner.png',
    estimatedValue: 32,
    synopsis: 'Samus Aran affronte les redoutables robots E.M.M.I. sur la mystérieuse planète ZDR.'
  },
  '0045496422776': {
    title: 'Super Smash Bros. Ultimate',
    console: 'Nintendo Switch',
    releaseYear: 2018,
    publisher: 'Nintendo',
    developer: 'Bandai Namco Studios / Sora Ltd.',
    genre: 'Combat',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F5%2F50%2FSuper_Smash_Bros._Ultimate.jpg',
    estimatedValue: 42,
    synopsis: 'Tous les combattants de l\'histoire de Smash Bros réunis dans des affrontements épiques.'
  },
  '0045496425333': {
    title: 'Animal Crossing: New Horizons',
    console: 'Nintendo Switch',
    releaseYear: 2020,
    publisher: 'Nintendo',
    developer: 'Nintendo EPD',
    genre: 'Simulation',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F1%2F1f%2FAnimal_Crossing_New_Horizons.jpg',
    estimatedValue: 35,
    synopsis: 'Créez votre propre paradis insulaire désert et aménagez-le à votre rythme.'
  },
  '0045496426460': {
    title: "Luigi's Mansion 3",
    console: 'Nintendo Switch',
    releaseYear: 2019,
    publisher: 'Nintendo',
    developer: 'Next Level Games',
    genre: 'Action-Aventure',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F9%2F92%2FLuigi%27s_Mansion_3_box_art.png',
    estimatedValue: 35,
    synopsis: 'Explorez un hôtel hanté étage par étage avec l\'Ectoblast et le fidèle Gluigi.'
  },
  '0045496478957': {
    title: 'The Legend of Zelda: Tears of the Kingdom',
    console: 'Nintendo Switch',
    releaseYear: 2023,
    publisher: 'Nintendo',
    developer: 'Nintendo EPD',
    genre: 'Action-Aventure',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Ff%2Ffb%2FThe_Legend_of_Zelda_Tears_of_the_Kingdom_cover.jpg',
    estimatedValue: 45,
    synopsis: 'Prenez votre envol dans les cieux d\'Hyrule et créez des véhicules grâce au pouvoir Emprise.'
  },
  '0045496427887': {
    title: 'Super Mario Bros. Wonder',
    console: 'Nintendo Switch',
    releaseYear: 2023,
    publisher: 'Nintendo',
    developer: 'Nintendo EPD',
    genre: 'Plates-formes',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F0%2F09%2FSuper_Mario_Bros._Wonder_box_art.png',
    estimatedValue: 40,
    synopsis: 'Une aventure 2D surprenante avec les fleurs prodige transformant le gameplay.'
  },
  '0045496423988': {
    title: "Super Mario 3D World + Bowser's Fury",
    console: 'Nintendo Switch',
    releaseYear: 2021,
    publisher: 'Nintendo',
    developer: 'Nintendo EPD',
    genre: 'Plates-formes',
    estimatedValue: 35,
  },
  '0045496428617': {
    title: 'Légendes Pokémon: Arceus',
    console: 'Nintendo Switch',
    releaseYear: 2022,
    publisher: 'Nintendo',
    developer: 'Game Freak',
    genre: 'Action-RPG',
    estimatedValue: 35,
  },
  '0045496429416': {
    title: 'Pokémon Écarlate',
    console: 'Nintendo Switch',
    releaseYear: 2022,
    publisher: 'Nintendo',
    developer: 'Game Freak',
    genre: 'RPG',
    estimatedValue: 35,
  },
  '0045496429461': {
    title: 'Pokémon Violet',
    console: 'Nintendo Switch',
    releaseYear: 2022,
    publisher: 'Nintendo',
    developer: 'Game Freak',
    genre: 'RPG',
    estimatedValue: 35,
  },
  '0045496426866': {
    title: 'Pikmin 4',
    console: 'Nintendo Switch',
    releaseYear: 2023,
    publisher: 'Nintendo',
    developer: 'Nintendo EPD',
    genre: 'Stratégie / Aventure',
    estimatedValue: 38,
  },

  // --- PLAYSTATION 5 ---
  '0711719567974': {
    title: "Marvel's Spider-Man 2",
    console: 'PlayStation 5',
    releaseYear: 2023,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Insomniac Games',
    genre: 'Action-Aventure',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F0%2F0f%2FMarvel%27s_Spider-Man_2_cover.jpg',
    estimatedValue: 45,
    synopsis: 'Peter Parker et Miles Morales unissent leurs forces face à Venom et Kraven le Chasseur.'
  },
  '0711719541172': {
    title: 'God of War Ragnarök',
    console: 'PlayStation 5',
    releaseYear: 2022,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Santa Monica Studio',
    genre: 'Action-Aventure',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Fe%2Fee%2FGod_of_War_Ragnar%C3%B6k_cover.jpg',
    estimatedValue: 38,
    synopsis: 'Kratos et Atreus traversent les neuf royaumes nordiques à l\'approche de la bataille finale.'
  },
  '0711719398851': {
    title: "Demon's Souls",
    console: 'PlayStation 5',
    releaseYear: 2020,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Bluepoint Games',
    genre: 'Action-RPG',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F1%2F11%2FDemons_Souls_remake_cover_art.jpg',
    estimatedValue: 30,
    synopsis: 'Le remake magistral du classique culte de dark fantasy dans le royaume de Boletaria.'
  },
  '0711719838043': {
    title: 'Ratchet & Clank: Rift Apart',
    console: 'PlayStation 5',
    releaseYear: 2021,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Insomniac Games',
    genre: 'Plates-formes / Action',
    estimatedValue: 30,
  },
  '0711719717850': {
    title: 'Horizon Forbidden West',
    console: 'PlayStation 5',
    releaseYear: 2022,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Guerrilla Games',
    genre: 'Action-RPG',
    estimatedValue: 32,
  },
  '0711719719854': {
    title: 'Gran Turismo 7',
    console: 'PlayStation 5',
    releaseYear: 2022,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Polyphony Digital',
    genre: 'Simulation de Course',
    estimatedValue: 35,
  },
  '0711719839453': {
    title: 'The Last of Us Part I',
    console: 'PlayStation 5',
    releaseYear: 2022,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Naughty Dog',
    genre: 'Action-Aventure',
    estimatedValue: 40,
  },
  '3391892015097': {
    title: 'Elden Ring',
    console: 'PlayStation 5',
    releaseYear: 2022,
    publisher: 'Bandai Namco Entertainment',
    developer: 'FromSoftware',
    genre: 'Action-RPG',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Fb%2Fb9%2FElden_Ring_Box_art.jpg',
    estimatedValue: 35,
    synopsis: 'Chef-d\'œuvre en monde ouvert façonné par Hidetaka Miyazaki et George R. R. Martin.'
  },
  '3391891999908': {
    title: 'Elden Ring',
    console: 'PlayStation 5',
    releaseYear: 2022,
    publisher: 'Bandai Namco Entertainment',
    developer: 'FromSoftware',
    genre: 'Action-RPG',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Fb%2Fb9%2FElden_Ring_Box_art.jpg',
    estimatedValue: 35,
  },
  '5030936124285': {
    title: 'Need for Speed: Unbound',
    console: 'PlayStation 5',
    releaseYear: 2022,
    publisher: 'Electronic Arts',
    developer: 'Criterion Games',
    genre: 'Course',
    estimatedValue: 24,
  },
  '5030935124299': {
    title: 'EA Sports FC 24',
    console: 'PlayStation 5',
    releaseYear: 2023,
    publisher: 'EA Sports',
    developer: 'EA Vancouver',
    genre: 'Sport',
    estimatedValue: 18,
  },

  // --- PLAYSTATION 4 ---
  '3307215984638': {
    title: "Assassin's Creed Valhalla",
    console: 'PlayStation 4',
    releaseYear: 2020,
    publisher: 'Ubisoft',
    developer: 'Ubisoft Montréal',
    genre: 'Action-RPG',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Ff%2Fff%2FAssassins_Creed_Valhalla_cover.jpg',
    estimatedValue: 16,
    synopsis: 'Incarnez Eivor, chef de guerre viking, et menez votre clan depuis la Norvège vers l\'Angleterre médiévale.'
  },
  '3307216065589': {
    title: "Assassin's Creed Odyssey",
    console: 'PlayStation 4',
    releaseYear: 2018,
    publisher: 'Ubisoft',
    developer: 'Ubisoft Québec',
    genre: 'Action-RPG',
    estimatedValue: 14,
    synopsis: 'Épopée magistrale dans la Grèce antique au temps de la guerre du Péloponnèse.'
  },
  '3307215984607': {
    title: "Assassin's Creed Origins",
    console: 'PlayStation 4',
    releaseYear: 2017,
    publisher: 'Ubisoft',
    developer: 'Ubisoft Montréal',
    genre: 'Action-RPG',
    estimatedValue: 12,
    synopsis: 'Découvrez la fondation de la confrérie des Assassins dans l\'Égypte des Pharaons.'
  },
  '0711719842491': {
    title: "Marvel's Spider-Man",
    console: 'PlayStation 4',
    releaseYear: 2018,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Insomniac Games',
    genre: 'Action-Aventure',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Fe%2Fe1%2FSpider-Man_PS4_cover.jpg',
    estimatedValue: 14,
    synopsis: 'Volez entre les gratte-ciel de Manhattan dans une aventure palpitante signée Insomniac Games.'
  },
  '0711719416852': {
    title: "Marvel's Spider-Man",
    console: 'PlayStation 4',
    releaseYear: 2018,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Insomniac Games',
    genre: 'Action-Aventure',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Fe%2Fe1%2FSpider-Man_PS4_cover.jpg',
    estimatedValue: 14,
  },
  '5026555416970': {
    title: 'Grand Theft Auto V',
    console: 'PlayStation 4',
    releaseYear: 2014,
    publisher: 'Rockstar Games',
    developer: 'Rockstar North',
    genre: 'Action-Aventure',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Fa%2Fa5%2FGrand_Theft_Auto_V.png',
    estimatedValue: 14,
    synopsis: 'Suivez les destins croisés de Michael, Franklin et Trevor à Los Santos.'
  },
  '5026555424240': {
    title: 'Grand Theft Auto V: Premium Edition',
    console: 'PlayStation 4',
    releaseYear: 2018,
    publisher: 'Rockstar Games',
    developer: 'Rockstar North',
    genre: 'Action-Aventure',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Fa%2Fa5%2FGrand_Theft_Auto_V.png',
    estimatedValue: 16,
    synopsis: 'L\'expérience complète de GTA V avec le pack d\'entrée dans le monde criminel pour GTA Online.'
  },
  '5026555424233': {
    title: 'Red Dead Redemption 2',
    console: 'PlayStation 4',
    releaseYear: 2018,
    publisher: 'Rockstar Games',
    developer: 'Rockstar Studios',
    genre: 'Action-Aventure / Western',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F4%2F44%2FRed_Dead_Redemption_II.jpg',
    estimatedValue: 20,
    synopsis: 'L\'histoire poignante d\'Arthur Morgan et de la bande de Van der Linde au déclin du Far West.'
  },
  '0711719808855': {
    title: 'The Last of Us Remastered',
    console: 'PlayStation 4',
    releaseYear: 2014,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Naughty Dog',
    genre: 'Action-Aventure',
    estimatedValue: 12,
  },
  '0711719505853': {
    title: 'The Last of Us Part II',
    console: 'PlayStation 4',
    releaseYear: 2020,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Naughty Dog',
    genre: 'Action-Aventure',
    estimatedValue: 20,
  },
  '0711719827856': {
    title: 'God of War',
    console: 'PlayStation 4',
    releaseYear: 2018,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Santa Monica Studio',
    genre: 'Action-Aventure',
    estimatedValue: 12,
  },
  '0711719822851': {
    title: "Uncharted 4: A Thief's End",
    console: 'PlayStation 4',
    releaseYear: 2016,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Naughty Dog',
    genre: 'Action-Aventure',
    estimatedValue: 10,
  },
  '0711719888857': {
    title: 'Bloodborne',
    console: 'PlayStation 4',
    releaseYear: 2015,
    publisher: 'Sony Interactive Entertainment',
    developer: 'FromSoftware',
    genre: 'Action-RPG',
    estimatedValue: 16,
  },
  '0711719714859': {
    title: 'Ghost of Tsushima',
    console: 'PlayStation 4',
    releaseYear: 2020,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Sucker Punch Productions',
    genre: 'Action-Aventure',
    estimatedValue: 22,
  },
  '0711719833857': {
    title: 'Horizon Zero Dawn',
    console: 'PlayStation 4',
    releaseYear: 2017,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Guerrilla Games',
    genre: 'Action-RPG',
    estimatedValue: 10,
  },
  '3391891981149': {
    title: 'The Witcher 3: Wild Hunt',
    console: 'PlayStation 4',
    releaseYear: 2015,
    publisher: 'CD Projekt RED',
    developer: 'CD Projekt RED',
    genre: 'Action-RPG',
    estimatedValue: 12,
  },
  '5030932111822': {
    title: 'Titanfall 2',
    console: 'PlayStation 4',
    releaseYear: 2016,
    publisher: 'Electronic Arts',
    developer: 'Respawn Entertainment',
    genre: 'FPS',
    estimatedValue: 8,
  },
  '5030930113260': {
    title: 'FIFA 14',
    console: 'PlayStation 4',
    releaseYear: 2013,
    publisher: 'EA Sports',
    developer: 'EA Vancouver',
    genre: 'Sport',
    estimatedValue: 3,
  },
  '5030930100789': {
    title: 'FIFA 14',
    console: 'PlayStation 4',
    releaseYear: 2013,
    publisher: 'EA Sports',
    developer: 'EA Vancouver',
    genre: 'Sport',
    estimatedValue: 3,
  },
  '5030930104084': {
    title: 'FIFA 15',
    console: 'PlayStation 4',
    releaseYear: 2014,
    publisher: 'EA Sports',
    developer: 'EA Vancouver',
    genre: 'Sport',
    estimatedValue: 3,
  },
  '5030930106880': {
    title: 'FIFA 16',
    console: 'PlayStation 4',
    releaseYear: 2015,
    publisher: 'EA Sports',
    developer: 'EA Vancouver',
    genre: 'Sport',
    estimatedValue: 3,
  },
  '5030931103650': {
    title: 'FIFA 17',
    console: 'PlayStation 4',
    releaseYear: 2016,
    publisher: 'EA Sports',
    developer: 'EA Vancouver',
    genre: 'Sport',
    estimatedValue: 3,
  },
  '5030931115882': {
    title: 'FIFA 18',
    console: 'PlayStation 4',
    releaseYear: 2017,
    publisher: 'EA Sports',
    developer: 'EA Vancouver',
    genre: 'Sport',
    estimatedValue: 3,
  },
  '5030935118045': {
    title: 'FIFA 19',
    console: 'PlayStation 4',
    releaseYear: 2018,
    publisher: 'EA Sports',
    developer: 'EA Vancouver',
    genre: 'Sport',
    estimatedValue: 4,
  },
  '5030932119934': {
    title: 'FIFA 20',
    console: 'PlayStation 4',
    releaseYear: 2019,
    publisher: 'EA Sports',
    developer: 'EA Vancouver',
    genre: 'Sport',
    estimatedValue: 4,
  },
  '5030931121876': {
    title: 'FIFA 21',
    console: 'PlayStation 4',
    releaseYear: 2020,
    publisher: 'EA Sports',
    developer: 'EA Vancouver',
    genre: 'Sport',
    estimatedValue: 5,
  },
  '5030931122828': {
    title: 'FIFA 22',
    console: 'PlayStation 4',
    releaseYear: 2021,
    publisher: 'EA Sports',
    developer: 'EA Vancouver',
    genre: 'Sport',
    estimatedValue: 6,
  },
  '5030932124370': {
    title: 'FIFA 23',
    console: 'PlayStation 4',
    releaseYear: 2022,
    publisher: 'EA Sports',
    developer: 'EA Vancouver',
    genre: 'Sport',
    estimatedValue: 8,
  },
  '5030938124302': {
    title: 'EA Sports FC 24',
    console: 'PlayStation 4',
    releaseYear: 2023,
    publisher: 'EA Sports',
    developer: 'EA Vancouver',
    genre: 'Sport',
    estimatedValue: 14,
  },
  '5030930111822': {
    title: 'Need for Speed: Rivals',
    console: 'PlayStation 4',
    releaseYear: 2013,
    publisher: 'Electronic Arts',
    developer: 'Ghost Games',
    genre: 'Course',
    estimatedValue: 9,
  },
  '5030932115660': {
    title: 'Need for Speed: Payback',
    console: 'PlayStation 4',
    releaseYear: 2017,
    publisher: 'Electronic Arts',
    developer: 'Ghost Games',
    genre: 'Course',
    estimatedValue: 12,
  },
  '5030938122346': {
    title: 'Need for Speed: Heat',
    console: 'PlayStation 4',
    releaseYear: 2019,
    publisher: 'Electronic Arts',
    developer: 'Ghost Games',
    genre: 'Course',
    estimatedValue: 15,
  },

  // --- PLAYSTATION 3 ---
  '5030932104860': {
    title: 'Need for Speed: The Run',
    console: 'PlayStation 3',
    releaseYear: 2011,
    publisher: 'Electronic Arts',
    developer: 'EA Black Box',
    genre: 'Course',
    estimatedValue: 8,
    synopsis: 'Course clandestine effrénée de San Francisco à New York à travers les États-Unis.'
  },
  '5030930081071': {
    title: 'Need for Speed: Undercover',
    console: 'PlayStation 3',
    releaseYear: 2008,
    publisher: 'Electronic Arts',
    developer: 'EA Black Box',
    genre: 'Course',
    estimatedValue: 7,
  },
  '5030930090424': {
    title: 'Need for Speed: Shift',
    console: 'PlayStation 3',
    releaseYear: 2009,
    publisher: 'Electronic Arts',
    developer: 'Slightly Mad Studios',
    genre: 'Course',
    estimatedValue: 7,
  },
  '5030930098901': {
    title: 'Need for Speed: Hot Pursuit',
    console: 'PlayStation 3',
    releaseYear: 2010,
    publisher: 'Electronic Arts',
    developer: 'Criterion Games',
    genre: 'Course',
    estimatedValue: 8,
  },
  '5030930109157': {
    title: 'Need for Speed: Most Wanted',
    console: 'PlayStation 3',
    releaseYear: 2012,
    publisher: 'Electronic Arts',
    developer: 'Criterion Games',
    genre: 'Course',
    estimatedValue: 9,
  },
  '5026555280204': {
    title: 'Grand Theft Auto IV',
    console: 'PlayStation 3',
    releaseYear: 2008,
    publisher: 'Rockstar Games',
    developer: 'Rockstar North',
    genre: 'Action-Aventure',
    estimatedValue: 8,
  },
  '5026555404496': {
    title: 'Grand Theft Auto V',
    console: 'PlayStation 3',
    releaseYear: 2013,
    publisher: 'Rockstar Games',
    developer: 'Rockstar North',
    genre: 'Action-Aventure',
    estimatedValue: 8,
  },
  '0711719280828': {
    title: 'Uncharted 2: Among Thieves',
    console: 'PlayStation 3',
    releaseYear: 2009,
    publisher: 'Sony Computer Entertainment',
    developer: 'Naughty Dog',
    genre: 'Action-Aventure',
    estimatedValue: 7,
  },
  '0711719183822': {
    title: 'God of War III',
    console: 'PlayStation 3',
    releaseYear: 2010,
    publisher: 'Sony Computer Entertainment',
    developer: 'Santa Monica Studio',
    genre: 'Action-Aventure',
    estimatedValue: 10,
  },

  // --- PLAYSTATION 2 ---
  '5030930104862': {
    title: 'Need for Speed: Underground 2',
    console: 'PlayStation 2',
    releaseYear: 2004,
    publisher: 'Electronic Arts',
    developer: 'EA Black Box',
    genre: 'Course',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F8%2F80%2FNfs-underground2-boxart.jpg',
    estimatedValue: 18,
    synopsis: 'Le jeu culte de tuning nocturne et courses de rue à Bayview.'
  },
  '5030930039867': {
    title: 'Need for Speed: Underground',
    console: 'PlayStation 2',
    releaseYear: 2003,
    publisher: 'Electronic Arts',
    developer: 'EA Black Box',
    genre: 'Course',
    estimatedValue: 12,
  },
  '5030930048661': {
    title: 'Need for Speed: Most Wanted',
    console: 'PlayStation 2',
    releaseYear: 2005,
    publisher: 'Electronic Arts',
    developer: 'EA Black Box',
    genre: 'Course',
    estimatedValue: 20,
    synopsis: 'Grimpez la Liste Noire des 15 pilotes les plus recherchés de Rockport City.'
  },
  '5030930058448': {
    title: 'Need for Speed: Carbon',
    console: 'PlayStation 2',
    releaseYear: 2006,
    publisher: 'Electronic Arts',
    developer: 'EA Canada',
    genre: 'Course',
    estimatedValue: 14,
  },
  '5030930070624': {
    title: 'Need for Speed: ProStreet',
    console: 'PlayStation 2',
    releaseYear: 2007,
    publisher: 'Electronic Arts',
    developer: 'EA Black Box',
    genre: 'Course',
    estimatedValue: 10,
  },
  '5026555302791': {
    title: 'Grand Theft Auto: San Andreas',
    console: 'PlayStation 2',
    releaseYear: 2004,
    publisher: 'Rockstar Games',
    developer: 'Rockstar North',
    genre: 'Action-Aventure',
    coverUrl: '/api/covers/proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Fc%2Fc4%2FGTASABOX.jpg',
    estimatedValue: 16,
    synopsis: 'Accompagnez CJ dans les années 90 à travers tout l\'état de San Andreas.'
  },
  '5026555301824': {
    title: 'Grand Theft Auto: Vice City',
    console: 'PlayStation 2',
    releaseYear: 2002,
    publisher: 'Rockstar Games',
    developer: 'Rockstar North',
    genre: 'Action-Aventure',
    estimatedValue: 14,
  },
  '5026555300896': {
    title: 'Grand Theft Auto III',
    console: 'PlayStation 2',
    releaseYear: 2001,
    publisher: 'Rockstar Games',
    developer: 'DMA Design',
    genre: 'Action-Aventure',
    estimatedValue: 10,
  },
  '0711719213826': {
    title: 'Final Fantasy X',
    console: 'PlayStation 2',
    releaseYear: 2002,
    publisher: 'Square Enix',
    developer: 'Square',
    genre: 'J-RPG',
    estimatedValue: 10,
  },
  '0711719602422': {
    title: 'Gran Turismo 4',
    console: 'PlayStation 2',
    releaseYear: 2005,
    publisher: 'Sony Computer Entertainment',
    developer: 'Polyphony Digital',
    genre: 'Simulation de Course',
    estimatedValue: 10,
  },
  '0711719600923': {
    title: 'Metal Gear Solid 2: Sons of Liberty',
    console: 'PlayStation 2',
    releaseYear: 2002,
    publisher: 'Konami',
    developer: 'KCEJ',
    genre: 'Infiltration / Action',
    estimatedValue: 12,
  },
  '4012927042564': {
    title: 'Metal Gear Solid 3: Snake Eater',
    console: 'PlayStation 2',
    releaseYear: 2004,
    publisher: 'Konami',
    developer: 'Konami Computer Entertainment Japan',
    genre: 'Infiltration / Action',
    estimatedValue: 18,
  },
  '5055060960530': {
    title: 'Resident Evil 4',
    console: 'PlayStation 2',
    releaseYear: 2005,
    publisher: 'Capcom',
    developer: 'Capcom Production Studio 4',
    genre: 'Survival Horror / Action',
    estimatedValue: 15,
  },
  '0711719642220': {
    title: 'God of War',
    console: 'PlayStation 2',
    releaseYear: 2005,
    publisher: 'Sony Computer Entertainment',
    developer: 'Santa Monica Studio',
    genre: 'Action-Aventure',
    estimatedValue: 14,
  },
  '0711719692423': {
    title: 'God of War II',
    console: 'PlayStation 2',
    releaseYear: 2007,
    publisher: 'Sony Computer Entertainment',
    developer: 'Santa Monica Studio',
    genre: 'Action-Aventure',
    estimatedValue: 16,
  },

  // --- PLAYSTATION 1 ---
  '0711719460022': {
    title: 'Metal Gear Solid',
    console: 'PlayStation 1',
    releaseYear: 1999,
    publisher: 'Konami',
    developer: 'KCEJ',
    genre: 'Infiltration / Action',
    estimatedValue: 35,
  },
  '0711719430025': {
    title: 'Final Fantasy VII',
    console: 'PlayStation 1',
    releaseYear: 1997,
    publisher: 'Squaresoft',
    developer: 'Square',
    genre: 'J-RPG',
    estimatedValue: 40,
  },
  '0711719450023': {
    title: 'Crash Bandicoot 3: Warped',
    console: 'PlayStation 1',
    releaseYear: 1998,
    publisher: 'Sony Computer Entertainment',
    developer: 'Naughty Dog',
    genre: 'Plates-formes',
    estimatedValue: 22,
  },
  '0711719708827': {
    title: 'Tekken 3',
    console: 'PlayStation 1',
    releaseYear: 1998,
    publisher: 'Namco',
    developer: 'Namco',
    genre: 'Combat',
    estimatedValue: 20,
  },

  // --- XBOX & XBOX 360 ---
  '0889842880770': {
    title: 'Forza Horizon 5',
    console: 'Xbox Series X|S',
    releaseYear: 2021,
    publisher: 'Xbox Game Studios',
    developer: 'Playground Games',
    genre: 'Course',
    estimatedValue: 28,
  },
  '0889842240994': {
    title: 'Forza Horizon 4',
    console: 'Xbox One',
    releaseYear: 2018,
    publisher: 'Microsoft Studios',
    developer: 'Playground Games',
    genre: 'Course',
    estimatedValue: 18,
  },
  '0889842635998': {
    title: 'Halo Infinite',
    console: 'Xbox Series X|S',
    releaseYear: 2021,
    publisher: 'Xbox Game Studios',
    developer: '343 Industries',
    genre: 'FPS',
    estimatedValue: 20,
  },
  '0885370217995': {
    title: 'Halo 3',
    console: 'Xbox 360',
    releaseYear: 2007,
    publisher: 'Microsoft Game Studios',
    developer: 'Bungie',
    genre: 'FPS',
    estimatedValue: 8,
  },
  '0885370634990': {
    title: 'Gears of War 3',
    console: 'Xbox 360',
    releaseYear: 2011,
    publisher: 'Microsoft Studios',
    developer: 'Epic Games',
    genre: 'TPS',
    estimatedValue: 7,
  },
  '5026555417038': {
    title: 'Grand Theft Auto V',
    console: 'Xbox One',
    releaseYear: 2014,
    publisher: 'Rockstar Games',
    developer: 'Rockstar North',
    genre: 'Action-Aventure',
    estimatedValue: 14,
  },
  '5026555358996': {
    title: 'Red Dead Redemption 2',
    console: 'Xbox One',
    releaseYear: 2018,
    publisher: 'Rockstar Games',
    developer: 'Rockstar Studios',
    genre: 'Action-Aventure',
    estimatedValue: 16,
  },

  // --- RETRO NINTENDO (N64, GameCube, SNES, Game Boy) ---
  '045496730079': {
    title: 'The Legend of Zelda: Ocarina of Time',
    console: 'Nintendo 64',
    releaseYear: 1998,
    publisher: 'Nintendo',
    developer: 'Nintendo EAD',
    genre: 'Action-Aventure',
    estimatedValue: 45,
  },
  '045496730017': {
    title: 'Super Mario 64',
    console: 'Nintendo 64',
    releaseYear: 1996,
    publisher: 'Nintendo',
    developer: 'Nintendo EAD',
    genre: 'Plates-formes',
    estimatedValue: 35,
  },
  '045496830502': {
    title: 'The Legend of Zelda: The Wind Waker',
    console: 'Nintendo GameCube',
    releaseYear: 2002,
    publisher: 'Nintendo',
    developer: 'Nintendo EAD',
    genre: 'Action-Aventure',
    estimatedValue: 50,
  },
  '045496830434': {
    title: 'Super Smash Bros. Melee',
    console: 'Nintendo GameCube',
    releaseYear: 2001,
    publisher: 'Nintendo',
    developer: 'HAL Laboratory',
    genre: 'Combat',
    estimatedValue: 55,
  },
  '045496350352': {
    title: 'Super Mario World',
    console: 'Super Nintendo (SNES)',
    releaseYear: 1990,
    publisher: 'Nintendo',
    developer: 'Nintendo EAD',
    genre: 'Plates-formes',
    estimatedValue: 25,
  },
  '045496711436': {
    title: 'Pokémon Version Rouge',
    console: 'Game Boy / Advance',
    releaseYear: 1996,
    publisher: 'Nintendo',
    developer: 'Game Freak',
    genre: 'RPG',
    estimatedValue: 50,
  },
  '045496711443': {
    title: 'Pokémon Version Bleue',
    console: 'Game Boy / Advance',
    releaseYear: 1996,
    publisher: 'Nintendo',
    developer: 'Game Freak',
    genre: 'RPG',
    estimatedValue: 50,
  },
  '045496733223': {
    title: 'Pokémon Version Rubis',
    console: 'Game Boy / Advance',
    releaseYear: 2002,
    publisher: 'Nintendo',
    developer: 'Game Freak',
    genre: 'RPG',
    estimatedValue: 50,
  },
  '045496733230': {
    title: 'Pokémon Version Saphir',
    console: 'Game Boy / Advance',
    releaseYear: 2002,
    publisher: 'Nintendo',
    developer: 'Game Freak',
    genre: 'RPG',
    estimatedValue: 50,
  },
  '045496733247': {
    title: 'Pokémon Version Émeraude',
    console: 'Game Boy / Advance',
    releaseYear: 2004,
    publisher: 'Nintendo',
    developer: 'Game Freak',
    genre: 'RPG',
    estimatedValue: 90,
  },
  '0045496428136': {
    title: 'Pokémon Diamant Étincelant',
    console: 'Nintendo Switch',
    releaseYear: 2021,
    publisher: 'Nintendo',
    developer: 'ILCA',
    genre: 'RPG',
    estimatedValue: 30,
    synopsis: 'Remake fidèle de Pokémon Diamant dans la région de Sinnoh.'
  },
  '0045496428181': {
    title: 'Pokémon Perle Scintillante',
    console: 'Nintendo Switch',
    releaseYear: 2021,
    publisher: 'Nintendo',
    developer: 'ILCA',
    genre: 'RPG',
    estimatedValue: 30,
    synopsis: 'Remake fidèle de Pokémon Perle dans la région de Sinnoh.'
  },
  '0045496424565': {
    title: 'Pokémon Épée',
    console: 'Nintendo Switch',
    releaseYear: 2019,
    publisher: 'Nintendo',
    developer: 'Game Freak',
    genre: 'RPG',
    estimatedValue: 30,
    synopsis: 'Aventure Pokémon dans la région de Galar inspirée de la Grande-Bretagne.'
  },
  '0045496424619': {
    title: 'Pokémon Bouclier',
    console: 'Nintendo Switch',
    releaseYear: 2019,
    publisher: 'Nintendo',
    developer: 'Game Freak',
    genre: 'RPG',
    estimatedValue: 30,
    synopsis: 'Aventure Pokémon dans la région de Galar avec les Terres Sauvages.'
  },
  '0045496423131': {
    title: 'New Super Mario Bros. U Deluxe',
    console: 'Nintendo Switch',
    releaseYear: 2019,
    publisher: 'Nintendo',
    developer: 'Nintendo EPD',
    genre: 'Plates-formes',
    estimatedValue: 35,
    synopsis: 'Plateforme 2D Mario en multijoueur avec 164 stages.'
  },
  '0045496425944': {
    title: 'Xenoblade Chronicles: Definitive Edition',
    console: 'Nintendo Switch',
    releaseYear: 2020,
    publisher: 'Nintendo',
    developer: 'Monolith Soft',
    genre: 'J-RPG',
    estimatedValue: 35,
    synopsis: 'RPG d\'envergure sur les titans Bionis et Mékonis avec Shulk et la Monado.'
  },
  '0045496428389': {
    title: 'Kirby et le monde oublié',
    console: 'Nintendo Switch',
    releaseYear: 2022,
    publisher: 'Nintendo',
    developer: 'HAL Laboratory',
    genre: 'Plates-formes',
    estimatedValue: 35,
    synopsis: 'Première grande aventure 3D pour Kirby dans une civilisation mystérieuse.'
  },
  '0045496424855': {
    title: 'Splatoon 3',
    console: 'Nintendo Switch',
    releaseYear: 2022,
    publisher: 'Nintendo',
    developer: 'Nintendo EPD',
    genre: 'Tir à la troisième personne',
    estimatedValue: 30,
    synopsis: 'Guerres de territoire à l\'encre dans la région torride de Cité-Clabousse.'
  },
  '0045496420550': {
    title: 'Splatoon 2',
    console: 'Nintendo Switch',
    releaseYear: 2017,
    publisher: 'Nintendo',
    developer: 'Nintendo EPD',
    genre: 'Tir à la troisième personne',
    estimatedValue: 20,
    synopsis: 'Batailles de peinture frénétiques en ligne et mode Salmon Run.'
  },
  '0045496421007': {
    title: 'Fire Emblem: Three Houses',
    console: 'Nintendo Switch',
    releaseYear: 2019,
    publisher: 'Nintendo',
    developer: 'Intelligent Systems',
    genre: 'Tactical RPG',
    estimatedValue: 38,
    synopsis: 'Tactical RPG stratégique au Monastère de Garreg Mach à Fódlan.'
  },
  '0711719399858': {
    title: 'Returnal',
    console: 'PlayStation 5',
    releaseYear: 2021,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Housemarque',
    genre: 'Roguelike / TPS',
    estimatedValue: 28,
    synopsis: 'Jeu d\'action roguelike spatial sombre et intense sur la planète Atropos.'
  },
  '5021290096356': {
    title: 'Final Fantasy XVI',
    console: 'PlayStation 5',
    releaseYear: 2023,
    publisher: 'Square Enix',
    developer: 'Creative Business Unit III',
    genre: 'Action-RPG',
    estimatedValue: 32,
    synopsis: 'Sombre épopée médiévale fantastique suivant Clive Rosfield à Valisthéa.'
  },
  '5021290097650': {
    title: 'Final Fantasy VII Rebirth',
    console: 'PlayStation 5',
    releaseYear: 2024,
    publisher: 'Square Enix',
    developer: 'Square Enix',
    genre: 'Action-RPG',
    estimatedValue: 45,
    synopsis: 'Poursuite de l\'aventure de Cloud et ses amis à travers la vaste planète.'
  },
  '711719842491': {
    title: "Marvel's Spider-Man",
    console: 'PlayStation 4',
    releaseYear: 2018,
    publisher: 'Sony Interactive Entertainment',
    developer: 'Insomniac Games',
    genre: 'Action-Aventure',
    estimatedValue: 14,
    synopsis: 'Voltigez dans New York dans la peau de Peter Parker face aux Sinister Six.'
  },
  '5026555280181': {
    title: 'Grand Theft Auto IV',
    console: 'Xbox 360',
    releaseYear: 2008,
    publisher: 'Rockstar Games',
    developer: 'Rockstar North',
    genre: 'Action-Aventure',
    estimatedValue: 8,
    synopsis: 'Le périple de Niko Bellic pour vivre le rêve américain à Liberty City.'
  },
  '5026555404502': {
    title: 'Grand Theft Auto V',
    console: 'Xbox 360',
    releaseYear: 2013,
    publisher: 'Rockstar Games',
    developer: 'Rockstar North',
    genre: 'Action-Aventure',
    estimatedValue: 8,
    synopsis: 'Les braquages épiques de Michael, Franklin et Trevor à Los Santos.'
  },
  '5030932124363': {
    title: 'FIFA 23',
    console: 'PlayStation 5',
    releaseYear: 2022,
    publisher: 'EA Sports',
    developer: 'EA Vancouver',
    genre: 'Sport',
    estimatedValue: 12,
    synopsis: 'La technologie HyperMotion2 et les Coupes du Monde masculine et féminine.'
  },
  '5030930124316': {
    title: 'EA Sports FC 24',
    console: 'Nintendo Switch',
    releaseYear: 2023,
    publisher: 'EA Sports',
    developer: 'EA Vancouver',
    genre: 'Sport',
    estimatedValue: 16,
    synopsis: 'Nouvelle ère du football virtuel propulsé par le moteur Frostbite.'
  },
  '5030930122817': {
    title: 'FIFA 22',
    console: 'PlayStation 5',
    releaseYear: 2021,
    publisher: 'EA Sports',
    developer: 'EA Vancouver',
    genre: 'Sport',
    estimatedValue: 8,
    synopsis: 'Football réaliste avec la technologie HyperMotion nouvelle génération.'
  },
};

// Recherche instantanée avec normalisation robuste des codes-barres (12 ou 13 chiffres, avec ou sans 0 initial)
export function lookupBarcodeInCatalog(rawCode: string): CatalogGame | null {
  if (!rawCode) return null;
  const digits = rawCode.replace(/\D/g, '').trim();
  if (digits.length < 6) return null;

  // 1. Test direct
  if (BARCODE_CATALOG[digits]) {
    return { ...BARCODE_CATALOG[digits], barcode: digits };
  }

  // 2. Test sans les zéros initiaux
  const unpadded = digits.replace(/^0+/, '');
  if (unpadded && BARCODE_CATALOG[unpadded]) {
    return { ...BARCODE_CATALOG[unpadded], barcode: digits };
  }

  // 3. Test avec padding EAN-13 (0 + 12 chiffres)
  if (digits.length === 12) {
    const pad13 = '0' + digits;
    if (BARCODE_CATALOG[pad13]) {
      return { ...BARCODE_CATALOG[pad13], barcode: digits };
    }
  }

  // 4. Test en enlevant le 0 initial d'un code à 13 chiffres (12 chiffres UPC)
  if (digits.length === 13 && digits.startsWith('0')) {
    const slice12 = digits.slice(1);
    if (BARCODE_CATALOG[slice12]) {
      return { ...BARCODE_CATALOG[slice12], barcode: digits };
    }
  }

  // 5. Recherche par correspondance souple (clé se terminant par ou égal)
  for (const [key, item] of Object.entries(BARCODE_CATALOG)) {
    const keyUnpadded = key.replace(/^0+/, '');
    if (key === digits || keyUnpadded === unpadded) {
      return { ...item, barcode: digits };
    }
  }

  return null;
}

// Recherche instantanée par titre ou mots-clés dans le catalogue
export function searchGamesInCatalog(query: string, max = 6): CatalogGame[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const qClean = q.replace(/[^a-z0-9]/gi, ' ');
  const terms = qClean.split(/\s+/).filter(t => t.length >= 2);

  const scored: { item: CatalogGame; score: number }[] = [];
  const seenTitles = new Set<string>();

  for (const [code, item] of Object.entries(BARCODE_CATALOG)) {
    const titleLower = item.title.toLowerCase();
    const key = `${titleLower}__${item.console}`;
    if (seenTitles.has(key)) continue;

    let score = 0;
    if (titleLower === q) score += 100;
    else if (titleLower.startsWith(q)) score += 50;
    else if (titleLower.includes(q)) score += 30;

    // Correspondance par mot
    let matchedTerms = 0;
    for (const term of terms) {
      if (titleLower.includes(term)) {
        score += 15;
        matchedTerms++;
      }
    }

    if (score > 0 || matchedTerms === terms.length) {
      seenTitles.add(key);
      scored.push({ item: { ...item, barcode: code }, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map(s => s.item);
}
