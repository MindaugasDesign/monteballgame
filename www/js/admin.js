
const admin_toggle = ec({e:'div', a:{id: 'admin_toggle'}})
const editable_pages = ['cempionatai', 'privatumo_politika', 'taisykles_salygos', 'apie']
add(document.body, admin_toggle)
ih(admin_toggle,
	`<div class="scale-on-hover" id="toggle" onclick="toggleAdminMenu()">
		<svg id="svg" height="49" width="49" xmlns="http://www.w3.org/2000/svg">
			<line x1="25" y1="8" x2="25" y2="41" style="stroke:white; stroke-width:4" />
			<line x1="8" y1="25" x2="41" y2="25" style="stroke:white; stroke-width:4" />
			<line x1="12" y1="12" x2="38" y2="38" style="stroke:white; stroke-width:4" />
			<line x1="38" y1="12" x2="12" y2="38" style="stroke:white; stroke-width:4" />
		</svg>
	</div>`)

const admin = ec({e:'div', a: {id: 'admin'}})
add(document.body, admin)

const lokaciju_elementai = {
	birzai: {e: 'div', t: 'Biržai', a: {class: 'lokacijos-pasirinkimas', onclick: 'rinktisLokacija(this)', reiksme: 'birzai', pav: 'Biržai'}},
	vilnius: {e: 'div', t: 'Vilnius', a: {class: 'lokacijos-pasirinkimas', onclick: 'rinktisLokacija(this)', reiksme: 'vilnius', pav: 'Vilnius'}}
}

add(admin, ec({e:'div', t: 'Rezervacijos', a: {class: 'admin-link', onclick: 'rodytiAdminPuslapi("rezervacijos");toggleAdminMenu()'}}))
add(admin, ec({e:'div', t: 'Grafikas', a: {class: 'admin-link', onclick: 'rodytiAdminPuslapi("grafikas");toggleAdminMenu()'}}))
add(admin, ec({e:'div', t: 'Nustatymai', a: {class: 'admin-link', onclick: 'rodytiAdminPuslapi("nustatymai");toggleAdminMenu()'}}))

add(admin, ec({
	e: 'div', a: {class: 'f c'}, 
	c: [{
			e: 'div', 
			a: {id: 'lokacijos-pasirinkimas'}, 
			c: [
				{e:'div', a: {id: 'aktyvi-lokacija', onclick: 'keistiLokacija()'}}, 
				{e: 'div', a: {id: 'lokacijos', hidden: 'true'}} 
			]
		}]
	}))
var ll
var nust
auth.onAuthStateChanged(user => {
    if(user) {
		db.ref(`teises/${user.uid}/lokacijos`).get().then(snap => snap.val()).then(lokacijos => {
			Object.keys(lokacijos).forEach(lok => {
				add(e('lokacijos'), ec(lokaciju_elementai[lok]))
			})
			dg('lokacija') ? qe(e('lokacijos'), `[reiksme='${dg('lokacija')}']`).click() : e('lokacijos').children[0].click()
		})

    }
})


var puslapis

