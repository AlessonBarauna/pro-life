(function(root){
  "use strict";
  // Serie A 2025/26 (escopo EA SPORTS FC 26). GER/potencial: estimativa propria, nao copia de tabela oficial.
  // Linha: "Nome|AnoNasc|COD|POS|GER|POT". Brasileiros ficam fora (cobertos pelo pool legado/Brasil).
  const pack={id:"eur26b_ita",version:2,league:["serie_a_italy","Serie A","Serie A","Italia",89],clubs:[
    ["inter","Inter","Inter",90,87,[
      "Yann Sommer|1988|SUI|GOL|83|83","Josep Martinez|1998|ESP|GOL|77|79","Alessandro Bastoni|1999|ITA|DEF|87|88","Francesco Acerbi|1988|ITA|DEF|80|80","Stefan de Vrij|1992|NED|DEF|80|80","Denzel Dumfries|1996|NED|DEF|83|83","Federico Dimarco|1997|ITA|DEF|85|85","Yann Bisseck|2000|GER|DEF|80|82","Hakan Calhanoglu|1994|TUR|MEI|87|87","Nicolo Barella|1997|ITA|MEI|87|88","Henrikh Mkhitaryan|1989|ARM|MEI|80|80","Piotr Zielinski|1994|POL|MEI|82|82","Davide Frattesi|1999|ITA|MEI|80|82","Petar Sucic|2003|CRO|MEI|77|84","Andy Diouf|2003|FRA|MEI|76|81","Lautaro Martinez|1997|ARG|ATA|89|89","Marcus Thuram|1997|FRA|ATA|85|85","Ange-Yoan Bonny|2003|FRA|ATA|76|81","Francesco Pio Esposito|2005|ITA|ATA|74|86","Manuel Akanji|1995|SUI|DEF|83|83"]],
    ["milan","AC Milan","Milan",87,84,[
      "Mike Maignan|1995|FRA|GOL|87|87","Pietro Terracciano|1990|ITA|GOL|75|75","Fikayo Tomori|1997|ENG|DEF|83|83","Strahinja Pavlovic|2001|SRB|DEF|80|82","Matteo Gabbia|1999|ITA|DEF|78|79","Davide Calabria|1996|ITA|DEF|76|76","Alex Jimenez|2005|ESP|DEF|76|85","Koni De Winter|2002|BEL|DEF|76|80","Luka Modric|1985|CRO|MEI|84|84","Adrien Rabiot|1995|FRA|MEI|83|83","Youssouf Fofana|1999|FRA|MEI|82|83","Ardon Jashari|2002|SUI|MEI|78|83","Samuele Ricci|2001|ITA|MEI|79|83","Yunus Musah|2002|USA|MEI|77|80","Ruben Loftus-Cheek|1996|ENG|MEI|78|78","Christian Pulisic|1998|USA|ATA|84|84","Rafael Leao|1999|POR|ATA|86|88","Christopher Nkunku|1997|FRA|ATA|82|82","Santiago Gimenez|2001|MEX|ATA|82|85","Alexis Saelemaekers|1999|BEL|ATA|78|78","Pervis Estupinan|1998|ECU|DEF|79|79"]],
    ["juventus","Juventus","Juventus",86,83,[
      "Michele Di Gregorio|1997|ITA|GOL|80|81","Mattia Perin|1992|ITA|GOL|76|76","Federico Gatti|1998|ITA|DEF|80|81","Pierre Kalulu|2000|FRA|DEF|79|80","Lloyd Kelly|1998|ENG|DEF|78|78","Andrea Cambiaso|2000|ITA|DEF|80|82","Juan Cabal|2001|COL|DEF|78|80","Manuel Locatelli|1998|ITA|MEI|82|82","Khephren Thuram|2001|FRA|MEI|80|84","Teun Koopmeiners|1998|NED|MEI|83|83","Weston McKennie|1998|USA|MEI|79|79","Kenan Yildiz|2005|TUR|ATA|84|91","Francisco Conceicao|2002|POR|ATA|81|85","Jonathan David|2000|CAN|ATA|82|83","Dusan Vlahovic|2000|SRB|ATA|83|83","Lois Openda|2000|BEL|ATA|80|82","Edon Zhegrova|1999|KOS|ATA|79|80","Arkadiusz Milik|1994|POL|ATA|76|76"]],
    ["napoli","SSC Napoli","Napoli",86,84,[
      "Alex Meret|1997|ITA|GOL|82|82","Alessandro Buongiorno|1999|ITA|DEF|83|85","Amir Rrahmani|1994|KOS|DEF|82|82","Giovanni Di Lorenzo|1993|ITA|DEF|82|82","Sam Beukema|1998|NED|DEF|80|82","Leonardo Spinazzola|1993|ITA|DEF|78|78","Miguel Gutierrez|2001|ESP|DEF|77|79","Stanislav Lobotka|1994|SVK|MEI|84|84","Scott McTominay|1996|SCO|MEI|83|83","Kevin De Bruyne|1991|BEL|MEI|87|87","Billy Gilmour|2001|SCO|MEI|79|80","Frank Anguissa|1996|CMR|MEI|82|82","Antonio Vergara|2003|ITA|MEI|74|80","Matteo Politano|1993|ITA|ATA|79|79","Romelu Lukaku|1993|BEL|ATA|82|82","Rasmus Hojlund|2003|DEN|ATA|78|83","Noa Lang|1999|NED|ATA|79|80","Vanja Milinkovic-Savic|1997|SRB|GOL|80|81"]],
    ["atalanta","Atalanta","Atalanta",82,81,[
      "Marco Carnesecchi|2000|ITA|GOL|82|84","Berat Djimsiti|1993|ALB|DEF|80|80","Isak Hien|1999|SWE|DEF|79|80","Sead Kolasinac|1993|BIH|DEF|77|77","Odilon Kossounou|2001|CIV|DEF|79|81","Raoul Bellanova|2000|ITA|DEF|79|80","Davide Zappacosta|1992|ITA|DEF|77|77","Marten de Roon|1991|NED|MEI|80|80","Lazar Samardzic|2002|SRB|MEI|79|82","Mario Pasalic|1995|CRO|MEI|80|80","Charles De Ketelaere|2001|BEL|ATA|82|85","Ademola Lookman|1997|NGA|ATA|83|83","Nikola Krstovic|2000|MNE|ATA|77|79","Gianluca Scamacca|1999|ITA|ATA|79|80","Giacomo Raspadori|2000|ITA|ATA|78|79","Daniel Maldini|2001|ITA|ATA|75|77","Rui Patricio|1988|POR|GOL|74|74","Honest Ahanor|2008|ITA|DEF|66|82"]],
    ["roma","AS Roma","Roma",82,80,[
      "Mile Svilar|1999|SRB|GOL|83|84","Gianluca Mancini|1996|ITA|DEF|82|82","Evan Ndicka|1999|CIV|DEF|82|83","Chris Smalling|1989|ENG|DEF|76|76","Mario Hermoso|1995|ESP|DEF|79|79","Angelino|1997|ESP|DEF|79|79","Zeki Celik|1997|TUR|DEF|77|77","Lorenzo Pellegrini|1996|ITA|MEI|82|82","Manu Kone|2001|FRA|MEI|81|83","Bryan Cristante|1995|ITA|MEI|80|80","Niccolo Pisilli|2004|ITA|MEI|74|81","Tommaso Baldanzi|2003|ITA|MEI|76|80","Paulo Dybala|1993|ARG|ATA|83|83","Matias Soule|2003|ARG|ATA|80|85","Artem Dovbyk|1997|UKR|ATA|79|79","Stephan El Shaarawy|1992|ITA|ATA|78|78","Robinio Vaz|2007|FRA|ATA|70|83","Pierluigi Gollini|1995|ITA|GOL|72|72"]],
    ["lazio","SS Lazio","Lazio",76,77,[
      "Ivan Provedel|1994|ITA|GOL|80|80","Mario Gila|2000|ESP|DEF|80|83","Alessio Romagnoli|1995|ITA|DEF|79|79","Nuno Tavares|2000|POR|DEF|77|78","Manuel Lazzari|1993|ITA|DEF|76|76","Nicolo Rovella|2001|ITA|MEI|81|83","Matteo Guendouzi|1999|FRA|MEI|81|82","Danilo Cataldi|1994|ITA|MEI|76|76","Fisayo Dele-Bashiru|2001|NGA|MEI|75|78","Reda Belahyane|2004|MAR|MEI|73|79","Gustav Isaksen|2001|DEN|ATA|78|80","Mattia Zaccagni|1995|ITA|ATA|80|80","Boulaye Dia|1996|SEN|ATA|77|77","Pedro|1987|ESP|ATA|75|75","Christos Mandas|2001|GRE|GOL|72|76","Patric|1993|ESP|DEF|74|74","Taty Castellanos|1998|ARG|ATA|78|78","Toma Basic|1996|CRO|MEI|76|76"]],
    ["fiorentina","ACF Fiorentina","Fiorentina",76,77,[
      "David de Gea|1990|ESP|GOL|80|80","Pietro Comuzzo|2005|ITA|DEF|76|84","Luca Ranieri|1999|ITA|DEF|77|78","Marin Pongracic|1997|CRO|DEF|77|77","Robin Gosens|1994|GER|DEF|77|77","Michael Kayode|2004|ITA|DEF|74|81","Rolando Mandragora|1997|ITA|MEI|78|78","Nicolo Fagioli|2001|ITA|MEI|77|80","Jacopo Fazzini|2003|ITA|MEI|74|79","Moise Kean|2000|ITA|ATA|82|83","Albert Gudmundsson|1997|ISL|ATA|79|79","Roberto Piccoli|2001|ITA|ATA|75|77","Riccardo Sottil|1999|ITA|ATA|74|74","Tommaso Martinelli|2002|ITA|GOL|68|74","Fabiano Parisi|2000|ITA|DEF|75|77","Cher Ndour|2004|ITA|MEI|75|80","Pablo Mari|1993|ESP|DEF|75|75","Eddy Kouadio|2005|ITA|DEF|66|76","Edoardo Bove|2002|ITA|MEI|77|80","Nicolas Valentini|2000|ARG|DEF|74|75","Lucas Beltran|2001|ARG|ATA|77|79"]],
    ["bologna","Bologna FC","Bologna",72,75,[
      "Lukasz Skorupski|1991|POL|GOL|79|79",
      "Jhon Lucumi|1998|COL|DEF|79|80",
      "Juan Miranda|2000|ESP|DEF|75|76",
      "Lewis Ferguson|1999|SCO|MEI|80|81",
      "Remo Freuler|1992|SUI|MEI|78|78",
      "Nikola Moro|1998|CRO|MEI|77|78",
      "Riccardo Orsolini|1997|ITA|ATA|79|79",
      "Santiago Castro|2004|ARG|ATA|76|82",
      "Jonathan Rowe|2003|ENG|ATA|76|80",
      "Thijs Dallinga|2000|NED|ATA|74|75",
      "Federico Bernardeschi|1994|ITA|ATA|76|76",
      "Federico Ravaglia|1999|ITA|GOL|70|72",
      "Torbjorn Heggem|1999|NOR|DEF|75|77",
      "Emil Holm|2000|SWE|DEF|75|77",
      "Eivind Helland|2002|NOR|DEF|70|74",
      "Jens Odgaard|1999|DEN|ATA|76|77",
      "Ciro Immobile|1990|ITA|ATA|75|75",
      "Dan Ndoye|2000|SUI|ATA|77|79",
      "Benjamin Dominguez|2001|CHI|MEI|73|76"
    ]],
    ["torino","Torino FC","Torino",66,71,[
      "Franco Israel|2000|URU|GOL|75|78","Saul Coco|1999|EQG|DEF|75|76","Perr Schuurs|1999|NED|DEF|77|78","Valentino Lazaro|1996|AUT|DEF|75|75","Nikola Vlasic|1997|CRO|MEI|77|77","Ivan Ilic|2001|SRB|MEI|76|78","Cesare Casadei|2003|ITA|MEI|73|79","Che Adams|1996|SCO|ATA|77|77","Duvan Zapata|1991|COL|ATA|75|75","Giovanni Simeone|1995|ARG|ATA|77|77","Adam Masina|1994|MAR|DEF|75|75","Ardian Ismajli|1996|ALB|DEF|74|74","Marcus Pedersen|2000|NOR|DEF|73|75","Cristian Ansaldi|1986|ARG|DEF|71|71","Gvidas Gineitis|2004|LTU|MEI|74|79","Zanos Savva|2002|CYP|ATA|73|76","Alberto Paleari|1992|ITA|GOL|72|72","Emirhan Ilkhan|2004|TUR|MEI|73|79"]],
    ["udinese","Udinese","Udinese",64,70,[
      "Maduka Okoye|1999|NGA|GOL|76|77","Thomas Kristensen|2002|DEN|DEF|76|79","Oumar Solet|2000|FRA|DEF|77|79","Kingsley Ehizibue|1995|NGA|DEF|75|75","Hassane Kamara|1994|CIV|DEF|75|75","Jesper Karlstrom|1995|SWE|MEI|76|76","Arthur Atta|2002|FRA|MEI|75|78","Florian Thauvin|1993|FRA|ATA|78|78","Nicolo Zaniolo|1999|ITA|ATA|76|78","Keinan Davis|1998|ENG|ATA|74|74","Razvan Sava|2002|ROU|GOL|68|73","Sandi Lovric|1998|SVN|MEI|75|76","Jurgen Ekkelenkamp|2000|NED|MEI|75|77","Lorenzo Lucca|2000|ITA|ATA|76|78","Iker Bravo|2005|ESP|ATA|70|78","Christian Kabasele|1991|BEL|DEF|73|73","Thomas Ouwejan|1996|NED|DEF|73|73","Jordan Zemura|1999|ZIM|DEF|73|74","Jakub Piotrowski|1997|POL|MEI|75|75","Vakoun Issouf Bayo|1997|CIV|ATA|74|74","Adam Buksa|1996|POL|ATA|74|74"]],
    ["genoa","Genoa CFC","Genoa",62,69,[
      "Mattia Bani|1993|ITA|DEF|74|74","Johan Vasquez|1998|MEX|DEF|77|78","Brooke Norton-Cuffy|2004|ENG|DEF|73|79","Morten Frendrup|2001|DEN|MEI|76|78","Ruslan Malinovskyi|1993|UKR|MEI|77|77","Vitor Oliveira|2000|POR|ATA|76|78|Vitinha","Lorenzo Colombo|2002|ITA|ATA|74|77","Maxwel Cornet|1996|CIV|ATA|75|75","Nicola Leali|1993|ITA|GOL|71|71","Justin Bijlow|1998|NED|GOL|74|76","Daniel Sommariva|2001|ITA|GOL|66|70","Alessandro Marcandalli|2001|ITA|DEF|73|76","Aaron Martin|1997|ESP|DEF|74|75","Alessandro Zanoli|2000|ITA|MEI|74|76","Jean Onana|2000|CMR|MEI|73|75","Vitinha|2000|POR|ATA|76|77","Junior Messias|1991|ITA|ATA|74|74","Caleb Ekuban|1994|GHA|ATA|73|73","Patrizio Masini|2005|ITA|MEI|68|77"]],
    ["como","Como 1907","Como",64,70,[
      "Jean Butez|1995|FRA|GOL|74|74","Marc-Oliver Kempf|1995|GER|DEF|75|75","Jacobo Ramon|2005|ESP|DEF|71|80","Alberto Moreno|1992|ESP|DEF|74|74","Mergim Vojvoda|1995|KOS|DEF|75|75","Nico Paz|2004|ARG|MEI|80|88","Lucas Da Cunha|2001|FRA|MEI|76|78","Maximo Perrone|2003|ARG|MEI|75|80","Sergi Roberto|1992|ESP|MEI|75|75","Assane Diao|2005|ESP|ATA|76|84","Anastasios Douvikas|1999|GRE|ATA|76|77","Alvaro Morata|1992|ESP|ATA|78|78","Mauro Vigorito|1998|ITA|GOL|68|70","Edoardo Goldaniga|1993|ITA|DEF|74|74","Alex Valle|2004|ESP|DEF|75|80","Ignace Van der Brempt|2002|BEL|DEF|74|76","Maxence Caqueret|2000|FRA|MEI|78|80","Jayden Addai|2005|NED|ATA|69|78","Andrea Belotti|1993|ITA|ATA|74|74"]],
    ["parma","Parma Calcio 1913","Parma",58,67,[
      "Zion Suzuki|2002|JPN|GOL|77|81",
      "Enrico Delprato|1999|ITA|DEF|74|75",
      "Lautaro Valenti|1998|ARG|DEF|74|75",
      "Matteo Cancellieri|2002|ITA|ATA|74|77",
      "Mandela Keita|2002|BEL|MEI|74|78",
      "Adrian Bernabe|2001|ESP|MEI|76|79",
      "Mateo Pellegrino|2001|ARG|ATA|74|77",
      "Gabriel Strefezza|1997|ITA|ATA|74|74",
      "Edoardo Corvi|2001|ITA|GOL|71|74",
      "Alessandro Circati|2003|AUS|DEF|75|80",
      "Botond Balogh|2001|HUN|DEF|74|77",
      "Emanuele Valeri|1998|ITA|DEF|74|75",
      "Nicolo Cambiaghi|2000|ITA|ATA|74|76",
      "Oliver Sorensen|2004|DEN|MEI|73|78",
      "Matija Frigan|2003|CRO|ATA|71|74",
      "Christian Ordonez|2004|ECU|MEI|70|76",
      "Pontus Almqvist|1999|SWE|ATA|75|76",
      "Franco Carboni|2003|ARG|DEF|74|77",
      "Mariano Troilo|2002|ITA|DEF|70|74"
    ]],
    ["cagliari","Cagliari Calcio","Cagliari",58,66,[
      "Elia Caprile|2001|ITA|GOL|76|80","Yerry Mina|1994|COL|DEF|75|75","Marco Palestra|2005|ITA|DEF|74|83","Gianluca Gaetano|2000|ITA|MEI|75|76","Michel Adopo|2000|FRA|MEI|74|76","Sebastiano Esposito|2002|ITA|ATA|74|78","Zito Luvumbo|2002|ANG|ATA|74|78","Michael Folorunsho|1998|ITA|MEI|75|76","Alessandro Deiola|1995|ITA|MEI|73|73","Sebastiano Luperto|1996|ITA|DEF|74|74","Zé Pedro|2004|POR|DEF|72|78","Juan Rodriguez|1998|ITA|DEF|72|73","Gabriele Zappa|1999|ITA|DEF|73|74","Mattia Felici|2002|ITA|MEI|72|75","Matteo Prati|2003|ITA|MEI|75|79","Razvan Marin|1996|ROU|MEI|75|75","Leonardo Pavoletti|1988|ITA|ATA|72|72","Mattia Aramu|1995|ITA|ATA|72|72","Boris Radunovic|1996|SRB|GOL|71|71","Tommaso Augello|1994|ITA|DEF|72|72"]],
    ["lecce","US Lecce","Lecce",56,65,[
      "Wladimiro Falcone|1995|ITA|GOL|75|75","Federico Baschirotto|1996|ITA|DEF|75|75","Tiago Gabriel|2004|POR|DEF|72|78","Lassana Coulibaly|1996|MLI|MEI|75|75","Ylber Ramadani|1996|ALB|MEI|75|75","Santiago Pierotti|2001|ARG|ATA|74|76","Lameck Banda|2001|ZAM|ATA|73|76","Christian Fruchtl|2000|GER|GOL|69|72","Kialonda Gaspar|1996|ANG|DEF|74|74","Antonino Gallo|2000|ITA|DEF|75|77","Danilo Veiga|2002|POR|DEF|73|76","Frederic Guilbert|1994|FRA|DEF|73|73","Gaby Jean|2002|FRA|MEI|72|76","Hamza Rafia|1999|TUN|MEI|73|75","Walid Cheddira|1998|MAR|ATA|73|74","Medon Berisha|2003|ALB|MEI|71|75","Rémi Oudin|1996|FRA|ATA|73|73","Tonny Vilhena|1995|NED|MEI|74|74","Filip Marchwinski|2002|POL|MEI|72|75","Konan N'Dri|2001|CIV|ATA|72|74"]],
    ["hellas_verona","Hellas Verona","Hellas Verona",54,64,[
      "Lorenzo Montipo|1996|ITA|GOL|75|75","Martin Frese|1998|DEN|DEF|73|74","Suat Serdar|1997|GER|MEI|74|74","Tomas Suslov|2002|SVK|MEI|74|78","Daniel Mosquera|2001|COL|ATA|72|76","Kieron Bowie|2002|SCO|ATA|70|75","Simone Perilli|1997|ITA|GOL|70|71","Pawel Dawidowicz|1995|POL|DEF|74|74","Victor Nelsson|1998|DEN|DEF|74|75","Diego Coppola|2003|ITA|DEF|73|77","Nelson Abbey|2002|ENG|DEF|71|74","Domagoj Bradaric|1999|CRO|DEF|74|75","Abdou Harroui|1998|MAR|MEI|74|75","Antoine Bernede|1999|FRA|MEI|73|74","Amin Sarr|2001|SWE|ATA|73|75","Rafik Belghali|2002|ALG|DEF|72|75","Andrias Edmundsson|2003|FRO|MEI|70|74","Kevin Zeroli|2000|ITA|MEI|72|74","Ondrej Duda|1994|SVK|MEI|75|75","Jose Ivan Mosquera|2005|COL|DEF|66|75"]],
    ["sassuolo","US Sassuolo","Sassuolo",60,67,[
      "Arijanet Muric|1998|KOS|GOL|76|77","Domenico Berardi|1994|ITA|ATA|80|80","Armand Lauriente|1998|FRA|ATA|76|77","Andrea Pinamonti|1999|ITA|ATA|76|77","Kristian Thorstvedt|1999|NOR|MEI|76|77","Nemanja Matic|1988|SRB|MEI|74|74","Cristian Volpato|2003|ITA|ATA|74|79","Andrea Consigli|1987|ITA|GOL|74|74","Jay Idzes|2000|NED|DEF|77|79","Tarik Muharemovic|2003|BIH|DEF|75|80","Woyo Coulibaly|1999|FRA|DEF|73|74","Fali Cande|2002|GNB|DEF|71|74","Josh Doig|2002|SCO|DEF|72|75","Daniel Boloca|1999|ROU|MEI|75|76","Edoardo Iannoni|2000|ITA|MEI|72|74","Laurs Skjellerup|2003|DEN|DEF|70|75","Luca Moro|2003|ITA|ATA|72|75","Cas Odenthal|2001|NED|DEF|72|75","Filippo Romagna|1997|ITA|DEF|72|73","Yeferson Paz|2003|COL|DEF|71|75","Pedro Mendes|2002|POR|DEF|70|74"]],
    ["cremonese","US Cremonese","Cremonese",52,63,[
      "Jamie Vardy|1987|ENG|ATA|75|75","Federico Bonazzoli|1997|ITA|ATA|74|74","Franco Vazquez|1989|ARG|MEI|74|74","Leonardo Sernicola|1997|ITA|DEF|72|72","Emil Audero|1997|IDN|GOL|75|76","Marco Silvestri|1991|ITA|GOL|72|72","Matteo Bianchetti|1993|ITA|DEF|73|73","Luka Lochoshvili|1998|GEO|DEF|72|74","Matteo Lovato|2000|ITA|DEF|73|75","Giuseppe Pezzella|1997|ITA|DEF|73|74","Alberto Grassi|1995|ITA|MEI|75|75","Alessio Zerbin|1999|ITA|ATA|74|75","Michele Castagnetti|1990|ITA|MEI|71|71","Dennis Johnsen|1998|NOR|ATA|72|74","Jari Vandeputte|1996|BEL|ATA|73|74","Faris Moumbagna|2000|CMR|ATA|72|74","Warren Bondo|2003|FRA|MEI|74|79","Martin Payero|1998|ARG|MEI|75|75","Romano Floriani Mussolini|2003|ITA|MEI|71|75","Jeremy Sarmiento|2002|ECU|ATA|72|75","Giovanni Bonfanti|2002|ITA|DEF|70|73","Filippo Terracciano|2003|ITA|DEF|70|74"]],
    ["pisa","Pisa SC","Pisa",52,63,[
      "Adrian Semper|1998|CRO|GOL|73|74",
      "Simone Canestrelli|1998|ITA|DEF|73|74",
      "Idrissa Toure|1998|GER|DEF|72|74",
      "Marius Marin|1998|ROU|MEI|74|75",
      "Mattia Tramoni|2000|ITA|MEI|72|73",
      "Stefano Moreo|1993|ITA|ATA|73|73",
      "Henrik Meister|2002|DEN|ATA|72|76",
      "M'Bala Nzola|1996|ANG|ATA|75|75",
      "Nicolas Scuffet|1996|ITA|GOL|73|73",
      "Antonio Caracciolo|1990|ITA|DEF|72|72",
      "Daniel Denoon|2003|NED|DEF|71|75",
      "Raul Albiol|1985|ESP|DEF|75|75",
      "Samuele Angori|2004|ITA|DEF|70|75",
      "Matteo Tramoni|2000|FRA|ATA|74|76",
      "Michel Aebischer|1997|SUI|MEI|77|77",
      "Mattia Valoti|1994|ITA|MEI|72|72",
      "Mehdi Leris|1998|FRA|ATA|72|73",
      "Gabriele Piccinini|1996|ITA|MEI|72|72",
      "Isak Vural|2001|TUR|MEI|71|73",
      "Stefano Sernicola|1999|ITA|DEF|70|72"
    ]]
  ]};
  const registry=root.ProLifeGlobalFootballPacks=root.ProLifeGlobalFootballPacks||[];
  if(!registry.some(item=>item.id===pack.id))registry.push(pack);
  if(typeof module!=="undefined"&&module.exports)module.exports=pack;
})(typeof globalThis!=="undefined"?globalThis:this);
