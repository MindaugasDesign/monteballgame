const firebaseConfig = {
	apiKey: "AIzaSyAfLPCPtYBlEtLdwgC-obftRjk_wWrLZ08",
	authDomain: "monteball.firebaseapp.com",
	projectId: "monteball",
	storageBucket: "monteball.appspot.com",
	messagingSenderId: "235083247530",
	appId: "1:235083247530:web:fe5c2ffe72dec557c4c5d3",
	measurementId: "G-5WENQK4RN1",
	databaseURL: "monteball-default-rtdb.europe-west1.firebasedatabase.app"
};
firebase.initializeApp(firebaseConfig)

const auth = firebase.auth()
const db = firebase.database()
const fs = firebase.firestore()
const st = firebase.storage()
const ga = firebase.analytics()

function sdt(el, ref) { 
    db.ref(ref).on('value', doc => { 
    t(el, `${doc.val()}`)
})}

//set variable as data from database
async function dd(ref, variable) {
	await db.ref(ref).get().then(snap => snap.val()).then(value => window[variable] = value)
}

// db.ref('viesi_nustatymai/laikai').set({pirma_valanda: { 
// 	vilnius: [10, 10, 10, 9, 8, 8, 8, 9, 9, 10, 10, 10], 
// 	birzai: [10, 10, 10, 9, 8, 8, 8, 9, 9, 10, 10, 10], 
// 	tablemonteball: [9,9,9,9,9,9,9,9,9,9,9,9]
// },
// paskutine_valanda: {
// 	vilnius: [15, 15, 16, 18, 20, 21, 21, 20, 18, 16, 15, 15], 
// 	birzai: [15, 15, 16, 18, 20, 21, 21, 20, 18, 16, 15, 15], 
// 	tablemonteball: [22,22,22,22,22,22,22,22,22,22,22,22]
// }})


// const cfg = firebase.remoteConfig()

// remoteConfig.fetchAndActivate().then(() => {
// 	const version = remoteConfig.getValue('version').asString();
// 	!dg('version') ? loadWebsite() : dg('version') === version ? loadWebsite(dgo('home')) : null
// 	const home = remoteConfig.getValue('home').asString();
// 	document.body.innerHTML = home;
// })

// auth.onAuthStateChanged(user => {
//     if(user) { 
//     	db.ref('styles/admin').once('value', (style) => { add(document.body, ec(style.val())) })
//     	db.ref('scripts/admin').once('value', (script) => { add(document.body, ec(script.val())) })
// 	}
// })

// newVisitor()

// function newVisitor() { loadAndShow(); }

// function loadAndShow() {
// 	dgo(page_name) ? 
// 	show(dgo(page_name)) : 	
// 	db.ref(`pages/${page_name}`).once('value', page => {
// 		const P = page.data
// 		P ? show(P) : console.log('page not found in the database')
// 	})
// }
