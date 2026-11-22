// A collection of internationally published books with short Czech descriptions.
const books = [
  ['Bílá nemoc', 'Karel Čapek', 'Česko', 'Záhadná epidemie postihuje zejména starší lidi. Lékař, který najde lék, ho chce využít k zastavení chystané války.'],
  ['Ostře sledované vlaky', 'Bohumil Hrabal', 'Česko', 'Mladý železničář Miloš Hrma pracuje na malém nádraží v posledních měsících okupace. Jeho osobní trápení se protne s odbojem, když stanicí projíždí německé vojenské vlaky.'],
  ['Tisícročná včela', 'Peter Jaroš', 'Slovensko', 'Příběh několika generací rodiny Pichandových z liptovské vesnice. Každodenní život zedníků, včelařů a jejich rodin se prolíná s proměnami světa na přelomu 19. a 20. století.'],
  ['Malý princ', 'Antoine de Saint-Exupéry', 'Francie', 'Pilot po nouzovém přistání v poušti potká cestovatele z malé planetky. Jeho vyprávění o růži, lišce a lidech, které potkal, je krátkou úvahou o přátelství a odpovědnosti.'],
  ['Jméno růže', 'Umberto Eco', 'Itálie', 'Františkán Vilém z Baskervillu v benediktinském opatství vyšetřuje sérii úmrtí. Se žákem Adsonem hledá stopy v knihovně, kam mají přístup jen vyvolení.'],
  ['Neviditelná města', 'Italo Calvino', 'Itálie', 'Marco Polo vypráví Kublajchánovi o městech složených ze vzpomínek, touhy a snů. Z krátkých popisů vyrůstá kniha o tom, jak si místa představujeme a jak na ně vzpomínáme.'],
  ['Don Quijote', 'Miguel de Cervantes', 'Španělsko', 'Nadšený čtenář rytířských románů se sám vydá na cestu za dobrodružstvím. Sancho Panza ho doprovází a s každým dalším střetem se ukazuje, jak odlišně si oba vykládají svět kolem sebe.'],
  ['Stín větru', 'Carlos Ruiz Zafón', 'Španělsko', 'Daniel objeví na barcelonském Hřbitově zapomenutých knih román záhadného autora. Když zjistí, že někdo systematicky ničí jeho výtisky, začne pátrat po spisovatelově minulosti.'],
  ['Slepota', 'José Saramago', 'Portugalsko', 'Městem se šíří náhlá slepota a úřady první nemocné izolují. Ve skupině internovaných zůstává jediná vidící žena a pomáhá ostatním přežít rozpad běžných pravidel.'],
  ['Nekonečný příběh', 'Michael Ende', 'Německo', 'Bastián se ukryje s knihou o zemi Fantázii, kterou pohlcuje Nicota. Brzy zjistí, že jeho vlastní představivost může ovlivnit osud postav, o nichž čte.'],
  ['Zeď', 'Marlen Haushofer', 'Rakousko', 'Žena v horské chatě zjistí, že ji od okolního světa oddělila neviditelná stěna. V zápiscích zachycuje, jak se učí přežít sama se zvířaty a přizpůsobit život rytmu přírody.'],
  ['Sofiin svět', 'Jostein Gaarder', 'Norsko', 'Sofie dostává záhadné dopisy s otázkami, kdo je a odkud přichází svět. Její výuka dějin filozofie se změní v pátrání po tom, kdo vlastně píše její příběh.'],
  ['Pipi Dlouhá punčocha', 'Astrid Lindgrenová', 'Švédsko', 'Do vily Viktorky se nastěhuje neobyčejně silná dívka bez rodičovského dozoru. Se sousedy Tommym a Annikou zažívá dobrodružství, při nichž pravidla dospělých berou za své.'],
  ['Kometen kommer', 'Tove Janssonová', 'Finsko', 'K údolí mumínků se blíží kometa. Mumínek a Čenich se vydají k observatoři, aby zjistili, co nebezpečí znamená pro jejich domov.'],
  ['Běguni', 'Olga Tokarczuková', 'Polsko', 'Krátké příběhy o cestování, lidském těle a předmětech z anatomických sbírek se střídají s úvahami vypravěčky. Knihu spojuje otázka, co lidi nutí být stále v pohybu.'],
  ['Solaris', 'Stanisław Lem', 'Polsko', 'Psycholog Kris Kelvin přilétá na stanici nad planetou pokrytou živým oceánem. Pokusy porozumět cizí inteligenci se obrátí k posádce, když na stanici začnou přicházet návštěvníci z jejích vzpomínek.'],
  ['Vorošilovgrad', 'Serhij Žadan', 'Ukrajina', 'Herman se vrací do rodného kraje, aby se postaral o benzinovou pumpu zmizelého bratra. Obrana pumpy ho znovu spojí s přáteli a s místem, od něhož se kdysi odstřihl.'],
  ['Mistr a Markétka', 'Michail Bulgakov', 'Rusko', 'Příchod ďábla a jeho družiny rozvrátí život moskevské literární společnosti. Satira se prolíná s láskou Markétky k Mistrovi a s jeho příběhem o Pilátu Pontském.'],
  ['Dubliňané', 'James Joyce', 'Irsko', 'Obyčejné návštěvy, první lásky a rodinné oslavy v Dublinu odhalují okamžiky, kdy postavy pochopí něco nepohodlného o svém životě. Sbírku uzavírá povídka Mrtví.'],
  ['Pýcha a předsudek', 'Jane Austenová', 'Spojené království', 'Elizabeth Bennetová si o panu Darcym udělá názor dřív, než ho skutečně pozná. Jejich postupné sbližování provází vtipný pohled na rodinu, majetek a sňatkové vyhlídky.'],
  ['Frankenstein', 'Mary Shelleyová', 'Spojené království', 'Viktor Frankenstein stvoří živou bytost a vzápětí ji opustí. Tvorovo osamění a vědcův strach roztočí příběh o důsledcích lidské ctižádosti.'],
  ['Řek Zorba', 'Nikos Kazantzakis', 'Řecko', 'Vypravěč se vydá na Krétu provozovat důl a najme si Alexise Zorbu. Společná práce postaví knihomolského vypravěče před člověka, který bere život bez dlouhého rozmýšlení.'],
  ['Independent People', 'Halldór Laxness', 'Island', 'Ovčák Bjartur si po dlouhých letech služby pořídí vlastní hospodářství. Tvrdohlavé trvání na nezávislosti určuje život jeho rodiny v drsném islandském kraji.'],
  ['Svět se rozpadá', 'Chinua Achebe', 'Nigérie', 'Vážený bojovník Okonkwo se snaží udržet postavení v igboské vesnici. Její zavedený řád promění příchod misionářů a koloniální správy.'],
  ['Amerikána', 'Chimamanda Ngozi Adichie', 'Nigérie', 'Ifemelu odjede z Nigérie studovat do Spojených států, zatímco její přítel Obinze hledá cestu do Británie. Po letech se jejich příběhy znovu spojí v Lagosu.'],
  ['Petals of Blood', 'Ngũgĩ wa Thiong’o', 'Keňa', 'Vyšetřování smrtícího požáru odkrývá společnou minulost čtyř obyvatel vesnice. Na proměně jejich domova román ukazuje, kdo po získání nezávislosti vytěžil z modernizace nejvíc.'],
  ['Season of Migration to the North', 'Tayeb Salih', 'Súdán', 'Muž po studiích v Evropě přijede do vesnice na Nilu a setká se s tajemným Mustafou Saídem. Jeho příběh z Londýna přiměje vypravěče znovu přemýšlet o vlastní zkušenosti s Evropou.'],
  ['Život a doba Michaela K.', 'J. M. Coetzee', 'Jihoafrická republika', 'Zahradník Michael veze nemocnou matku z Kapského Města do jejího rodného kraje. V zemi zasažené občanskou válkou pak hledá místo, kde by mohl sám pěstovat jídlo.'],
  ['Nervous Conditions', 'Tsitsi Dangarembga', 'Zimbabwe', 'Dívka Tambu získá možnost studovat na misijní škole, když se v rodině uvolní místo. Přátelství se sestřenicí Nyashou jí ukáže, jakou cenu může mít vzdělání v koloniální Rhodesii.'],
  ['So Long a Letter', 'Mariama Bâ', 'Senegal', 'Ramatoulaye po smrti manžela píše dlouhý dopis přítelkyni, s níž sdílí vzpomínky na manželství a mateřství. Z intimního svědectví vystupují rozdílné možnosti, jaké mají ženy v její společnosti.'],
  ['The Shadow King', 'Maaza Mengiste', 'Etiopie', 'Při italské invazi do Etiopie se osiřelá Hirut přidá k odporu. Román se soustředí na ženy, které bojovaly a jejichž příběhy se z oficiálních dějin často vytratily.'],
  ['Terra sonâmbula', 'Mia Couto', 'Mosambik', 'Chlapec Muidinga se starým Tuahirem najdou útočiště ve vyhořelém autobuse. Deníky, které tam čtou, jim během občanské války otevírají jiný příběh o domově a putování.'],
  ['Midaq Alley', 'Nagíb Mahfúz', 'Egypt', 'Obyvatelé jedné káhirské uličky během druhé světové války sní o lepším životě. Ambiciózní Hamída chce z uzavřeného sousedství odejít a její rozhodnutí zasáhne několik zdejších rodin.'],
  ['Kokoro', 'Nacume Sóseki', 'Japonsko', 'Mladý student se spřátelí s uzavřeným mužem, kterého oslovuje Sensei. Teprve jeho dopis vysvětlí, jak ho dávné přátelství a vina přivedly k osamělému životu.'],
  ['Convenience Store Woman', 'Sayaka Murata', 'Japonsko', 'Keiko nachází jistotu v přesném rytmu práce v tokijské samoobsluze. Její okolí ale očekává, že si najde jinou kariéru nebo partnera, a ona hledá způsob, jak s tím naložit.'],
  ['Vegetariánka', 'Han Kang', 'Jižní Korea', 'Po znepokojivých snech se Jonghje vzdá masa. Její rozhodnutí naruší rodinné vztahy a trojice vypravěčů poodhalí, jak se okolí snaží získat kontrolu nad jejím životem.'],
  ['Žít', 'Jü Chua', 'Čína', 'Fuguej prohraje rodinné jmění a musí se naučit žít z práce vlastních rukou. Osudy jeho blízkých odkrývají dopad velkých politických převratů na jednu čínskou rodinu.'],
  ['Problém tří těles', 'Liou Cch’-sin', 'Čína', 'Podivné úkazy kolem výzkumu nanomateriálů přivedou vědce k záhadné počítačové hře. Stopy vedou až k tajnému projektu z doby kulturní revoluce a k možnosti mimozemského kontaktu.'],
  ['The Man with the Compound Eyes', 'Wu Ming-yi', 'Tchaj-wan', 'U tchajwanského pobřeží se střetnou osudy spisovatelky a chlapce z odlehlého ostrova. Příběh propojuje osobní ztrátu s proměnami oceánu a ostrovního života.'],
  ['The Sorrow of War', 'Bảo Ninh', 'Vietnam', 'Válečný veterán Kiên se snaží zaznamenat minulost, která se mu vrací v útržcích. Vzpomínky na boje se mísí s příběhem jeho lásky a s obtížným návratem k civilnímu životu.'],
  ['The Rainbow Troops', 'Andrea Hirata', 'Indonésie', 'Na ostrově Belitung se skupinka dětí snaží udržet maličkou školu otevřenou. Jejich učitelé jim pomáhají rozvíjet schopnosti navzdory chudobě a převaze bohatších škol.'],
  ['Bůh maličkostí', 'Arundhati Royová', 'Indie', 'Dvojčata Estha a Rahel se po letech setkají v Kérale, kde jejich rodinu poznamenala tragédie. Román skládá její příčiny z dětských vzpomínek, dávných křivd a společenských pravidel.'],
  ['Půlnoční děti', 'Salman Rushdie', 'Indie', 'Salím Sináí se narodí v okamžiku, kdy Indie získá nezávislost. Jeho nadpřirozené schopnosti propojí rodinné vyprávění s osudy dalších dětí narozených téže noci.'],
  ['Persepolis', 'Marjane Satrapi', 'Írán', 'V autobiografickém komiksu vyrůstá Marjane v Teheránu během revoluce a války. Černobílé kresby sledují, jak si v Íránu i v emigraci hledá vlastní způsob života.'],
  ['Muži na slunci', 'Ghassán Kanafání', 'Palestina', 'Tři palestinští uprchlíci se snaží dostat přes poušť za prací do Kuvajtu. Spoléhají na převaděče, jehož nákladní vůz jim má pomoci projet přes hraniční kontroly.'],
  ['Jmenuji se Červená', 'Orhan Pamuk', 'Turecko', 'V osmanském Istanbulu pracují miniaturisté na knize pro sultána, když jednoho z nich někdo zavraždí. K případu se vyjadřují střídající se vypravěči, včetně obrazu i samotné barvy.'],
  ['Příběh lásky a tmy', 'Amos Oz', 'Izrael', 'Autor se ohlíží za dětstvím v Jeruzalémě a za osudem své matky. Rodinné vzpomínky prokládá příběhy příbuzných, kteří přišli do města z Evropy.'],
  ['Anna ze Zeleného domu', 'Lucy Maud Montgomeryová', 'Kanada', 'Sourozenci Cuthbertovi chtějí chlapce na výpomoc, ale místo něj přijede upovídaná Anna Shirleyová. Díky představivosti a odhodlání si postupně najde místo v nové rodině i v okolní obci.'],
  ['Příběh služebnice', 'Margaret Atwoodová', 'Kanada', 'V republice Gileád přidělí Offred do domácnosti velitele, kde má porodit dítě. Ve vyprávění si uchovává vzpomínky na dřívější život a hledá drobné možnosti vzdoru.'],
  ['Milovaná', 'Toni Morrisonová', 'USA', 'Sethe unikla z otroctví a žije s dcerou v domě, který poznamenala smrt dítěte. Příchod mladé ženy jménem Milovaná vrátí rodinu k minulosti, již se snažila uzavřít.'],
  ['Podobenství o rozsévači', 'Octavia E. Butlerová', 'USA', 'Lauren vyrůstá v Kalifornii, kde se kvůli chudobě a násilí hroutí zavedený způsob života. Když se její čtvrť rozpadne, vydá se na sever a na cestě formuluje učení o změně.'],
  ['Stařec a moře', 'Ernest Hemingway', 'USA', 'Rybář Santiago po dlouhé sérii neúspěchů vypluje daleko od břehu a chytí obrovského marlína. Zápas o úlovek prověří jeho sílu, zkušenost i vztah k moři.'],
  ['Hrozny hněvu', 'John Steinbeck', 'USA', 'Rodina Joadových po ztrátě farmy putuje z Oklahomy za prací do Kalifornie. Naději na nový začátek tam vystřídá zkušenost s životem sezónních dělníků.'],
  ['Pedro Páramo', 'Juan Rulfo', 'Mexiko', 'Juan Preciado podle slibu matce hledá otce v zapadlé vesnici Comala. Hlasy jejích obyvatel postupně skládají příběh místního statkáře a následků jeho moci.'],
  ['Como agua para chocolate', 'Laura Esquivel', 'Mexiko', 'Tita podle rodinné tradice nesmí opustit matku a provdat se za muže, kterého miluje. Pocity, jež nemůže vyslovit, předává druhým prostřednictvím jídel.'],
  ['Sto roků samoty', 'Gabriel García Márquez', 'Kolumbie', 'Rod Buendíů prožívá vzestup a úpadek městečka Macondo. V příbězích jeho generací se všední život prolíná s neobyčejnými jevy, válkou i rodinnými tajemstvími.'],
  ['Alchymista', 'Paulo Coelho', 'Brazílie', 'Mladý pastýř Santiago opustí Španělsko a hledá poklad, o němž se mu zdálo. Setkání v severní Africe ho vedou k otázce, jak poznat, které sny stojí za následování.'],
  ['Memórias póstumas de Brás Cubas', 'Machado de Assis', 'Brazílie', 'Brás Cubas začne psát vzpomínky až po smrti. S odstupem a ironií rekapituluje své milostné poměry, nenaplněné ambice i pohodlný život v brazilské vyšší společnosti.'],
  ['Morelův vynález', 'Adolfo Bioy Casares', 'Argentina', 'Uprchlík na ostrově pozoruje společnost, která si jeho přítomnosti nevšímá. Když se některé události začnou opakovat, pátrá po jejich spojení s vynálezcem Morelem.'],
  ['Nebe, peklo, ráj', 'Julio Cortázar', 'Argentina', 'Horacio Oliveira hledá blízkost a smysl mezi přáteli v Paříži a po návratu v Buenos Aires. Knihu lze číst po pořádku nebo po kapitolách přeskakovat podle autorova návodu.'],
  ['Dům duchů', 'Isabel Allendeová', 'Chile', 'Generace rodiny Truebových spojují lásky, spory a neobvyklá schopnost Clary rozmlouvat s duchy. Dění v rodině postupně zasáhne i politický převrat.'],
  ['Město a psi', 'Mario Vargas Llosa', 'Peru', 'Na vojenském učilišti v Limě se kadeti učí přežít ve světě šikany a pevných hierarchií. Krádež zadání zkoušky spustí události, které odhalí fungování celé instituce.'],
  ['El reino de este mundo', 'Alejo Carpentier', 'Kuba', 'Z pohledu Ti Noëla se příběh vrací k povstání zotročených obyvatel Haiti a k počátkům nezávislého státu. Historické události prostupují představy, které jejich aktérům pomáhají světu rozumět.'],
  ['A Brief History of Seven Killings', 'Marlon James', 'Jamajka', 'Pokus o atentát na Boba Marleyho v roce 1976 se stává středem příběhu mnoha vypravěčů. Román dohledává jeho ozvěny v jamajské politice, pouličním násilí i za hranicemi ostrova.'],
  ['Breath, Eyes, Memory', 'Edwidge Danticat', 'Haiti', 'Sophie opustí tetu na Haiti a přestěhuje se za matkou do New Yorku. Pozdější návrat na ostrov jí pomůže porozumět bolestným zkušenostem žen ve vlastní rodině.'],
  ['The Bone People', 'Keri Hulme', 'Nový Zéland', 'Do osamělého života umělkyně Kerewin zasáhne chlapec, který nemluví, a jeho pěstoun Joe. Jejich neobvyklé pouto přináší blízkost i nutnost postavit se násilí.'],
  ['Cloudstreet', 'Tim Winton', 'Austrálie', 'Dvě velmi odlišné rodiny sdílejí velký dům v Perthu. Po dvě desetiletí se jejich všední život, ztráty a oslavy prolínají pod jednou střechou.'],
  ['Picnic at Hanging Rock', 'Joan Lindsay', 'Austrálie', 'Při školním výletu k skalnímu útvaru Hanging Rock beze stopy zmizí několik účastnic. Následné pátrání rozvrátí život internátní školy i lidí z jejího okolí.'],
  ['Where We Once Belonged', 'Sia Figiel', 'Samoa', 'Dospívající Alofa vypráví o kamarádkách, rodině a školních dnech v samojské vesnici. Epizody ukazují, jak objevuje vlastní hlas mezi různými představami o tom, čím má být.']
];