function saugotiEilute() {
	db.ref('puslapis/nustatymai/eilute/tekstas').set(t(e('eilutes-teksto-nustatymas')))
	db.ref('puslapis/nustatymai/eilute/nuoroda').set(t(e('eilutes-nuorodos-nustatymas')))
	ca(e('eilutes-saugojimas'), 'hidden')
}
function sudetiLaikus() {
	for(pirma_birzu of nustatymai.laikai.pirma.birzai) {
		add(e('pirma_birzai'), ec({cl: 'pb1 laikas_valanda', a: { contenteditable: 'true', lokacija: 'birzai', tipas: 'pirma'}, t: pirma_birzu}) )
	}
	for(paskutine_birzu of nustatymai.laikai.paskutine.birzai) {
		add(e('pask_birzai'), ec({cl: 'pb1 laikas_valanda', a: { contenteditable: 'true', lokacija: 'birzai', tipas: 'paskutine'}, t: paskutine_birzu}) )
	}
	for(pirma_vilniaus of nustatymai.laikai.pirma.birzai) {
		add(e('pirma_vilnius'), ec({cl: 'pb1 laikas_valanda', a: { contenteditable: 'true', lokacija: 'vilnius', tipas: 'pirma'}, t: pirma_vilniaus}) )
	}
	for(paskutine_vilniaus of nustatymai.laikai.paskutine.birzai) {
		add(e('pask_vilnius'), ec({cl: 'pb1 laikas_valanda', a: { contenteditable: 'true', lokacija: 'vilnius', tipas: 'paskutine'}, t: paskutine_vilniaus}) )
	}
	for(pirma_tablemonteball of nustatymai.laikai.pirma.tablemonteball) {
		add(e('pirma_tablemonteball'), ec({cl: 'pb1 laikas_valanda', a: { contenteditable: 'true', lokacija: 'tablemonteball' , tipas: 'pirma'}, t: pirma_tablemonteball}) )
	}
	for(paskutine_tablemonteball of nustatymai.laikai.paskutine.tablemonteball) {
		add(e('pask_tablemonteball'), ec({cl: 'pb1 laikas_valanda', a: { contenteditable: 'true', lokacija: 'tablemonteball', tipas: 'paskutine'}, t: paskutine_tablemonteball}) )
	}
}
function saugotiLaikus() {
	let laiko_nustatymai = { pirma: {birzai: [], vilnius: [], tablemonteball: []}, paskutine: {birzai: [], vilnius: [], tablemonteball: []} }
	for(laikutis of qea(e('darbo_laikas'), '.laikas_valanda')) {
		laiko_nustatymai[a(laikutis, 'tipas')][a(laikutis, 'lokacija')].push(parseInt(t(laikutis)))
	}
	db.ref('puslapis/nustatymai/laikai').set(laiko_nustatymai)
}

