(function(root){
  "use strict";
  // Eliteserien 2025/26 (pre-etapa 26C, NAO registrado no build). GER/potencial: estimativa propria, nao copia de tabela oficial.
  // Linha: "Nome|AnoNasc|COD|POS|GER|POT". Fontes: Wikipedia (elenco), starting11/outras para idade; anos de nascimento marcados como incertos ficam no relatorio da 26C.
  const pack={id:"eur26c_nor",version:1,league:["nor_eli","Eliteserien","Eliteserien","Noruega",66],clubs:[
    ["bodo_glimt","Bodo/Glimt","Bodo/Glimt",72,72,[
      "Julian Faye Lund|2002|NOR|GOL|71|77",
      "Nikita Haikin|1995|RUS|GOL|66|66",
      "Isak Sjong|2006|NOR|GOL|52|64",
      "Villads Nielsen|2000|DEN|DEF|68|72",
      "Odin Bjortuft|1999|NOR|DEF|68|71",
      "Haitam Aleesami|1991|NOR|DEF|66|66",
      "Jostein Gundersen|1997|NOR|DEF|69|70",
      "Fredrik Sjovold|1997|NOR|DEF|67|68",
      "Fredrik Andre Bjorkan|1998|NOR|DEF|69|70",
      "Isak Dybvik Maatta|2002|NOR|DEF|66|71",
      "Kasper Solhaug|2002|NOR|DEF|60|68",
      "Patrick Berg|1997|NOR|MEI|74|74",
      "Sondre Auklend|1997|NOR|MEI|67|68",
      "Ulrik Saltnes|1992|NOR|MEI|68|68",
      "Joshua Kitolano|2001|NOR|MEI|66|69",
      "Sondre Brunstad Fet|2002|NOR|MEI|66|69",
      "Magnus Riisnaes|2001|NOR|MEI|64|68",
      "Hakon Evjen|2000|NOR|MEI|71|73",
      "Jens Petter Hauge|1999|NOR|ATA|71|72",
      "Andreas Helmersen|2000|NOR|ATA|66|69",
      "Ole Didrik Blomberg|2000|NOR|ATA|66|68",
      "Ola Brynhildsen|2000|NOR|ATA|68|70",
      "Mikkel Bro Hansen|2005|DEN|ATA|60|70",
      "August Mikkelsen|2004|NOR|ATA|58|66"
    ]],
    ["brann","SK Brann","Brann",70,70,[
      "Mathias Dyngeland|1997|NOR|GOL|69|70","Simen Vidtun Nilsen|2000|NOR|GOL|56|62","Hakon Melas Hellesoy|2007|NOR|GOL|50|62","Fredrik Pallesen Knudsen|1997|NOR|DEF|68|69","Nana Kwame Boakye|1999|GHA|DEF|66|69","Jonas Torsvik|1999|NOR|DEF|65|67","Joachim Soltvedt|2003|NOR|DEF|64|69","Vetle Dragsnes|1998|NOR|DEF|64|66","Denzel De Roeve|2003|BEL|DEF|66|71","Thore Pedersen|2003|NOR|DEF|63|68","Sakarias Opsahl|1999|NOR|MEI|66|68","Felix Horn Myhre|2000|NOR|MEI|65|67","Ulrik Mathisen|1999|NOR|MEI|64|66","Jacob Lungi Sorensen|1998|DEN|MEI|69|70","Eggert Aron Gudmundsson|2004|ISL|MEI|67|73","Niklas Wassberg|2005|NOR|MEI|58|67","Jesper Eikrem|2007|NOR|MEI|54|66","Niklas Castro|1999|CHI|ATA|69|70","Kristall Mani Ingason|2002|ISL|ATA|68|70","Jon Dagur Thorsteinsson|1998|ISL|ATA|68|68","Bard Finne|1995|NOR|ATA|66|66","Kristian Eriksen|1997|NOR|ATA|65|66","Saevar Atli Magnusson|2000|ISL|ATA|69|70","Rabbi Matondo|2001|WAL|ATA|67|70","Noah Holm|2001|NOR|ATA|66|69","Chinedu Cyprain Ononogbo|2005|NGA|ATA|60|70"]],
    ["molde","Molde FK","Molde",69,68,[
      "Mads Kikkenborg|1999|DEN|GOL|68|70","Peder Hoel Lervik|2004|NOR|GOL|56|64","Albert Posiadala|2001|POL|GOL|60|64","Mads Myklebust|2005|NOR|GOL|50|60","Sivert Sira Hansen|2005|NOR|DEF|58|67","Eirik Haugan|1997|NOR|DEF|68|68","Martin Linnes|1991|NOR|DEF|66|66","Birk Risa|1998|NOR|DEF|68|69","Halldor Stenevik|2000|NOR|DEF|65|67","Samukele Kabini|2003|RSA|DEF|65|69","Fredrik Kristensen Dahl|2006|NOR|DEF|54|66","Eirik Hestad|1995|NOR|MEI|67|67","Emil Breivik|1997|NOR|MEI|68|68","Jacob Steen Christensen|2001|DEN|MEI|67|68","Vebjorn Hoff|1997|NOR|MEI|67|67","Mats Moller Daehli|1995|NOR|MEI|68|68","Mads Enggard|1999|DEN|MEI|65|67","Sondre Granaas|2005|NOR|MEI|56|66","Viktor Bender|2004|DEN|MEI|62|68","Daniel Daga|2005|NGA|MEI|62|69","Caleb Zady Sery|2000|CIV|ATA|69|70","Jalal Abdullai|2001|GHA|ATA|66|69","Oskar Spiten-Nysaeter|2000|NOR|ATA|62|66","Trent Kone-Doherty|2001|IRL|ATA|66|68"]],
    ["viking","Viking FK","Viking",68,67,[
      "Arild Ostbo|1995|NOR|GOL|68|68","Lubomir Belko|1996|SVK|GOL|62|64","Erlend Jacobsen|2004|NOR|GOL|55|62","Herman Haugen|2000|NOR|DEF|64|66","Viljar Vevatne|1992|NOR|DEF|65|65","Martin Ove Roseth|2000|NOR|DEF|64|66","Henrik Heggheim|1998|NOR|DEF|66|68","Gianni Stensness|2001|AUS|DEF|64|67","Essien Bassey|2002|NED|DEF|63|68","Sondre Bjorshol|2000|NOR|DEF|62|66","Anders Baertelsen|1999|DEN|DEF|65|66","Vetle Auklend|2003|NOR|DEF|60|66","Henrik Falchener|2004|NOR|DEF|61|67","Jesper Daland|1998|NOR|DEF|64|65","Kristoffer Haugen|1994|NOR|DEF|65|65","Kristoffer Askildsen|2001|NOR|MEI|68|70","Joe Bell|1999|NZL|MEI|69|70","Henrik Bjordal|2006|NOR|MEI|52|66","Simen Kvia-Egeskog|2006|NOR|MEI|54|66","Tobias Moi|2005|NOR|MEI|55|66","Jakob Segadal Hansen|2003|NOR|MEI|58|66","Nicholas D'Agostino|1998|AUS|ATA|67|68","Zlatko Tripic|1992|NOR|ATA|68|68","Romano Postema|1999|NED|ATA|66|68","Veton Berisha|1994|NOR|ATA|68|68","Amin Cosic|2004|ISL|ATA|60|68","Peter Christiansen|1998|DEN|ATA|66|67","Niklas Fuglestad|2004|NOR|ATA|60|68","Kelvin Frimpong|2005|GHA|ATA|60|70"]],
    ["rosenborg","Rosenborg BK","Rosenborg",68,67,[
      "Leopold Wahlstedt|1997|SWE|GOL|66|67","Rasmus Sandberg|2000|NOR|GOL|58|62","Haakon Ingdal Sorum|2005|NOR|GOL|50|62","Hakon Rosten|2004|NOR|DEF|60|67","Tobias Dahl|2003|NOR|DEF|62|67","Mikkel Konradsen Ceide|2004|NOR|DEF|60|68","Hakon Singsdal Volden|2005|NOR|DEF|58|67","Jonas Mortensen|2000|DEN|DEF|65|67","Aslak Fonn Witry|1999|NOR|DEF|66|66","Adrian Pereira|1999|NOR|DEF|66|67","Tomas Nemcik|2003|SVK|DEF|66|70","Jonas Svensson|1993|NOR|DEF|67|67","Ulrik Hald-Hernes|2005|NOR|DEF|56|66","Santeri Vaananen|2000|FIN|MEI|66|68","Simen Bolkan Nordli|1999|NOR|MEI|66|67","Iver Fossum|1996|NOR|MEI|68|68","Ole Selnaes|1994|NOR|MEI|68|68","Mads Bomholt|2002|DEN|MEI|64|68","Aleksander Borgersen|2002|NOR|MEI|62|66","Johan Bakke|2005|NOR|MEI|58|66","Elias Slordal|2006|NOR|MEI|54|66","Isak Holmen|2007|NOR|MEI|52|64","Dino Islamovic|1994|MNE|ATA|68|68","Noah Sahsah|2001|DEN|ATA|66|68","Jesper Reitan-Sunde|2002|NOR|ATA|62|68","Amin Chiakha|2002|ALG|ATA|64|70","Daniel Thorstensen|2006|NOR|ATA|54|65","David Duris|2000|SVK|ATA|64|67","Emil Konradsen Ceide|2003|NOR|ATA|65|69"]],
    ["tromso","Tromso IL","Tromso",66,65,[
      "Jakob Haugaard|1992|DEN|GOL|66|66",
      "Ole Kristian Lauvli|1998|NOR|GOL|58|60",
      "Abderrahmane Sarr|2002|MTN|GOL|54|62",
      "Mathias Tonnessen|2002|NOR|DEF|62|66",
      "Vetle Skjaervik|1998|NOR|DEF|63|64",
      "Benjamin Myrvold|2005|NOR|DEF|56|66",
      "Leon Hien|2003|SWE|DEF|64|68",
      "Vince Osuji|2004|NGA|DEF|58|66",
      "Casper Oyvann|1997|NOR|DEF|66|67",
      "Alexander Warneryd|2000|SWE|DEF|62|65",
      "Isak Vadebu|2005|NOR|DEF|54|64",
      "David Edvardsson|2003|SWE|MEI|62|66",
      "Jesper Grundt|2003|NOR|MEI|61|66",
      "Troy Nyhammer|2003|NOR|MEI|60|66",
      "Ruben Yttergard Jenssen|1988|NOR|MEI|66|66",
      "Sigurd Prestmo|2001|NOR|MEI|62|65",
      "Aleksander Lilletun Elvebu|2004|NOR|MEI|58|66",
      "Heine Asen Larsen|2003|NOR|MEI|60|65",
      "Mads Mikkelsen|2004|NOR|MEI|56|64",
      "Sander Innvaer|2007|NOR|MEI|52|64",
      "Lars Olden Larsen|1998|NOR|ATA|65|66",
      "Daniel Braut|2001|NOR|ATA|62|66",
      "Viktor Ekblom|2003|SWE|ATA|62|66",
      "Ieltsin Camoes|1998|CPV|ATA|65|66"
    ]],
    ["fredrikstad","Fredrikstad FK","Fredrikstad",65,64,[
      "Oystein Ovretveit|1998|NOR|GOL|64|65","Ole Langbraten|2003|NOR|GOL|52|62","Martin Borsheim|1999|NOR|GOL|60|62","Kennedy Okpaleke|1997|SWE|DEF|64|64","Fredrik Holme|1998|NOR|DEF|62|64","Simen Rafn|1996|NOR|DEF|62|62","Ulrik Fredriksen|1999|NOR|DEF|62|63","Daniel Eid|2003|NOR|DEF|60|65","Sigurd Kvile|1999|NOR|DEF|63|64","Fanuel Ghebreyohannes|2004|NOR|DEF|60|67","Joachim Nysveen|2005|NOR|DEF|54|64","Chris Pondy|2002|CMR|DEF|58|64","Solomon Owusu|2000|GHA|DEF|62|63","Isak Amundsen|2004|NOR|DEF|58|66","Samuel Leach Holm|1992|SWE|MEI|64|64","Salim Laghzaoui|1999|MAR|MEI|64|66","Sondre Sorlokk|2001|NOR|MEI|62|65","Max Nilsson|2002|SWE|MEI|60|64","Jakub Jezierski|2002|POL|MEI|62|66","Leonard Owusu|1999|GHA|MEI|66|67","Gabriel Wesseh|2005|USA|MEI|56|66","Benjamin Faraas|2001|NOR|ATA|64|66","Johannes Nunez|2001|NOR|ATA|64|66","Liam West|2004|NOR|ATA|58|64","Bryan Fiabema|2003|NOR|ATA|64|69","Henrik Skogvold|2004|NOR|ATA|56|64"]],
    ["sarpsborg_08","Sarpsborg 08 FF","Sarpsborg 08",64,63,[
      "Jacob Pryts|2002|DEN|GOL|60|65","Leander Oy|2004|NOR|GOL|52|62","Marius Lode|1993|NOR|DEF|64|64","Bjorn Inge Utvik|1998|NOR|DEF|63|64","Lucas Hoyland|2005|NOR|DEF|56|66","Claus Niyukuri|2000|BDI|DEF|60|62","Peter Reinhardsen|2000|NOR|DEF|62|63","Anders Hiim|2002|NOR|DEF|58|62","Sigurd Rosted|1994|NOR|DEF|65|65","Eirik Wichne|2000|NOR|DEF|58|60","Aimar Sher|1994|IRQ|MEI|66|66","Sander Christiansen|1998|NOR|MEI|63|64","Jo Inge Berget|1990|NOR|MEI|64|64","Bop Gueye|2002|SEN|MEI|60|65","Victor Halvorsen|1998|NOR|MEI|60|62","Andreas Nibe|2002|DEN|MEI|60|64","Olaus Skarsem|2002|NOR|MEI|60|64","Mathias Svenningsen-Gronn|2006|NOR|MEI|52|64","Camil Mmaee|1999|MAR|ATA|63|64","Sondre Sorli|1993|NOR|ATA|65|65","Daniel Karlsbakk|1993|NOR|ATA|62|62","Michael Opoku|2000|DEN|ATA|62|64","Frederik Carstensen|2002|DEN|ATA|60|65","Noa Williams|2003|SWE|ATA|58|65"]],
    ["valerenga","Valerenga Fotball","Valerenga",66,65,[
      "Oscar Hedvall|1998|DEN|GOL|66|66","Sander Lonning|2002|NOR|GOL|56|62","Magnus Sjoeng|2005|NOR|GOL|50|60","Alexander Svensen Ordal|2007|NOR|GOL|48|60","Kolbeinn Finnsson|1999|ISL|DEF|66|67","Hakon Sjatil|2001|NOR|DEF|63|65","Aaron Kiil Olsen|2003|NOR|DEF|64|68","Kevin Tshiembe|2003|DEN|DEF|62|66","Vegar Eggen Hedenstad|1991|NOR|DEF|66|66","Mario Gomes|2007|GNB|DEF|52|66","Ivan Nasberg|2001|NOR|DEF|62|63","Sebastian Jarl|2003|NOR|DEF|60|64","Carl Lange|1999|DEN|MEI|64|66","Ghayas Zahid|1995|NOR|MEI|66|66","Odin Thiago Holm|2003|NOR|MEI|64|70","Evenezer Awasum Forcha|2005|NOR|MEI|56|66","Petter Strand|2002|NOR|MEI|62|65","Magnus Westergaard|2002|DEN|MEI|62|65","Brice Ambina|2003|CMR|MEI|62|66","Omar Bully Drammeh|2007|NOR|MEI|52|64","Gabriel Rajkovic|2005|NOR|ATA|58|66","Mathias Grundetjern|2007|NOR|ATA|52|64","Lorents Apold-Aasen|2006|NOR|ATA|52|64","Dennis Gjengaar|2002|NOR|ATA|64|68","Lucas Haren|2001|DEN|ATA|64|65","Ole Saeter|2001|NOR|ATA|62|66"]],
    ["lillestrom","Lillestrom SK","Lillestrom",64,63,[
      "Stefan Hagerup|1994|NOR|GOL|64|64","Pontus Dahlberg|1999|SWE|GOL|62|63","Lars Ranger|2005|NOR|DEF|56|66","Sturla Ottesen|2005|NOR|DEF|56|66","Espen Garnas|2003|NOR|DEF|60|65","Sander Moen Foss|2003|NOR|DEF|60|65","Frederik Elkaer|1996|DEN|DEF|62|62","Ruben Gabrielsen|1992|NOR|DEF|66|66","Lucas Svenningsen|2003|NOR|DEF|58|63","Filip Reshane|2005|NOR|DEF|54|64","Isa Daniel Jallow|2007|NOR|DEF|50|64","Stian Kristiansen|2005|NOR|DEF|54|64","Harald Woxen|2004|NOR|MEI|58|65","Linus Alperud|2003|SWE|MEI|60|65","Gustav Nyheim|2002|NOR|MEI|60|64","Gustav Nordh|2002|SWE|MEI|60|64","Henrik Melland|2000|NOR|MEI|60|62","Eric Kitolano|1996|NOR|MEI|64|64","Kevin Martin Krygard|2000|NOR|MEI|62|63","Filip Ottosson|2000|SWE|MEI|62|63","Daniel Bassi|2000|NOR|MEI|60|62","Ylldren Ibrahimaj|2001|KOS|MEI|62|64","Fredrik Gulbrandsen|1992|NOR|ATA|66|66","Kparobo Arierhi|2000|NGA|ATA|63|65","Thomas Lehne Olsen|1991|NOR|ATA|64|64","Camil Jebara|2000|SWE|ATA|62|64","Felix Va|2003|ANG|ATA|60|66","Yaw Paintsil|1994|NOR|ATA|64|64","Markus Waehler|2001|NOR|ATA|58|63","Ivar Winje|2007|NOR|ATA|50|64"]],
    ["hamkam","Hamarkameratene","HamKam",62,61,[
      "Marcus Sandberg|1998|SWE|GOL|62|63","Sander Ostraat|2003|NOR|GOL|56|62","Simon Rusen|2007|NOR|GOL|50|60","Martin Gjone|2001|NOR|DEF|62|64","Ethan Amundsen-Day|2005|NOR|DEF|54|65","Halvor Rodolen Opsahl|2004|NOR|DEF|58|64","Aleksander Andresen|2002|NOR|DEF|60|63","Luc Mares|2001|NED|DEF|60|63","Snorre Strand Nilsen|1999|NOR|DEF|60|61","David de Ornelas|2005|NOR|DEF|54|64","Joao Barros|2000|POR|DEF|60|62","Vidar Ari Jonsson|1994|ISL|MEI|64|64","Markus Johnsgard|2001|NOR|MEI|60|63","Loris Mettler|2001|SUI|MEI|62|64","Mohamed Ofkir|2001|NOR|MEI|60|63","Anders Trondsen|1995|NOR|MEI|63|63","Aksel Potur|2005|NOR|MEI|54|64","Fredrik Sjolstad|1992|NOR|MEI|62|62","William Osnes-Ringen|2006|NOR|MEI|52|64","Patrick Metcalfe|2001|CAN|MEI|62|64","Blerton Isufi|2001|KOS|MEI|62|64","Duarte Moreira|2000|POR|ATA|60|62","Henrik Udahl|1997|NOR|ATA|63|63","Danilo Al-Saed|1999|IRQ|ATA|62|63","David Benjamin|2005|NGA|ATA|56|66","Mamadou Diop|2005|SEN|ATA|56|66","Olav Mengshoel|2006|NOR|ATA|52|64"]],
    ["kfum_oslo","KFUM Oslo","KFUM",60,59,[
      "Emil Odegaard|1998|NOR|GOL|62|62","William da Rocha|2002|NOR|GOL|54|60","Henri Sorlie|2005|NOR|GOL|48|58","Daniel Schneider|2001|NOR|DEF|60|62","Fredrik Berglie|1996|NOR|DEF|60|60","Amin Nouri|1989|NOR|DEF|58|58","David Hickson Gyedu|1996|NOR|DEF|58|58","Ayoub Aleesami|2002|NOR|DEF|56|60","Jonas Lange Hjorth|2000|NOR|DEF|60|61","Magnus Kiperberg Mehl|2004|NOR|DEF|54|62","Joachim Prent-Eckbo|2004|NOR|DEF|54|62","Mansour Sinyan|2001|NOR|MEI|58|61","Robin Rasch|1993|NOR|MEI|60|60","Simen Hestnes|2001|NOR|MEI|56|60","Hakon Helland Hoseth|1998|NOR|MEI|58|59","Teodor Berg Haltvik|2005|NOR|MEI|52|62","Sondre Halvorsen|1998|NOR|MEI|56|58","Sverre Sandal|2005|NOR|MEI|52|62","Eirik Saunes|1997|NOR|MEI|60|60","Martin Tangen Vinjor|1998|NOR|MEI|60|61","Tore Andre Soras|1997|NOR|MEI|58|59","Mostafa Najafzadeh|2007|NOR|MEI|50|64","Marko Vuckovic|2010|NOR|MEI|44|66","Ola Visted|2004|NOR|MEI|58|65","Moussa Njie|1997|NOR|ATA|60|60","Bilal Njie|2002|SOM|ATA|58|62","Niclas Schjoth Semmen|2003|NOR|ATA|56|62","Bjorn Martin Kristensen|2000|PHI|ATA|58|60","Mame Mor Ndiaye|2000|SEN|ATA|58|60"]],
    ["sandefjord","Sandefjord Fotball","Sandefjord",60,59,[
      "Alf Lukas Gronneberg|1998|NOR|GOL|60|61",
      "Elias Hadaya|1995|SYR|GOL|58|58",
      "Martin Hellan|2002|NOR|DEF|60|64",
      "Vetle Walle Egeli|2001|NOR|DEF|60|62",
      "Fredrik Carson Pedersen|2005|NOR|DEF|54|64",
      "Gustav Hojbjerg|2002|DEN|DEF|58|62",
      "Rasmus Holten|2004|NOR|DEF|56|64",
      "Hakon Krogelien|2004|NOR|DEF|54|62",
      "Filip Loftesnes-Bjune|2002|NOR|DEF|58|62",
      "Henrik Skretteberg|2003|NOR|DEF|56|62",
      "Xander Lambrix|2006|BEL|DEF|50|64",
      "Sander Risan Mork|1998|NOR|MEI|62|62",
      "Tobias Borkeeiet|2003|NOR|MEI|58|62",
      "Ervin Gigovic|1998|SWE|MEI|60|60",
      "Edvard Sundbo Pettersen|2000|NOR|MEI|58|60",
      "Marcus Melchior|2002|NOR|MEI|58|62",
      "Jakob Swift|2005|NOR|MEI|52|63",
      "Kristoffer Halvorsen|2000|NOR|MEI|58|60",
      "Daniel Skaarud|2007|NOR|MEI|48|62",
      "Jakob Vester|2002|DEN|MEI|58|62",
      "Evangelos Patoulidis|1996|BEL|ATA|62|62",
      "Oscar Kapskarmo|2003|NOR|ATA|56|62",
      "Nikolaj Duus Moller|2001|SWE|ATA|58|61",
      "Foster Apetorgbor|2001|GHA|ATA|58|62",
      "Mathias Sauer|2000|DEN|ATA|58|60",
      "Bendik Berntsen|2003|NOR|ATA|56|62",
      "Sebastian Holm Mathisen|2003|NOR|ATA|54|62",
      "Jakob Dunsby|1998|NOR|ATA|60|60"
    ]],
    ["kristiansund","Kristiansund BK","Kristiansund",58,57,[
      "Michael Lansing|1996|USA|GOL|58|58","Adrian Saether|2001|NOR|GOL|52|58","Anders Borset|2001|NOR|DEF|58|60","Frederik Flex|2005|DEN|DEF|56|64","Julius Mar Juliusson|1999|ISL|DEF|58|59","Dan Peter Ulvestad|1991|NOR|DEF|58|58","Max Normann Williamsen|2003|NOR|DEF|56|61","Haakon Haugen|2002|NOR|DEF|54|60","Gustav Christensen|2003|DEN|DEF|56|62","John Kitolano|2002|NOR|DEF|56|60","Isak Hagen Aalberg|2007|NOR|DEF|46|60","Aksel Brattoy|2005|NOR|DEF|48|60","Marius Elvius|2005|DEN|DEF|48|60","Jesper Isaksen|2001|NOR|MEI|58|60","Eron Isufi|2005|NOR|MEI|54|63","Heine Gikling Bruseth|1999|NOR|MEI|58|58","Syver Skeide|2004|NOR|MEI|56|63","Wilfred George Igor|2004|NGA|MEI|54|62","Tobias Svendsen|2001|NOR|MEI|54|58","Adrian Kurd Ronning|2004|NOR|MEI|52|60","Sander Svendsen|1997|NOR|ATA|60|60","Zymer Bytyqi|1998|KOS|ATA|58|59","David Tufekcic|2003|NOR|ATA|54|60","Leander Alvheim|2002|NOR|ATA|54|59"]],
    ["aalesund","Aalesunds FK","Aalesund",58,57,[
      "Luca Podlech|2003|GER|GOL|58|62","Tor Erik Larsen|2000|NOR|GOL|52|55","Marius Andresen|2001|NOR|DEF|56|58","Olafur Gudmundsson|1999|ISL|DEF|58|59","Simen Vatne Haram|2000|NOR|DEF|56|58","Aleksander Hammer Kjelsen|1999|NOR|DEF|56|58","Jakob Nyland Orsahl|2001|NOR|DEF|54|58","Emil Engqvist|2000|SWE|DEF|56|58","Erik Froysa|2004|NOR|DEF|52|58","Ulrik Syversen|2005|NOR|DEF|50|58","Cheikh Mbacke Diop|2004|SEN|DEF|60|66","Jorgen Boe|2003|NOR|DEF|52|58","Philip Aukland|2005|NOR|DEF|46|58","Hakon Hammer|2002|NOR|MEI|56|59","Kristoffer Nesso|1999|NOR|MEI|56|57","Mathias Kristensen|2000|DEN|MEI|58|59","David Johannsson|2002|ISL|MEI|56|59","Uba Charles|2001|NGA|MEI|56|59","Endre Osenbroch|2004|NOR|MEI|52|58","Elias Hagen|2004|NOR|MEI|54|60","Mathias Christensen|2004|GRL|MEI|52|58","Janus Seehusen|2004|DEN|MEI|52|58","Tobias Leikanger|2005|NOR|MEI|46|56","Paul Ngongo|1999|DEN|ATA|60|60","Elias Myrlid|2005|NOR|ATA|50|58","Ivan Djantou|2004|CMR|ATA|54|60","Marcus Reed|2004|NOR|ATA|50|56","Storm Karlsson Knutsen|2006|NOR|ATA|46|58"]],
    ["start","IK Start","Start",57,56,[
      "Storm Strand-Kolbjornsen|1998|NOR|GOL|58|58","Jasper Silva Torkildsen|2003|NOR|GOL|54|60","Filip Manojlovic|2001|SRB|GOL|58|60","Fredrik Palerud|2002|NOR|DEF|54|57","Altin Ujkani|2000|NOR|DEF|56|58","Johan Meyer|1999|DEN|DEF|56|57","Sander Aske Granheim|2002|NOR|DEF|54|58","John Olav Norheim|1996|NOR|DEF|56|56","Deni Dashaev|2003|NOR|DEF|50|57","Sebastian Griesbeck|1998|GER|DEF|57|57","Kristoffer Tonnessen|2005|NOR|DEF|46|56","Ousmane Diallo Toure|2005|NOR|DEF|46|56","Jens Husebo|2000|NOR|DEF|56|57","Erlend Dahl Reitan|2002|NOR|DEF|56|59","Steve Mvoue|1998|CMR|MEI|58|58","Eirik Schulze|1994|NOR|MEI|58|58","Marius Nordal|2003|NOR|MEI|54|58","Mikael Ugland|2002|NOR|MEI|54|57","Erlend Segberg|2004|NOR|MEI|50|57","Nikola Jojic|1998|SRB|ATA|58|58","Nikolas Koutsakos|2002|CYP|ATA|56|59","Jesper Cornelius|2000|DEN|ATA|56|57","Hakon Lorentzen|2005|NOR|ATA|48|57","Terry Benjamin|2004|NGA|ATA|52|58","Santino Samuyiwa|2005|SWE|ATA|48|57"]]
  ]};
  const registry=root.ProLifeGlobalFootballPacks=root.ProLifeGlobalFootballPacks||[];
  if(!registry.some(item=>item.id===pack.id))registry.push(pack);
  if(typeof module!=="undefined"&&module.exports)module.exports=pack;
})(typeof globalThis!=="undefined"?globalThis:this);