const pragueDate = new Intl.DateTimeFormat('en', {
  timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit'
});
const dateLabel = new Intl.DateTimeFormat('cs-CZ', { timeZone: 'Europe/Prague', dateStyle: 'full' });
const dayMs = 24 * 60 * 60 * 1000;

function shuffleForCycle(cycle) {
  const shuffled = books.slice();
  let seed = cycle;
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Mulberry32 gives every date the same reproducible draw on either site.
    seed = (seed + 0x6d2b79f5) | 0;
    let random = Math.imul(seed ^ (seed >>> 15), seed | 1);
    random ^= random + Math.imul(random ^ (random >>> 7), random | 61);
    const index = Math.floor((((random ^ (random >>> 14)) >>> 0) / 4294967296) * (i + 1));
    [shuffled[i], shuffled[index]] = [shuffled[index], shuffled[i]];
  }
  return shuffled;
}

export function getDailyBook(now = new Date()) {
  const parts = Object.fromEntries(pragueDate.formatToParts(now).map(({ type, value }) => [type, value]));
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const day = Date.parse(`${date}T00:00:00Z`) / dayMs;
  const cycle = Math.floor(day / books.length);
  const position = day - cycle * books.length;
  const shuffled = shuffleForCycle(cycle);
  if (position < 2 && shuffled[0] === shuffleForCycle(cycle - 1).at(-1)) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  const [title, author, country, description] = shuffled[position];
  return { date, dateLabel: dateLabel.format(now), title, author, country, description };
}
