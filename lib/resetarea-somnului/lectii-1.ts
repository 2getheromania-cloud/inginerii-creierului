// Lecțiile 1–4. Adaptate din „Ghidul Somnului" (Inginerii Creierului) și
// trecute prin Filtrul dovezilor IC: afirmațiile care nu au rezistat au fost
// scoase sau rescrise, iar fiecare măsură din plan are treapta dovezii scrisă.
//
// Etichetele de dovadă:
//   solid   — trialuri randomizate sau meta-analize la om
//   partial — mecanism real, dovadă incompletă sau studii mici
//   ipoteza — plauzibil, nedemonstrat la om; nu intră în plan
//   nu      — verificat și nu rezistă

export const bazele = `
<p class="lead">Somnul de calitate nu e un lux. E momentul în care corpul își reface energia, memoria și echilibrul hormonal. Dacă te trezești epuizat(ă) după o noapte întreagă în pat, corpul îți spune ceva.</p>
<p>În primele șapte zile înveți câte o pârghie pe zi și adaugi câte un obicei. Din ziua 8 le pui pe toate împreună, timp de zece zile. Ultimele patru zile sunt pentru ce rămâne după program.</p>

<section>
  <h2>Începe cu testul</h2>
  <p>Zece întrebări, două minute. Scorul de azi e punctul de pornire; în ziua 21 refaci testul și vezi diferența.</p>
  <p><a class="btn" href="/resetarea-somnului/test">Fă testul de somn</a></p>
</section>

<section>
  <h2>Ce se întâmplă noaptea</h2>
  <p>Somnul vine în cicluri de aproximativ 90 de minute, de patru-cinci ori pe noapte. Fiecare ciclu trece prin trei feluri de somn:</p>
  <div class="grid3">
    <div class="tile"><b>~50–60%</b><span>Somn ușor (stadiile 1 și 2). Corpul se relaxează, temperatura scade.</span></div>
    <div class="tile"><b>~15–25%</b><span>Somn profund. Refacere fizică și secreția hormonului de creștere. Scade odată cu vârsta.</span></div>
    <div class="tile"><b>~20–25%</b><span>Somn REM. Vise, memorie, procesarea emoțiilor. Predomină spre dimineață.</span></div>
  </div>
  <p>Procentele sunt aproximative și variază de la om la om. De aceea alarma care te trezește la 5 dimineața taie mai ales din somnul REM.</p>
</section>

<section>
  <h2>Ce fel de somn prost ai?</h2>
  <ul>
    <li><strong>Insomnia de adormire</strong> — mintea nu se oprește: griji, liste, conversații reluate.</li>
    <li><strong>Insomnia de menținere</strong> — adormi, dar te trezești des și readormi greu.</li>
    <li><strong>Somnul neodihnitor</strong> — dormi multe ore și te trezești la fel de obosit(ă).</li>
  </ul>
  <div class="card warn">
    <p><strong>Când mergi întâi la medic, nu la program:</strong> sforăi puternic și cineva a observat că ți se oprește respirația în somn; adormi ziua fără să vrei, mai ales la volan; te trezești cu dureri de cap sau cu gura uscată în fiecare dimineață. Acestea pot fi semne de apnee în somn, care e mai frecventă după menopauză și se tratează. Respirația pe gură noaptea poate fi și ea un semn: nas înfundat sau apnee.</p>
  </div>
</section>

<section>
  <h2>Primele două obiceiuri</h2>

  <h3>1. Lista de mâine, pe hârtie</h3>
  <p><span class="dovada partial">Dovadă parțială</span> Într-un experiment randomizat cu 57 de adulți, monitorizați prin polisomnografie, cei care și-au scris cinci minute înainte de culcare <em>ce au de făcut a doua zi</em> au adormit mai repede decât cei care au scris ce terminaseră deja. Un singur studiu, pe studenți tineri: merită încercat, nu e o garanție.</p>
  <p class="ce-faci"><b>Ce faci:</b> seara, după ce te-ai spălat pe dinți, scrii pe hârtie tot ce ai de făcut mâine. Nu în telefon.</p>

  <h3>2. Respirația lentă</h3>
  <p><span class="dovada partial">Dovadă parțială</span> Respirația lentă, cu expirul mai lung decât inspirul, scade activarea corpului. Ca mecanism e bine documentat. Trialurile care măsoară direct somnul după ea sunt puține și mici.</p>
  <p class="ce-faci"><b>Ce faci:</b> în pat, inspiri pe nas 4 secunde și expiri lent 6–8 secunde. Cinci minute. Dacă adormi înainte, cu atât mai bine.</p>
</section>

<section class="reflecta">
  <h2>Reflectă</h2>
  <p>Scrie în caiet, nu aici. Răspunsurile tale nu se salvează nicăieri.</p>
  <ul>
    <li>Care e cea mai mare îngrijorare a ta acum?</li>
    <li>Ce te-a bucurat azi? Trei lucruri.</li>
    <li>Ce angajament iei azi pentru un somn mai bun?</li>
  </ul>
</section>

<p class="surse"><b>Surse:</b> Scullin și colab., <i>J Exp Psychol Gen</i>, 2018 — randomizat, 57 de adulți, polisomnografie.</p>
`

