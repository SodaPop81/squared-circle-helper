import type { TerritoryId, PinMode, MoveLetter, Move, Wrestler, TagTeamTemplate, Manager } from './types';

export const venueCatalog:Record<TerritoryId,{name:string; city:string; note?:string}[]> = {
 crockett1986: [
  {name:'Greensboro Coliseum', city:'Greensboro, NC'},
  {name:'Charlotte Coliseum', city:'Charlotte, NC'},
  {name:'The Omni', city:'Atlanta, GA'},
  {name:'Dorton Arena', city:'Raleigh, NC'},
  {name:'Norfolk Scope', city:'Norfolk, VA'},
  {name:'Richmond Coliseum', city:'Richmond, VA'},
  {name:'Baltimore Civic Center', city:'Baltimore, MD'},
  {name:'Asheville Civic Center', city:'Asheville, NC'},
  {name:'Roanoke Civic Center', city:'Roanoke, VA'},
  {name:'Township Auditorium', city:'Columbia, SC'},
  {name:'Greenville Memorial Auditorium', city:'Greenville, SC'},
  {name:'Spartanburg Memorial Auditorium', city:'Spartanburg, SC'},
  {name:'Winston-Salem Memorial Coliseum', city:'Winston-Salem, NC'},
  {name:'Hampton Coliseum', city:'Hampton, VA'},
  {name:'Charleston Civic Center', city:'Charleston, WV'},
  {name:'Cincinnati Gardens', city:'Cincinnati, OH'},
  {name:'Augusta-Richmond County Civic Center', city:'Augusta, GA'},
  {name:'Macon Coliseum', city:'Macon, GA'}
 ],
 wwf1985_90: [
  {name:'Madison Square Garden', city:'New York, NY'},
  {name:'Boston Garden', city:'Boston, MA'},
  {name:'Philadelphia Spectrum', city:'Philadelphia, PA'},
  {name:'Maple Leaf Gardens', city:'Toronto, ON'},
  {name:'Kiel Auditorium', city:'St. Louis, MO'},
  {name:'Los Angeles Sports Arena', city:'Los Angeles, CA'},
  {name:'Nassau Veterans Memorial Coliseum', city:'Uniondale, NY'},
  {name:'Brendan Byrne Arena', city:'East Rutherford, NJ'},
  {name:'Rosemont Horizon', city:'Rosemont, IL'},
  {name:'Joe Louis Arena', city:'Detroit, MI'},
  {name:'Capital Centre', city:'Landover, MD'},
  {name:'Providence Civic Center', city:'Providence, RI'},
  {name:'Hartford Civic Center', city:'Hartford, CT'},
  {name:'Civic Arena', city:'Pittsburgh, PA'},
  {name:'Richfield Coliseum', city:'Richfield, OH'},
  {name:'Market Square Arena', city:'Indianapolis, IN'},
  {name:'Milwaukee MECCA Arena', city:'Milwaukee, WI'},
  {name:'San Diego Sports Arena', city:'San Diego, CA'},
  {name:'Cow Palace', city:'Daly City, CA'},
  {name:'Oakland-Alameda County Coliseum Arena', city:'Oakland, CA'},
  {name:'The Omni', city:'Atlanta, GA'},
  {name:'Show-Me Center', city:'Cape Girardeau, MO'}
 ],
 combined: []
};
venueCatalog.combined = [...venueCatalog.wwf1985_90, ...venueCatalog.crockett1986]
 .filter((v,i,arr)=>arr.findIndex(x=>x.name===v.name && x.city===v.city)===i)
 .sort((a,b)=>a.name.localeCompare(b.name));

export const territories = [
 {id:'crockett1986' as TerritoryId, name:'1986 Crockett Mid-Atlantic', note:'Southern grit, title chases, blood feuds, and studio-era chaos.'},
 {id:'wwf1985_90' as TerritoryId, name:'1985–90 WWF / New York', note:'Hulkamania, Macho Madness, blue cages, Rumbles, and big-arena spectacle.'},
 {id:'combined' as TerritoryId, name:'Combined Universe', note:'Cross-territory dream matches using compatible Power Point totals.'}
];

