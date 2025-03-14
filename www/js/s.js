//attributes
function a(el,ke,va = null) {
    if(va) { el.setAttribute(ke, va) }
    if(ke == null) { return el.attributes }
    else if(typeof ke === 'object') {
        for(at in ke) { 
            typeof ke[at] === 'string' ? 
            el.setAttribute(at.replace(/_/g, '-'), ke[at]) :
            ke[at] == null ? 
            el.removeAttribute(at) : 
            el.setAttribute(at, ke[at]) 
        }
    }
    else return el.getAttribute(ke.replace(/_/g, '-'))
}
function ar(e, a) { e.removeAttribute(a) }
function ag(e, a) { return e.getAttribute(a) }
function ao(e, ao) { for(at in ao) { e.setAttribute(at, ao[at].toString().replace(/_/g, '-')) } }

function ih(e, html) { e.innerHTML = html }
function oh(e, html) { e.outerHTML = html }
function t(e, text = null) { if(text) { e.innerText = text } else return e.innerText }

//classes
function ca(e, c) { e.classList.add(c)}
function cr(e, c) { e.classList.remove(c)}
function ct(e, c) { e.classList.toggle(c)}
function ctt(e, c) { e.classList.toggle(c, true)}
function ctf(e, c) { e.classList.toggle(c, false)}
function cc(e, cl) {return e.classList.contains(cl)}

//element
function c(e) { return document.createElement(e)}
function cn(e) { return document.createElementNS(n,e)}
function ec(o) {
	var e = c(o.e || 'div')
	if(o.a) { ao(e, o.a) }
	if(o.cl) { a(e, 'class', o.cl) }
	if(o.id) { e.id = o.id }
	if(o.so) { a('style', so(e, o.so)) }
	if(o.s) { ss('style', o.s) }
	if(o.t) { t(e, o.t) }
	if(o.ih) { ih(e, o.ih) }
	if(o.oh) { oh(e, o.oh) }
	if(o.c && o.c.length) { for(ch of o.c) { add(e,ec(ch)) } }
	return e
}
function p(e) { return e.parentNode }
function pr(e) { return p(e).remove() }
function sb(e) { return e.parentNode.children }
function sbr(e) { var pe = p(e); ih(pe, ''); add(pe, e) }

//append
function add(p,c) { p.append(c); return c}
function adds(p,c) { p.prepend(c)}

//select
function e(id) { return document.getElementById(id) }
function q(qq) { return document.querySelector(qq) }
function qa(qq) { return document.querySelectorAll(qq) }
function qe(el, qq) { return el.querySelector(qq) }
function qea(el, qq) { return el.querySelectorAll(qq) }

//show/hide

function hf(el) { el.hidden = false }
function ht(el) { el.hidden = true }

//style
function s(e, sk, sv) { e.style[sk] = sv }
function ss(e, ss) { e.style = ss }
function so(sob) {
	var st = ''
	for(s in sob) { st += s + ':' + sob[s] + '; ' }
	return st.replace(/_/g, '-')
}
function se(sob) {
	const se = document.createElement('style')
	for(ss of sob) {
		var stl = ss.f + ' { '
		for(stl in ss.s) { stl += so(stl) }
		stl += '}'
		se.append(stl)
	}
	return se
}

//local storage
function ds(key,val) { return window.localStorage.setItem(key, val) }
function dg(key) { return window.localStorage.getItem(key) }
function dr(key) { return window.localStorage.removeItem(key) }
function dso(k,v) { return window.localStorage.setItem(k, JSON.stringify(v)) }
function dgo(k) { return JSON.parse(window.localStorage.getItem(k)) }
function duo(k, o) { var oo = dgo(k); for(p in o) { oo[p] = o[p] }; dso(k, oo) }

//events 
function ael(n, f) { addEventListener(n, f)}

//other
function sfa(a,k) { var ss = ''; for(i of a) { console.log(i); if(k) {ss+= i[k]} else { ss+= i }} return ss}

