(function(root){
  "use strict";
  // Allsvenskan 2025/26 (pre-etapa 26C, NAO registrado no build). GER/potencial: estimativa propria, nao copia de tabela oficial.
  // Linha: "Nome|AnoNasc|COD|POS|GER|POT". Fontes: Wikipedia (elenco), starting11/outras para idade; anos de nascimento marcados como incertos ficam no relatorio da 26C.
  const pack={id:"eur26c_swe",version:1,league:["swe_all","Allsvenskan","Allsvenskan","Suecia",66],clubs:[
    ["malmo_ff","Malmo FF","Malmo FF",72,72,[
      "Robin Olsen|1990|SWE|GOL|70|70",
      "Johan Dahlin|1986|SWE|GOL|62|62",
      "William Nieroth|2006|SWE|GOL|52|62",
      "Stian Gregersen|1995|NOR|DEF|68|68",
      "Bleon Kurtulus|2007|SWE|DEF|58|70",
      "Andrej Djuric|2003|MNE|DEF|66|72",
      "Jens Stryger|1991|DEN|DEF|64|64",
      "Pontus Jansson|1991|SWE|DEF|67|67",
      "Noah John|2004|SWE|DEF|60|66",
      "Gabriel Busanello|1999|BRA|DEF|65|66",
      "Adrian Skogmar|2006|SWE|DEF|59|68",
      "Malte Frejd|2007|SWE|DEF|55|65",
      "Yanis Karabelyov|1996|BUL|MEI|66|66",
      "Otto Rosengren|2003|SWE|MEI|66|72",
      "Anders Christiansen|1990|DEN|MEI|69|69",
      "Oscar Sjostrand|2005|SWE|MEI|58|66",
      "Jovan Milosavljevic|2007|SRB|MEI|62|74",
      "Kenan Busuladzic|2007|SWE|MEI|58|70",
      "Viggo Jeppsson|2006|SWE|MEI|55|64",
      "Gentian Lajqi|2007|SWE|MEI|55|65",
      "Antonio Palac|2007|CRO|MEI|57|70",
      "Theodor Lundbergh|2009|SWE|MEI|52|68",
      "Anton Hoog|2008|SWE|MEI|54|68",
      "Diego Garcia|2000|ESP|ATA|68|70",
      "Emmanuel Ekong|2002|SWE|ATA|66|70",
      "Erik Botheim|2000|NOR|ATA|67|68",
      "Sead Haksabanovic|1999|MNE|ATA|68|69",
      "Daniel Gudjohnsen|2006|ISL|ATA|62|72",
      "Omar Krajina|2007|MNE|ATA|55|68",
      "Isaac Assibu|2008|GHA|ATA|55|68"
    ]],
    ["bk_hacken","BK Hacken","Hacken",72,72,[
      "Andreas Linde|1993|SWE|GOL|68|68","Etrit Berisha|1989|ALB|GOL|66|66","David Andersson|2001|SWE|GOL|58|62","Kristian Marinkovic|2005|SWE|GOL|52|60","Brice Wembangomo|1997|NOR|DEF|66|66","Leo Vaisanen|1997|FIN|DEF|67|67","Julius Lindberg|1999|SWE|DEF|64|65","Ben Engdahl|2003|SWE|DEF|63|66","Adam Lundkvist|1994|SWE|DEF|64|64","Filip Helander|1993|SWE|DEF|66|66","Olle Samuelsson|2004|SWE|DEF|61|66","Filip Ohman|2008|SWE|DEF|55|68","Harry Hilvenius|2007|SWE|DEF|58|70","Abdoulaye Doumbia|2008|CIV|MEI|62|76","Simen Hestnes|1996|NOR|MEI|67|67","Mikkel Rygaard|1991|DEN|MEI|67|67","Wilson Lindberg|1999|SWE|MEI|64|65","Pontus Dahbo|2005|SWE|MEI|56|64","David Seger|1999|SWE|MEI|63|64","Harun Ibrahim|2003|SWE|MEI|63|68","Adrian Svanback|2004|FIN|ATA|65|72","Mads Agger|2000|DEN|ATA|66|67","Gustav Lindgren|2001|SWE|ATA|64|67","Bamir Sadiku|2008|SWE|ATA|58|70","Sabri Kondo|2006|TAN|ATA|60|70","Christ Wawa|2007|CIV|ATA|60|72","Markus Haaland|2003|NOR|ATA|64|70"]],
    ["hammarby_if","Hammarby IF","Hammarby",71,71,[
      "Warner Hahn|1992|SUR|GOL|66|66","Elton Fischerstrom|2002|SWE|GOL|58|62","Felix Jakobsson|2004|SWE|GOL|55|62","Hampus Skoglund|2000|SWE|DEF|66|68","Frederik Winther|1996|DEN|DEF|64|64","Victor Eriksson|1998|SWE|DEF|64|65","Ibrahima Breze Fofana|2004|GUI|DEF|63|68","Noah Persson|2000|SWE|DEF|66|68","Waylon Renecke|2002|RSA|DEF|64|67","Oscar Steinke|2005|SWE|DEF|55|64","Essayas Lwampindy Bofua|2007|SWE|DEF|55|66","Bjorn Hedlof|2004|SWE|DEF|56|62","Tesfaldet Tekie|2000|SWE|MEI|67|68","Markus Karlsson|1998|SWE|MEI|63|64","Oscar Johansson Schellhas|2002|SWE|MEI|60|65","Amin Boudri|2001|SWE|MEI|63|66","Nahir Besara|1991|SWE|MEI|69|69","Sourou Kone|2001|CIV|MEI|64|67","Frank Adjei|2003|GHA|MEI|62|66","Paulos Abraham|2002|SWE|ATA|70|72","Victor Lind|2001|DEN|ATA|68|69","Oliver Jordan Hagen|2005|NOR|ATA|64|70","Montader Madjed|2001|IRQ|ATA|66|68","Suwaibou Kebbeh|2004|GAM|ATA|62|68"]],
    ["djurgardens_if","Djurgardens IF","Djurgarden",71,71,[
      "Jacob Rinne|1993|SWE|GOL|66|66",
      "Max Croon|2005|SWE|GOL|55|62",
      "Piotr Johansson|1995|SWE|DEF|65|65",
      "Jacob Une|1994|SWE|DEF|67|67",
      "Miro Tenho|1995|FIN|DEF|66|66",
      "Adam Stahl|1994|FIN|DEF|64|64",
      "Mikael Marques|2001|SWE|DEF|63|66",
      "Daryl Tschoumy Nana|2007|GER|DEF|58|68",
      "Max Larsson|2003|SWE|DEF|60|65",
      "Lucca Gentil|2008|BRA|DEF|54|66",
      "Peter Langhoff|2004|DEN|MEI|67|73",
      "Christos Almyras|2006|GRE|MEI|64|74",
      "Patric Aslund|2002|SWE|MEI|66|69",
      "Daniel Stensson|1997|SWE|MEI|64|64",
      "Bo Hegland|2004|NOR|MEI|66|72",
      "Jeppe Okkels|1999|DEN|MEI|67|67",
      "Matias Siltanen|2007|FIN|MEI|63|73",
      "Alexander Andersson|2010|SWE|MEI|51|66",
      "Alexander Johansson|2010|SWE|MEI|52|68",
      "Abdul Abdulmalik|2003|ENG|ATA|66|72",
      "Kristian Lien|2001|NOR|ATA|67|69",
      "Oskar Fallenius|2002|SWE|ATA|66|69",
      "Charlie Rosenqvist|2007|SWE|ATA|58|70",
      "Sander Ringberg|2000|NOR|ATA|62|64",
      "Angelo Agbejoye|2005|NGA|ATA|58|66"
    ]],
    ["mjallby_aif","Mjallby AIF","Mjallby",70,71,[
      "Robin Wallinder|1999|SWE|GOL|68|68","Alexander Lundin|1993|SWE|GOL|58|58","Ludvig Svanberg|2003|SWE|DEF|64|68","Martin Agnarsson|2004|FRO|DEF|65|70","Axel Noren|1999|SWE|DEF|66|67","Abdullah Iqbal|2002|PAK|DEF|64|67","Tom Pettersson|1990|SWE|DEF|63|63","Ian Hoffmann|2001|USA|DEF|62|66","Tony Miettinen|2002|FIN|DEF|65|68","Villiam Granath|1998|SWE|DEF|65|65","Mads Enggard|2004|DEN|MEI|68|73","Viktor Gustafson|1995|SWE|MEI|66|66","Teo Helge|2005|SWE|MEI|62|68","Jeppe Kjaer|2004|DEN|MEI|66|70","Jesper Gustavsson|1995|SWE|MEI|68|68","Max Nielsen|2005|DEN|MEI|63|68","Olle Lindberg|2007|SWE|MEI|60|70","Ludvig Tidstrand|2005|SWE|MEI|58|66","Romeo Leandersson|2008|SWE|MEI|55|66","Mans Isaksson|2004|SWE|MEI|58|64","Ali Youssef|2000|TUN|ATA|66|68","Timo Stavitski|1999|FIN|ATA|67|68","Bork Bang-Kittilsen|2000|NOR|ATA|64|66","Jacob Bergstrom|1995|SWE|ATA|63|63","Aki Samuelsen|2004|FRO|ATA|64|69","Zebedee Kennedy|2007|SWE|ATA|54|66"]],
    ["if_elfsborg","IF Elfsborg","Elfsborg",69,69,[
      "Theo Sander|2005|DEN|GOL|63|70",
      "Isak Pettersson|1997|SWE|GOL|65|65",
      "Lucas Hagg-Johansson|1999|SWE|GOL|58|58",
      "Thomas Isherwood|1998|SWE|DEF|67|67",
      "Rasmus Wikstrom|2001|SWE|DEF|65|67",
      "Sebastian Holmen|1992|SWE|DEF|62|62",
      "Niklas Hult|1990|SWE|DEF|62|62",
      "Viggo Elfstrom|2007|SWE|DEF|55|65",
      "Jonathan Esenga|2007|ENG|DEF|55|66",
      "Ossian Nordvall|2004|SWE|MEI|56|64",
      "Marcus Rohden|1991|SWE|MEI|63|63",
      "Arber Zeneli|1995|KOS|MEI|68|68",
      "Simon Olsson|1997|SWE|MEI|66|66",
      "Simon Hedlund|1993|SWE|MEI|60|60",
      "Julius Magnusson|1998|ISL|MEI|66|66",
      "Julius Beck|2005|DEN|MEI|64|70",
      "Ari Sigurpalsson|2003|ISL|MEI|65|70",
      "Victor Okeke|2005|NGA|MEI|60|66",
      "Momoh Kamara|2005|SLE|MEI|62|68",
      "Taylor Silverholt|2001|SWE|ATA|66|68",
      "Per Frick|1992|SWE|ATA|64|64",
      "Leo Ostman|2006|SWE|ATA|62|70",
      "Dion Krasniqi|2003|KOS|ATA|63|68",
      "Gabriel Gunnarsson|2008|ISL|ATA|56|68"
    ]],
    ["aik","AIK","AIK",69,69,[
      "Kristoffer Nordfeldt|1989|SWE|GOL|68|68","Kalle Joelsson|1998|SWE|GOL|60|60","Eskil Edh|2002|NOR|DEF|64|67","Herve Matthys|1996|BEL|DEF|66|66","Sotirios Papagiannopoulos|1990|SWE|DEF|62|62","Lukas Bergquist|2000|SWE|DEF|62|65","Mads Thychosen|1997|DEN|DEF|65|65","Sebastian Hausner|2000|DEN|DEF|63|65","Ibrahim Cisse|1999|CIV|DEF|62|64","Diogo Tomas|1997|FIN|DEF|64|64","Wilmer Olofsson|2005|SWE|DEF|60|66","Charlie Pavey|2008|SWE|DEF|55|66","Fredrik Nissen|2005|SWE|DEF|58|65","Martin Ellingsen|1995|NOR|MEI|66|66","Amel Mujanic|2001|SWE|MEI|66|68","Johan Hove|2000|NOR|MEI|66|67","Lucas Assadi|2004|CHI|MEI|70|76","Abdihakim Ali|2002|SWE|MEI|62|65","Dino Besirovic|1994|BIH|MEI|64|64","Stanley Wilson|2006|KEN|MEI|60|68","Linus Jareteg|2007|SWE|MEI|55|66","Yannick Geiger|2008|SWE|MEI|58|70","Axel Kouame|2004|CIV|MEI|62|68","Andreas Redkin|2006|SWE|MEI|55|64","Henry Atola|2005|KEN|MEI|58|65","Linus Carlstrand|2004|SWE|ATA|63|67","Sixten Gustafsson|2007|SWE|ATA|58|70","Adrian Helm|2005|SWE|ATA|58|65","Kevin Filling|2009|SWE|ATA|55|70","Nikolaj Staykov|2008|SWE|ATA|55|66","Taha Ayari|2005|SWE|ATA|60|66","Nana-Kofi Donkor|2006|GHA|ATA|58|66"]],
    ["ifk_goteborg","IFK Goteborg","IFK Goteborg",68,68,[
      "Jonathan Rasheed|1992|NOR|GOL|66|66","Viktor Andersson|2004|SWE|GOL|58|62","Elis Bishesari|2005|SWE|GOL|56|64","William Anttonen|2006|SWE|GOL|52|62","August Erlingmark|1998|SWE|DEF|66|66","Jonas Bager|1996|DEN|DEF|66|66","Hjortur Hermannsson|1995|ISL|DEF|66|66","Alexander Jallow|1998|SWE|DEF|65|65","Felix Eriksson|2004|SWE|DEF|64|67","Gabriel Ersoy|2005|SWE|DEF|58|64","Noah Tolf|2005|SWE|DEF|63|68","Emil Fasth|2005|SWE|DEF|55|63","Issaka Seidu|2006|GHA|DEF|62|70","Ramon Pascal Lundqvist|1997|SWE|MEI|67|67","David Kruse|2002|DEN|MEI|65|68","Filip Ottosson|2003|SWE|MEI|60|65","Leo Radakovic|2008|SWE|MEI|55|68","Kolbeinn Thordarson|2001|ISL|MEI|65|67","Oliver Mansson|2010|SWE|MEI|52|68","Ifeoluwa Olowoporoku|2008|NGA|MEI|58|70","Sebastian Clemmensen|2000|TOG|ATA|62|64","Sam Larsson|1993|SWE|ATA|65|65","Max Fenger|2001|DEN|ATA|66|68","Nino Zugelj|2000|SVN|ATA|66|67","Tobias Heintz|1998|NOR|ATA|68|68","Arbnor Mucolli|1999|ALB|ATA|66|67","Alfons Boren|2005|SWE|ATA|56|63","Adam Bergmark Wiberg|1997|SWE|ATA|64|64","Tiago Coimbra|2004|CAN|ATA|62|68","Peter Lazarus|2006|SSD|ATA|55|64","Alexander Simmelhack|2006|DEN|ATA|60|70"]],
    ["ik_sirius","IK Sirius","Sirius",66,66,[
      "Ismael Diawara|1995|MLI|GOL|65|65","David Celic|2003|SWE|GOL|56|60","Mohamed Soumah|2003|GUI|DEF|63|67","Bohdan Milovanov|1998|UKR|DEF|63|64","Tobias Anker|2001|DEN|DEF|63|66","Henrik Castegren|1996|SWE|DEF|64|64","Isaac Hook|2004|SWE|DEF|57|63","Simon Sandberg|1994|SWE|DEF|64|64","Victor Ekstrom|2003|SWE|DEF|61|65","Oscar Krusnell|1999|SWE|DEF|62|63","Ben Magnusson|2005|SWE|DEF|55|62","Marcus Lindberg|2000|DEN|MEI|65|66","Matthias Nartey|2004|NED|MEI|63|68","Melker Heier|2001|SWE|MEI|66|68","Charlie Nilden|2007|SWE|MEI|56|66","Victor Svensson|2006|SWE|MEI|58|66","Joakim Persson|2002|SWE|ATA|63|65","Robbie Ure|2000|SCO|ATA|64|65","Isak Bjerkebo|2003|SWE|ATA|64|67","Neo Jonsson|2007|SWE|ATA|57|68","Noel Milleskog|2002|SWE|ATA|60|63","Finlay Neat|2003|SCO|ATA|62|66","Samuel Adindu|2007|NGA|ATA|60|70"]],
    ["gais","GAIS","GAIS",64,64,[
      "Mergim Krasniqi|1992|SWE|GOL|64|64","Andreas Hermansen|2004|DEN|GOL|58|62","Matteo de Brienne|2002|CAN|DEF|62|64","Oskar Agren|1998|SWE|DEF|63|63","Robin Wendin Thomasson|1999|SWE|DEF|62|63","August Wangberg|1994|SWE|DEF|63|63","Robin Frej|1998|SWE|DEF|60|60","Anes Cardaklija|2005|BIH|DEF|60|66","Filip Beckman|2003|SWE|DEF|60|64","Dennis Collander|2002|SWE|DEF|58|60","Joackim Fagerjord|2000|SWE|MEI|62|63","William Milovanovic|2002|SWE|MEI|63|65","Gustav Lundgren|1995|SWE|MEI|62|62","Henry Sletsjoe|1998|SWE|MEI|64|64","Max Andersson|2003|SWE|MEI|60|63","Robert Frosti Thorkelsson|2005|ISL|MEI|63|70","Kevin Holmen|2002|SWE|MEI|62|64","Christos Gravius|1998|SWE|MEI|61|61","Jonas Lindberg|1989|SWE|MEI|60|60","Mohamed Bawa|2004|LBY|MEI|60|66","Rasmus Niklasson Petrovic|2003|SWE|ATA|63|66","Simon Girke Jorgensen|2005|DEN|MEI|62|68","Samuel Salter|2000|CAN|ATA|63|64","Nikola Vasic|1991|SWE|ATA|63|63","Blessing Asumang|2005|GHA|ATA|58|64","Lucas Hedlund|1998|SWE|ATA|60|60","Oscar Pettersson|2000|SWE|ATA|62|63"]],
    ["if_brommapojkarna","IF Brommapojkarna","Brommapojkarna",63,63,[
      "Leo Cavallius|2005|SWE|GOL|63|70","Davor Blazevic|1993|SWE|GOL|60|60","Philip Isaksson|2007|SWE|GOL|52|64","Hlynur Freyr Karlsson|2000|ISL|DEF|64|66","Andreas Troelsen|2003|DEN|DEF|63|66","Oskar Cotton|2002|SWE|DEF|60|62","Oliver Zanden|2001|SWE|DEF|63|65","Emir El-Kathemi|2006|SWE|DEF|58|66","Simon Strand|1993|SWE|DEF|60|60","Rasmus Bergvall|2009|SWE|DEF|52|68","Jordan Simpson|2003|SWE|DEF|60|63","Baba Salifu Apiiga|2008|GHA|DEF|55|68","Kaare Barslund|2004|DEN|DEF|60|64","Rasmus Orqvist|1999|SWE|MEI|62|62","Sebastian Wandin|2004|SWE|DEF|56|62","Serge-Junior Martinsson Ngouali|1992|GAB|MEI|64|64","Oliver Berg|1993|NOR|MEI|63|63","Kevin Ackermann|2001|SWE|MEI|62|64","Lukas Bjorklund|2004|SWE|MEI|60|64","Atle Wahlund|2009|SWE|MEI|53|66","Wael Derbali|2003|TUN|MEI|60|64","Wilmer Odefalk|2005|SWE|MEI|58|65","Obilor Okeke|2002|NOR|ATA|65|67","Mads Hansen|2002|DEN|ATA|64|66","Bidemi Amole|2009|NGA|ATA|54|68","Kamilcan Sever|2006|TUR|ATA|60|68","Anton Kurochkin|2003|SWE|ATA|60|63","Elton Hedstrom|2005|SWE|ATA|55|62","Courage Otokwefor|2005|NGA|ATA|56|64","Evans Botchway|2006|GHA|ATA|58|66","David Isso|2007|SWE|ATA|55|66"]],
    ["kalmar_ff","Kalmar FF","Kalmar",64,64,[
      "Samuel Brolin|2000|SWE|GOL|64|65","Jakob Kindberg|1994|SWE|GOL|58|58","Victor Larsson|2000|SWE|DEF|62|63","Sivert Engh Overby|1999|NOR|DEF|62|63","Rony Jansson|2001|FIN|DEF|62|64","Zakarias Ravik|2005|SWE|DEF|57|63","Sodiq Lawal|2008|NGA|DEF|56|68","Achraf Dari|1999|MAR|DEF|66|67","Lars Saetra|1991|NOR|DEF|62|62","Aboubacar Keita|2000|USA|DEF|60|63","Melker Hallberg|1996|SWE|MEI|65|65","Vilmer Tyren|2006|SWE|MEI|56|64","Nassef Chourak|2004|NED|MEI|62|68","Marius Soderback|2004|FIN|MEI|62|68","Carl Gustafsson|2000|SWE|MEI|62|63","Abdussalam Magashy|1998|NGA|MEI|64|64","Robert Gojani|1993|SWE|MEI|62|62","Malcolm Stolt|2001|SWE|ATA|63|65","Anthony Olusanya|2000|FIN|ATA|62|63","Charles Sagoe Jr|2004|ENG|ATA|64|72","Abdi Sabriye|2005|SWE|ATA|55|63","Emeka Nnamani|2002|DEN|ATA|60|63"]],
    ["halmstads_bk","Halmstads BK","Halmstad",62,62,[
      "Tim Ronning|1994|SWE|GOL|62|62","Gabriel Wallentin|1997|SWE|DEF|60|60","Filip Schyberg|1998|SWE|DEF|60|61","Pascal Gregor|1999|DEN|DEF|61|62","Gustav Friberg|2000|SWE|DEF|58|60","Erko Jonne Tougjas|2000|EST|DEF|59|60","Andre Boman|1999|SWE|DEF|58|58","Rami Kaib|2000|TUN|DEF|60|61","Joel Allansson|1991|SWE|MEI|62|62","Niilo Maenpaa|1997|FIN|MEI|63|63","Hussein Carneil|1999|SWE|MEI|64|64","Oliver Kapsimalis|2005|SWE|MEI|58|64","Aleksander Damnjanovic Nilsson|2004|SWE|MEI|57|63","Rocco Ascone|1996|FRA|MEI|62|62","Iddrisu Moro|2004|GHA|MEI|58|63","Omar Faraj|2000|PLE|ATA|62|63","Ludvig Arvidsson|2001|SWE|ATA|60|62","Malte Persson|2003|SWE|ATA|58|62","Marvin Illary|2000|CIV|ATA|61|62","Joel Nilsson|2000|SWE|ATA|58|59","Jesper Westermark|2005|SWE|ATA|55|62"]],
    ["orgryte_is","Orgryte IS","Orgryte",60,60,[
      "Mathias Nilsson|1999|SWE|GOL|62|62","Alex Rahm|2003|SWE|GOL|55|59","Hampus Gustafsson|2001|SWE|GOL|55|58","Jonathan Azulay|1993|SWE|DEF|60|60","Christoffer Styffe|2001|SWE|DEF|60|62","Mikael Dyrestam|1992|GUI|DEF|60|60","Hampus Dahlqvist|1997|SWE|DEF|58|58","Adam Andersson|1997|SWE|DEF|58|58","William Svensson|2002|SWE|DEF|57|59","Johan Hammar|1994|SWE|DEF|58|58","Sebastian Lagerlund|2002|SWE|DEF|58|60","Michael Parker|2005|ENG|DEF|57|62","Marlon Ebietomere|2010|SWE|DEF|50|64","Anton Andreasson|1993|SWE|MEI|56|56","Charlie Vindehall|1996|SWE|MEI|60|60","Benjamin Laturnus|2004|CAN|MEI|60|65","William Kenndal|1996|SWE|MEI|58|58","Owen Parker-Price|1999|NZL|MEI|62|62","Aydarus Abukar|2000|SOM|MEI|58|59","Liam Filip Andersson|2003|SWE|ATA|58|61","Rasmus Alm|1995|SWE|ATA|61|61","David Obou|2007|ENG|ATA|58|68","Daniel Paulson|1995|SWE|ATA|61|61","Jerome Tibbling Ugwo|1999|NGA|ATA|59|60","William Hofvander|2002|SWE|ATA|58|60","Tobias Sana|1989|SWE|ATA|58|58","Viktor Ekblom|1998|SWE|ATA|60|60"]],
    ["degerfors_if","Degerfors IF","Degerfors",61,61,[
      "Wille Jakobsson|2002|SWE|GOL|60|62","Rasmus Forsell|2002|SWE|GOL|54|58","Matvei Igonen|1996|EST|GOL|58|58","Mamadouba Diaby|2003|MLI|DEF|58|62","Nikolai Skuseth|2004|NOR|DEF|60|65","Juhani Pikkarainen|1998|FIN|DEF|60|60","Daniel Sundgren|1991|SWE|DEF|62|62","Sebastian Ohlsson|1993|SWE|DEF|60|60","Christoffer Ohlsson|1993|SWE|MEI|58|58","Erik Lindell|2000|SWE|DEF|56|57","Nasiru Moro|1996|GHA|DEF|58|58","Samba Diatara|2005|SEN|DEF|58|64","Jesus Hernandez|2004|ESP|DEF|58|62","Kazper Karlsson|2005|SWE|MEI|58|66","Bilal Hussein|2000|SWE|MEI|60|61","Yiriyon Gideon|2003|GHA|MEI|56|60","Ludvig Fritzson|1995|SWE|MEI|60|60","Alexander Lindgren|2003|SWE|MEI|55|60","Elias Barsoum|2002|SWE|MEI|60|62","Alexander Berisson|2002|SWE|MEI|56|60","Nahom Netabay|1994|ERI|MEI|58|58","Robin Dzabic|2001|SWE|MEI|60|62","Dijan Vukojevic|1995|SWE|ATA|62|62","Arman Taranis|2001|DEN|ATA|59|61","Olle Leonardsson|2005|SWE|ATA|54|60","Ziyad Salifu|2005|GHA|ATA|56|62"]],
    ["vasteras_sk","Vasteras SK","Vasteras",60,60,[
      "Anton Fagerstrom|1992|SWE|GOL|62|62","Andre Bernardini|1996|BRA|GOL|58|58","Elis Jager|2005|SWE|GOL|55|60","Herman Magnusson|1998|SWE|DEF|60|60","Marcus Baggesen|2003|DEN|DEF|58|61","Philip Bonde|2004|SWE|DEF|58|62","Frederic Nsabiyumva|1995|BDI|DEF|58|58","Victor Wernersson|1995|SWE|DEF|56|56","Peter Amoran|2004|SWE|DEF|58|62","Jack Tagesson|2006|SWE|DEF|56|63","Madiou Keita|2004|GUI|DEF|58|62","Jonathan Karlsson|2004|SWE|DEF|56|62","Leonardo Bark|2005|SWE|DEF|54|60","Melvin Ljungqvist|2008|SWE|DEF|52|64","Karl Gunnarsson|2005|SWE|MEI|56|60","Mamadou Diagne|2003|SEN|MEI|60|63","Jonathan Ring|1992|SWE|MEI|58|58","Simon Gefvert|1997|SWE|MEI|60|60","Ismet Lushaku|2000|KOS|MEI|60|61","Jens Magnusson|2005|SWE|MEI|58|62","Mattias Hellisdal|2006|FRO|MEI|58|64","Levi Hansas|2010|SWE|MEI|50|64","Musab Abdi Mohamud|2007|SWE|MEI|52|62","Axel Taonsa|2004|CIV|MEI|58|62","Abdelrahman Boudah|1999|SWE|ATA|62|62","Casper Risbjerg|2008|DEN|ATA|56|68","Bonaventure Lendambi|2006|CGO|ATA|58|68","Moussa Diallo|2005|SEN|ATA|56|62"]]
  ]};
  const registry=root.ProLifeGlobalFootballPacks=root.ProLifeGlobalFootballPacks||[];
  if(!registry.some(item=>item.id===pack.id))registry.push(pack);
  if(typeof module!=="undefined"&&module.exports)module.exports=pack;
})(typeof globalThis!=="undefined"?globalThis:this);
