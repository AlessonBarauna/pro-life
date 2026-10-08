(function(root){
  "use strict";
  // Superliga Dinamarquesa 2025/26 (pre-etapa 26C, NAO registrado no build). GER/potencial: estimativa propria, nao copia de tabela oficial.
  // Linha: "Nome|AnoNasc|COD|POS|GER|POT". Fontes: Wikipedia (elenco), starting11/outras para idade; anos de nascimento marcados como incertos ficam no relatorio da 26C.
  const pack={id:"eur26c_den",version:1,league:["den_sl","Superliga Dinamarquesa","Superliga","Dinamarca",70],clubs:[
    ["fc_copenhagen","FC Copenhagen","Copenhagen",76,74,[
      "Dominik Kotarski|2000|CRO|GOL|73|75","Runar Alex Runarsson|1995|ISL|GOL|66|66","Oscar Gadeberg Buur|2005|DEN|GOL|56|66","Gabriel Pereira|2001|BRA|DEF|70|73","Pantelis Hatzidiakos|1997|GRE|DEF|71|71","Rodrigo Huescas|2003|MEX|DEF|69|74","Marcos Lopez|1999|PER|DEF|68|69","Aurelio Buta|1997|POR|DEF|69|69","Kenay Myrie|1999|CRC|DEF|66|68","Junnosuke Suzuki|2003|JPN|DEF|70|74","Birger Meling|1994|NOR|DEF|69|69","Mathias Jorgensen|1990|DEN|DEF|67|67","Magnus Mattsson|1998|DEN|MEI|70|71","Mads Emil Madsen|2001|DEN|MEI|69|72","Amir Richardson|1997|MAR|MEI|70|70","Thomas Delaney|1991|DEN|MEI|70|70","Jonathan Moalem|2002|DEN|MEI|62|66","William Clem|2004|DEN|MEI|62|72","Oliver Hojer|2005|DEN|MEI|58|70","Viktor Claesson|1992|SWE|ATA|71|71","Youssoufa Moukoko|2004|GER|ATA|71|75","Mohamed Elyounoussi|1994|NOR|ATA|72|72","Jordan Larsson|1997|SWE|ATA|69|69","Andreas Cornelius|1993|DEN|ATA|67|67","Robert|2002|BRA|ATA|66|69","Liam West|2005|NOR|ATA|62|72","Elias Achouri|1999|TUN|ATA|71|72","Viktor Dadason|2002|ISL|ATA|66|69"]],
    ["fc_midtjylland","FC Midtjylland","Midtjylland",76,74,[
      "Jonas Lossl|1989|DEN|GOL|69|69",
      "Elias Rafn Olafsson|1999|ISL|GOL|66|69",
      "Ousmane Diao|2003|SEN|DEF|64|69",
      "Martin Erlic|1998|CRO|DEF|68|69",
      "Adam Gabriel|2002|CZE|DEF|66|70",
      "Mads Bech Sorensen|1999|DEN|DEF|70|71",
      "Paulinho|2002|BRA|DEF|65|68",
      "Kevin Mbabu|1995|SUI|DEF|70|70",
      "Victor Bak|2004|DEN|DEF|60|70",
      "Philip Billing|1996|DEN|MEI|71|71",
      "Dario Osorio|2004|CHI|MEI|71|75",
      "Pedro Bravo|2001|COL|MEI|68|71",
      "Valdemar Byskov|2004|DEN|MEI|62|70",
      "Denil Castillo|2003|ECU|MEI|69|73",
      "Aral Simsir|2002|TUR|MEI|67|71",
      "Dani Silva|2000|POR|MEI|68|69",
      "Franculino Dju|2004|GNB|ATA|68|72",
      "Cho Gue-sung|1998|KOR|ATA|70|70",
      "Edward Chilufya|1999|ZAM|ATA|68|69",
      "Mikael Uhre|1994|DEN|ATA|68|68",
      "Mikel Gogorza|2005|DEN|ATA|56|66",
      "Junior Brumado|2002|BRA|ATA|62|66",
      "Friday Etim|2004|NGA|ATA|63|70"
    ]],
    ["brondby_if","Brondby IF","Brondby",74,72,[
      "Patrick Pentz|1997|AUT|GOL|71|72",
      "Gavin Beavers|2002|USA|GOL|63|68",
      "Thomas Mikkelsen|1990|DEN|GOL|60|60",
      "Oliver Villadsen|1998|DEN|DEF|67|68",
      "Luis Binks|1998|ENG|DEF|67|68",
      "Rasmus Lauritsen|1997|DEN|DEF|68|68",
      "Ben Godfrey|1998|ENG|DEF|68|69",
      "Marko Divkovic|2001|CRO|DEF|66|69",
      "Mats Kohlert|1999|GER|DEF|66|67",
      "Jordi Vanlerberghe|1998|BEL|DEF|67|68",
      "Sean Klaiber|1995|SUR|DEF|67|67",
      "Frederik Alves|2003|DEN|DEF|60|68",
      "Daniel Wass|1989|DEN|MEI|68|68",
      "Mathias P. Jensen|2005|DEN|MEI|68|68",
      "Bartosz Slisz|1999|POL|MEI|69|70",
      "Nicolai Vallys|1999|DEN|ATA|69|70",
      "Filip Bundgaard|2004|DEN|ATA|63|70",
      "Sho Fukuda|2001|JPN|ATA|66|68",
      "Ousmane Sow|2000|SEN|ATA|68|69",
      "Jacob Ambaek|2005|DEN|ATA|60|70"
    ]],
    ["agf","AGF Aarhus","AGF",72,68,[
      "Jesper Hansen|1985|DEN|GOL|66|66","Mads Hedenstad Christiansen|1999|NOR|GOL|62|64","Danieli Leo Gretarsson|1995|ISL|DEF|63|63","Frederik Tingager|1993|DEN|DEF|65|65","Tobias Molgaard|2001|DEN|DEF|63|65","Eric Kahl|2000|SWE|DEF|64|66","Colin Rosler|2002|NOR|DEF|63|66","Jacob Andersen|2005|DEN|DEF|58|66","Luka Callo|2005|DEN|DEF|58|66","Magnus Knudsen|1995|NOR|MEI|66|66","Nicolai Poulsen|1993|DEN|MEI|64|64","Markus Solbakken|1998|NOR|MEI|65|66","Kristian Arnstad|1998|NOR|MEI|68|69","Gift Links|2001|RSA|MEI|67|70","Jens Jonsson|1993|DEN|MEI|66|66","Kevin Yakob|1998|IRQ|MEI|64|66","Callum McCowatt|1999|NZL|MEI|65|66","Tomas Kristjansson|2002|ISL|MEI|63|68","Oskar Haugstrup|2005|DEN|MEI|58|68","Mikael Anderson|1998|ISL|MEI|67|68","Rasmus Carstensen|1999|DEN|MEI|63|65","Sebastian Jorgensen|1999|DEN|ATA|64|66","Janni Serra|1998|GER|ATA|66|67","Stefen Tchamche|2003|DEN|ATA|62|67","James Bogere|2005|UGA|ATA|61|70","Tobias Bech|2004|DEN|ATA|60|68","Frederik Emmery|2005|DEN|ATA|58|66"]],
    ["fc_nordsjaelland","FC Nordsjaelland","Nordsjaelland",70,66,[
      "Andreas Hansen|1998|DEN|GOL|62|64","Jakob Busk|1993|DEN|GOL|60|60","Peter Ankersen|1990|DEN|DEF|65|65","Tobias Salquist|1997|DEN|DEF|63|64","Runar Norheim|1998|NOR|DEF|63|64","Stephen Acquah|2002|GHA|DEF|62|66","Juho Lahteenmaki|2001|FIN|DEF|64|67","Markus Walker|2002|DEN|DEF|61|64","Victor Gustafsen|2004|DEN|DEF|58|65","Villads Rutkjaer|2004|DEN|DEF|57|65","Matej Tuka|2004|SWE|DEF|59|67","Noah Markmann|2006|DEN|DEF|54|64","Mark Brink|1997|DEN|MEI|66|66","Nicklas Rojkjaer|2000|DEN|MEI|63|65","Prince Amoako|2005|GHA|MEI|62|70","Justin Janssen|2003|DEN|MEI|60|65","Araphat Mohammed|2005|GHA|MEI|60|69","Diallo Sanoussi|2003|CIV|MEI|59|65","Villum Berthelsen|2004|DEN|MEI|57|65","Caleb Yirenkyi|2003|GHA|MEI|63|67","Lamine Sadio|2005|SEN|MEI|57|66","Malte Heyde|2006|DEN|MEI|54|64","Ola Solbakken|1996|NOR|ATA|65|65","Alexander Lind|1996|DEN|ATA|64|64","Ibrahim Adel|2001|EGY|ATA|64|66","Levy Nene|2001|CIV|ATA|62|65","Souleymane Alio|2004|BFA|ATA|60|67","Daniel Johannesson|2005|ISL|ATA|58|67","Hjalte Boe|2005|DEN|ATA|55|65","Mouekeinga Kone|2005|CIV|ATA|55|65","Rayan Bardghji|2005|SWE|ATA|63|72"]],
    ["viborg_ff","Viborg FF","Viborg",66,64,[
      "Lucas Lund|1999|DEN|GOL|63|65","Kasper Kiilerich|2004|DEN|GOL|55|62","Mohamed Iyadh Riahi|2002|TUN|DEF|62|66","Valgeir Lunddal Fridriksson|1999|ISL|DEF|64|66","Lukas Kirkegaard|2000|DEN|DEF|62|64","Zan Zaletel|1999|SVN|DEF|62|64","Oliver Bundgaard|2001|DEN|DEF|60|63","Daniel Anyembe|2003|KEN|DEF|60|64","Hjalte Bidstrup|2003|DEN|DEF|58|63","Srdan Kuzmic|2000|SVN|DEF|61|63","Emil Monrad|2005|DEN|DEF|54|62","Mads Sondergaard|1998|DEN|MEI|63|64","Asker Beck|2002|DEN|MEI|64|66","Jeppe Gronning|1993|DEN|MEI|63|63","Bilal Brahimi|2000|FRA|MEI|66|67","Frederik Damkjer|2004|DEN|MEI|55|63","Philip Keller|2005|DEN|MEI|54|63","Yonis Njoh|2000|FRA|ATA|65|66","Tim Freriks|1995|NED|ATA|65|65","Sami Jalal|2004|DEN|ATA|62|68","Charly Nouck|1998|DEN|ATA|64|65","Osman Addo|2003|DEN|ATA|62|67","Dorian Jr|2000|EQG|ATA|63|65","Adam Kleis-Kristoffersen|2005|DEN|ATA|54|63","Giulio Gabriel da Silva|2003|BRA|ATA|58|64"]],
    ["silkeborg_if","Silkeborg IF","Silkeborg",62,63,[
      "Aske Andresen|1997|DEN|GOL|65|65","Bastian Holm|2004|DEN|GOL|55|62","Andreas Poulsen|1999|DEN|DEF|64|65","Robin Ostrom|1996|NOR|DEF|63|64","Pedro Ganchas|2000|POR|DEF|63|65","Mael de Gevigney|1998|FRA|DEF|63|64","Melker Jonsson|2002|SWE|DEF|61|64","Jens Martin Gammelby|1995|DEN|DEF|62|62","Alexander Priesborg Madsen|2005|DEN|DEF|55|63","Pontus Rodin|2000|SWE|DEF|62|64","William Moller|2004|DEN|DEF|55|63","Alexander Busch|2005|DEN|DEF|54|63","Villads Westh|2000|DEN|MEI|63|64","Kristian Kirkegaard|1994|DEN|MEI|63|63","Sofus Berger|2001|DEN|MEI|62|65","Mads Larsen|2002|DEN|MEI|60|64","Rami Al Hajj|1996|SWE|MEI|63|63","Mikkel Oxenberg|2003|DEN|MEI|58|63","William Kirk|2005|DEN|MEI|55|63","Mads Freundlich|2004|DEN|MEI|56|63","Julius Lorents|2005|DEN|MEI|54|63","Oliver Ross|2000|DEN|ATA|63|64","Lucas Riisgaard|2003|DEN|ATA|60|64","Malthe Hansen|2004|DEN|ATA|58|64","Kristian Bogild|2005|DEN|ATA|54|63"]],
    ["odense_boldklub","Odense Boldklub","OB",66,63,[
      "Martin Hansen|1990|DEN|GOL|66|66",
      "Viljar Myhra|1999|NOR|GOL|62|64",
      "Marcus Eskildsen|2003|DEN|GOL|55|62",
      "Theo Sander|2004|DEN|GOL|56|65",
      "Adam Sorensen|2002|DEN|DEF|62|65",
      "Bjorn Paulsen|1995|DEN|DEF|63|63",
      "Nicolas Burgy|1998|SUI|DEF|64|65",
      "Julius Berthel Askou|2003|DEN|DEF|60|64",
      "Gustav Grubbe|2005|DEN|DEF|55|63",
      "Marcus McCoy|2004|DEN|DEF|56|63",
      "Leeroy Owusu|1998|NED|DEF|64|65",
      "Yaya Bojang|2004|GAM|DEF|62|65",
      "James Gomez|1999|GAM|DEF|63|64",
      "Adam Amrani|2005|DEN|DEF|54|63",
      "Jakob Bonde|1999|DEN|MEI|62|63",
      "Rasmus Falk|1992|DEN|MEI|64|64",
      "Anssi Suhonen|2001|FIN|MEI|66|68",
      "Max Ejdum|2005|DEN|MEI|55|64",
      "Tom Trybull|1993|GER|MEI|65|65",
      "Vitus Friis|2005|DEN|MEI|54|63",
      "Ismahila Ouedraogo|2002|BFA|MEI|62|65",
      "Noah Lassen|2006|DEN|MEI|52|62",
      "Fiete Arp|2000|GER|ATA|66|68",
      "Jona Niemiec|2002|GER|ATA|63|65",
      "Noah Ganaus|2005|GER|ATA|55|64",
      "William Martin|2005|DEN|ATA|54|63",
      "Mads Abrahamsen|2005|DEN|ATA|54|63",
      "Lasse Legolas|2005|DEN|ATA|53|62",
      "Magnus Andersen|2003|DEN|ATA|56|62",
      "Jay-Roy Grot|1998|SUR|ATA|64|65"
    ]],
    ["randers_fc","Randers FC","Randers",64,63,[
      "Paul Izzo|1995|AUS|GOL|66|66","Mert Demirci|2002|NED|GOL|58|63","Jannich Storch|1993|DEN|GOL|60|60","Lucas Lissens|1999|BEL|DEF|64|65","Daniel Hoegh|1998|DEN|DEF|63|64","Wessel Dammers|1996|NED|DEF|65|65","Oliver Jones|2003|AUS|DEF|60|66","Martin Sjolstad|2000|NOR|DEF|62|64","Benjamin Orn|2000|SWE|DEF|62|64","Sabil Hansen|2005|DEN|DEF|55|64","Nikolas Dyhr|2005|DEN|DEF|53|62","John Bjorkengren|2000|SWE|MEI|63|65","Mike Themsen|1997|DEN|MEI|64|64","Laurits Pedersen|2003|DEN|MEI|58|63","Elies Mahmoud|1998|FRA|MEI|64|65","Frederik Lauenborg|2005|DEN|MEI|55|64","Mathias Greve|1996|DEN|MEI|63|63","Ousseynou Fall Seck|2001|SEN|MEI|62|65","Andre Romer|1998|DEN|MEI|62|63","Max Albaek|2005|DEN|MEI|54|63","Lasse Mandal|2005|DEN|MEI|53|63","Amin Al-Hamawi|2001|IRQ|ATA|63|66","Warren Caddy|2001|MAD|ATA|64|66","Musa Toure|2005|AUS|ATA|56|65","Ernest Agyiri|2002|GHA|ATA|62|65","Cyril Edudzi|2006|GHA|ATA|55|64","Oliver Henriksen|2006|DEN|GOL|50|60"]],
    ["sonderjyske","Sonderjyske Fodbold","Sonderjyske",60,62,[
      "Nicolai Flo|1997|DEN|GOL|63|63","Marcus Bundgaard|2001|DEN|GOL|55|62","Nick Shinton|2003|BEL|GOL|56|62","Berkant Bayrak|2005|TUR|GOL|52|61","Alexander Munksgaard|2000|DEN|DEF|62|63","Maxime Soulas|1998|FRA|DEF|62|63","Dalton Wilkins|1998|NZL|DEF|61|62","Pachanga Kristensen|2000|DEN|DEF|60|62","Tobias Klysner|1999|DEN|DEF|61|62","Stefan Velkov|1999|BUL|DEF|62|63","Ebube Duru|2003|NGA|DEF|59|64","Brynjar Ingi Bjarnason|1999|ISL|DEF|63|64","Gustav Wagner|2005|DEN|DEF|54|62","Runar Thor Sigurgeirsson|1994|ISL|DEF|60|60","Rasmus Vinderslev|1994|DEN|MEI|64|64","Sefer Emini|1997|MKD|MEI|63|63","Mohamed Cherif Haidara|2002|GUI|MEI|62|65","Anders Hoeg|2000|DEN|MEI|61|63","Andreas Oggesen|2002|DEN|MEI|60|63","Anders Bergholt|2001|DEN|MEI|61|63","Jacob Steen Christensen|2004|DEN|MEI|58|65","Elias Hjort-Pedersen|2005|DEN|MEI|54|62","Matthew Hoppe|2001|USA|ATA|65|66","Osaze De Rosario|2003|GUY|ATA|62|66","Teodor Berg Haltvik|2002|NOR|ATA|62|65","Lirim Qamili|2002|MKD|ATA|61|64","Omran Khatar|2005|DEN|ATA|56|64","Bubacarr Tambedou|2004|GAM|ATA|58|64","Ismail Seydi|2001|FRA|ATA|62|63","David Boison|2005|GHA|ATA|56|64","Villads Nohr Birk|2005|DEN|ATA|54|62","Sebastian Larsen|2005|DEN|ATA|53|62","Lasse Nielsen|1995|DEN|DEF|62|62"]],
    ["vejle_bk","Vejle Boldklub","Vejle",60,60,[
      "Igor Vekic|2000|SVN|GOL|62|63","Nicolai Larsen|1996|DEN|GOL|58|58","Kasper Kristensen|2004|DEN|GOL|53|60","Thorbjorn Ploger|2005|DEN|GOL|50|58","Thomas Gundelund|1998|DEN|MEI|63|64","Christian Sorensen|1999|DEN|DEF|62|63","Mike Vestergard|1998|DEN|MEI|62|63","Christian Gammelgaard|1999|DEN|MEI|62|63","Tobias Lauritsen|2000|DEN|MEI|61|63","Jelle Duin|1996|NED|ATA|63|63","Mikkel Duelund|1997|DEN|MEI|65|65","Jonathan Amon|1999|USA|MEI|65|66","Tobias Bach|2002|DEN|MEI|60|63","Andrew Hjulsager|1995|DEN|MEI|64|64","Wahid Faghir|2003|DEN|ATA|65|68","Abdoulaye Camara|2001|GUI|MEI|61|63","Giorgi Tabatadze|2002|GEO|MEI|60|63","Lasse Flo|2000|DEN|DEF|61|62","Sander Ravn|2004|DEN|MEI|56|63","Nicolas Gammelgaard|2002|DEN|MEI|58|62","Hjalte Gitz|2004|DEN|DEF|55|62","Bismark Edjeodji|2003|GHA|ATA|58|63","Lundrim Hetemi|2000|ALB|MEI|62|63","Max Jensen|2005|DEN|MEI|53|62","Gustav Marcussen|2005|DEN|MEI|52|61"]],
    ["fc_fredericia","FC Fredericia","Fredericia",58,58,[
      "Andreas Gulstorff|1998|DEN|GOL|62|62","Christian Risom|2001|DEN|GOL|55|60","Valdemar Birkso|2005|DEN|GOL|50|58","Adam Nygaard|1999|DEN|DEF|61|62","Jeppe Kudsk|1996|DEN|DEF|62|62","Frederik Rieper|1998|DEN|DEF|62|63","Svenn Crone|1998|DEN|DEF|61|62","Anders Dahl|1999|DEN|DEF|60|61","Malthe Ladefoged|2002|DEN|DEF|58|62","Lauritz Dauerhoj|2002|DEN|DEF|58|62","Oliver Vest|2003|DEN|DEF|57|62","Felix Winther|1999|DEN|MEI|61|62","Emilio Simonsen|2000|DEN|MEI|61|62","William Madsen|2001|DEN|MEI|60|62","Andreas Pyndt|1999|DEN|MEI|60|61","Daniel Haarbo|2002|DEN|MEI|58|62","Patrick Egelund|1997|DEN|ATA|62|62","Nemo Thomsen|2003|GRL|ATA|58|63","Eskild Dall|2003|DEN|ATA|58|62","Elias Hansborg-Sorensen|2005|DEN|ATA|56|63"]]
  ]};
  const registry=root.ProLifeGlobalFootballPacks=root.ProLifeGlobalFootballPacks||[];
  if(!registry.some(item=>item.id===pack.id))registry.push(pack);
  if(typeof module!=="undefined"&&module.exports)module.exports=pack;
})(typeof globalThis!=="undefined"?globalThis:this);