function rodytiAdminPuslapi(puslapio_pavadinimas, push_state = true) {

		for(psl of q('main').children) { psl.hidden = true }

		puslapis = qe(main, `[id=${puslapio_pavadinimas}]`) || add(q('main'), ec({cl: 'page p1', id: puslapio_pavadinimas}))

		ih(puslapis, '')
		puslapis.hidden = false

		if(puslapio_pavadinimas === 'rezervacijos') {
			const snd = siandien()
			fs.collection('rezervacijos').where('lokacija', '==', dg('lokacija')).where('diena', '>=', `${snd.slice(2,4)}${snd.slice(5,7)}${snd.slice(8,10)}`).orderBy('diena').onSnapshot(snap => {
				ih(e('rezervacijos'), '')
	    		snap.forEach(rez => {
	    			let rezervacija = rez.data()
	    			let elementas = ec({a: {class: 'rezervacija'}})
					add(e('rezervacijos'), elementas)
	    			ih(elementas,
	    			`<div class="rezervacijos-informacija">
	        			<div class="f fw pt06">
	        				<div class="ikona"><span class="m calendar-date"></span> <strong>${rezervacija.diena.slice(0,2)}-${rezervacija.diena.slice(2,4)}-${rezervacija.diena.slice(4,6)}</strong></div>
	        				<div class="ikona"><span class="m clock-1"></span> <strong>${rezervacija.laikas.slice(0,2)}:${rezervacija.laikas.slice(2,4)}</strong></div>
	        			</div>
	        			
	        			<div class="f fw pt06">
	        				<div class="ikona"><span class="m hash-mark-2"></span> <strong>${rezervacija.nr}</strong></div>
							<div class="ikona"><span class="m golf-course-2"></span> <strong>${rezervacija.zaidimas.duobutes}</strong></div>
	        				<div class="ikona"><span class="m soccer-2"></span> <strong>${rezervacija.zaidejai}</strong></div>
	        				${rezervacija.zaidimas.cempionatas ? '<div class="ikona"><span class="m trophy"></span> <strong></strong></div>' : '<div class="ikona"><span class="m trophy-1"></span> <strong></strong></div>'}
	        			</div>

	        			<div class="f fw pt06">
	        				<div class="ikona"><span class="m account"></span> <strong>${rezervacija.kontaktas.vardas}</strong></div>
	        				<div class="ikona"><span class="m email-open-4"></span><a href="mailto:${rezervacija.kontaktas.el_pastas}">${rezervacija.kontaktas.el_pastas}</a></div>
	        				<div class="ikona"><span class="m phone-2"></span><a href="tel:${rezervacija.kontaktas.telefonas}">${rezervacija.kontaktas.telefonas}</a></div>
	        			</div>

	        			<div class="f fw pt06">
	        				<div class="ikona"><span class="m currency-euro-1"></span> <strong>${rezervacija.mokejimas.suma} / ${rezervacija.mokejimas.apmoketa} / ${rezervacija.mokejimas.liko_moketi}</strong></div>
	        			</div>

	        			<div class="f pt06">
	        				<div class="m f-comment"></div>
		        			<div class="admino-komentaras" contenteditable="true" oninput="cr(p(this).children[2], 'hidden')">${rezervacija.admin_komentaras ?? ''}</div>
		        			<div class="hidden"><span class="m confirm p1 mr08 pointer" onclick="fs.collection('rezervacijos').doc('${rez.id}').update({admin_komentaras: this.parentNode.parentNode.children[1].innerText}).then(() => this.remove())"></span></div>
		        		</div>

	        			<div class="f p1 pl2 action">
		        			<div class="ikona pointer" onclick="fs.collection('rezervacijos').doc('${rez.id}').update({patvirtinti: true})"><span class="m priority-low-1"></span>${rezervacija.statusas}</div>
		        		</div>

		        		<div class="f p1 pl2 action">
		        			<div onclick="rinktisTeiseja(this, '${rez.id}')" class="ikona pointer"><span class="m whistle-2"></span><span class="teisejo-vardas">${rezervacija.teisejas ? rezervacija.teisejas : '<span><i>-</i></span>'}</span></div>
		        		</div>
	    			</div>
	    			`)
	    		})
        })
		}

		else if (puslapio_pavadinimas === 'nustatymai') {

			add(e('nustatymai'), ec({id: 'teisejai'}))

			ih(e('teisejai'), `
				<div class="f ic">
					<h2 class="m0 p0">Teisėjai</h2>
					<div class="fc"><h2 class="m0 p1 pointer green" onclick="pridetiTeiseja()">+</h2><h2 class="m0 p1 pointer red" onclick="salintiTeisejus()">-</h2></div>
				</div>
				<div id="teiseju-sarasas" class="f fw mb3"></div>
			`)

			db.ref(`nustatymai/${dg('lokacija')}/teisejai`).on('value', t => {
				const teisejai = t.val()
				ih(e('teiseju-sarasas'), '')
				for(teisejas of teisejai) {
					add(e('teiseju-sarasas'), ec({e: 'div', a: { class: 'p1 fc teisejas' }, c: [{t: teisejas}]}))
				}
			})

			add(e('nustatymai'), ec({id: 'eilutes_nustatymai', cl: 'mt2 mb2'}))

			ih(e('eilutes_nustatymai'), `
				<div class="f ic">
					<h2 class="m0 p0">Eilutė</h2>
					<span id="eilutes-saugojimas" class="m confirm p1 mr08 pointer hidden" onclick="saugotiEilute()"></span>
				</div>
				<h5>Tekstas</h5>
				<div><div class="input" id="eilutes-teksto-nustatymas" contenteditable="true" oninput="cr(e('eilutes-saugojimas'), 'hidden')"></div>

				<h5 class="mt1">Nuoroda</h5>
				<div id="eilutes-nuorodos-nustatymas" contenteditable="true" class="input" oninput="cr(e('eilutes-saugojimas'), 'hidden')"></div>
			`)

			sdt(e('eilutes-teksto-nustatymas'), 'puslapis/nustatymai/eilute/tekstas')
			sdt(e('eilutes-nuorodos-nustatymas'), 'puslapis/nustatymai/eilute/nuoroda')

			add(e('nustatymai'), ec({id: 'laiku_nustatymai', cl: 'mt2 mb2'}))


			ih(e('laiku_nustatymai'), `
			<div class="f ic">
				<h2 class="m0 p0">Laikai</h2>
				<span id="saugojimas" class="m confirm p1 mr08 pointer" onclick="saugotiLaikus()"></span>
			</div>
				
			<div class="f" id="darbo_laikas" >

				<div class="px1 menesiai">
					<div class="pb1"><i>men.</i></div>
					<div class="pb1">Sausis</div>
					<div class="pb1">Vasaris</div>
					<div class="pb1">Kovas</div>
					<div class="pb1">Balandis</div>
					<div class="pb1">Gegužė</div>
					<div class="pb1">Birželis</div>
					<div class="pb1">Liepa</div>
					<div class="pb1">Rugpjūtis</div>
					<div class="pb1">Rugsėjis</div>
					<div class="pb1">Spalis</div>
					<div class="pb1">Lapkritis</div>
					<div class="pb1">Gruodis</div>
				</div>

				<div class="px1" id="pirma_birzai">
					<div class="pb1">Biržai</div>
				</div>

				<div class="px1" id="pask_birzai">
					<div class="pb1">Biržai</div>
				</div>

				<div class="px1" id="pirma_vilnius">
					<div class="pb1">Vilnius</div>
				</div>

				<div class="px1" id="pask_vilnius">
					<div class="pb1">Vilnius</div>
				</div>

				<div class="px1" id="pirma_tablemonteball">
					<div class="pb1">Tablemonteball</div>
				</div>


				<div class="px1" id="pask_tablemonteball">
					<div class="pb1">Tablemonteball</div>
				</div>

			</div>

			`)

			sudetiLaikus()

		}

		else if (puslapio_pavadinimas === 'grafikas') {
			ih(puslapis, `
			<div class="grafikas">
				<div class="fcc">
					<div class="f c ic" style="width: 100%;" id="dienos-pasirinkimas">
						<div class="p1 t15 pointer" onclick="vakar()"><</div>
						<div class="p1 t15 pointer" onclick="rinktisDiena()" id="dienos-tekstas"></div>
						<div class="p1 t15 pointer" onclick="rytoj()">></div>
					</div>
					<div class="fc hidden" id="menesio-pasirinkimas"> 
						<div class="p1 t15 pointer" onclick="menAtgal()"><</div>
						<div class="p1 t15 pointer" id="menesio-pavadinimas" onclick="nebesirinktiDienos()"></div>
						<div class="p1 t15 pointer" onclick="menKitas()">></div>
					</div>
					<div class="mb1" id="menesio-grafikas" hidden>
						<div class="savaite dienos" style="margin-bottom: 0.5em;">
							<div class="diena">P.</div>
							<div class="diena">A.</div>
							<div class="diena">T.</div>
							<div class="diena">K.</div>
							<div class="diena">Pn.</div>
							<div class="diena">Š</div>
							<div class="diena">S</div>
						</div>

						<div class="dienos" id="grafiko-menesio-dienos"></div>

						</div>
				</div>

				<div id="dienos-grafikas"></div>
			</div>
			`)
			rodytiDiena()
		}
}

