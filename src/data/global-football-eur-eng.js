(function(root){
  "use strict";
  // Premier League 2025/26 (escopo EA SPORTS FC 26). GER/potencial: estimativa propria, nao copia de tabela oficial.
  // Linha: "Nome|AnoNasc|COD|POS|GER|POT". Brasileiros ficam fora (cobertos pelo pool legado/Brasil).
  const pack={id:"eur26b_eng",version:2,league:["premier_league","Premier League","Premier League","Inglaterra",95],clubs:[
    ["arsenal","Arsenal","Arsenal",92,90,[
      "David Raya|1995|ESP|GOL|86|86","Kepa Arrizabalaga|1994|ESP|GOL|78|78","William Saliba|2001|FRA|DEF|89|91","Ben White|1997|ENG|DEF|83|83","Jurrien Timber|2001|NED|DEF|84|87","Piero Hincapie|2002|ECU|DEF|83|86","Riccardo Calafiori|2002|ITA|DEF|82|86","Cristhian Mosquera|2004|ESP|DEF|78|85","Martin Zubimendi|1999|ESP|MEI|85|87","Declan Rice|1999|ENG|MEI|89|90","Martin Odegaard|1998|NOR|MEI|88|89","Mikel Merino|1996|ESP|MEI|83|83","Eberechi Eze|1998|ENG|MEI|84|85","Bukayo Saka|2001|ENG|ATA|90|92","Viktor Gyokeres|1998|SWE|ATA|86|86","Leandro Trossard|1994|BEL|ATA|81|81","Noni Madueke|2002|ENG|ATA|81|84","Ethan Nwaneri|2007|ENG|MEI|75|90","Myles Lewis-Skelly|2006|ENG|DEF|74|88"]],
    ["man_city","Manchester City","Man City",92,89,[
      "Gianluigi Donnarumma|1999|ITA|GOL|88|89","James Trafford|2002|ENG|GOL|78|84","Ruben Dias|1997|POR|DEF|87|87","Josko Gvardiol|2002|CRO|DEF|86|88","Nathan Ake|1995|NED|DEF|83|83","John Stones|1994|ENG|DEF|82|82","Rayan Ait-Nouri|2001|ALG|DEF|81|83","Matheus Nunes|1998|POR|DEF|80|80","Rodri|1996|ESP|MEI|90|90","Bernardo Silva|1994|POR|MEI|87|87","Tijjani Reijnders|1998|NED|MEI|83|85","Phil Foden|2000|ENG|MEI|86|88","Rayan Cherki|2003|FRA|MEI|83|87","Mateo Kovacic|1994|CRO|MEI|80|80","Erling Haaland|2000|NOR|ATA|91|93","Jeremy Doku|2002|BEL|ATA|83|86","Omar Marmoush|1999|EGY|ATA|84|84","Nico O'Reilly|2005|ENG|DEF|77|85"]],
    ["liverpool","Liverpool","Liverpool",91,89,[
      "Giorgi Mamardashvili|2000|GEO|GOL|83|86","Virgil van Dijk|1991|NED|DEF|88|88","Ibrahima Konate|1999|FRA|DEF|85|86","Milos Kerkez|2003|HUN|DEF|80|85","Andy Robertson|1994|SCO|DEF|81|81","Jeremie Frimpong|2000|NED|DEF|82|83","Joe Gomez|1997|ENG|DEF|78|78","Conor Bradley|2003|NIR|DEF|79|85","Alexis Mac Allister|1998|ARG|MEI|86|86","Ryan Gravenberch|2002|NED|MEI|86|88","Dominik Szoboszlai|2000|HUN|MEI|85|86","Florian Wirtz|2003|GER|MEI|87|92","Curtis Jones|2001|ENG|MEI|79|81","Mohamed Salah|1992|EGY|ATA|90|90","Cody Gakpo|1999|NED|ATA|84|84","Alexander Isak|1999|SWE|ATA|87|88","Hugo Ekitike|2002|FRA|ATA|83|88","Rio Ngumoha|2008|ENG|ATA|68|86","Freddie Woodman|1997|ENG|GOL|68|68","Harvey Davies|2005|ENG|GOL|64|72"]],
    ["chelsea","Chelsea","Chelsea",89,85,[
      "Robert Sanchez|1997|ESP|GOL|79|80","Filip Jorgensen|2002|DEN|GOL|76|82","Levi Colwill|2003|ENG|DEF|82|86","Wesley Fofana|2000|FRA|DEF|80|82","Trevoh Chalobah|1999|ENG|DEF|79|80","Marc Cucurella|1998|ESP|DEF|82|82","Reece James|1999|ENG|DEF|84|85","Malo Gusto|2003|FRA|DEF|79|83","Moises Caicedo|2001|ECU|MEI|86|88","Enzo Fernandez|2001|ARG|MEI|85|88","Cole Palmer|2002|ENG|MEI|88|91","Romeo Lavia|2004|ENG|MEI|78|85","Alejandro Garnacho|2004|ARG|ATA|81|86","Pedro Neto|2000|POR|ATA|83|84","Jamie Gittens|2004|ENG|ATA|79|85","Liam Delap|2003|ENG|ATA|78|84","Nicolas Jackson|2001|SEN|ATA|80|82","Mykhailo Mudryk|2001|UKR|ATA|77|80"]],
    ["man_united","Manchester United","Man United",88,83,[
      "Senne Lammens|2002|BEL|GOL|77|84","Andre Onana|1996|CMR|GOL|79|79","Lisandro Martinez|1998|ARG|DEF|83|83","Matthijs de Ligt|1999|NED|DEF|82|83","Harry Maguire|1993|ENG|DEF|80|80","Leny Yoro|2005|FRA|DEF|77|88","Diogo Dalot|1999|POR|DEF|80|80","Luke Shaw|1995|ENG|DEF|80|80","Noussair Mazraoui|1997|MAR|DEF|79|79","Bruno Fernandes|1994|POR|MEI|87|87","Kobbie Mainoo|2005|ENG|MEI|79|87","Manuel Ugarte|2001|URU|MEI|78|81","Mason Mount|1999|ENG|MEI|79|79","Bryan Mbeumo|1999|CMR|ATA|83|84","Benjamin Sesko|2003|SVN|ATA|82|88","Amad Diallo|2002|CIV|ATA|80|83","Patrick Dorgu|2004|DEN|DEF|76|82","Altay Bayindir|1998|TUR|GOL|75|75","Tom Heaton|1986|ENG|GOL|68|68","Ayden Heaven|2006|ENG|DEF|70|82","Tyler Fredricson|2005|ENG|DEF|63|74"]],
    ["tottenham","Tottenham Hotspur","Tottenham",86,82,[
      "Guglielmo Vicario|1996|ITA|GOL|81|81","Cristian Romero|1998|ARG|DEF|85|85","Micky van de Ven|2001|NED|DEF|83|85","Pedro Porro|1999|ESP|DEF|82|82","Destiny Udogie|2002|ITA|DEF|79|82","Kevin Danso|1998|AUT|DEF|78|78","Radu Dragusin|2002|ROU|DEF|75|80","James Maddison|1996|ENG|MEI|82|82","Rodrigo Bentancur|1997|URU|MEI|80|80","Pape Matar Sarr|2002|SEN|MEI|79|82","Joao Palhinha|1995|POR|MEI|80|80","Xavi Simons|2003|NED|MEI|82|87","Lucas Bergvall|2006|SWE|MEI|75|87","Son Heung-min|1992|KOR|ATA|84|84","Dominic Solanke|1997|ENG|ATA|80|80","Mohammed Kudus|2000|GHA|ATA|82|84","Brennan Johnson|2001|WAL|ATA|78|80","Wilson Odobert|2004|FRA|ATA|75|82","Antonin Kinsky|2003|CZE|GOL|75|82","Brandon Austin|1999|ENG|GOL|66|67"]],
    ["newcastle","Newcastle United","Newcastle",84,80,[
      "Nick Pope|1992|ENG|GOL|79|79","Aaron Ramsdale|1998|ENG|GOL|77|79","Sven Botman|2000|NED|DEF|80|82","Fabian Schar|1991|SUI|DEF|79|79","Dan Burn|1992|ENG|DEF|78|78","Tino Livramento|2002|ENG|DEF|80|84","Lewis Hall|2004|ENG|DEF|78|85","Kieran Trippier|1990|ENG|DEF|78|78","Sandro Tonali|2000|ITA|MEI|84|86","Anthony Gordon|2001|ENG|ATA|82|84","Harvey Barnes|1997|ENG|ATA|79|79","Jacob Murphy|1995|ENG|ATA|76|76","Anthony Elanga|2002|SWE|ATA|77|79","Nick Woltemade|2002|GER|ATA|80|86","Yoane Wissa|1996|COD|ATA|79|79","Jacob Ramsey|2001|ENG|MEI|77|80","Odysseas Vlachodimos|1994|GRE|GOL|76|76","Mark Gillespie|1992|ENG|GOL|66|66","Joe Willock|1999|ENG|MEI|76|77","Jorgen Strand Larsen|2000|NOR|ATA|77|80"]],
    ["aston_villa","Aston Villa","Aston Villa",80,78,[
      "Emiliano Martinez|1992|ARG|GOL|84|84",
      "Ezri Konsa|1997|ENG|DEF|81|81",
      "Pau Torres|1997|ESP|DEF|80|80",
      "Matty Cash|1997|POL|DEF|79|79",
      "Lucas Digne|1993|FRA|DEF|78|78",
      "Ian Maatsen|2002|NED|DEF|77|80",
      "Amadou Onana|2001|BEL|MEI|81|83",
      "Youri Tielemans|1997|BEL|MEI|82|82",
      "John McGinn|1994|SCO|MEI|79|79",
      "Morgan Rogers|2002|ENG|MEI|83|86",
      "Boubacar Kamara|1999|FRA|MEI|81|81",
      "Leon Bailey|1997|JAM|ATA|78|78",
      "Ollie Watkins|1995|ENG|ATA|82|82",
      "Donyell Malen|1999|NED|ATA|79|79",
      "Jadon Sancho|2000|ENG|ATA|77|79",
      "Andres Garcia|2003|ESP|DEF|74|78",
      "Lamare Bogarde|2003|NED|MEI|72|78",
      "Samuel Iling-Junior|2003|ENG|DEF|71|76"
    ]],
    ["west_ham","West Ham United","West Ham",74,74,[
      "Alphonse Areola|1993|FRA|GOL|77|77","Max Kilman|1997|ENG|DEF|78|78","Jean-Clair Todibo|1999|FRA|DEF|79|80","Aaron Wan-Bissaka|1997|ENG|DEF|78|78","Konstantinos Mavropanos|1997|GRE|DEF|77|77","Tomas Soucek|1995|CZE|MEI|77|77","Mateus Fernandes|2004|POR|MEI|74|82","Jarrod Bowen|1996|ENG|ATA|81|81","Crysencio Summerville|2001|NED|ATA|77|79","Niclas Fullkrug|1993|GER|ATA|76|76","Callum Wilson|1992|ENG|ATA|75|75","Mads Hermansen|2000|DEN|GOL|75|78","Kyle Walker-Peters|1997|ENG|DEF|76|76","El Hadji Malick Diouf|2004|SEN|DEF|75|80","Guido Rodriguez|1994|ARG|MEI|77|77","Soungoutou Magassa|2003|FRA|MEI|72|77","Oliver Scarles|2005|ENG|DEF|66|76","Luis Guilherme|2006|POR|MEI|68|80","Pablo Felipe|2003|ESP|ATA|72|76","Andy Irving|2000|AUT|MEI|71|73"]],
    ["brighton","Brighton & Hove Albion","Brighton",74,76,[
      "Bart Verbruggen|2002|NED|GOL|79|82","Lewis Dunk|1991|ENG|DEF|78|78","Jan Paul van Hecke|2000|NED|DEF|79|80","Carlos Baleba|2004|CMR|MEI|79|84","Yasin Ayari|2003|SWE|MEI|76|82","Georginio Rutter|2002|FRA|ATA|77|81","Kaoru Mitoma|1997|JPN|ATA|79|79","Yankuba Minteh|2004|GAM|ATA|76|82","Danny Welbeck|1990|ENG|ATA|75|75","Diego Gomez|2003|PAR|MEI|75|80","Jack Hinshelwood|2005|ENG|MEI|75|82","Jason Steele|1990|ENG|GOL|72|72","Adam Webster|1995|ENG|DEF|76|76","Ferdi Kadioglu|1999|TUR|DEF|77|78","Brajan Gruda|2004|GER|MEI|75|82","Tom McGill|2000|ENG|GOL|66|66","Igor Julio|1998|NOR|DEF|74|74","Joel Veltman|1992|NED|DEF|74|74","Facundo Buonanotte|2004|ARG|MEI|73|78"]],
    ["crystal_palace","Crystal Palace","Crystal Palace",72,76,[
      "Dean Henderson|1997|ENG|GOL|80|80","Marc Guehi|2000|ENG|DEF|83|85","Maxence Lacroix|2000|FRA|DEF|80|81","Chris Richards|2000|USA|DEF|76|78","Tyrick Mitchell|1999|ENG|DEF|77|77","Daniel Munoz|1996|COL|DEF|78|78","Adam Wharton|2004|ENG|MEI|80|87","Ismaila Sarr|1998|SEN|ATA|80|80","Jean-Philippe Mateta|1997|FRA|ATA|80|80","Yeremy Pino|2002|ESP|ATA|78|80","Will Hughes|1995|ENG|MEI|75|75","Nathaniel Clyne|1991|ENG|DEF|68|68","Daichi Kamada|1996|JPN|MEI|77|77","Cheick Doucoure|2000|MLI|MEI|76|77","Eddie Nketiah|1999|ENG|ATA|74|75","Justin Devenny|2003|NIR|MEI|72|77","Remi Matthews|1994|ENG|GOL|68|68","Jaydee Canvot|2007|FRA|DEF|66|78","Jefferson Lerma|1994|COL|MEI|76|76","Borna Sosa|1998|CRO|DEF|74|74"]],
    ["fulham","Fulham","Fulham",70,74,[
      "Bernd Leno|1992|GER|GOL|80|80","Calvin Bassey|1999|NGA|DEF|77|78","Joachim Andersen|1996|DEN|DEF|79|79","Antonee Robinson|1997|USA|DEF|79|79","Sasa Lukic|1996|SRB|MEI|76|76","Emile Smith Rowe|2000|ENG|MEI|77|79","Harry Wilson|1997|WAL|ATA|76|76","Raul Jimenez|1991|MEX|ATA|75|75","Alex Iwobi|1996|NGA|MEI|77|77","Steven Benda|2000|GER|GOL|69|71","Kenny Tete|1995|NED|DEF|76|76","Jorge Cuenca|1999|ESP|DEF|73|75","Issa Diop|1997|FRA|DEF|75|75","Sander Berge|1998|NOR|MEI|78|78","Harrison Reed|1995|ENG|MEI|74|74","Samuel Chukwueze|1999|NGA|ATA|76|77","Timothy Castagne|1995|BEL|DEF|77|77","Josh King|2002|ENG|MEI|70|75","Reiss Nelson|1999|ENG|ATA|75|75","Jonah Kusi-Asare|2005|SWE|ATA|66|75"]],
    ["everton","Everton","Everton",72,73,[
      "Jordan Pickford|1994|ENG|GOL|82|82","Jarrad Branthwaite|2002|ENG|DEF|80|85","James Tarkowski|1992|ENG|DEF|78|78","Vitaliy Mykolenko|1999|UKR|DEF|76|76","Jake O'Brien|2001|IRL|DEF|76|79","Idrissa Gueye|1989|SEN|MEI|76|76","James Garner|2001|ENG|MEI|78|81","Kiernan Dewsbury-Hall|1998|ENG|MEI|78|78","Iliman Ndiaye|2000|SEN|ATA|78|80","Jack Grealish|1995|ENG|ATA|79|79","Tim Iroegbunam|2003|ENG|MEI|74|78","Mark Travers|1999|IRL|GOL|70|72","Michael Keane|1993|ENG|DEF|75|75","Nathan Patterson|2001|SCO|DEF|74|76","Seamus Coleman|1988|IRL|DEF|70|70","Carlos Alcaraz|2002|ARG|MEI|74|78","Dwight McNeil|1999|ENG|ATA|76|76","Beto|1998|POR|ATA|75|75","Tyler Dibling|2006|ENG|ATA|72|83"]],
    ["wolves","Wolverhampton Wanderers","Wolverhampton",68,70,[
      "Sam Johnstone|1993|ENG|GOL|76|76","Toti Gomes|1999|POR|DEF|75|75","Yerson Mosquera|2001|COL|DEF|74|78","Hee-chan Hwang|1996|KOR|ATA|77|77","Matt Doherty|1992|IRL|DEF|74|74","Emmanuel Agbadou|1997|CIV|DEF|75|75","Marshall Munetsi|1996|ZIM|MEI|75|75","Jose Sa|1993|POR|GOL|79|79","Jackson Tchatchoua|2001|CMR|DEF|73|75","Santiago Bueno|1998|URU|DEF|75|76","Jean-Ricner Bellegarde|1998|FRA|MEI|75|75","Mateus Mane|2007|POR|MEI|68|82","Tommy Doyle|2001|ENG|MEI|73|75","Rodrigo Gomes|2003|POR|ATA|74|79","Tolu Arokodare|2000|NGA|ATA|75|76","Fer Lopez|2004|ESP|MEI|71|77","Angel Gomes|2000|ENG|MEI|77|78","David Moller Wolfe|2001|NOR|DEF|75|77"]],
    ["bournemouth","AFC Bournemouth","Bournemouth",68,73,[
      "Djordje Petrovic|1999|SRB|GOL|77|80",
      "Marcos Senesi|1997|ARG|DEF|77|77",
      "Adrien Truffert|2001|FRA|DEF|75|78",
      "Alex Scott|2003|ENG|MEI|77|83",
      "Tyler Adams|1999|USA|MEI|77|77",
      "Ryan Christie|1995|SCO|MEI|76|76",
      "Antoine Semenyo|2000|GHA|ATA|81|83",
      "Justin Kluivert|1999|NED|ATA|78|78",
      "Amine Adli|2000|MAR|ATA|76|78",
      "Fraser Forster|1988|ENG|GOL|72|72",
      "Julio Soler|2005|ARG|DEF|67|78",
      "Veljko Milosavljevic|2005|SRB|DEF|67|78",
      "Adam Smith|1991|ENG|DEF|73|73",
      "James Hill|2002|ENG|DEF|73|75",
      "Lewis Cook|1997|ENG|MEI|75|75",
      "Marcus Tavernier|1999|ENG|ATA|77|78",
      "Daniel Jebbison|2003|ENG|ATA|68|74",
      "Eli Junior Kroupi|2006|FRA|ATA|72|85"
    ]],
    ["brentford","Brentford","Brentford",68,73,[
      "Caoimhin Kelleher|1998|IRL|GOL|79|80","Nathan Collins|2001|IRL|DEF|77|79","Sepp van den Berg|2001|NED|DEF|76|79","Rico Henry|1997|ENG|DEF|76|76","Christian Norgaard|1994|DEN|MEI|77|77","Mikkel Damsgaard|2000|DEN|MEI|78|80","Kevin Schade|2001|GER|ATA|77|80","Dango Ouattara|2002|BFA|ATA|76|80","Keane Lewis-Potter|2001|ENG|ATA|75|78","Hakon Valdimarsson|2001|ISL|GOL|68|72","Kristoffer Ajer|1998|NOR|DEF|77|77","Aaron Hickey|2002|SCO|DEF|76|78","Jair Cunningham|2000|JAM|DEF|68|70","Yehor Yarmolyuk|2004|UKR|MEI|76|81","Vitaly Janelt|1998|GER|MEI|76|76","Mathias Jensen|1996|DEN|MEI|76|76","Jordan Henderson|1990|ENG|MEI|75|75","Frank Onyeka|1998|NGA|MEI|74|75"]],
    ["nottingham_forest","Nottingham Forest","Nottm Forest",70,73,[
      "Matz Sels|1992|BEL|GOL|77|77","Nikola Milenkovic|1997|SRB|DEF|80|80","Neco Williams|2001|WAL|DEF|76|77","Morgan Gibbs-White|2000|ENG|MEI|80|82","Elliot Anderson|2002|ENG|MEI|79|84","Ibrahim Sangare|1997|CIV|MEI|78|78","Chris Wood|1991|NZL|ATA|77|77","Callum Hudson-Odoi|2000|ENG|ATA|77|78","Taiwo Awoniyi|1997|NGA|ATA|76|76","Omari Hutchinson|2003|ENG|ATA|74|80","Stefan Ortega|1992|GER|GOL|78|78","Ola Aina|1996|NGA|DEF|77|77","Willy Boly|1991|CIV|DEF|73|73","Nicolas Dominguez|1998|ARG|MEI|76|77","Ryan Yates|1997|ENG|MEI|72|72","Jota Silva|1999|POR|ATA|75|76","Zach Abbott|2006|ENG|DEF|66|78","Nikola Savona|2005|ENG|DEF|64|74","Eric da Silva Moreira|2005|ENG|DEF|66|75"]],
    ["leeds","Leeds United","Leeds",64,70,[
      "Pascal Struijk|1999|NED|DEF|76|77","Joe Rodon|1997|WAL|DEF|75|75","Anton Stach|1998|GER|MEI|76|77","Ethan Ampadu|2000|WAL|MEI|76|77","Brenden Aaronson|2000|USA|MEI|74|75","Dominic Calvert-Lewin|1997|ENG|ATA|76|76","Noah Okafor|2000|SUI|ATA|75|76","Daniel James|1997|WAL|ATA|75|75","Lukas Nmecha|1998|GER|ATA|74|75","Illan Meslier|2000|FRA|GOL|75|77","Jaka Bijol|1999|SVN|DEF|77|78","Sebastiaan Bornauw|1999|BEL|DEF|75|75","Jayden Bogle|2000|ENG|DEF|74|75","Junior Firpo|1996|DOM|DEF|75|75","Ilia Gruev|2000|BUL|MEI|74|76","Sean Longstaff|1997|ENG|MEI|75|75","Joel Piroe|1999|NED|ATA|76|77","Wilfried Gnonto|2003|ITA|ATA|75|79","Karl Darlow|1990|ENG|GOL|72|72","Isaac Schmidt|1999|SUI|DEF|73|74","Sam Byram|1993|ENG|DEF|70|70","Gabriel Gudmundsson|1999|SWE|DEF|76|77"]],
    ["burnley","Burnley","Burnley",58,68,[
      "Martin Dubravka|1989|SVK|GOL|74|74","Maxime Esteve|2002|FRA|DEF|73|76","Josh Cullen|1996|IRL|MEI|73|73","Jaidon Anthony|1999|ENG|ATA|73|74","Zian Flemming|1998|NED|ATA|73|74","Lyle Foster|2000|RSA|ATA|72|75","Hannibal Mejbri|2003|TUN|MEI|72|76","Axel Tuanzebe|1997|ENG|DEF|72|72","Hjalmar Ekdal|1998|SWE|DEF|72|72","Kyle Walker|1990|ENG|DEF|78|78","Quilindschy Hartman|2001|NED|DEF|73|75","Bashir Humphreys|2003|ENG|DEF|72|77","Connor Roberts|1995|WAL|DEF|72|72","Jack Cork|1989|ENG|MEI|68|68","Lesley Ugochukwu|2004|FRA|MEI|75|82","Josh Brownhill|1995|ENG|MEI|73|73","Armando Broja|2001|ALB|ATA|73|76","Marcus Edwards|1998|ENG|ATA|73|73","Jacob Bruun Larsen|1998|DEN|ATA|73|73","Loum Tchaouna|2003|FRA|ATA|72|76"]],
    ["sunderland","Sunderland","Sunderland",58,68,[
      "Robin Roefs|2003|NED|GOL|73|78","Granit Xhaka|1992|SUI|MEI|79|79","Habib Diarra|2003|SEN|MEI|74|80","Enzo Le Fee|2000|FRA|MEI|75|77","Dan Neil|2001|ENG|MEI|72|75","Brian Brobbey|2002|NED|ATA|76|80","Wilson Isidor|2000|FRA|ATA|72|74","Chemsdine Talbi|2005|MAR|ATA|71|78","Nordi Mukiele|1997|FRA|DEF|75|75","Reinildo|1994|MOZ|DEF|74|74","Anthony Patterson|2000|ENG|GOL|73|75","Omar Alderete|1996|PAR|DEF|76|76","Dan Ballard|1999|NIR|DEF|74|75","Trai Hume|2002|NIR|DEF|73|75","Luke O'Nien|1994|ENG|DEF|71|71","Noah Sadiki|2004|COD|MEI|75|80","Romaine Mundle|2003|ENG|ATA|71|75","Simon Adingra|2002|CIV|ATA|76|79","Eliezer Mayenda|2005|ESP|ATA|72|78","Bertrand Traore|1995|BFA|ATA|75|75"]]
  ]};
  const registry=root.ProLifeGlobalFootballPacks=root.ProLifeGlobalFootballPacks||[];
  if(!registry.some(item=>item.id===pack.id))registry.push(pack);
  if(typeof module!=="undefined"&&module.exports)module.exports=pack;
})(typeof globalThis!=="undefined"?globalThis:this);