export const ceasul = `
<p class="lead">Ce faci ziua decide cât de bine dormi noaptea. Ceasul tău biologic se reglează după două lucruri simple: lumina și ora la care te trezești.</p>

<section>
  <h2>Doi hormoni, două momente</h2>
  <table>
    <thead><tr><th>Hormon</th><th>Când urcă</th><th>Ce face</th><th>Ce îl încurcă</th></tr></thead>
    <tbody>
      <tr><td><strong>Melatonina</strong></td><td>seara, pe întuneric</td><td>semnalează corpului că e noapte</td><td>lumina puternică seara</td></tr>
      <tr><td><strong>Cortizolul</strong></td><td>dimineața, în prima oră după trezire</td><td>energie, atenție</td><td>lipsa luminii dimineața, stresul cronic, somnul puțin</td></tr>
    </tbody>
  </table>
</section>

<section>
  <h2>Ora fixă de trezire</h2>
  <p><span class="dovada partial">Dovadă observațională</span> Pe aproape 61.000 de oameni urmăriți cu accelerometrul, regularitatea somnului a prezis mai bine decât durata lui riscul de deces. E un studiu de observație: arată o legătură, nu cauza. Dar pârghia e gratuită.</p>
  <p class="ce-faci"><b>Ce faci:</b> alegi o oră de trezire și o păstrezi în fiecare zi, cu o marjă de jumătate de oră. Inclusiv sâmbăta și duminica. Ora de culcare se așază singură după ea, în două-trei săptămâni.</p>
</section>

<section>
  <h2>Lumina de dimineață</h2>
  <p><span class="dovada partial">Mecanism demonstrat</span> Lumina de dimineață e semnalul cel mai puternic pentru ceasul intern. Afară, chiar pe nori, e de multe ori mai multă lumină decât într-o cameră aprinsă.</p>
  <p class="ce-faci"><b>Ce faci:</b> în prima oră după trezire, 10–20 de minute afară, înainte de telefon. Prin geam nu e același lucru. Iarna, dacă pleci pe întuneric, ieși la prânz.</p>
</section>

<section>
  <h2>Cafeina și adenozina</h2>
  <p>Adenozina e molecula care se adună în creier cu fiecare oră de veghe și îți face somn. Cafeina îi blochează receptorii. Corpul elimină jumătate din cafeină în aproximativ cinci ore, dar la unii oameni durează mult mai mult.</p>
  <p><span class="dovada solid">Dovadă solidă</span> Într-un trial randomizat, controlat cu placebo, 400 mg de cafeină (două-trei cafele) luate cu <strong>șase ore</strong> înainte de culcare au scurtat somnul măsurat cu peste o oră. Participanții nu și-au dat seama. Studiul a fost mic, 12 adulți, dar rezultatul e în aceeași direcție cu tot ce știm despre cafeină.</p>
  <p class="ce-faci"><b>Ce faci:</b> ultima cafea înainte de ora 14:00, dacă te culci în jur de 22–23. Atenție și la ceaiul negru, verde, ciocolată și băuturile energizante.</p>
</section>

<section>
  <h2>Cronotipul tău</h2>
  <p>Nu toată lumea e făcută pentru ora 5 dimineața. Întreabă-te: te simți mai motivat(ă) dimineața sau seara? Te trezești singur(ă) sau doar cu alarma? La ce oră ai cea mai multă energie? Alege ora de trezire potrivită ție și ține-te de ea. Regularitatea contează mai mult decât ora exactă.</p>
</section>

<section>
  <h2>Ziua ideală pentru ceasul biologic</h2>
  <div class="grid3">
    <div class="tile"><b>Dimineața</b><span>Lumină afară înainte de ecrane. Mișcare, dacă poți, tot afară.</span></div>
    <div class="tile"><b>După-amiaza</b><span>Prânzul la lumină naturală. Ultima cafea până la 14:00.</span></div>
    <div class="tile"><b>Seara</b><span>Lumini slabe după 20:00. Televizorul și biroul scoase din dormitor.</span></div>
  </div>
  <p><span class="dovada partial">Mai puțin decât pare</span> Filtrele de lumină de pe telefon (Night Shift, f.lux) pot ajuta puțin. Pentru ochelarii cu filtru de lumină albastră, dovada e de certitudine scăzută: banii se duc mai bine pe o perdea groasă.</p>
</section>

<section class="reflecta">
  <h2>Reflectă</h2>
  <ul>
    <li>Pot ieși mâine 15 minute afară, dimineața? Când exact?</li>
    <li>Ce mă împiedică să opresc telefonul seara?</li>
    <li>Care e cel mai mic pas pe care îl pot face azi?</li>
  </ul>
</section>

<p class="surse"><b>Surse:</b> Drake și colab., <i>J Clin Sleep Med</i>, 2013 — randomizat, dublu-orb, placebo, 12 adulți. Windred și colab., <i>Sleep</i>, 2024 — observațional, ~61.000 de participanți (UK Biobank).</p>
`

