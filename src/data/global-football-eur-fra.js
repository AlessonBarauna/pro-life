(function(root){
  "use strict";
  // Ligue 1 2025/26 (escopo EA SPORTS FC 26). GER/potencial: estimativa propria, nao copia de tabela oficial.
  // Linha: "Nome|AnoNasc|COD|POS|GER|POT". Brasileiros ficam fora (cobertos pelo pool legado/Brasil).
  const pack={id:"eur26b_fra",version:2,league:["ligue_1","Ligue 1","Ligue 1","Franca",87],clubs:[
    ["psg","Paris Saint-Germain","Paris Saint-Germain",94,90,[
      "Lucas Chevalier|2001|FRA|GOL|82|87","Willian Pacho|2001|ECU|DEF|84|88","Achraf Hakimi|1998|MAR|DEF|87|88","Nuno Mendes|2002|POR|DEF|86|89","Lucas Hernandez|1996|FRA|DEF|82|82","Illia Zabarnyi|2002|UKR|DEF|80|83","Vitor Ferreira|2000|POR|MEI|88|90|Vitinha","Joao Neves|2004|POR|MEI|86|91","Fabian Ruiz|1996|ESP|MEI|85|85","Warren Zaire-Emery|2006|FRA|MEI|82|90","Senny Mayulu|2006|FRA|MEI|77|87","Lee Kang-in|2001|KOR|MEI|80|83","Ousmane Dembele|1997|FRA|ATA|91|91","Khvicha Kvaratskhelia|2001|GEO|ATA|87|90","Bradley Barcola|2002|FRA|ATA|85|89","Desire Doue|2005|FRA|ATA|85|91","Goncalo Ramos|2001|POR|ATA|80|83","Matvey Safonov|1999|RUS|GOL|78|80","Renato Marin|2002|ITA|GOL|66|72","Quentin Ndjantou|2005|FRA|ATA|70|82"]],
    ["marseille","Olympique de Marseille","Marseille",82,79,[
      "Geronimo Rulli|1992|ARG|GOL|80|80","Pau Lopez|1994|ESP|GOL|76|76","Leonardo Balerdi|1999|ARG|DEF|80|82","Facundo Medina|1999|ARG|DEF|79|80","CJ Egan-Riley|2003|ENG|DEF|74|79","Nayef Aguerd|1996|MAR|DEF|79|79","Amir Murillo|1996|PAN|DEF|76|76","Emerson|1994|ITA|DEF|76|76","Pierre-Emile Hojbjerg|1995|DEN|MEI|82|82","Matt O'Riley|2001|DEN|MEI|79|82","Arthur Vermeeren|2005|BEL|MEI|76|85","Quinten Timber|2001|NED|MEI|78|80","Mason Greenwood|2001|ENG|ATA|82|84","Amine Gouiri|2000|ALG|ATA|81|82","Pierre-Emerick Aubameyang|1989|GAB|ATA|77|77","Timothy Weah|2000|USA|ATA|77|78","Jeffrey de Lange|1997|NED|GOL|72|72","Hamed Traore|2000|CIV|MEI|75|78","Benjamin Pavard|1996|FRA|DEF|80|80"]],
    ["monaco","AS Monaco","Monaco",78,77,[
      "Philipp Kohn|1998|SUI|GOL|77|78","Lukas Hradecky|1989|FIN|GOL|79|79","Mohammed Salisu|1999|GHA|DEF|79|79","Thilo Kehrer|1996|GER|DEF|77|77","Wilfried Singo|2000|CIV|DEF|78|79","Eric Dier|1994|ENG|DEF|77|77","Jordan Teze|1999|NED|DEF|77|78","Denis Zakaria|1996|SUI|MEI|79|79","Lamine Camara|2004|SEN|MEI|78|85","Maghnes Akliouche|2002|FRA|MEI|80|86","Paul Pogba|1993|FRA|MEI|74|74","Takumi Minamino|1995|JPN|ATA|77|77","Folarin Balogun|2001|USA|ATA|80|82","George Ilenikhena|2006|FRA|ATA|73|83","Mika Biereth|2003|DEN|ATA|76|80","Krepin Diatta|1999|SEN|ATA|76|77","Radoslaw Majecki|1999|POL|GOL|72|73","Christian Mawissa|2005|FRA|DEF|73|80","Aleksandr Golovin|1996|RUS|MEI|78|78"]],
    ["lille","LOSC Lille","Lille",74,75,[
      "Berke Ozer|2000|TUR|GOL|76|79","Aissa Mandi|1991|ALG|DEF|77|77","Bafode Diakite|2001|FRA|DEF|77|80","Nathan Ngoy|2003|BEL|DEF|74|79","Thomas Meunier|1991|BEL|DEF|74|74","Benjamin Andre|1990|FRA|MEI|79|79","Ayyoub Bouaddi|2007|FRA|MEI|76|88","Nabil Bentaleb|1994|ALG|MEI|74|74","Felix Correia|2001|POR|ATA|76|80","Hamza Igamane|2002|MAR|ATA|75|80","Osame Sahraoui|2001|NOR|ATA|76|78","Matias Fernandez-Pardo|2005|FRA|ATA|74|82","Ludovic Butelle|1983|FRA|GOL|72|72","Ngal'ayel Mukau|2004|FRA|MEI|73|78","Olivier Giroud|1986|FRA|ATA|75|75","Hakon Haraldsson|2001|ISL|ATA|75|79","Romain Perraud|1997|FRA|DEF|75|75","Chancel Mbemba|1994|COD|DEF|75|75"]],
    ["lyon","Olympique Lyonnais","Lyon",78,77,[
      "Remy Descamps|1996|FRA|GOL|75|75","Dominik Greif|1997|SVK|GOL|77|78","Moussa Niakhate|1996|SEN|DEF|78|78","Clinton Mata|1992|BEL|DEF|76|76","Nicolas Tagliafico|1992|ARG|DEF|77|77","Ainsley Maitland-Niles|1997|ENG|DEF|73|73","Orel Mangala|1998|BEL|MEI|78|79","Tanner Tessmann|2001|USA|MEI|76|79","Corentin Tolisso|1994|FRA|MEI|77|77","Pavel Sulc|2000|CZE|MEI|77|80","Georges Mikautadze|2000|GEO|ATA|80|82","Alexandre Lacazette|1991|FRA|ATA|78|78","Malick Fofana|2005|BEL|ATA|76|84","Ernest Nuamah|2003|GHA|ATA|75|80","Dino Mikanovic|2002|CRO|GOL|66|70","Tyler Morton|2002|ENG|MEI|74|78","Said Benrahma|1995|ALG|ATA|77|77","Noham Kamara|2007|FRA|DEF|66|80","Khalis Merah|2002|FRA|ATA|72|75","Ruben Kluivert|2001|NED|ATA|72|74"]],
    ["nice","OGC Nice","Nice",70,73,[
      "Marcin Bulka|1999|POL|GOL|78|79","Jonathan Clauss|1992|FRA|DEF|76|76","Melvin Bard|2000|FRA|DEF|75|76","Moise Bombito|2000|CAN|DEF|76|80","Pablo Rosario|1997|NED|MEI|75|75","Hicham Boudaoui|1999|ALG|MEI|75|76","Morgan Sanson|1994|FRA|MEI|75|75","Terem Moffi|1999|NGA|ATA|76|77","Evann Guessand|2001|CIV|ATA|78|80","Sofiane Diop|2000|FRA|ATA|76|77","Gaetan Laborde|1994|FRA|ATA|75|75","Teddy Boulhendi|2005|FRA|GOL|64|72","Mohamed Abdelmonem|1999|EGY|DEF|75|76","Jeremie Boga|1997|CIV|ATA|76|76","Tom Louchet|2001|FRA|MEI|73|75","Youssouf Ndayishimiye|1998|BDI|DEF|74|75","Antoine Mendy|2005|FRA|MEI|70|78","Mohamed-Ali Cho|2004|FRA|ATA|75|79","Ali Abdi|1993|TUN|DEF|73|73"]],
    ["lens","RC Lens","Lens",72,74,[
      "Robin Risser|2004|FRA|GOL|76|81","Malang Sarr|1999|FRA|DEF|75|76","Jhoanner Chavez|2003|ECU|DEF|74|78","Ruben Aguilar|1993|FRA|DEF|75|75","Salis Abdul Samed|2000|GHA|MEI|77|78","Angelo Fulgini|1996|FRA|MEI|77|77","Adrien Thomasson|1993|FRA|MEI|76|76","Florian Sotoca|1990|FRA|ATA|76|76","Wesley Said|1995|FRA|ATA|75|75","Jonathan Gradit|1992|FRA|DEF|77|77","Nampalys Mendy|1992|SEN|MEI|75|75","Neil El Aynaoui|2001|MAR|MEI|79|82","Elye Wahi|2003|FRA|ATA|77|80","Odsonne Edouard|1998|FRA|ATA|77|77","Remy Labeau Lascary|2003|FRA|MEI|72|76","David Pereira Da Costa|2001|POR|MEI|72|74","Deiver Machado|1993|COL|DEF|74|74","Regis Gurtner|1986|FRA|GOL|70|70"]],
    ["rennes","Stade Rennais","Rennes",70,73,[
      "Quentin Merlin|2002|FRA|DEF|76|78",
      "Warmed Omari|2000|FRA|DEF|76|77",
      "Glen Kamara|1995|FIN|MEI|76|76",
      "Valentin Rongier|1994|FRA|MEI|76|76",
      "Albert Gronbaek|2001|DEN|MEI|77|79",
      "Mousa Al-Tamari|1997|JOR|ATA|77|77",
      "Breel Embolo|1997|SUI|ATA|77|77",
      "Arnaud Kalimuendo|2002|FRA|ATA|78|80",
      "Sebastian Szymanski|1999|POL|GOL|68|70",
      "Lorenz Assignon|2000|FRA|DEF|75|77",
      "Anthony Rouault|2001|FRA|DEF|73|76",
      "Benjamin Bourigeaud|1994|FRA|MEI|77|77",
      "Djaoui Cisse|2003|FRA|MEI|74|77",
      "Mikayil Faye|2004|SEN|DEF|73|79",
      "Esteban Lepaul|2000|FRA|ATA|76|77",
      "Brice Samba|1994|FRA|GOL|78|78",
      "Przemyslaw Frankowski|1995|POL|DEF|77|77",
      "Ludovic Blas|1997|FRA|ATA|75|75"
    ]],
    ["strasbourg","RC Strasbourg","Strasbourg",66,72,[
      "Mike Penders|2005|BEL|GOL|77|85","Ismael Doukoure|2003|CIV|DEF|74|78","Guela Doue|2002|FRA|DEF|76|80","Valentin Barco|2004|ARG|DEF|75|80","Ben Chilwell|1996|ENG|DEF|76|76","Diego Moreira|2004|BEL|ATA|72|78","Emanuel Emegha|2003|NED|ATA|78|82","Joaquin Panichelli|2002|ARG|ATA|77|80","Sebastian Nanasi|2002|SWE|ATA|75|78","Abdoul Kone|2003|CIV|DEF|73|76","Andrew Omobamidele|2002|IRL|DEF|74|77","Lucas Hogsberg|2000|DEN|DEF|73|75","Mamadou Sarr|2005|FRA|DEF|72|80","Julio Enciso|2004|PAR|ATA|77|82","Samuel Amo-Ameyaw|2004|GHA|ATA|70|75","Rafael Luis|2005|POR|MEI|71|78","Caleb Wiley|2004|USA|DEF|72|77","Martial Godo|2002|FRA|MEI|73|76","Karl-Johan Johnsson|1990|SWE|GOL|72|72","Saidou Sow|2002|GUI|DEF|73|75","Mathis Amougou|2005|FRA|MEI|72|79","Felix Lemarechal|2005|FRA|MEI|68|76"]],
    ["brest","Stade Brestois","Brest",60,68,[
      "Marco Bizot|1991|NED|GOL|77|77",
      "Brendan Chardonnet|1994|FRA|DEF|74|74",
      "Kenny Lala|1991|FRA|DEF|74|74",
      "Mahdi Camara|1998|FRA|MEI|76|77",
      "Pierre Lees-Melou|1993|FRA|MEI|75|75",
      "Kamory Doumbia|2003|MLI|MEI|74|78",
      "Romain Del Castillo|1996|FRA|ATA|74|74",
      "Ludovic Ajorque|1994|FRA|ATA|75|75",
      "Gregoire Coudert|1999|FRA|GOL|73|74",
      "Soumaila Coulibaly|2005|FRA|DEF|71|78",
      "Lilian Brassier|1999|FRA|DEF|73|75",
      "Julien Le Cardinal|1997|FRA|DEF|73|74",
      "Jonas Martin|1990|FRA|MEI|75|75",
      "Hugo Magnetti|1998|FRA|MEI|74|75",
      "Mama Balde|1995|GNB|ATA|74|74",
      "Joris Chotard|2001|FRA|MEI|73|76",
      "Karamoko Dembele|2003|ENG|ATA|72|77",
      "Jeremy Le Douaron|1998|FRA|ATA|74|75",
      "Abdallah Sima|2001|SEN|ATA|75|76",
      "Eric Junior Dina Ebimbe|2000|FRA|MEI|74|76"
    ]],
    ["toulouse","Toulouse FC","Toulouse",60,68,[
      "Guillaume Restes|2005|FRA|GOL|79|84",
      "Mikkel Desler|1995|DEN|DEF|73|73",
      "Rasmus Nicolaisen|1997|DEN|DEF|76|76",
      "Vincent Sierro|1995|SUI|MEI|75|75",
      "Frank Magri|1999|CMR|ATA|74|75",
      "Yann Gboho|2000|CIV|ATA|73|76",
      "Zakaria Aboukhlal|2000|MAR|ATA|75|76",
      "Kjetil Haug|1999|NOR|GOL|70|72",
      "Charlie Cresswell|2002|ENG|DEF|74|78",
      "Mark McKenzie|1999|USA|DEF|75|77",
      "Dayann Methalie|2002|FRA|DEF|72|75",
      "Warren Kamanzi|2000|BDI|DEF|70|74",
      "Cristian Casseres|2000|VEN|MEI|75|76",
      "Niklas Schmidt|1998|GER|MEI|74|75",
      "Aron Donnum|1998|NOR|ATA|74|75",
      "Joshua Duffus|2002|AUS|ATA|71|75",
      "Santiago Lopez|2004|COL|MEI|70|75",
      "Alex Dominguez|2004|ECU|MEI|70|76"
    ]],
    ["nantes","FC Nantes","Nantes",56,66,[
      "Anthony Lopes|1990|POR|GOL|75|75","Chidozie Awaziem|1997|NGA|DEF|73|73","Nicolas Cozza|1999|FRA|DEF|73|73","Fabien Centonze|1996|FRA|DEF|74|74","Johan Gastien|1988|FRA|MEI|73|73","Matthis Abline|2003|FRA|ATA|75|79","Mostafa Mohamed|1997|EGY|ATA|75|75","Patrik Carlgren|1992|SWE|GOL|72|72","Pedro Chirivella|1997|ESP|MEI|74|74","Johann Lepenant|2002|FRA|MEI|75|78","Louis Leroux|2001|FRA|DEF|72|75","Herba Guirassy|2000|GUI|ATA|72|74","Alban Lafont|1999|FRA|GOL|78|79","Kelvin Amian|1998|CIV|DEF|73|74","Francisco Sierralta|1997|CHI|DEF|74|74","Ibrahima Sissoko|1997|MLI|DEF|72|73","Yassine Benhattab|1999|ALG|ATA|73|75","Jean-Charles Castelletto|1995|CMR|DEF|75|75"]],
    ["auxerre","AJ Auxerre","Auxerre",52,64,[
      "Donovan Leon|1992|FRA|GOL|74|74","Gideon Mensah|1998|GHA|DEF|73|73","Gaetan Perrin|1996|FRA|ATA|74|74","Lassine Sinayoko|1999|MLI|ATA|74|75","Theo De Percin|2001|FRA|GOL|68|71","Clement Akpa|2001|FRA|DEF|74|75","Elisha Owusu|1997|GHA|MEI|75|75","Hamed Junior Traore|2000|CIV|MEI|75|78","Sinaly Diomande|2001|CIV|DEF|73|76","Rayan Raveloson|1999|MAD|MEI|72|74","Lasso Coulibaly|2005|FRA|MEI|70|77","Theo Pellenard|1994|FRA|DEF|73|73","Ado Onaiwu|1995|JPN|ATA|73|73","Kevin Danois|2001|FRA|MEI|72|75","Nathan Buayi-Kiala|2003|FRA|DEF|72|76","Kevin Boma|1996|FRA|DEF|72|72","Sebastien Pocognoli|1987|BEL|MEI|70|70","Hamza Sakhi|2005|MAR|ATA|68|76","Nicolas Saint-Ruf|1999|FRA|DEF|72|73"]],
    ["angers","Angers SCO","Angers",50,63,[
      "Paul Bernardoni|1997|FRA|GOL|73|74","Jordan Lefort|1993|FRA|DEF|72|72","Yahia Fofana|2000|CIV|GOL|75|76","Herve Koffi|1999|BFA|GOL|71|72","Jacques Ekomie|1997|CMR|DEF|72|72","Emmanuel Biumla|2002|FRA|DEF|72|75","Sidiki Cherif|2002|GUI|DEF|72|75","Carlens Arcus|1996|HAI|DEF|74|74","Himad Abdelli|1999|ALG|MEI|76|78","Pierrick Capelle|1987|FRA|MEI|74|74","Farid El Melali|1997|ALG|ATA|74|75","Amine Salama|2002|MAR|ATA|71|74","Ibrahima Niane|1999|SEN|ATA|73|74","Pierre Sagna|2003|FRA|MEI|70|74","Haris Belkebla|1994|ALG|MEI|74|74","Prosper Peter|2004|NGA|ATA|68|74","Louis Mouton|1999|FRA|ATA|72|73","Abdoulaye Bamba|2001|CIV|MEI|71|74"]],
    ["le_havre","Le Havre AC","Le Havre",50,63,[
      "Arouna Sangante|2002|SEN|DEF|72|75","Mohamed Bayo|1998|GUI|ATA|74|75","Arthur Desmas|1994|FRA|GOL|75|75","Mathieu Gorgelin|1990|FRA|GOL|71|71","Yoann Salmier|1990|FRA|DEF|72|72","Arouna Kone|2001|FRA|DEF|72|74","Loic Nego|1991|HUN|DEF|73|73","Gautier Lloris|1999|FRA|DEF|71|73","Christopher Operi|1997|CIV|DEF|72|72","Nabil Alioui|1999|FRA|ATA|74|75","Daler Kuzyaev|1993|RUS|MEI|75|75","Rassoul Ndiaye|2000|SEN|MEI|73|75","Antoine Joujou|1999|FRA|ATA|73|74","Issa Soumare|2000|FRA|ATA|72|75","Josue Casimir|2001|FRA|ATA|73|75","Yassine Kechta|1999|MAR|MEI|72|73","Abdoulaye Toure|1994|GUI|MEI|74|74","Emmanuel Sabbi|1997|USA|ATA|72|73"]],
    ["lorient","FC Lorient","Lorient",50,63,[
      "Laurent Abergel|1993|FRA|MEI|73|73","Bamo Meite|2001|CIV|DEF|72|75","Yvon Mvogo|1994|SUI|GOL|75|75","Benjamin Leroy|1989|FRA|GOL|70|70","Montassar Talbi|1998|TUN|DEF|75|75","Isaak Toure|2003|FRA|DEF|73|76","Julien Laporte|1993|FRA|DEF|72|72","Theo Le Bris|2002|FRA|DEF|72|75","Panos Katseris|1997|GRE|DEF|73|73","Pablo Pagis|2000|FRA|ATA|73|75","Aiyegun Tosin|1997|NGA|ATA|74|74","Arthur Avom|2004|FRA|MEI|72|76","Bakary Kone|2003|FRA|DEF|71|74","Noah Cadiou|2004|FRA|MEI|70|74","Formose Mendy|2001|SEN|MEI|73|75","Mohamed Bamba|2000|FRA|ATA|72|74","Gedeon Kalulu|1997|COD|DEF|72|73","Darlin Yongwa|2000|CMR|MEI|72|74"]],
    ["metz","FC Metz","Metz",48,62,[
      "Jean-Philippe Gbamin|1995|CIV|MEI|72|72",
      "Pape Sy|1998|SEN|GOL|71|72",
      "Alexandre Oukidja|1988|ALG|GOL|73|73",
      "Ismael Traore|1999|CIV|DEF|72|74",
      "Koffi Kouao|2002|CIV|DEF|71|74",
      "Maxime Colin|1991|FRA|DEF|73|73",
      "Urie-Michel Mboula|2002|FRA|ATA|72|75",
      "Matthieu Udol|1997|FRA|DEF|72|72",
      "Jessy Deminguet|1996|FRA|MEI|73|73",
      "Boubacar Traore|2001|MLI|MEI|74|76",
      "Joel Asoro|1999|SWE|ATA|71|72",
      "Papa Amadou Diallo|2005|SEN|ATA|70|78",
      "Habib Maiga|1995|CIV|MEI|72|72",
      "Gauthier Hein|1996|FRA|ATA|73|73",
      "Cheikh Sabaly|1996|SEN|ATA|72|72",
      "Sadibou Sane|2002|SEN|DEF|71|74",
      "Terry Yegbe|2001|FRA|DEF|71|74",
      "Jean-Philippe Krasso|1997|CIV|ATA|72|72"
    ]],
    ["paris_fc","Paris FC","Paris FC",52,64,[
      "Moses Simon|1995|NGA|ATA|74|74","Willem Geubbels|2001|FRA|ATA|73|75","Obed Nkambadio|2003|FRA|GOL|70|74","Kevin Trapp|1990|GER|GOL|77|77","Moustapha Mbow|2002|SEN|DEF|72|75","Otavio|1995|POR|DEF|73|73","Samir Chergui|1996|FRA|DEF|72|72","Thibault De Smet|1999|FRA|DEF|72|74","Maxime Lopez|1997|FRA|MEI|76|76","Ilan Kebbal|1998|ALG|MEI|75|77","Adama Camara|2002|FRA|MEI|72|75","Jonathan Ikone|1998|FRA|ATA|76|77","Ibrahim Mbaye|2006|FRA|ATA|70|82","Luca Koleosho|2004|ITA|ATA|73|77","Nhoa Sangui|2005|FRA|DEF|72|79","Mathieu Cafaro|1997|FRA|ATA|72|73","Alimami Gory|1999|FRA|ATA|74|74","Nouha Dicko|1992|MLI|ATA|72|72","Vincent Marchetti|2005|FRA|MEI|66|74"]]
  ]};
  const registry=root.ProLifeGlobalFootballPacks=root.ProLifeGlobalFootballPacks||[];
  if(!registry.some(item=>item.id===pack.id))registry.push(pack);
  if(typeof module!=="undefined"&&module.exports)module.exports=pack;
})(typeof globalThis!=="undefined"?globalThis:this);