//params
function sp(p,v) { const url = new URL(window.location.href); url.searchParams.set(p, v); window.history.replaceState(null, null, url) }
function gp(p) { const url = new URL(window.location.href); return url.searchParams.get(p); }
function rp(p) { const url = new URL(window.location.href); url.searchParams.delete(p); window.history.replaceState(null, null, url);}

//scroll
function sv(el) { el.scrollIntoView({block: 'start'})}
function svs(el) { el.scrollIntoView({behavior: 'smooth'})}
function tdn(n) { return n.toString().padStart(2,"0")}

function notify(m) {
	const back = ec({
		e: 'div', 
		a: { style : 'background-color: rgba(0,0,0,0.4);z-index: 10000; position: fixed; top:0; bottom: 0; left: 0; right: 0; display: flex; justify-content: center; align-items: center; flex-direction: column; transition: all 200ms',
			onclick: 'this.remove()'}
	})
	const msg = ec({e: 'div', t: m, a: { style: 'border: 3px solid rgb(255,196,42); background-color: #000; color: #fff; padding: 1em;'}})
	add(back, msg)
	add(q('body'), back)
}

	function eo(e) {
	    var o = {}
	    o.e = e.nodeName
	    if(o.e === 'SCRIPT') {
			if(e.innerText && e.innerText.length) { o.t = e.innerText.replace(/\r?\n|\r/g, ";")}
	    }
	    else if(o.e === 'STYLE') {
			if(e.innerText && e.innerText.length) { o.t = e.innerText.trim().replace(/\r?\n|\r/g, " ")}
	    }

	    else {
		    if(e != undefined && e.attributes.length) {
		        o.a = {}
		        for(a of e.attributes) {o.a[a.name] = a.value}
		    }
		    if(e.children.length) {
		        o.c = []
		        for(ch of e.children) {o.c.push(eo(ch))}
		        const cln = e.cloneNode(true)
		        const cl = cln.children.length
		        for(var i = 0; i < cl; i++) { cln.children[0].remove() }
		        if(cln.innerText && cln.innerText.length) { o.t = cln.innerText.trim()}
		    }
		    else if(e.innerText && e.innerText.length ) { o.t = e.innerText.trim()}
	    }
	    return o
	}

	function post(url, data) {
	  return fetch(url, {method: "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
	}


	function sendContact() {
		const inputs =  qea(e('contact-form'), '.input')

		var contact = {}

		for(input of inputs) {
			contact[input.name] = input.value
		}

		post('', contact).then(() => {
			ih(e('contact-form'), 'Thank you for contacting us')
			window.localStorage.setItem('contacted', Date.now())
		})

	}

function siandien() {
	return new Date().toISOString().split('T')[0]
}

function siandien_objektas() {
	const data_splits = siandien().split('-')
	return { metai: data_splits[0], menuo: data_splits[1], diena: data_splits[2] }
}

//paskutine menesio diena
function pmd(metai, menuo) {
	return new Date(metai, menuo, 0).getDate()
}

function sdp(mt, men, d) { return ['Sekm.', 'Pirm.', 'Antr.', 'Treč.', 'Ketv.', 'Penkt.', 'Šešt.'][new Date(mt, men-1, d).getDay()]}



// var consent = window.localStorage.getItem('consent')

// consent ? loadPage() : showConsent()

function showConsent() {
	
	consent = {
		terms: false,
		conditions: false,
		marketing: false,
		email: false,
		phone: false
	}

	const consent_element = document.createElement('screen')
	
	console.log(consent_element)

	consent_element.innerHTML = 
	`
	<h2>Svetaines naudojimosi taisyklės</h2>

	<button onclick="saveConsent(this)">Sutinku</button>
	`

	document.body.append(consent_element)
}

function saveConsent(button) {
	consent.terms = new Date()
	consent.conditions = new Date()
	window.localStorage.setItem('consent', JSON.stringify(consent))
	button.parentNode.remove()
	loadPage()
}