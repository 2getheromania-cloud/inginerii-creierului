// Stilul comun al fișelor, identic cu cel din varianta de tipărit.
export const stilFise = `:root{
  color-scheme: light;
  --brand:#133D13; --gold:#B08A3C; --gold2:#8F6E2A; --ribbon:#8CA032;
  --bg:#FBF8F2; --bg2:#F3EDE2; --card:#FFFDF9;
  --ink:#1C1713; --ink2:#5E534A; --line:#E2D8C8; --rule:#CFC2AC;
  --warnbg:#F6EEE2; --warnedge:#B08A3C;
  --serif:"Cormorant Garamond",Georgia,"Times New Roman",serif;
  --sans:"Manrope","Segoe UI",Helvetica,Arial,sans-serif;
  --paper:.035;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    color-scheme: dark;
    --brand:#0A2410; --gold:#D2AD5C; --gold2:#B99447; --ribbon:#9DB13E;
    --bg:#151110; --bg2:#1E1917; --card:#1B1614;
    --ink:#F1EAE0; --ink2:#A2958A; --line:#342B25; --rule:#4A3E35;
    --warnbg:#241D14; --warnedge:#D2AD5C;
    --paper:.06;
  }
}
:root[data-theme="dark"]{
  color-scheme: dark;
  --brand:#0A2410; --gold:#D2AD5C; --gold2:#B99447; --ribbon:#9DB13E;
  --bg:#151110; --bg2:#1E1917; --card:#1B1614;
  --ink:#F1EAE0; --ink2:#A2958A; --line:#342B25; --rule:#4A3E35;
  --warnbg:#241D14; --warnedge:#D2AD5C;
  --paper:.06;
}
*{box-sizing:border-box}
[hidden]{display:none!important}
body{
  margin:0; background:var(--bg); color:var(--ink);
  font-family:var(--sans); font-size:16px; line-height:1.6;
  -webkit-font-smoothing:antialiased;
}
body::before{
  content:""; position:fixed; inset:0; pointer-events:none; z-index:0;
  opacity:var(--paper);
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E");
}
h1,h2,h3{font-family:var(--serif); font-weight:600; letter-spacing:-.01em; text-wrap:balance; margin:0}
.sheet{position:relative; z-index:1; max-width:760px; margin:0 auto; padding:0 20px 64px}

/* antet */
.head{
  background:var(--brand); color:#F1EAE0; margin:0 -20px 0;
  padding:26px 28px 24px; position:relative; overflow:hidden;
}
.head::after{
  content:""; position:absolute; right:-60px; top:-80px; width:230px; height:230px;
  background:radial-gradient(circle,rgba(210,173,92,.24),transparent 68%);
}
.brandrow{display:flex; align-items:center; gap:11px; position:relative}
.mark{width:30px;height:30px;object-fit:contain;flex:none;background:#FBF8F2;border-radius:50%;padding:4px;box-shadow:0 0 0 1px rgba(176,138,60,.5)}
.bn{font-family:var(--serif); font-size:1.02rem; line-height:1}
.bn i{font-style:normal; color:var(--gold)}
.eyebrow{
  font-size:.7rem; letter-spacing:.18em; text-transform:uppercase;
  font-weight:700; color:var(--gold); margin:20px 0 6px; position:relative;
}
.head h1{font-size:clamp(1.9rem,5.5vw,2.5rem); color:#FBF8F2; position:relative}
.head .meta{
  margin-top:10px; font-size:.84rem; color:#BDB4A6; position:relative;
  display:flex; flex-wrap:wrap; gap:6px 18px;
}

/* corp */
.stack{display:flex; flex-direction:column; gap:22px; padding-top:30px}
p{margin:0}
.lead{font-size:1.06rem}
.say{
  border-left:2.5px solid var(--gold); padding:2px 0 2px 18px;
  display:flex; flex-direction:column; gap:12px;
}
h2{font-size:1.5rem; margin-top:10px}
h3{font-size:1.12rem}
.sub{font-size:.9rem; color:var(--ink2)}
.q{display:flex; flex-direction:column; gap:5px}
.q b{font-weight:700}

/* tabele */
table{width:100%; border-collapse:collapse; font-size:.92rem}
caption{
  caption-side:top; text-align:left; font-size:.7rem; letter-spacing:.14em;
  text-transform:uppercase; font-weight:700; color:var(--ink2); padding-bottom:9px;
}
th,td{border:1px solid var(--rule); padding:9px 10px; text-align:left; vertical-align:top}
th{background:var(--bg2); font-weight:700; font-size:.78rem; letter-spacing:.02em}
.when th{width:34%}
.grid td{height:42px}
.grid th:first-child{width:21%}
.grid th:not(:first-child){text-align:center}
.grid td:not(:first-child){text-align:center; color:var(--ink2)}
.tw{overflow-x:auto}

/* avertisment */
.warn{
  background:var(--warnbg); border:1px solid var(--warnedge); border-radius:14px;
  padding:22px 24px; display:flex; flex-direction:column; gap:12px;
}
.warn h3{color:var(--gold2)}
.warn strong{color:var(--ink)}

/* pasul unic */
.step{
  border-top:2px solid var(--gold); padding-top:18px;
  display:flex; flex-direction:column; gap:8px;
}
.step .eyebrow{margin:0; color:var(--gold2)}
.foot{
  margin-top:10px; padding-top:16px; border-top:1px solid var(--line);
  font-size:.78rem; color:var(--ink2);
}

@media (max-width:560px){
  .head{padding:22px 20px}
  .grid td{height:38px}
  table{font-size:.85rem}
  th,td{padding:7px 6px}
}

@media print{
  .back{display:none}
  body{background:#fff; color:#000; font-size:10.5pt}
  body::before{display:none}
  .sheet{max-width:none; padding:0}
  .head{background:none; color:#000; margin:0; padding:0 0 12pt; border-bottom:1.5pt solid #133D13}
  .head::after{display:none}
  .head h1{color:#000}
  .head .meta,.bn i{color:#444}
  .mark{background:none;box-shadow:none;padding:0}
  .eyebrow{color:#7a5f22}
  .warn{background:none; border:1pt solid #999; break-inside:avoid}
  .grid td{height:30pt}
  th{background:#f0ece4}
  h2,h3{break-after:avoid}
  table,.step{break-inside:avoid}
  .stack{gap:14pt}
}
@page{margin:16mm}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
.back{margin:0; padding:14px 0 10px; font-size:.85rem}
.back a{color:var(--gold2); text-decoration:none; font-weight:600; display:inline-flex; gap:7px; align-items:center}
.back a:hover{text-decoration:underline}
.back a:focus-visible{outline:2px solid var(--gold); outline-offset:3px; border-radius:4px}`