export const alimentatia = `
<p class="lead">Ce mănânci și mai ales <em>când</em> mănânci se vede în somn. Aici e și locul unde ghidul de pornire spunea câteva lucruri care nu au trecut filtrul, așa că le spunem direct.</p>

<section>
  <h2>Ora cinei</h2>
  <p>Digestia și somnul nu se împacă bine. O masă mare chiar înainte de culcare încălzește corpul și poate da reflux, iar corpul adoarme mai ușor când temperatura internă scade.</p>
  <p class="ce-faci"><b>Ce faci:</b> cina cu cel puțin 2–3 ore înainte de culcare. Dacă te culci la 22, cina e la 19 cel târziu.</p>
</section>

<section>
  <h2>Mese fără vârfuri</h2>
  <p>Programul folosește farfuria din protocolul de microbiom IC: trei sferturi legume colorate, plus proteine de calitate și grăsimi bune. Pâinea albă, dulciurile și cerealele cu lapte dau vârfuri de glicemie urmate de scăderi.</p>
  <p><span class="dovada ipoteza">Ipoteză</span> Ghidul spunea că trezirile de la 2–3 noaptea vin dintr-o scădere bruscă a glicemiei. La unii oameni e posibil, dar din ce am verificat, nu am găsit studii care să arate că asta e cauza obișnuită la oamenii fără diabet. Mai des, trezirile de atunci vin din alcool, stres, bufeuri, nevoia de a urina sau sfârșitul firesc al unui ciclu de somn.</p>
  <div class="card warn"><p>Dacă te tratezi cu insulină sau cu pastile care scad glicemia și te trezești noaptea transpirat(ă), tremurând sau cu palpitații, spune-i medicului. Poate fi hipoglicemie și se reglează din tratament, nu din meniu.</p></div>
  <p><b>Exemplu de zi:</b> micul dejun cu ouă și legume la tigaie; la prânz o salată cu somon, avocado și legume; ca gustare o mână de nuci; la cină legume coapte, carne slabă și o felie de cartof dulce.</p>
</section>

<section>
  <h2>Intestinul și somnul</h2>
  <p>Legătura e reală, dar mai mică decât se spune pe internet:</p>
  <ul>
    <li>Cea mai mare parte din serotonina corpului e făcută în intestin. Ea <strong>nu trece</strong> însă în creier; creierul își face singur serotonina lui.</li>
    <li>Intestinul conține mult mai multă melatonină decât glanda pineală. Dar semnalul de noapte pentru ceasul biologic vine din glanda pineală, nu din intestin.</li>
  </ul>
  <p><span class="dovada nu">Nu rezistă</span> „Dacă ai flora intestinală afectată, nu poți produce melatonină, deci nu poți dormi.” Din ce am verificat, nu există dovezi pentru asta. Studiile despre microbiom și somn sunt mai ales pe animale sau de observație.</p>
  <p>Mâncarea reală, alimentele fermentate (murături naturale, kimchi, chefir) și cele cu fibre (ceapă, usturoi, praz, sparanghel) sunt bune pentru sănătate în general. Pentru somn în mod specific, dovada e încă la început.</p>
  <div class="card warn"><p><strong>5-HTP</strong> nu se ia fără medic. Împreună cu antidepresivele (de tip SSRI sau SNRI), cu triptanele pentru migrenă sau cu alte medicamente serotoninergice, poate da sindrom serotoninergic, o reacție gravă. Nu opri și nu începe nicio pastilă fără medicul tău.</p></div>
</section>

<section class="reflecta">
  <h2>Reflectă</h2>
  <ul>
    <li>La ce oră mănânc de obicei seara? Ce trebuie să schimb ca să mut cina mai devreme?</li>
    <li>Ce mănânc zilnic care îmi dă „căderi” de energie?</li>
    <li>Care e un singur lucru pe care îl pot schimba de mâine?</li>
  </ul>
</section>
`

