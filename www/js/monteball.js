var page_name = new URLSearchParams(window.location.search).get('p') || 'montebolas'

var nustatymai 

db.ref('puslapis/nustatymai').on('value', pritaikytiNustatymus)

function pritaikytiNustatymus(nustatymai_is_db) {
	nustatymai = nustatymai_is_db.val()
	t(e('eilutes-tekstas'), nustatymai.eilute.tekstas)
	a(e('eilute'), 'onclick', `window.location = '${nustatymai.eilute.nuoroda}'`)
	cr(e('eilute'), 'sutraukta')
}

window.addEventListener('popstate', function (event) {
	let params = new URLSearchParams(window.location.search)
	page_name = params.get("p") || 'montebolas'
	rodyti(page_name, false)
});

function rinktis(o) { for(el of sb(o)) { cr(el, 'pasirinkta') }; ca(o, 'pasirinkta')}

const menu = q('#menu')
const nav = q('nav')
const main = q('main')
const page_titles = {
	montebolas: 'Monteball',
	rezervacija: 'Monteball - Rezervacija',
	apie: 'Monteball - Apie mus',
	cempionatai: 'Monteball - Čempionatai',
	aikstynai: 'Monteball - Aikštynai',
	kontaktai: 'Monteball - Kontaktai',
	rezervacijos_perziura: 'Monteball - Rezervacijos peržiūra'
}

function rodyti(pn, push_state = true) {
	sv(main)
	page_name = pn
	for(link of nav.children) { link.classList.remove('active') }
	let nav_link = qe(nav, `[name=${page_name}]`)
	nav_link ? nav_link.classList.add('active') : null
	for(pg of main.children) { pg.hidden = true }
	const page = qe(main, `[id=${page_name}]`)
	page.hidden = false
	menu.classList.remove('open')
	nav.classList.add('closed')

	gtag('event', 'page_view', { page_title: page_titles[page_name] ?? page_name });

	document.title = page_titles[page_name] ?? 'Monteball'

	if (history.pushState && push_state) {
	    var params = new URLSearchParams(window.location.search)
	    params.set('p', page_name)
	    var newUrl = window.location.origin + window.location.pathname + '?' + params.toString()
	    window.history.pushState({path:newUrl},'',newUrl)
	}

	if(page_name === 'montebolas') {}
	else if(page_name === 'rezervacijos_perziura') { 
		var rid = new URLSearchParams(window.location.search).get('rid')
		if(rid) {
			fs.collection('paymentWebhooks').doc(rid).onSnapshot(snap => {
				const payment = snap.data()
				if(payment.paymentStatus == 'PAID') {
					fs.collection('rezervacijos').doc(rid).onSnapshot(snap => {
						if(snap.exists) { 
							const rez = snap.data()
							ih(page, `
						      <div style="padding: 2em; margin: auto; max-width: 700px; letter-spacing: 2px; ">
						      <h2 style="color: rgb(255,196,42); margin-top: 1.5em;">Rezervacija</h2>
						      <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Lokacija:</div><div style="font-weight: bold; color: #fff;">${rez.lokacija}</div></div>
						      <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Žaidimas:</div><div style="font-weight: bold; color: #fff;">${rez.zaidimas.pavadinimas}</div></div>
						      <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Data:</div><div style="font-weight: bold; color: #fff;">${rezervacija.diena.slice(0,2)}-${rezervacija.diena.slice(2,4)}-${rezervacija.diena.slice(4,6)}</div></div>
						      <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Valanda:</div><div style="font-weight: bold; color: #fff;">${rez.laikas.slice(0,2)}:${rez.laikas.slice(2,4)}</div></div>
						      <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Žaidėjai:</div><div style="font-weight: bold; color: #fff;">${rez.zaidejai}</div></div>
						      <h2 style="color: rgb(255,196,42); margin-top: 1.5em;">Informacija</h2>
						      <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Numeris:</div><div style="font-weight: bold; color: #fff;">${rez.nr}</div></div>
						      <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Statusas:</div><div style="font-weight: bold; color: #fff;">${rez.statusas}</div></div>
						      <div style="color: #fff;">Suma: ${rez.mokejimas.suma}€</div>
						      <div style="color: #fff;">Jūs sumokėjote: ${rez.mokejimas.apmoketa}€</div>
						      <div style="color: #fff;">Likusi mokėtina suma: ${rez.mokejimas.liko_moketi}€ </div>
						      <h2 style="color: rgb(255,196,42); margin-top: 1.5em;">Jūsų informacija</h2>
						      <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Vardas:</div><div style="font-weight: bold; color: #fff;">${rez.kontaktas.vardas}</div></div>
						      <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Telefonas:</div><div style="font-weight: bold; color: #fff;">${rez.kontaktas.telefonas}</div></div>
						      <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">El. paštas:</div><div style="font-weight: bold; color: #fff;">${rez.kontaktas.el_pastas}</div></div>
						    </div>`)
						}
					})
				}
			})

		}}
	else if(page_name === 'rezervacija') { e('lokacija').children[1].click(); }
	else if(['cempionatai', 'privatumo_politika', 'taisykles_salygos', 'apie'].includes(page_name) ) { db.ref('pages/'+ page_name).on('value', (psl)=> { ih(page, psl.val()) } ) }
}

rodyti(page_name)

auth.onAuthStateChanged(user => {
    if(user) { 
    	db.ref('styles/admin').once('value', (style) => { add(document.body, ec(style.val())) })
    	db.ref('scripts/admin').once('value', (script) => { add(document.body, ec(script.val())) })
	}
})