export const pinCharts:Record<PinMode, Record<MoveLetter, Record<string,[number,number,number]>>> = {
 standard:{
  A:{'0':[1,16,93],'1':[1,14,85],'2':[1,14,82],'3':[1,12,74],'4':[1,6,53],'5':[1,2,43],'-50':[1,2,10],'-100':[1,1,2]},
  B:{'0':[1,21,95],'1':[1,18,89],'2':[1,18,86],'3':[1,16,77],'4':[1,6,65],'5':[1,2,55],'-50':[1,2,13],'-100':[1,1,3]},
  C:{'0':[6,26,96],'1':[6,23,91],'2':[6,23,88],'3':[6,20,83],'4':[1,11,74],'5':[1,7,64],'-50':[1,2,16],'-100':[1,1,4]},
  D:{'0':[6,31,98],'1':[6,28,93],'2':[6,28,91],'3':[6,25,87],'4':[1,11,80],'5':[1,7,70],'-50':[1,2,19],'-100':[1,1,5]},
  E:{'0':[11,36,99],'1':[11,31,97],'2':[11,31,96],'3':[11,28,90],'4':[1,16,84],'5':[1,12,74],'-50':[1,3,22],'-100':[1,1,8]}
 },
 optionB:{
  A:{'0':[1,13,84],'1':[1,11,72],'2':[1,11,66],'3':[1,10,59],'4':[1,5,42],'5':[1,2,34],'-50':[100,100,100],'-100':[100,100,100]},
  B:{'0':[1,17,86],'1':[1,14,75],'2':[1,14,69],'3':[1,13,62],'4':[1,5,52],'5':[1,2,44],'-50':[1,1,10],'-100':[100,100,100]},
  C:{'0':[5,21,87],'1':[5,18,77],'2':[5,18,70],'3':[5,16,66],'4':[1,9,59],'5':[1,6,51],'-50':[1,2,13],'-100':[1,1,3]},
  D:{'0':[5,25,88],'1':[5,22,78],'2':[5,22,73],'3':[5,20,70],'4':[1,9,64],'5':[1,6,56],'-50':[1,2,15],'-100':[1,1,4]},
  E:{'0':[9,29,95],'1':[9,25,92],'2':[9,25,91],'3':[9,22,85],'4':[1,13,79],'5':[1,10,69],'-50':[1,2,17],'-100':[1,1,5]}
 }
};

export const genericMoves = (name:string, finisher:string):Move[] => [
 {from:1,to:14,name:'Punches and Kicks',bonus:8}, {from:15,to:27,name:'Arm Wringer',bonus:10},
 {from:28,to:39,name:'Body Slam',bonus:15}, {from:40,to:51,name:'Back Elbow',bonus:12},
 {from:52,to:62,name:'Suplex',bonus:22,letter:'C',pin:'setup'}, {from:63,to:72,name:'Clothesline',bonus:24,letter:'D',pin:'setup'},
 {from:73,to:82,name:'Backbreaker',bonus:27,letter:'C',pin:'setup'}, {from:83,to:91,name:'Signature Rally',bonus:30,letter:'B',pin:'setup'},
 {from:92,to:100,name:finisher || `${name} Finisher`,bonus:46,letter:'A',pin:'auto'}
];