var showing = false
const svg = e('svg')

function toggleAdminMenu() {

	if(!showing && editable_pages.includes(page_name)) {
		ih(admin, '')
		if(!editing_page) {
			add(admin, ec({e:'div', t: 'koreguoti', a: {class: 'admin-link', onclick: 'editPage();toggleAdminMenu()'}}))
		}
		else {
			add(admin, ec({e:'div', t: 'atstatyti', a: {class: 'admin-link fpilka', onclick: 'restorePage();toggleAdminMenu()'}}))
			add(admin, ec({e:'div', t: 'saugoti', a: {class: 'admin-link fzalia', onclick: 'savePage();toggleAdminMenu()'}}))
		}
	}

	admin.classList.toggle('show')
	svg.classList.toggle('rotate45')
	showing = !showing
}

function keistiLokacija() {
	e('aktyvi-lokacija').hidden = true
	e('lokacijos').hidden = false
}

function rinktisLokacija(elementas) {
	t(e('aktyvi-lokacija'), ag(elementas, 'pav'))
	grafiko_lokacija = ag(elementas, 'reiksme')
	e('lokacijos').hidden = true
	e('aktyvi-lokacija').hidden = false
	ds('lokacija', ag(elementas, 'reiksme'))
	if(page_name == 'grafikas') { rodytiDiena() }
}

