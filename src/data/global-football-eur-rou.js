(function(root){
  "use strict";
  // SuperLiga Romena 2025/26 (pre-etapa 26C, NAO registrado no build). GER/potencial: estimativa propria, nao copia de tabela oficial.
  // Linha: "Nome|AnoNasc|COD|POS|GER|POT". Fontes: Wikipedia (elenco), starting11/outras para idade; anos de nascimento marcados como incertos ficam no relatorio da 26C.
  const pack={id:"eur26c_rou",version:1,league:["rou_sl","SuperLiga Romena","SuperLiga","Romenia",62],clubs:[
    ["fcsb","FCSB","FCSB",68,69,[
      "Rares Andrei|2005|ROU|GOL|55|66","Matei Popa|2005|ROU|GOL|54|64","Stefan Tarnovanu|2001|ROU|GOL|70|73","Mihai Udrea|2006|ROU|GOL|52|62","Lukas Zima|1995|CZE|GOL|62|62","Valentin Cretu|1989|ROU|DEF|64|64","Andre Duarte|1997|POR|DEF|64|65","Daniel Graovac|1993|BIH|DEF|65|65","Joyskim Dawa|1997|CMR|DEF|63|63","Andrei Dancus|2004|ROU|DEF|57|63","David Kiki|2000|BEN|DEF|63|65","Mihai Popescu|1993|ROU|DEF|63|63","Vlad Chiriches|1989|ROU|DEF|60|60","Alexandru Pantea|2004|ROU|DEF|55|62","Siyabonga Ngezana|1999|RSA|DEF|65|66","Risto Radunovic|1992|MNE|DEF|63|63","Denis Colibasanu|2004|ROU|MEI|58|64","Ofri Arad|1998|ISR|MEI|66|67","Mihai Lixandru|2003|ROU|MEI|66|69","Joao Paulo|1998|CPV|MEI|65|66","Mihai Toma|2005|ROU|MEI|56|64","Andrei Panait|2006|ROU|MEI|54|64","Juri Cisotti|1999|ITA|MEI|64|65","Octavian Popescu|2002|ROU|MEI|66|69","David Popa|2006|ROU|MEI|54|65","Baba Alhassan|1998|UGA|MEI|63|64","Daniel Birligea|2000|ROU|ATA|71|72","Florin Tanase|1994|ROU|ATA|70|70","David Miculescu|2002|ROU|ATA|69|71","Luca Ilie|2006|ROU|ATA|57|67","David Avram|2006|ROU|ATA|58|68","Alexandru Stoian|1991|ROU|ATA|62|62","Mamadou Thiam|2002|SEN|ATA|63|66"]],
    ["cfr_cluj","CFR Cluj","CFR Cluj",66,67,[
      "Rares Gal|1999|ROU|GOL|64|65","Octavian Valceanu|2005|ROU|GOL|54|62","Andre Moreira|1995|POR|GOL|60|60","Marian Huja|1999|POR|DEF|63|64","Aly Abeid|1995|MTN|DEF|62|62","Ilija Masic|1998|BIH|DEF|62|63","Simao Rocha|2003|POR|DEF|62|65","Mario Camora|1994|ROU|DEF|63|63","Christopher Braun|2001|GER|DEF|61|64","Viktor Kun|2004|ROU|DEF|57|63","Kurt Zouma|1994|FRA|DEF|68|68","Daniel Dumbravanu|2001|MDA|DEF|60|63","Alin Fica|1997|ROU|MEI|62|62","Adrian Paun|1995|ROU|MEI|64|64","Ovidiu Perianu|1998|ROU|MEI|60|61","Razvan Gligor|2001|ROU|MEI|60|63","Yuval Sade|2000|ISR|MEI|62|63","Karlo Muhar|1996|CRO|MEI|67|67","Damjan Dokovic|1996|CRO|MEI|66|66","Mateo Miclaus|2005|ROU|MEI|55|64","Drilon Islami|2000|KOS|MEI|62|63","Antonio Bosec|1998|CRO|MEI|62|62","Meriton Korenica|1996|KOS|ATA|64|64","Andrei Cordea|1999|ROU|ATA|64|65","Lorenzo Biliboc|2001|ROU|ATA|61|64","Denis Crisan|2004|ROU|ATA|56|63","Andres Sfait|2002|ROU|ATA|64|66","Luka Zahovic|1995|SVN|ATA|65|65","Marko Gjorgjievski|1999|MKD|ATA|62|63","Tudor Cocis|2005|ROU|ATA|55|64"]],
    ["craiova","Universitatea Craiova","U Craiova",66,67,[
      "Pavlo Isenko|1996|UKR|GOL|65|65",
      "Laurentiu Popescu|1997|ROU|GOL|62|62",
      "Alexandru Glodean|1999|ROU|GOL|61|62",
      "Oleksandr Romanchuk|1995|UKR|DEF|67|67",
      "Baptiste Roux|1996|FRA|DEF|65|65",
      "Nicusor Bancu|1992|ROU|DEF|65|65",
      "Nikola Stevanovic|1998|SRB|DEF|64|65",
      "Adrian Rus|1996|ROU|DEF|64|64",
      "Ronaldo Webster|1996|JAM|DEF|63|63",
      "Alexandru Cretu|1999|ROU|MEI|65|66",
      "Vladimir Screciu|2000|ROU|MEI|68|69",
      "Tudor Baluta|1999|ROU|MEI|67|68",
      "Alexandru Cicaldau|1997|ROU|MEI|67|67",
      "Carlos Mora|1995|CRC|MEI|65|65",
      "Samuel Teles|1998|POR|MEI|63|64",
      "Alexandru Iamandache|2003|ROU|MEI|59|65",
      "Mihnea Radulescu|2004|ROU|MEI|58|65",
      "Luca Basceanu|2006|ROU|MEI|55|66",
      "David Matei|2005|ROU|MEI|54|64",
      "Denys Muntean|2006|ROU|MEI|52|62",
      "Sebastian Serban|2006|ROU|MEI|52|62",
      "Steven Nsimba|1993|FRA|ATA|66|66",
      "Assad Al Hamlawi|2000|PLE|ATA|66|67",
      "Stefan Baiaram|2003|ROU|ATA|69|71",
      "Monday Etim|1998|NGA|ATA|63|64",
      "Heri Tavares|2000|CPV|ATA|63|64",
      "Simon Elisor|1998|FRA|ATA|63|64"
    ]],
    ["rapid","Rapid Bucuresti","Rapid",65,66,[
      "Alex Simonia|2008|ROU|GOL|50|65","Bogdan Ungureanu|2007|ROU|GOL|50|64","Marian Aioani|1999|ROU|GOL|62|63","Alexandru Pascanu|1998|ROU|DEF|63|63","Alin Celik|2007|ROU|DEF|56|66","Cristian Manea|1997|ROU|DEF|63|63","Denis Ciobotariu|1998|ROU|DEF|61|62","Ebenezer Annan|2002|GHA|DEF|62|64","Lars Kramer|1999|NED|DEF|62|62","Razvan Onea|1998|ROU|DEF|62|62","Robert Salceanu|2004|ROU|DEF|58|64","Sheriff Sinyan|1996|GHA|DEF|61|61","Stefan Senciuc|2007|ROU|DEF|55|65","Wedtoin Latif Ouedraogo|2007|BFA|DEF|55|66","Alexandru Dobre|1998|ROU|MEI|62|62","Andrei Niculcea|2009|ROU|MEI|52|66","Andrei Sucu|2008|ROU|MEI|52|66","Catalin Vulturar|2004|ROU|MEI|58|64","Chec Bebel Doumbia|2007|CIV|MEI|54|65","Claudiu Petrila|2000|ROU|MEI|66|67","Constantin Grameni|2002|ROU|MEI|60|63","Eric Tape|2008|CMR|MEI|53|66","Mohammed Kamara|1997|SLE|MEI|62|62","Olimpiu Morutan|1999|ROU|MEI|68|69","Rares Pop|2005|ROU|MEI|58|65","Vladan Bubanja|1999|MNE|MEI|63|63","Filip Stojilkovic|2000|SRB|ATA|67|68","Jason Kodor|2006|ROU|ATA|58|67","Timotej Jambor|2003|SVK|ATA|63|65"]],
    ["dinamo","Dinamo Bucuresti","Dinamo",64,65,[
      "Devis Epassy|1993|CMR|GOL|66|66","Mario Din-Licaciu|2005|ROU|GOL|56|63","Alexandru Rosca|2004|ROU|GOL|55|62","Denis Oncescu|2007|ROU|GOL|50|62","Raul Oprut|1999|ROU|DEF|63|64","Kennedy Boateng|1997|TOG|DEF|64|64","Alexandru Tabuncic|1995|MDA|DEF|62|62","Nikita Stoinov|1998|ISR|DEF|62|63","Mihnea Toader|2002|ROU|DEF|58|63","Maxime Sivis|2000|COD|DEF|61|62","Matteo Dutu|2004|ROU|DEF|57|65","Jordan Ikoko|1994|COD|DEF|62|62","Valentin Ticu|1998|ROU|DEF|60|61","Cristian Licsandru|1996|ROU|MEI|61|61","Eddy Gnahore|1994|FRA|MEI|62|62","Catalin Cirjan|2002|ROU|MEI|65|67","Georgi Milanov|1992|BUL|MEI|63|63","Cristian Mihai|1999|ROU|MEI|60|61","Matteo N'Giuwu|2005|ROU|MEI|56|64","Andrei Marginean|2002|ROU|MEI|58|63","Darius Gavrila|2007|ROU|MEI|52|63","Alexandru Musi|2002|ROU|ATA|65|68","Mamoudou Karamoko|2002|FRA|ATA|64|66","Adrian Mazilu|2004|ROU|ATA|66|70","Antonio Bordusanu|2002|ROU|ATA|63|65","Ianis Tarba|2005|ROU|ATA|55|65","Adrian Caragea|2005|ROU|ATA|55|64","Alberto Soro|1998|ESP|ATA|65|65","George Puscas|1996|ROU|ATA|66|66","Daniel Armstrong|1997|SCO|ATA|64|64","Alexandru Pop|2006|ROU|ATA|56|66","Godwin Udosen|2006|NGA|ATA|56|64","Vadym Kyrychenko|2000|UKR|ATA|62|63"]],
    ["univ_cluj","Universitatea Cluj","U Cluj",63,64,[
      "Stefan Lefter|1998|ROU|GOL|63|63","Denis Moldovan|2004|ROU|GOL|55|63","Vlad Rafaila|2004|ROU|GOL|53|61","Neofytos Michail|1993|CYP|GOL|58|58","Tudor Cosa|2006|ROU|GOL|52|62","Alin Chintes|1991|ROU|DEF|61|61","Iulian Cristea|1994|ROU|DEF|62|62","Friday Adams|2000|NGA|DEF|61|62","Noah Loosli|1999|SUI|DEF|62|63","Florent Poulolo|1996|MTQ|DEF|61|61","Elio Capradossi|1996|UGA|DEF|64|64","Dino Mikanovic|1994|CRO|DEF|64|64","Alin Teheres|1997|ROU|DEF|61|61","Jonathan Cisse|1999|CIV|DEF|59|60","Tobias Horn|2004|GER|DEF|58|63","Luca Szimionas|2002|ROU|MEI|60|63","Mouhamadou Drammeh|1999|GAM|MEI|62|63","Dorin Codrea|1992|ROU|MEI|61|61","Dan Nistor|1988|ROU|MEI|64|64","Marius Stefanescu|1998|ROU|MEI|63|63","Pedro Pinho|1999|POR|MEI|61|62","Alexandru Chipciu|1989|ROU|MEI|63|63","Andrei Gheorghita|2001|ROU|MEI|63|65","Ovidiu Bic|1997|ROU|MEI|62|62","Lukas Pall|2005|ROU|MEI|56|64","Gabriel Simion|2005|ROU|MEI|54|63","Jovo Lukic|1992|BIH|ATA|64|64","Issouf Macalou|1998|CIV|ATA|64|65","Alibek Aliyev|2000|SWE|ATA|63|64","Oucasse Mendy|1997|FRA|ATA|63|63","Jug Stanojev|1993|SRB|ATA|62|62"]],
    ["farul","Farul Constanta","Farul",61,62,[
      "Alexandru Buzbuchi|1998|ROU|GOL|62|62","Rafael Munteanu|2001|ROU|GOL|58|62","David Barbu|2006|ROU|GOL|52|62","David Maftei|2005|ROU|DEF|57|64","Gustavo Marins|1995|BRA|DEF|63|63","Cristian Ganea|1999|ROU|DEF|61|61","Ionut Cercel|2004|ROU|DEF|60|65","Ionut Larie|1996|ROU|DEF|61|61","Lucas Pellegrini|1999|FRA|DEF|60|61","Dan Sirbu|2004|ROU|DEF|56|62","Sofyane Bouzamoucha|1998|FRA|DEF|60|60","Joao Ferreira|1997|BRA|DEF|60|60","Alexandru Telehoi|2005|ROU|DEF|54|62","Steve Furtado|1998|CPV|DEF|61|62","Hassane Traore|2001|BFA|DEF|59|61","Victor Dican|1999|ROU|MEI|60|61","Ionut Vina|1998|ROU|MEI|61|61","Eddy Sylvestre|1994|FRA|MEI|60|60","Ianis Podoleanu|2005|ROU|MEI|56|64","Luca Banu|2004|ROU|MEI|58|64","Eduard Radaslavescu|1995|ROU|MEI|62|62","Tony Njike|1998|FRA|MEI|59|60","Alexandru Goncear|2005|ROU|MEI|55|63","Matteo Ahlinvi|2003|BEN|MEI|58|62","Razvan Tanasa|2004|ROU|MEI|55|62","Nicolas Popescu|2005|ROU|MEI|54|62","Andrei Oancea|2005|ROU|MEI|54|62","Patrick Budescu|2000|ROU|MEI|59|60","Razvan Marincean|2000|ROU|MEI|60|61","Denis Alibec|1991|ROU|ATA|63|63","Muhamet Hyseni|2002|KOS|ATA|62|64","Jakub Vojtus|2000|SVK|ATA|61|62","Cristian Sima|1999|ROU|ATA|59|60","Narek Grigoryan|1999|ARM|ATA|60|61","David Pacuraru|2005|ROU|ATA|55|63"]],
    ["uta","UTA Arad","UTA Arad",61,62,[
      "Marcio Rosa|1997|CPV|GOL|62|62","Alexandru Popescu|1998|ROU|GOL|58|59","Andrei Gorcea|2000|ROU|GOL|57|58","Andrei Dorobantu|2003|ROU|DEF|57|62","Din Alomerovikj|1998|MKD|DEF|62|63","Alexandru Benga|1996|ROU|DEF|61|61","Peter Ouaneh|2001|FRA|DEF|60|62","Dmytro Pospyelov|1999|UKR|DEF|62|63","Andrea Padula|1998|ITA|DEF|61|62","Robert Badescu|2004|ROU|DEF|56|62","Sota Mino|1998|JPN|MEI|62|62","Antoni Ivanov|1995|BUL|MEI|62|62","Alin Roman|1996|ROU|MEI|61|61","Marinos Tzionis|2001|CYP|MEI|63|65","Richard Odada|1999|KEN|MEI|60|61","Denis Ile|2003|ROU|MEI|56|62","Denis Taroi|2005|ROU|MEI|55|63","Andrei Tolcea|2004|ROU|MEI|55|62","Alexandru Matei|2002|ROU|MEI|57|62","Razvan Oaida|2004|ROU|MEI|56|62","Alexi Pitu|2006|ROU|MEI|54|62","Omar El Sawy|2003|ROU|MEI|58|63","Samuel Gueulette|2000|RWA|MEI|59|60","Ismet Sinani|1996|KOS|ATA|63|63","Marius Coman|1996|ROU|ATA|63|63","Hakim Abdallah|1999|MAD|ATA|62|63","Jayson Papeau|1997|FRA|ATA|62|62"]],
    ["petrolul","Petrolul Ploiesti","Petrolul",60,61,[
      "Stefan Radulescu|1999|ROU|GOL|60|61","Stefan Georgescu|2004|ROU|GOL|55|62","Andres Dumitrescu|2001|ROU|DEF|59|62","Paul Papp|1998|ROU|DEF|60|60","Sergiu Hanca|1996|ROU|DEF|60|60","Mark Tutu|2004|ROU|DEF|56|62","Adam Zaian|1999|NED|DEF|60|61","Liviu Argesanu|2002|ROU|DEF|56|60","Kilian Ludewig|2000|GER|DEF|61|62","Tiberiu Capusa|1998|ROU|DEF|60|60","Breston Malula|2000|SUI|DEF|60|61","Rodrigo Martins|1999|POR|MEI|60|61","Lucho Vega|1998|ARG|MEI|61|62","Alejandro Bran|1998|CRC|MEI|61|62","Celal Huseynov|2001|AZE|MEI|58|61","Leo Teixeira|1999|POR|MEI|60|60","David Paraschiv|2004|ROU|MEI|56|62","Marius Costache|2003|ROU|MEI|57|60","Rares Manolache|2005|ROU|MEI|55|62","Mario Ionita|2003|ROU|MEI|56|60","Israel Dele|2000|NGA|MEI|59|60","Rares Leescu|2005|ROU|ATA|55|63","Robert Jerdea|2005|ROU|ATA|54|62","David Ilie|2006|ROU|ATA|53|62"]],
    ["botosani","FC Botosani","Botosani",58,59,[
      "David Dinca|2002|ROU|GOL|59|61",
      "Ion Gurau|2003|ROU|GOL|56|59",
      "Iustin Filote|2006|ROU|GOL|50|60",
      "Giannis Anestis|1991|GRE|GOL|60|60",
      "Brian Bayeye|1996|COD|DEF|59|59",
      "Andrei Miron|1996|ROU|DEF|58|58",
      "Razvan Cret|2002|ROU|DEF|58|60",
      "Miguel Munoz|1994|ESP|DEF|60|60",
      "Djibril Diaw|1998|SEN|DEF|59|60",
      "Alexandru Suchianu|2004|ROU|DEF|55|61",
      "Alexandru Tiganasu|1998|ROU|DEF|58|58",
      "Rijad Sadiku|1996|BIH|DEF|59|59",
      "Narcis Ilas|2004|ROU|DEF|56|61",
      "Mamadou Diarra|1999|FRA|DEF|58|59",
      "Charles Petro|1999|MWI|MEI|58|59",
      "Sebastian Mailat|1999|ROU|MEI|62|63",
      "Denis Stefan|2002|ROU|MEI|57|59",
      "Lucas de Vega|2000|BRA|MEI|59|60",
      "Hervin Ongenda|1995|FRA|MEI|60|60",
      "Mihai Bordeianu|1991|ROU|MEI|61|61",
      "Enriko Papa|1999|ALB|MEI|58|59",
      "David Ciurel|2005|ROU|MEI|54|61",
      "Gabriel Gama|1998|BRA|MEI|59|59",
      "Mario Preda|2005|ROU|MEI|52|60",
      "Jovan Markovic|1995|ROU|ATA|62|62",
      "Stefan Bodisteanu|2001|MDA|ATA|60|61",
      "Zoran Mitrov|1996|ROU|ATA|58|58",
      "George Sorodoc|2004|ROU|ATA|55|60",
      "Teodor Afilipoaie|2003|ROU|ATA|57|60",
      "Mykola Kovtalyuk|1999|UKR|ATA|58|59",
      "Andrei Dumiter|2004|ROU|ATA|54|60"
    ]],
    ["arges","FC Arges Pitesti","Arges",58,59,[
      "Catalin Straton|1996|ROU|GOL|60|60",
      "Matteo Serban|2006|ROU|GOL|50|60",
      "Catalin Cabuz|1997|ROU|GOL|58|58",
      "Igor Nikic|1998|MNE|GOL|58|59",
      "Andrei Tofan|2002|ROU|DEF|58|60",
      "Leard Sadriu|2000|KOS|DEF|60|61",
      "Mario Tudose|2004|ROU|DEF|56|61",
      "Guilherme Garutti|1998|BRA|DEF|60|60",
      "Florin Borta|1997|ROU|DEF|58|58",
      "Tiago Goncalves|2000|POR|DEF|59|60",
      "Dorinel Oancea|2005|ROU|DEF|54|61",
      "Silviu Balaure|1996|ROU|DEF|59|59",
      "Michael Idowu|1999|NGA|MEI|58|59",
      "Yanis Pirvu|2004|ROU|MEI|56|61",
      "Ciprian Balasa|2004|ROU|MEI|56|61",
      "Ionut Radescu|1999|ROU|MEI|59|59",
      "Claudiu Micovschi|1998|ROU|MEI|60|60",
      "Vadim Rata|1995|MDA|MEI|60|60",
      "Gabriel Gheorghe|2002|ROU|MEI|57|59",
      "Oluwatobiloba Alagbe|2001|NGA|MEI|57|60",
      "Xian Emmers|1999|BEL|MEI|61|61",
      "Taylor Luvambo|2000|FRA|ATA|59|60",
      "Daniel Sandu|2001|ROU|ATA|57|60",
      "Ricardo Matos|1997|POR|ATA|60|60",
      "Patrick Dulcea|2003|ROU|ATA|57|61",
      "Rober Sierra|1998|ESP|ATA|60|60",
      "Robert Moldoveanu|2003|ROU|ATA|56|60"
    ]],
    ["otelul","Otelul Galati","Otelul",58,59,[
      "Cosmin Dur-Bozoanca|1996|ROU|GOL|60|60","Gabriel Ursu|2004|ROU|GOL|54|60","Mario Contra|2006|ROU|GOL|50|59","Milen Zhelev|1996|BUL|DEF|60|60","Ne Lopes|1996|POR|DEF|59|59","Paul Iacob|1999|ROU|DEF|58|59","Dan Neicu|2003|ROU|DEF|56|59","Kazu|1996|BRA|DEF|58|58","Habib Sylla|2000|CIV|DEF|57|58","Giannis Christopoulos|1995|GRE|DEF|58|58","Dragos Aftene|1997|ROU|MEI|58|58","Joao Lameira|1993|POR|MEI|62|62","Andrei Ciobanu|2004|ROU|MEI|56|60","Radu Postelnicu|2005|ROU|MEI|54|60","Denis Bordun|2004|ROU|MEI|55|60","Pedro Nuno|1999|POR|MEI|59|59","Matei Frunza|2006|ROU|MEI|52|60","Diego Zivulic|1998|CRO|MEI|60|60","Bruno Paz|1997|ANG|MEI|58|58","Teodor Lungu|2004|MDA|MEI|55|59","Andrezinho|1999|POR|ATA|60|60","Patrick|1997|CPV|ATA|59|59","Cristian Neicu|2003|ROU|ATA|57|60","Luan Campos|2000|BRA|ATA|58|58","Joao Paulino|2000|CPV|ATA|57|58"]],
    ["slobozia","Unirea Slobozia","Slobozia",56,57,[
      "Albert Humor|2000|ROU|GOL|58|59","Denis Rusu|2000|MDA|GOL|55|58","Stefan Ciuperca|2005|ROU|GOL|52|58","David Dumitru|2006|ROU|GOL|50|58","Alexandru Stanica|1999|ROU|DEF|57|57","Gabriel Nedelea|1997|ROU|DEF|58|58","Constantin Toma|1991|ROU|DEF|58|58","Andre Serra|1999|POR|DEF|58|58","Gabriel Lazar|1996|ROU|DEF|57|57","David Todoran|2004|ROU|DEF|54|59","Florinel Ibrian|1996|ROU|DEF|57|57","Raul Iancu|2004|ROU|MEI|54|59","Rares Lazar|2004|ROU|MEI|54|59","Bruno Ventura|1996|POR|MEI|58|58","Szabolcs Szilagyi|2004|ROU|MEI|54|59","Robert Ristoiu|2004|ROU|MEI|54|60","Mihaita Lemnaru|2001|ROU|MEI|56|58","Deimantas Rimpa|1997|LTU|MEI|58|58","Razvan Gradinaru|1998|ROU|ATA|58|58","Gergely Bobal|1999|HUN|ATA|59|59","Robert Necsulescu|2005|ROU|ATA|55|62","Viorel Garbacea|1997|ROU|ATA|57|57","Silviu Tanase|2002|ROU|ATA|56|58","Felipe Borges|1997|POR|ATA|58|58","Alexandru Niculae|2002|ROU|ATA|56|58","Lucas Campan|2005|ROU|ATA|53|60"]],
    ["csikszereda","Csikszereda Miercurea Ciuc","Csikszereda",55,56,[
      "Zsombor Deaky|2000|ROU|GOL|58|58","Mate Simon|2006|ROU|GOL|50|57","Mark Karacsony|2005|ROU|GOL|50|57","Eduard Pap|2002|ROU|GOL|52|57","Raul Palmes|1998|ROU|DEF|57|57","Alex Szabo|1996|HUN|DEF|58|58","Gyorgy Papp|1997|ROU|DEF|57|57","Lorand Paszka|1996|ROU|DEF|57|57","Mate Odor|1999|HUN|DEF|57|57","Janos Hegedus|1996|HUN|DEF|57|57","Razvan Trif|2000|ROU|DEF|55|57","Szilard Veres|1998|ROU|MEI|57|57","Soufiane Jebari|1999|ESP|MEI|59|59","Artur Horvath|1997|HUN|MEI|58|58","Attila Csuros|1995|ROU|MEI|57|57","Ervin Bakos|1999|ROU|MEI|56|57","Elod Toth-Pal|1998|ROU|MEI|56|57","Matyas Tajti|1996|HUN|MEI|57|57","Victor Oniga|2001|ROU|MEI|55|57","Lima|1998|BRA|MEI|58|58","Zsolt Magyar|1995|HUN|MEI|56|56","Botond Szondi|2004|ROU|MEI|53|58","Darius Bota|2005|ROU|MEI|52|58","Albert Stahl|2004|ROU|MEI|53|58","Szabolcs Nyitra|2003|ROU|MEI|53|57","Dusan Vukovic|1998|MNE|ATA|58|58","Nino Kukovec|1996|SVN|ATA|58|58","Luca Noveli|2002|ROU|ATA|56|58","Adam Czekus|1999|HUN|ATA|57|57","Marton Eppel|1991|HUN|ATA|57|57","Szabolcs Szalay|2000|HUN|ATA|56|57"]],
    ["metaloglobus","Metaloglobus Bucuresti","Metaloglobus",53,54,[
      "George Gavrilas|1993|ROU|GOL|57|57","Alexandru Soare|2005|ROU|GOL|50|56","Ionut Ailenei|2003|ROU|GOL|51|56","Dinis Ieseanu|1999|MDA|DEF|55|56","George Caramalau|1994|ROU|DEF|55|55","Tudor Pojar|2000|ROU|DEF|54|56","Junior Morais|1997|BRA|DEF|55|55","Andrei Sava|2000|ROU|DEF|54|56","Laurentiu Corbu|1997|ROU|DEF|54|54","Marius Martac|1998|ROU|DEF|54|55","Costin Leonte|2004|ROU|DEF|52|57","Matko Zirdum|1996|CRO|DEF|56|56","Erico|1999|BRA|DEF|54|55","Andrei Pandele|1998|ROU|MEI|55|55","Florin Purece|1997|ROU|MEI|55|55","Alexandru Irimia|2004|ROU|MEI|54|59","Andrei Dumitru|2004|ROU|MEI|52|57","Luca Stoica|2006|ROU|MEI|52|59","Robert Neacsu|2002|ROU|MEI|54|56","Vlad Stancovici|2005|ROU|MEI|51|57","Jordan Gutierrez|1999|EQG|ATA|56|57","Nicolas Constantinescu|2004|ROU|ATA|53|59","Ime Ndon|1999|NGA|ATA|55|56","Stefan Todoran|2003|ROU|ATA|53|58"]],
    ["hermannstadt","Hermannstadt","Hermannstadt",55,56,[
      "David Lazar|1991|ROU|GOL|58|58",
      "V. Mutiu|1995|ROU|GOL|56|56",
      "Ionut Pop|1997|ROU|GOL|55|56",
      "Bozhidar Chorbadzhiyski|1995|BUL|DEF|58|58",
      "Ianis Stoica|2002|ROU|DEF|56|56",
      "A. Karo|1996|CYP|DEF|57|57",
      "Kevin Ciubotaru|2004|ROU|DEF|54|59",
      "Luca Stancu|2005|ROU|DEF|53|59",
      "S. Issah|2000|GHA|DEF|56|57",
      "Dragos Albu|2001|ROU|MEI|57|58",
      "Jair da Silva|1994|BRA|MEI|58|58",
      "Kalifa Kujabi|2000|GAM|MEI|57|58",
      "A. Zargary|2003|ISR|MEI|56|58",
      "Diogo Batista|2000|POR|MEI|57|58",
      "I. Gandila|2006|ROU|MEI|52|58",
      "Cristian Negut|1996|ROU|ATA|57|57",
      "Aurelian Chitu|1991|ROU|ATA|57|57",
      "E. Florescu|1997|ROU|ATA|55|55",
      "Christ Afalna|1998|CMR|ATA|56|57",
      "Sergiu Bus|1993|ROU|ATA|56|56",
      "D. Politic|2000|ROU|ATA|55|56",
      "M. Simba|2000|SWE|ATA|56|56",
      "Ioan Barstan|2004|ROU|ATA|53|58",
      "S. Ritivoi|2009|ROU|ATA|48|60"
    ]]
  ]};
  const registry=root.ProLifeGlobalFootballPacks=root.ProLifeGlobalFootballPacks||[];
  if(!registry.some(item=>item.id===pack.id))registry.push(pack);
  if(typeof module!=="undefined"&&module.exports)module.exports=pack;
})(typeof globalThis!=="undefined"?globalThis:this);