export const hormonii = `
<p class="lead">Hormonii și somnul se influențează în ambele sensuri: somnul prost dereglează hormonii, iar hormonii dereglați strică somnul.</p>

<section>
  <h2>Insulina și foamea</h2>
  <p><span class="dovada solid">Dovadă solidă</span> O meta-analiză pe 21 de studii de restricție a somnului arată că somnul scurt scade sensibilitatea la insulină. Exemplu concret: după o săptămână la cinci ore pe noapte, sensibilitatea la insulină a scăzut cu aproximativ 20%, la bărbați sănătoși (20 de participanți).</p>
  <p><span class="dovada solid">Dovadă solidă</span> Foamea crește și ea: într-o meta-analiză pe 41 de trialuri randomizate, oamenii au mâncat în medie cu 253 kcal mai mult pe zi după somn restricționat.</p>
  <p><span class="dovada nu">Mai puțin decât pare</span> Explicația populară e că somnul puțin scade leptina și crește grelina. În aceeași meta-analiză, schimbarea acestor doi hormoni nu a fost consecventă. Foamea crește, dar motivul e mai complicat.</p>
</section>

<section>
  <h2>Hormonul de creștere</h2>
  <p>Cea mai mare parte se eliberează în primul somn profund al nopții. Ajută la refacerea țesuturilor și a masei musculare. Încă un motiv ca prima parte a nopții să nu fie tăiată de alcool sau de un ecran.</p>
</section>

<section>
  <h2>Tiroida</h2>
  <p><span class="dovada nu">Nu rezistă</span> Ghidul spunea că ai nevoie de melatonină ca să transformi hormonul T4 în T3. Transformarea o fac niște enzime numite deiodinaze; din ce am verificat, nu am găsit dovezi că melatonina e necesară pentru ea.</p>
  <p>Ce e adevărat: tiroida dereglată strică somnul. Hipertiroidia dă insomnie și palpitații, hipotiroidia dă oboseală, iar apneea e mai frecventă la cei cu hipotiroidie netratată.</p>
  <p class="ce-faci"><b>Ce faci:</b> dacă ai Hashimoto sau altă boală tiroidiană și dormi prost, cere-i endocrinologului să-ți verifice valorile. Somnul prost poate fi un simptom.</p>
</section>

<section>
  <h2>Progesteronul și menopauza</h2>
  <p>Progesteronul are un efect calmant, prin unul dintre metaboliții lui, care acționează pe aceiași receptori ca anxioliticele. În perimenopauză nivelul lui scade, iar bufeurile de noapte trezesc multe femei de mai multe ori.</p>
  <p><span class="dovada nu">Nu rezistă</span> „Stresul cronic transformă progesteronul în cortizol.” E teoria „furtului de pregnenolonă”. Hormonii se fac în compartimente diferite ale glandelor, iar din ce am verificat, nu există dovezi că lucrurile se petrec așa.</p>
  <p class="ce-faci"><b>Ce faci:</b> dacă te trezesc bufeurile, discută cu medicul ginecolog. Există tratamente cu dovadă solidă, iar alegerea depinde de istoricul tău medical.</p>
</section>

<section>
  <h2>Alcoolul</h2>
  <p><span class="dovada solid">Dovadă solidă</span> Alcoolul te ajută să adormi mai repede, dar fragmentează a doua jumătate a nopții și scade somnul REM. De aceea te trezești la 3 și nu mai adormi.</p>
  <p class="ce-faci"><b>Ce faci:</b> fără alcool seara, din ziua 4 până la sfârșitul programului. După program, dacă bei, păstrează cel puțin trei ore între ultimul pahar și culcare.</p>
</section>

<section>
  <h2>Analizele de discutat cu medicul</h2>
  <p>Dacă ai peste 40 de ani și dormi prost de mult timp, poți discuta cu medicul de familie despre: TSH, FT4, FT3, glicemie și insulină à jeun, feritină, vitamina D și, la femei în perimenopauză, hormonii sexuali.</p>
  <p>Rezultatele se citesc după intervalele laboratorului și cu medicul. Am scos din ghid tabelul de „intervale optime”: nu am găsit o sursă care să le susțină, iar unele diferă de intervalele de referință.</p>
</section>

<section class="reflecta">
  <h2>Reflectă</h2>
  <ul>
    <li>Mă simt epuizat(ă) chiar și după un somn lung?</li>
    <li>Observ schimbări în somn în funcție de ciclu sau de menopauză?</li>
    <li>Ce obicei vechi înlocuiesc azi cu unul sănătos?</li>
  </ul>
</section>

<p class="surse"><b>Surse:</b> Sondrup și colab., <i>Sleep Med Rev</i>, 2022 — meta-analiză, 21 de studii de restricție. Buxton și colab., <i>Diabetes</i>, 2010 — 20 de bărbați, 5 ore pe noapte timp de o săptămână. Zhu și colab., <i>Sleep Med Rev</i>, 2019 — meta-analiză, 41 de trialuri randomizate.</p>
`