//page editing
var editing_page = null

function editPage() {
	e('menu').hidden = true
	const page = qe(main, `[id=${page_name}]`)
	editing_page = page.innerHTML
	a(page, 'contenteditable', true)
}

function restorePage() {
	e('menu').hidden = false
	const page = qe(main, `[id=${page_name}]`)
	a(page, 'contenteditable', false)
	ih(page, editing_page)
	editing_page = null
}

function savePage() {
	e('menu').hidden = false
	const page = qe(main, `[id=${page_name}]`)
	a(page, 'contenteditable', false)
	db.ref('pages/'+page_name).set(page.innerHTML)
	editing_page = null
}

// GRAFIKAS 
	var minuciu_intervalas = 30

	const paskutine_menesio_diena = pmd(grafiko_metai, grafiko_menuo)

	var grafiko_diena = siandien_objektas().diena
	var grafiko_menuo = siandien_objektas().menuo
	var grafiko_metai = siandien_objektas().metai

	var laisvi_laikai = { }
	var rezervacijos = { }
	var kalendoriaus_irasai = { }
	var kalendoriaus_dienos = {}
	var statusai = {}

	function rodytiDiena() {
		t(e('dienos-tekstas'), `${grafiko_metai} ${tdn(grafiko_menuo)} ${tdn(grafiko_diena)} ${sdp(grafiko_metai, grafiko_menuo, grafiko_diena)}`)
		const gd = e('dienos-grafikas')
		a(gd, 'metai', `${grafiko_metai}`)
		a(gd, 'menuo', `${tdn(grafiko_menuo)}`)
		a(gd, 'diena', `${tdn(grafiko_diena)}`)
		ih(gd, '')
		for(val = pirma_valanda[dg('lokacija')][parseInt(grafiko_menuo)-1]; val <= paskutine_valanda[dg('lokacija')][parseInt(grafiko_menuo)-1]; val++) {
			for(min = 0; min < 60; min+= minuciu_intervalas) {
				let dienos_laikas = ec({ e: 'div', a: {class: 'intervalas', laikas: tdn(val) + tdn(min) }, c: [{e: 'div', a:{class: 'laikas'}, t: tdn(val) + ':' + tdn(min)}] })
				add(gd, dienos_laikas)
			}
		}
		pridetiRezervacijas()
		pridetiLaisvusLaikus()
		dg('lokacija') == 'birzai' ? pridetiKalendoriausIrasus() : null
	}

	function pridetiLaisvusLaikus() {
		const dienos_laikai = e('dienos-grafikas').children

		db.ref(`laisvi_laikai/${dg('lokacija')}/${grafiko_metai}/${tdn(grafiko_menuo)}/${tdn(grafiko_diena)}`).on('value', snap => {
			laisvi_laikai = snap.val()

			for(interval of dienos_laikai) {
				if(ag(interval, 'laikas') in laisvi_laikai) {
					qe(interval, '.laikas').style.borderColor = 'rgb(58,181,58)'
					a(qe(interval, '.laikas'), 'onclick', `db.ref('laisvi_laikai/${dg('lokacija')}/${grafiko_metai}/${tdn(grafiko_menuo)}/${tdn(grafiko_diena)}/${ag(interval, 'laikas')}').remove(); this.style.borderColor = 'rgb(222,0,0)'`)
				}
				else {
					qe(interval, '.laikas').style.borderColor = 'rgb(222,0,0)'
					a(qe(interval, '.laikas'), 'onclick', `db.ref('laisvi_laikai/${dg('lokacija')}/${grafiko_metai}/${tdn(grafiko_menuo)}/${tdn(grafiko_diena)}/${ag(interval, 'laikas')}').set(true); this.style.borderColor = 'rgb(58,181,58)'`)
				}
			}
		})
	}

	function pridetiRezervacijas() {
		fs.collection('rezervacijos')
		.where('lokacija', '==', dg('lokacija'))
		.where('diena', '==', `${grafiko_metai.slice(-2)}${tdn(grafiko_menuo)}${tdn(grafiko_diena)}`)
		.onSnapshot(snap => {
			snap.forEach(rez => {
				console.log(rez.id)
				let rezervacija = rez.data()
				let intervalas = qe(e('dienos-grafikas'), `[laikas='${rezervacija.laikas}']`)
				let rezervacijos_elementas = qe(intervalas, `[id="${rez.id}"]`) ?? add(intervalas, ec({ e: 'div', a: { class: 'rezervacija', id: rez.id } }))

				ih(rezervacijos_elementas, `
					<div class="eilute sa fw ic">
						<div class="ikona"><span class="m golf-course-1"></span><span class=" ">${rezervacija.zaidimas.duobutes}</span></div>
						<div class="ikona"><span class="m soccer-2"></span><span class=" ">${rezervacija.zaidejai}</span></div>
						<div class="ikona"><span class="m currency-euro-2"></span><span class=" ">${rezervacija.mokejimas.apmoketa}/${rezervacija.mokejimas.suma}</span></div>
						${rezervacija.zaidimas.cempionatas ? '<div class="ikona"><span class="m trophy"></span></div>' : '' }
						<div class="ikona"><span class="m phone-2"></span><a href="tel:${rezervacija.kontaktas.telefonas}"><span>${rezervacija.kontaktas.vardas}</span></a></div>
						<div class="ikona pointer"><span onclick="rinktisTeiseja(p(this), '${rez.id}')" class="m whistle-2"></span><span>${rezervacija.teisejas ? rezervacija.teisejas : '<i>rinktis</i>'}</span></div>
					</div>
				`)
			})
		})
	}

	function pridetiKalendoriausIrasus() {
		
		db.ref('calendar/items').on('value', snap => {
			kalendoriaus_irasai = snap.val()
			kalendoriaus_dienos = []
			for(id in kalendoriaus_irasai) {
				let irasas = kalendoriaus_irasai[id]

				if(irasas.status != 'cancelled') {
					let diena = irasas.start.dateTime.split('T')[0].split('-')[0] + irasas.start.dateTime.split('T')[0].split('-')[1]+ irasas.start.dateTime.split('T')[0].split('-')[2]
					let laikas = irasas.start.dateTime.split('T')[1].split(':')[0] + irasas.start.dateTime.split('T')[1].split(':')[1]

					if(kalendoriaus_dienos[diena] == undefined) { kalendoriaus_dienos[diena] = {} }
					if(kalendoriaus_dienos[diena][laikas] == undefined ) { kalendoriaus_dienos[diena][laikas] = [] }
					kalendoriaus_dienos[diena][laikas].push(irasas)
				}
			}
			let dienos_irasu_laikai = kalendoriaus_dienos[`${grafiko_metai}${tdn(grafiko_menuo)}${tdn(grafiko_diena)}`]
			if(dienos_irasu_laikai) {
				const eventai = qa('.eventas')
				for(eventas of eventai) {
					eventas.remove()
				}
				for(dienos_laikas in dienos_irasu_laikai) {
					for(iras of dienos_irasu_laikai[dienos_laikas]) {
						let intervalas = qe(e('dienos-grafikas'), `[laikas='${dienos_laikas}']`)
							let kalendoriaus_evento_elementas = ec({ e: 'div', a: { class: 'eventas', id: `${iras.id}` } })
							add(intervalas, kalendoriaus_evento_elementas)
							ih(kalendoriaus_evento_elementas, `
								<div class="">
									<div><b>${iras.summary}</b></div>
									<div>${iras.description ?? ''}</div>
								</div>
							`)
					}
				}
			}

		})
	}

	function rinktisDiena() {
		e('menesio-grafikas').hidden = false
		ca(e('dienos-pasirinkimas'),'hidden')
		cr(e('menesio-pasirinkimas'),'hidden')

		t(e('menesio-pavadinimas'), grafiko_metai + ' ' + menesiai[grafiko_menuo - 1])

		const menesio_dienos = e('grafiko-menesio-dienos')
		var tuscios_d = 0
		const prm_men_d = new Date(grafiko_metai, grafiko_menuo-1, 1)
		const pask_men_d = new Date(grafiko_metai, grafiko_menuo, 0).getDate()
		const sav_d = prm_men_d.getDay()

		if(sav_d == 0) { tuscios_d = 6 }
		else { tuscios_d = sav_d - 1 }

		ih(menesio_dienos, '')

		for(let i = 0; i < tuscios_d; i++) { add(menesio_dienos, ec({e: 'div', a: {class: 'diena'}, t:''})) } 

		for(let d = 1; d < pask_men_d+1; d++) {
			add(menesio_dienos, ec({e: 'div', a: {class: 'diena', onclick: 'pasirinktiDiena(this)', metai: grafiko_metai, menuo: tdn(grafiko_menuo), diena: tdn(d) }, t: d}))
		}

		if(grafiko_diena) {
			ca(qe(menesio_dienos, `[diena="${tdn(grafiko_diena)}"]`), 'siandien')
		}
	}


	function nebesirinktiDienos() {
		e('menesio-grafikas').hidden = true
		cr(e('dienos-pasirinkimas'),'hidden')
		ca(e('menesio-pasirinkimas'),'hidden')
	}

	function pasirinktiDiena(dienos_elementas) {
		e('menesio-grafikas').hidden = true
		cr(e('dienos-pasirinkimas'),'hidden')
		ca(e('menesio-pasirinkimas'),'hidden')
		grafiko_metai = ag(dienos_elementas, 'metai')
		grafiko_menuo = ag(dienos_elementas, 'menuo')
		grafiko_diena = ag(dienos_elementas, 'diena')
		rodytiDiena()
	}

	function vakar() {
		if(grafiko_diena == 1) {
			if(grafiko_menuo == 1) {
				grafiko_metai = parseInt(grafiko_metai) + 1
				grafiko_menuo = 12
				grafiko_diena = 31
			}
			else { 
				grafiko_diena = pmd(grafiko_metai, grafiko_menuo)
				grafiko_menuo = parseInt(grafiko_menuo) - 1
			}
		}
		else { grafiko_diena = parseInt(grafiko_diena) - 1}
		rodytiDiena()
	}

	function rytoj() {
		console.log(pmd(grafiko_metai, grafiko_menuo))
		if(pmd(grafiko_metai, grafiko_menuo) == grafiko_diena) {
			if(grafiko_menuo == 12) { 
				grafiko_metai = parseInt(grafiko_metai) + 1
				grafiko_menuo = 1
			}
			else {
				grafiko_menuo = parseInt(grafiko_menuo) + 1
			}
			grafiko_diena = 1
		}
		else { grafiko_diena++ }
		rodytiDiena()
	}


	// function atnaujintiMenesioGrafika() {
		
	// 	var pirma_dienos_valanda = pirma_valanda[dg('lokacija')][grafiko_menuo-1]
	// 	var paskutine_dienos_valanda = paskutine_valanda[dg('lokacija')][grafiko_menuo-1]

	// 	ih(e('grafiko-dienos'), '')

	// 	for(diena = 1; diena <= paskutine_menesio_diena; diena++) {
	// 		let dienos_juosta = ec({
	// 			e: 'div',
	// 			a: { class: 'fcc diena', diena: `${grafiko_metai.slice(2,4)}${tdn(grafiko_menuo)}${tdn(diena)}`},
	// 			c: [{e: 'div', a: {class: `savaites-diena`}, t: `${savaites_dienos[new Date(grafiko_metai, grafiko_menuo-1, diena).getDay()]}`},{e: 'div', a: {class: `dienos-data`}, t: tdn(grafiko_menuo) + '-' + tdn(diena)}
	// 				]
	// 		})

	// 		let dienos_rezervacijos = rezervacijos[dg('lokacija')][`${grafiko_metai.slice(-2)}${tdn(grafiko_menuo)}${tdn(diena)}`] ?? null

	// 		let dienos_rezervacijos_pagal_laika = {}

	// 		if(dienos_rezervacijos) {
	// 			dienos_rezervacijos.forEach(rez => {
	// 				dienos_rezervacijos_pagal_laika[rez.laikas] = rez
	// 			})
	// 		}

	// 		add(e('grafiko-dienos'), dienos_juosta)

	// 		for(valanda = 8; valanda <= 20; valanda++) {
	// 			for(m = 0; m < 60; m+=30) {
	// 				let dienos_laikas = ec({ e: 'div', a: {class: 'dienos-laikas', laikas: tdn(valanda) + tdn(m) }, t: tdn(valanda) + ':' + tdn(m) })

	// 				if([tdn(diena)] in laisvi_laikai[dg('lokacija')][tdn(grafiko_menuo)] && 
	// 					[tdn(valanda) + tdn(m)] in laisvi_laikai[dg('lokacija')][tdn(grafiko_menuo)][tdn(diena)] && laisvi_laikai[dg('lokacija')][tdn(grafiko_menuo)][tdn(diena)][tdn(valanda) + tdn(m)]== true) 
	// 				{ 
	// 					ca(dienos_laikas, 'laisva')
	// 					a(dienos_laikas, 'onclick', `db.ref('laisvi_laikai/${dg('lokacija')}/${grafiko_metai}/${tdn(grafiko_menuo)}/${tdn(diena)}/${tdn(valanda) + tdn(m)}').remove(); cr(this, 'laisva')`)
	// 				}
	// 				else if(dienos_rezervacijos && dienos_rezervacijos_pagal_laika[`${tdn(valanda)}${tdn(m)}`]) {
	// 					let rezzz = dienos_rezervacijos_pagal_laika[`${tdn(valanda)}${tdn(m)}`]
	// 					ca(dienos_laikas, 'rezervacija')
	// 					a(dienos_laikas, 'onclick', `rodytiRezervacija(${rezz})`)
	// 				}
	// 				else {
	// 					a(dienos_laikas, 'onclick', `db.ref('laisvi_laikai/${dg('lokacija')}/${grafiko_metai}/${tdn(grafiko_menuo)}/${tdn(diena)}/${tdn(valanda) + tdn(m)}').set(true); ca(this, 'laisva')`)
	// 				} 

	// 				add(dienos_juosta, dienos_laikas)
	// 			}
	// 		}
	// 	}
	// }

	function menAtgal() {
		if(grafiko_menuo != 1) { grafiko_menuo-- } else { grafiko_menuo = 12; grafiko_metai-- }
		grafiko_diena = null
		rinktisDiena()
	}

	function menKitas() {
		if(grafiko_menuo === 12) { grafiko_menuo = 1; grafiko_metai++} else { grafiko_menuo++ }
		grafiko_diena = null
		rinktisDiena()
	}

