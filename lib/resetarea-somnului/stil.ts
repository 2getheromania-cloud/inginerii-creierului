// Stilul lecțiilor. Scopat sub .lectie-somn, ca să nu atingă restul aplicației.
// Aceleași culori ca „Cele 7 Etape" (identitatea vizuală IC).
export const stilLectii = `
.lectie-somn{--brand:#133D13;--gold:#B08A3C;--gold2:#8F6E2A;--ribbon:#8CA032;--bg2:#F3EDE2;--card:#FFFDF9;--ink:#1C1713;--ink2:#5E534A;--line:#E2D8C8;line-height:1.7}
.lectie-somn .lead{font-size:1.12rem;color:var(--ink);margin:1.2rem 0}
.lectie-somn p{margin:.75rem 0}
.lectie-somn section{margin-top:2.4rem}
.lectie-somn h2{font-family:"Cormorant Garamond",Georgia,serif;font-weight:600;font-size:1.7rem;line-height:1.15;color:var(--brand);margin:0 0 .6rem}
.lectie-somn h3{font-weight:700;font-size:1.05rem;margin:1.4rem 0 .2rem}
.lectie-somn ul{padding-left:1.2rem;margin:.6rem 0}
.lectie-somn li{margin:.35rem 0}
.lectie-somn a{color:var(--gold2);font-weight:600;text-decoration:underline;text-underline-offset:3px}
.lectie-somn a.btn{display:inline-block;background:var(--gold);color:#1C1713;text-decoration:none;padding:.7rem 1.3rem;border-radius:999px;font-weight:700}
.lectie-somn a.btn:hover{background:var(--gold2);color:#FBF8F2}
.lectie-somn .ce-faci{background:var(--bg2);border-radius:12px;padding:.8rem 1rem}
.lectie-somn .ce-faci b{color:var(--gold2)}
.lectie-somn .card.warn{border:1px solid var(--gold);background:#F6EEE2;border-radius:12px;padding:.2rem 1rem;margin:1rem 0}
.lectie-somn .reflecta{border-top:1px solid var(--line);padding-top:1.4rem}
.lectie-somn .reflecta h2{font-size:1.4rem}
.lectie-somn .surse{margin-top:2.4rem;font-size:.82rem;color:var(--ink2);border-top:1px solid var(--line);padding-top:1rem}
.lectie-somn .grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.7rem;margin:1rem 0}
.lectie-somn .tile{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:.9rem;display:flex;flex-direction:column;gap:.3rem}
.lectie-somn .tile b{font-family:"Cormorant Garamond",Georgia,serif;font-size:1.5rem;font-weight:600;color:var(--gold2);line-height:1.1}
.lectie-somn .tile span{font-size:.9rem;color:var(--ink2);line-height:1.5}
.lectie-somn table{width:100%;border-collapse:collapse;font-size:.92rem;margin:1rem 0;display:block;overflow-x:auto}
.lectie-somn th,.lectie-somn td{text-align:left;vertical-align:top;padding:.5rem .6rem;border-bottom:1px solid var(--line)}
.lectie-somn th{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--gold2)}
.lectie-somn td:first-child{white-space:nowrap;font-variant-numeric:tabular-nums}
.lectie-somn .dovada{display:inline-block;font-size:.68rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:.15rem .5rem;border-radius:999px;margin-right:.35rem;vertical-align:.1em;white-space:nowrap}
.lectie-somn .dovada.solid{background:#E4EBD3;color:#2F4A12}
.lectie-somn .dovada.partial{background:#F3E7CC;color:#6E5320}
.lectie-somn .dovada.ipoteza{background:#ECE6DC;color:#5E534A}
.lectie-somn .dovada.nu{background:#F2DED7;color:#7A2E1B}
@media (max-width:600px){.lectie-somn .grid3{grid-template-columns:1fr}}
`