const crockettSeed:[number,string,number,string,string,number][] = [
 [1,'Ric Flair',1000,'Heel A','Figure Four Leglock',14],
 [2,'Dusty Rhodes',850,'Face A','Bionic Elbow',13],
 [3,'Nikita Koloff',800,'Heel B','Russian Sickle',8],
 [4,'Magnum T.A.',790,'Face B','Belly-to-Belly Suplex',8],
 [5,'Ron Garvin',760,'Face B','Knock Out Punch / Hands of Stone',6],
 [6,'Barry Windham',750,'Face B','Flying Lariat',6],
 [7,'Wahoo McDaniel',690,'Face B','Chop Drop',9],
 [8,'Arn Anderson',685,'Heel B','Gourd Buster',3],
 [9,'Dick Murdoch',680,'Face/Heel B','Brain Buster',8],
 [10,'Tully Blanchard',670,'Heel B','Slingshot Suplex',3],
 [11,'Hawk',660,'Face B','Clothesline',9],
 [12,'Ricky Morton',650,'Face B','Top Rope High Crossbody',2],
 [13,'Animal',640,'Face B','Clothesline',9],
 [14,'Manny Fernandez',600,'Heel B','Flying Burrito',2],
 [15,'Jimmy Valiant',595,'Face C','Elbow Drop',1],
 [16,'The Barbarian',590,'Heel C','Top Rope Head Butt',8],
 [17,'Jimmy Garvin',585,'Heel C','Brain Buster',1],
 [18,'Black Bart',575,'Heel C','Texas Trash Compactor',4],
 [19,'Ole Anderson',570,'Heel B','Lock in the Armbar',6],
 [20,'Bobby Eaton',565,'Heel B','Alabama Jam',2],
 [21,'The Warlord',500,'Heel C','Power Slam',8],
 [22,'Ivan Koloff',500,'Heel B','Russian Sickle',2],
 [23,'Rick Rude',490,'Heel C','Rude Awakening DDT',2],
 [24,'Khrusher Khrushchev',480,'Heel C','Russian Sickle',5],
 [25,'Robert Gibson',460,'Face B','Figure Four',2],
 [26,'Dennis Condrey',450,'Heel B','Brain Buster',2],
 [27,'Buddy Landel',390,'Heel D','Figure Four',1],
 [28,'Ron Bass',390,'Heel D','Iron Claw',4],
 [29,'Shaska Whatley',370,'Heel D','Superplex',1],
 [30,'Brad Armstrong',350,'Face D','Russian Leg Sweep',1],
 [31,'Sam Houston',340,'Face D','Bulldog',1],
 [32,'Tim Horner',310,'Face D','Roll Up with a Bridge',1],
 [33,'Dutch Mantell',300,'Heel D','2nd Rope Clothesline',2],
 [34,'Don Kernodle',295,'Face D','The Cannon',1],
 [35,'Baron Von Raschke',290,'Heel D','Iron Claw',1],
 [36,'Bill Dundee',280,'Heel D','Top Rope Cannonball',1],
 [37,'Bobby Jaggers',270,'Heel D','Lariat',2],
 [38,'Teijo Khan',270,'Heel D','Power Slam',1],
 [39,'Steve Regal',250,'Heel E','Russian Leg Sweep',1],
 [40,'Hector Guerrero',245,'Face E','Top Rope High Crossbody',1],
 [41,'Nelson Royal',240,'Face E','Small Package',1],
 [42,'Denny Brown',240,'Face E','High Crossbody',1],
 [43,'Mike Jackson',190,'Face F','Dropkick',1],
 [44,'Rocky Kernodle',185,'Face F','Sleeper',0],
 [45,'Todd Champion',170,'Face F','Shoulder Block',0],
 [46,'Rocky King',170,'Face F','Dropkick',0],
 [47,'Italian Stallion',170,'Face F','High Crossbody',0],
 [48,'Joe Coltrane',160,'Heel F','Forearm Smash',0],
 [49,'George South',150,'Heel F','Punch',0],
 [50,'Mitch Snow',150,'Face F','Dropkick',0],
 [51,'Tony Zane',130,'Heel F','Knee Drop',-1],
 [52,'Thunderfoot I',120,'Heel F','Loaded Boot Kick',-1],
 [53,'Bill Mulkey',120,'Face F','Eye Rake',-1],
 [54,'Golden Terror',120,'Heel F','High Crossbody',-1],
 [55,'Thunderfoot II',110,'Heel F','Loaded Boot Kick',-1],
 [56,'Randy Mulkey',110,'Face F','Throw into Turnbuckle',-1],
 [57,'Vernon Deaton',110,'Face F','Shoulder Block',-1],
 [58,'Brodie Chase',110,'Heel F','Punch',-1],
 [59,'Big Bubba Rogers',760,'Heel Special','The Bubba Slam',12],
 [60,'Paul Jones',210,'Manager/Wrestler','Cane Shot',-1],
 [61,'Mac Jeffers',100,'Prelim','Punch',-1],
 [62,'Jim Jeffers',100,'Prelim','Forearm',-1],
 [63,'Grim Reaper',100,'Prelim','Choke',-1]
];
export const crockett:Wrestler[] = crockettSeed.map(([rank,name,pp,qpr,fin,brAdj])=>({id:'c-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name,pp,rank,territory:'crockett1986' as TerritoryId,qpr,style:qpr,brAdj,moves:genericMoves(name,fin)}));

const wwfSeed:[number,string,number,string,string,number][] = [
 [1,'Hulk Hogan',1000,'Face A','Leg Drop',14],[2,'Andre the Giant',875,'Heel A','Giant Splash',15],[3,'Ultimate Warrior',850,'Face A','Warrior Splash',13],[4,'Randy Savage',825,'Heel A','Flying Elbow Drop',12],[5,'Ted DiBiase',780,'Heel B','Million Dollar Dream',9],[6,'Roddy Piper',750,'Face B','Sleeperhold',10],[8,'King Kong Bundy',720,'Heel B','Avalanche Splash',11],[9,'Ricky Steamboat',700,'Face B','Flying Crossbody',8],[10,'Jake Roberts',685,'Face B','DDT',8],[11,'Tito Santana',680,'Face B','Flying Forearm',7],[13,'Greg Valentine',670,'Heel B','Figure Four Leglock',8],[14,'Rick Rude',660,'Heel B','Rude Awakening',8],[18,'Big Bossman',625,'Heel C','Bossman Slam',8],[19,'Jim Duggan',620,'Face C','Three-Point Stance',7],[20,'Honky Tonk Man',615,'Heel C','Shake Rattle and Roll',5],[31,'Jimmy Snuka',565,'Face C','Superfly Splash',6],[37,'Bret Hart',525,'Heel D','Piledriver',6],[39,'Mr. Perfect',520,'Heel D','Perfectplex',6],[43,'Dynamite Kid',515,'Face C','Diving Headbutt',6],[44,'Davey Boy Smith',515,'Face C','Running Powerslam',7],[55,'Koko B. Ware',390,'Face D','Ghostbuster',4],[58,'Shawn Michaels',380,'Face D','Flying Crossbody',5],[63,'Marty Jannetty',360,'Face E','Rocker Dropper',4],[65,'Arn Anderson',360,'Heel B','Spinebuster',7],[69,'Tully Blanchard',350,'Heel B','Slingshot Suplex',6],[120,'Barry Horowitz',120,'Heel F','Pat on the Back Rollup',-1]
];
const wwfExtraSeed:[number,string,number,string,string,number][] = [
 [7,'Big John Studd',725,'Heel B','Back Breaker Submission',13],[12,'Junkyard Dog',675,'Face B','Power Slam',5],[15,'Iron Sheik',640,'Heel B','Camel Clutch',4],[21,'Brutus Beefcake',610,'Heel/Face C','Sleeper',3],[22,'Don Muraco',605,'Heel C','Tombstone Piledriver',4],[23,'Bad News Brown',600,'Heel C','Ghetto Blaster',6],[24,'Akeem',590,'Heel C','747 Big Splash',10],[25,'Nikolai Volkoff',585,'Heel D','Press Slam into Back Breaker',7],[26,'Harley Race',580,'Heel C','Cradle Suplex',5],[27,'Hillbilly Jim',575,'Face D','Bear Hug',7],[29,'Rick Martel',570,'Face/Heel C','Boston Crab',4],[30,'Hercules',565,'Face/Heel C','Full Nelson',6],[32,'Billy Jack Haynes',560,'Face D','Full Nelson',6],[33,'Bam Bam Bigelow',555,'Face D','Slingshot Splash',8],[34,'Bob Orton',540,'Heel D','Superplex',2],[35,'George Steele',535,'Face D','Lifting Hammer Lock',4],[36,'Adrian Adonis',530,'Heel D','Goodnight Irene Sleeper',3],[38,'Dino Bravo',525,'Heel D','Side Suplex',5],[40,'Dusty Rhodes',520,'Face D','Bionic Elbow Drop',7],[41,'Terry Funk',518,'Heel D','Piledriver',6],[42,'Jesse Ventura',517,'Heel D','Body Breaker Submission',3],[45,'Barbarian',510,'Heel D','Top Rope Clothesline',8],[46,'Demolition Smash',480,'Face D','Double Axe Handle x 10',8],[47,'Demolition Ax',480,'Face D','Double Axe Handle x 10',8],[48,'Warlord',450,'Heel D','Power Slam',8],[49,'Jim Neidhart',445,'Heel D','Anvil Shoulder Block',6],[50,'Pedro Morales',430,'Face D','Boston Crab',3],[51,'Ron Bass',425,'Heel D','Texas Gourdbuster',4],[52,'Ivan Putski',420,'Face D','Polish Hammer',5],[53,'Corporal Kirchner',415,'Face D','Fallaway Slam',3],[54,'Uncle Elmer',410,'Face E','Leg Drop',11],[56,'Ron Garvin',385,'Face D','Hands of Stone',4],[57,'Barry Windham',380,'Face D','Flying Lariat',5],[59,'Mike Rotundo',375,'Face D','Airplane Spin',3],[60,'Blue Blazer',370,'Face D','Top Rope Splash',5],[61,'Jim Brunzell',365,'Face D','Dropkick',4],[62,'Jacques Rougeau',365,'Face D','Quebec Crab',3],[64,'Luke Williams',360,'Heel D','Battering Ram',5],[66,'B. Brian Blair',355,'Face D','Sleeper',3],[67,'Tama',355,'Heel D','Top Rope Big Splash',1],[68,'Butch Miller',350,'Heel D','Battering Ram',5],[70,'Danny Spivey',330,'Face D','Bulldog',5],[71,'Butch Reed',325,'Heel D','Flying Shoulder Block',4],[72,'Red Rooster',320,'Face D','Flying Forearm',2],[73,'Tom Zenk',320,'Face D','Missile Dropkick',3],[74,'Raymond Rougeau',320,'Face D','Savate Kick',3],[75,'Outback Jack',315,'Face E','Boomerang Clothesline',4],[76,'Boris Zhukov',315,'Heel E','Russian Sickle',2],[77,'Dory Funk Jr.',312,'Face/Heel D','Spinning Toe Hold',1],[78,'Cousin Luke',310,'Face E','Sit Down Splash',6],[79,'Tom Magee',300,'Face E','Power Slam',5],[80,'Cousin Junior',295,'Face E','Double Mule Kick',6],[81,'Tony Atlas',290,'Face E','Gorilla Press Slam',5],[82,'Lanny Poffo',290,'Face E','Moonsault',3],[83,'Ted Arcidi',275,'Face E','Bear Hug',4],[84,'David Sammartino',270,'Face E','Figure Four',2],[85,'S.D. Jones',265,'Face E','Headbutt',1],[86,'Moondog Spot',265,'Heel E','Bone Shot',2],[87,'Jimmy Jack Funk',260,'Heel E','Bulldog',2],[88,'Scott McGhee',260,'Face E','Dropkick',2],[89,'Rick McGraw',250,'Face E','Small Package',2],[90,'Paul Roma',245,'Face E','Missile Dropkick',3],[91,'Jim Powers',245,'Face E','Dropkick',3],[92,'George Wells',240,'Face F','Shoulder Block',1],[93,'Moondog Rex',240,'Heel F','Bone Shot',2],[94,'Dick Slater',240,'Heel D','Elbow Drop',2],[95,'Brad Rheingans',240,'Face F','German Suplex',1],[96,'Sivi Afi',240,'Face F','Top Rope Splash',2],[97,'Sam Houston',240,'Face E','Bulldog',1],[98,'Danny Davis',240,'Heel E','Schoolboy',0],[99,'Conquistador #1',240,'Heel F','Masked Rollup',0],[100,'Luc Poirier',240,'Heel F','Backbreaker',0],[101,'Conquistador #2',240,'Heel F','Masked Rollup',0],[102,'Tony Parisi',230,'Face F','Airplane Spin',0],[103,'Tim Horner',220,'Face F','Roll Up',1],[104,'Scott Casey',210,'Face F','Bulldog',1],[105,'Steve Lombardi',205,'Heel F','Brooklyn Brawler Punch',0],[106,'Les Thornton',200,'Heel F','European Uppercut',0],[107,'George Skaaland',195,'Face F','Small Package',0],[108,'Angelo Mosca Jr.',190,'Face F','Body Slam',0],[109,'Tony Garea',165,'Face F','Dropkick',0],[110,'Jose Luis Rivera',160,'Face F','Roll Up',0],[111,'Iron Mike Sharpe',160,'Heel F','Loaded Forearm',0],[112,'Tiger Chung Lee',150,'Heel F','Karate Thrust',0],[113,'Rene Goulet',150,'Heel F','Claw Hold',0],[114,'Terry Gibbs',140,'Heel F','Elbow Drop',0],[115,'Steve Gatorwolf',140,'Face F','Tomahawk Chop',0],[116,'Salvatore Bellomo',130,'Face F','Flying Crossbody',0],[117,'Ron Shaw',130,'Heel F','Punch',0],[118,'Jerry Allen',130,'Face F','Dropkick',0],[119,'Barry O',130,'Heel F','Neckbreaker',0],[121,'The Executioner',120,'Heel G','Masked Stomp',0],[122,'Pete Doherty',120,'Heel G','Punch',0],[123,'Mr. X',110,'Heel G','Masked Rollup',0],[124,'The Gladiator',110,'Heel G','Forearm',0],[125,'The Red Demon',110,'Heel G','Masked Punch',0],[126,'Omar Atlas',100,'Face G','Shoulder Block',0],[127,'A.J. Petruzzi',100,'Heel G','Punch',0],[128,'Charlie Fulton',100,'Heel G','Forearm',0],[129,'Rusty Brooks',100,'Heel G','Splash',0],[130,'Carl Fury',100,'Heel G','Punch',0],[131,'Dusty Wolfe',100,'Heel G','Neckbreaker',0]
];
export const wwf = [...wwfSeed, ...wwfExtraSeed].map(([rank,name,pp,qpr,fin,brAdj])=>({id:'w-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name,pp,rank,territory:'wwf1985_90' as TerritoryId,qpr,style:qpr,brAdj,moves:genericMoves(name,fin)}));
export const allWrestlers = [...crockett,...wwf];

export const officialTagTeams:TagTeamTemplate[] = [
 // 1986 Crockett Mid-Atlantic official teams from the book tag-team section/rankings.
 {id:'c-rock-roll-express',name:'Rock and Roll Express',members:['c-ricky-morton','c-robert-gibson'],territory:'crockett1986',finisher:'Double Drop Kick',rating:'A',rankingPoints:500},
 {id:'c-midnight-express',name:'Midnight Express',members:['c-bobby-eaton','c-dennis-condrey'],territory:'crockett1986',finisher:'Rocket Launcher',rating:'A',rankingPoints:470},
 {id:'c-road-warriors',name:'Road Warriors',members:['c-hawk','c-animal'],territory:'crockett1986',finisher:'2nd Rope Power Slam / Doomsday Device',rating:'B',rankingPoints:460},
 {id:'c-andersons',name:'The Andersons',members:['c-arn-anderson','c-ole-anderson'],territory:'crockett1986',finisher:'Top Rope Knee to Arm',rating:'A',rankingPoints:430},
 {id:'c-rude-fernandez',name:'Rick Rude & Manny Fernandez',members:['c-rick-rude','c-manny-fernandez'],territory:'crockett1986',finisher:'2nd Rope Reverse Burrito Combo',rating:'B',rankingPoints:410},
 {id:'c-russians-ivan-nikita',name:'The Russians — Ivan & Nikita Koloff',members:['c-ivan-koloff','c-nikita-koloff'],territory:'crockett1986',finisher:'Top Rope Russian Sickle',rating:'A',rankingPoints:405,note:'Russians sheet applies to any Ivan/Nikita/Khrusher combination.'},
 {id:'c-russians-ivan-khrusher',name:'The Russians — Ivan Koloff & Khrusher Khrushchev',members:['c-ivan-koloff','c-khrusher-khrushchev'],territory:'crockett1986',finisher:'Top Rope Russian Sickle',rating:'A',rankingPoints:405,note:'U.S. Tag Tournament championship combination.'},
 {id:'c-russians-nikita-khrusher',name:'The Russians — Nikita Koloff & Khrusher Khrushchev',members:['c-nikita-koloff','c-khrusher-khrushchev'],territory:'crockett1986',finisher:'Russian Sickle with Chain',rating:'A',rankingPoints:405},
 {id:'c-horsemen-flair-tully',name:'Four Horsemen — Flair & Tully',members:['c-ric-flair','c-tully-blanchard'],territory:'crockett1986',finisher:'Horsemen Double-Team Finish',rating:'B',rankingPoints:400},
 {id:'c-horsemen-flair-arn',name:'Four Horsemen — Flair & Arn',members:['c-ric-flair','c-arn-anderson'],territory:'crockett1986',finisher:'Horsemen Double-Team Finish',rating:'B',rankingPoints:400},
 {id:'c-horsemen-flair-ole',name:'Four Horsemen — Flair & Ole',members:['c-ric-flair','c-ole-anderson'],territory:'crockett1986',finisher:'Horsemen Double-Team Finish',rating:'B',rankingPoints:400},
 {id:'c-horsemen-tully-arn',name:'Four Horsemen — Tully & Arn',members:['c-tully-blanchard','c-arn-anderson'],territory:'crockett1986',finisher:'Horsemen Double-Team Finish',rating:'B',rankingPoints:400},
 {id:'c-horsemen-tully-ole',name:'Four Horsemen — Tully & Ole',members:['c-tully-blanchard','c-ole-anderson'],territory:'crockett1986',finisher:'Horsemen Double-Team Finish',rating:'B',rankingPoints:400},
 {id:'c-americas-team',name:'America’s Team',members:['c-dusty-rhodes','c-magnum-t-a-'],territory:'crockett1986',finisher:'Double Belly-to-Belly Suplex',rating:'C',rankingPoints:380},
 {id:'c-windham-garvin',name:'Barry Windham & Ron Garvin',members:['c-barry-windham','c-ron-garvin'],territory:'crockett1986',finisher:'Top Rope Sunset Flip Combo',rating:'C',rankingPoints:375},
 {id:'c-paul-jones-army-barbarian-whatley',name:'Paul Jones’ Army — Barbarian & Shaska Whatley',members:['c-the-barbarian','c-shaska-whatley'],territory:'crockett1986',finisher:'Double Choke',rating:'C',rankingPoints:250},
 {id:'c-paul-jones-army-barbarian-khan',name:'Paul Jones’ Army — Barbarian & Teijo Khan',members:['c-the-barbarian','c-teijo-khan'],territory:'crockett1986',finisher:'Double Clothesline',rating:'C',rankingPoints:250},
 {id:'c-paul-jones-army-whatley-khan',name:'Paul Jones’ Army — Shaska Whatley & Teijo Khan',members:['c-shaska-whatley','c-teijo-khan'],territory:'crockett1986',finisher:'Double Clothesline',rating:'C',rankingPoints:250},
 {id:'c-kansas-jayhawks',name:'Kansas Jayhawks',members:['c-dutch-mantell','c-bobby-jaggers'],territory:'crockett1986',finisher:'Top Rope Hart Attack',rating:'C',rankingPoints:230},
 {id:'c-dundee-landel',name:'Bill Dundee & Buddy Landel',members:['c-bill-dundee','c-buddy-landel'],territory:'crockett1986',finisher:'Top Rope Cannonball Combo',rating:'C',rankingPoints:210},
 {id:'c-lightning-express',name:'Lightning Express',members:['c-brad-armstrong','c-tim-horner'],territory:'crockett1986',finisher:'Sunset Flip Combo',rating:'C',rankingPoints:200},
 {id:'c-kernodles',name:'The Kernodles',members:['c-don-kernodle','c-rocky-kernodle'],territory:'crockett1986',finisher:'Top Rope Elbow Combo',rating:'C',rankingPoints:150},
 {id:'c-houston-royal',name:'Sam Houston & Nelson Royal',members:['c-sam-houston','c-nelson-royal'],territory:'crockett1986',finisher:'High Crossbody Combo',rating:'D',rankingPoints:100},
 {id:'c-brown-south',name:'Denny Brown & George South',members:['c-denny-brown','c-george-south'],territory:'crockett1986',finisher:'Improvised Double-Team Finish',rating:'D',rankingPoints:95},
 {id:'c-zane-chase',name:'Tony Zane & Brodie Chase',members:['c-tony-zane','c-brodie-chase'],territory:'crockett1986',finisher:'Improvised Double-Team Finish',rating:'D',rankingPoints:90},
 {id:'c-champion-snow',name:'Todd Champion & Mitch Snow',members:['c-todd-champion','c-mitch-snow'],territory:'crockett1986',finisher:'Improvised Double-Team Finish',rating:'D',rankingPoints:85},
 {id:'c-thunderfoots',name:'Thunderfoot I and II',members:['c-thunderfoot-i','c-thunderfoot-ii'],territory:'crockett1986',finisher:'Loaded Boot Double-Team',rating:'D',rankingPoints:80},
 {id:'c-stallion-king',name:'Italian Stallion & Rocky King',members:['c-italian-stallion','c-rocky-king'],territory:'crockett1986',finisher:'Improvised Double-Team Finish',rating:'D',rankingPoints:75},
 {id:'c-mulkeys',name:'The Mulkey Brothers',members:['c-randy-mulkey','c-bill-mulkey'],territory:'crockett1986',finisher:'Desperation Double-Team Rollup',rating:'D',rankingPoints:70},
 {id:'c-golden-terror-grim-reaper',name:'Golden Terror & Grim Reaper',members:['c-golden-terror','c-grim-reaper'],territory:'crockett1986',finisher:'Masked Team Finish',rating:'D',rankingPoints:65},
 {id:'c-jeffers',name:'Mac Jeffers & Jim Jeffers',members:['c-mac-jeffers','c-jim-jeffers'],territory:'crockett1986',finisher:'Improvised Double-Team Finish',rating:'D',rankingPoints:60},
 // Existing New York/WWF presets retained.
 {id:'hart-foundation',name:'The Hart Foundation',members:['w-bret-hart','w-jim-neidhart'],territory:'wwf1985_90',finisher:'Hart Attack',rating:'A'},
 {id:'british-bulldogs',name:'The British Bulldogs',members:['w-dynamite-kid','w-davey-boy-smith'],territory:'wwf1985_90',finisher:'Running Powerslam / Diving Headbutt Combo',rating:'A'},
 {id:'wwf-demolition',name:'Demolition',members:['w-demolition-ax','w-demolition-smash'],territory:'wwf1985_90',finisher:'Decapitation',rating:'A',rankingPoints:550},
 {id:'wwf-strike-force',name:'Strike Force',members:['w-tito-santana','w-rick-martel'],territory:'wwf1985_90',finisher:'Flying Forearm / Boston Crab Combo',rating:'A',rankingPoints:500},
 {id:'wwf-us-express',name:'U.S. Express',members:['w-barry-windham','w-mike-rotundo'],territory:'wwf1985_90',finisher:'Airplane Spin / Bulldog Combo',rating:'B',rankingPoints:460},
 {id:'wwf-iron-sheik-volkoff',name:'Iron Sheik & Nikolai Volkoff',members:['w-iron-sheik','w-nikolai-volkoff'],territory:'wwf1985_90',finisher:'Camel Clutch / Backbreaker Combo',rating:'B',rankingPoints:430},
 {id:'wwf-brain-busters',name:'The Brain Busters',members:['w-arn-anderson','w-tully-blanchard'],territory:'wwf1985_90',finisher:'Spike Piledriver',rating:'A',rankingPoints:420},
 {id:'wwf-studd-bundy',name:'King Kong Bundy & Big John Studd',members:['w-king-kong-bundy','w-big-john-studd'],territory:'wwf1985_90',finisher:'Avalanche / Backbreaker Combo',rating:'B',rankingPoints:400},
 {id:'wwf-dream-team',name:'The Dream Team',members:['w-greg-valentine','w-brutus-beefcake'],territory:'wwf1985_90',finisher:'Figure Four / Sleeper Combo',rating:'B',rankingPoints:390},
 {id:'wwf-colossal-connection',name:'The Colossal Connection',members:['w-andre-the-giant','w-haku'],territory:'wwf1985_90',finisher:'Giant Splash / Headbutt Combo',rating:'B',rankingPoints:380},
 {id:'wwf-twin-towers',name:'The Twin Towers',members:['w-big-bossman','w-akeem'],territory:'wwf1985_90',finisher:'Bossman Slam / 747 Splash',rating:'B',rankingPoints:370},
 {id:'wwf-powers-of-pain',name:'Powers of Pain',members:['w-barbarian','w-warlord'],territory:'wwf1985_90',finisher:'Power Slam / Top Rope Clothesline Combo',rating:'B',rankingPoints:360},

 {id:'rockers',name:'The Rockers',members:['w-shawn-michaels','w-marty-jannetty'],territory:'wwf1985_90',finisher:'Rocker-Plex',rating:'B'},
 {id:'horsemen',name:'The Horsemen',members:['w-arn-anderson','w-tully-blanchard'],territory:'combined',finisher:'Spike Piledriver',rating:'B'}
];

export const managers:Manager[] = [
 {id:'c-jim-cornette',name:'Jim Cornette',territory:'crockett1986',stable:['Bobby Eaton','Dennis Condrey','Big Bubba Rogers'],note:'Midnight Express / Big Bubba'},
 {id:'c-jj-dillon',name:'J.J. Dillon',territory:'crockett1986',stable:['Ric Flair','Tully Blanchard','Arn Anderson','Ole Anderson'],note:'Four Horsemen'},
 {id:'c-paul-jones-mgr',name:'Paul Jones',territory:'crockett1986',stable:['The Barbarian','Shaska Whatley','Teijo Khan','Baron Von Raschke','Rick Rude','Manny Fernandez'],note:'Paul Jones’ Army'},
 {id:'c-baby-doll',name:'Baby Doll',territory:'crockett1986',stable:['Dusty Rhodes','Magnum T.A.','The Warlord'],note:'Babyface side in this set'},
 {id:'c-precious',name:'Precious',territory:'crockett1986',stable:['Jimmy Garvin'],note:'Jimmy Garvin'},
 {id:'c-paul-ellering',name:'Paul Ellering',territory:'crockett1986',stable:['Hawk','Animal'],note:'Road Warriors'},
 {id:'c-bill-dundee-mgr',name:'Bill Dundee',territory:'crockett1986',stable:['Buddy Landel'],note:'Also active as wrestler'},
 {id:'w-bobby-heenan-mgr',name:'Bobby Heenan',territory:'wwf1985_90',stable:['Andre the Giant','Rick Rude','Big John Studd','King Kong Bundy','Hercules','Haku'],note:'Heenan Family'},
 {id:'w-jimmy-hart-mgr',name:'Jimmy Hart',territory:'wwf1985_90',stable:['Honky Tonk Man','Hart Foundation','Greg Valentine'],note:'The Mouth of the South'},
 {id:'w-mr-fuji-mgr',name:'Mr. Fuji',territory:'wwf1985_90',stable:['Demolition','Powers of Pain','The Orient Express'],note:'Salt / cane chaos'},
 {id:'w-slick-mgr',name:'Slick',territory:'wwf1985_90',stable:['Akeem','Big Bossman','Nikolai Volkoff','Boris Zhukov'],note:'The Doctor of Style'},
 {id:'w-elizabeth-mgr',name:'Elizabeth',territory:'wwf1985_90',stable:['Randy Savage','Hulk Hogan'],note:'Non-cheating ringside presence'},
 {id:'w-sherri-mgr',name:'Sensational Sherri',territory:'wwf1985_90',stable:['Randy Savage','Ted DiBiase'],note:'Interference-prone manager'},
 {id:'w-virgil-mgr',name:'Virgil',territory:'wwf1985_90',stable:['Ted DiBiase'],note:'Bodyguard'},
 {id:'w-frenchy-martin-mgr',name:'Frenchy Martin',territory:'wwf1985_90',stable:['Dino Bravo'],note:'Dino Bravo'},
 {id:'w-brother-love-mgr',name:'Brother Love',territory:'wwf1985_90',stable:['Ted DiBiase','The Undertaker'],note:'Occasional manager'},
 {id:'none',name:'No Manager',territory:'both',stable:[]}
];