function patvirtintiRezervacija(id) {
	fs.collection('rezervacijos').doc(id).get().then(snap => {
		let reservation_data = snap.data()

		reservation_data['patvirtinti'] = true

		// auth.currentUser.updateProfile({displayName: 'Tadas'})

		snap.ref.update(reservation_data)

	})

}

function keistiRezervacija(id) {

}
function rinktisTeiseja(elementas, rezervacijos_id) {
	ih(elementas, '')
	ca(elementas, 'fw')
	db.ref(`nustatymai/${dg('lokacija')}/teisejai`).once('value', t => {
		const teisejai = t.val()
		for(teisejas of teisejai) {
			add(elementas, ec({e: 'div', cl: 'p1', t: teisejas, a: {onclick: `fs.collection('rezervacijos').doc('${rezervacijos_id}').update({teisejas: '${teisejas}'})`} }))
		}
	})
}

function pridetiTeiseja() {
	let teisejas = prompt('Teisejo vardas?')
	db.ref(`nustatymai/${dg("lokacija")}/teisejai/${e('teiseju-sarasas').children.length}`).set(teisejas)
}

function salintiTeisejus() {
	let teisejai = e('teiseju-sarasas').children
	for(teis in teisejai) {
		add(teisejai[teis], ec({cl: 'pl1 red pointer', t: 'X', a: {onclick: `db.ref('nustatymai/${dg("lokacija")}/teisejai/${teis}').remove()`}}))
	}
}
