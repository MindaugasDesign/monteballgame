const functions = require('firebase-functions/v1');
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.database()
const fs = admin.firestore()
admin.firestore().settings({ignoreUndefinedProperties:true})
const axios = require('axios')
const jwt = require('jsonwebtoken')

const montonio_api = 'https://stargate.montonio.com/api/orders'
const google_calendar_id = '609b695e2c21e70874a730fb987f3d1d292c46d8a09abad6a331b00af1ea3cf9@group.calendar.google.com'

const keys = {
  vilnius: '9cdf6755-a537-4d42-8357-480113a1c66a',
  birzai: '87167aa0-e2eb-470e-b126-34963941cbed'
}

const secrets = {
  vilnius: '1bH38Q95LXPTtxu62npLmlOn54jjAmhpz6gSltuX+Lmz',
  birzai: '0aIK5/MXxlcMQJ7Xxw6ubO4D5UxS+q6A9r8eDBWUBWL0'
}

exports.newPaymentIntent = functions.region('europe-west1').firestore.document("/paymentIntents/{id}").onCreate(async (snap, context) => {
  try {
    const payment = snap.data()

    const payload = {
      "accessKey": keys[payment.rezervacija.lokacija],
      "merchantReference": context.params.id,
      "returnUrl": "https://monteball.eu?p=rezervacijos_perziura&rid="+context.params.id,
      "notificationUrl": `https://europe-west1-monteball.cloudfunctions.net/paymentWebhooks?lokacija=${payment.rezervacija.lokacija}`,
      "currency": "EUR",
      "grandTotal": payment.to_pay,
      "locale": "lt",
      "payment": {
          "method": payment.type,
          "amount": payment.to_pay, 
          "currency": "EUR"
      },
      "billingAddress": {
          "firstName": payment.rezervacija.kontaktas.vardas,
          "email": payment.rezervacija.kontaktas.el_pastas,
          "phoneNumber": payment.rezervacija.kontaktas.telefonas
      },
    }

    const token = jwt.sign(payload, secrets[payment.rezervacija.lokacija], { algorithm: 'HS256', expiresIn: '60m' });

    console.log('posting to montonio at ' + new Date().toISOString(), payload)
    await axios.post(montonio_api, { data: token }).then(response => {
      console.log('got response from montonio ' + new Date().toISOString(), response.data)

      db.ref('paymentRedirects/' + context.params.id).set({ url: response.data.paymentUrl }).then(() => {
        console.log('updating payment intent')
        return snap.ref.update(response.data)
      })

    }).catch(err=> console.log(err))  
  } catch (error) { console.log(error)}
})

exports.paymentWebhooks = functions.region('europe-west1').https.onRequest(async (req, res) => {
  try {
  const token = req.body.orderToken
  const location = req.params.lokacija ?? req.query.lokacija

  const decoded = jwt.verify(token, secrets[location])
    admin.firestore().collection('paymentWebhooks').doc(decoded.merchantReference).set(decoded)
    if(decoded.paymentStatus === 'PAID') {
      admin.firestore().collection('paymentIntents').doc(decoded.merchantReference).get().then(snap => {
        const mokejimas = snap.data()
        var rezervacija = Object.assign({}, mokejimas.rezervacija)
        const simboliai = 'ABCDEFGHJKLMNOPRSTUV123456789'
        var kodas = ''
        for(i = 0; i < 4; i++) { kodas += simboliai.charAt(Math.floor(Math.random() * simboliai.length)) }
        rezervacija['nr'] = location == 'birzai' ? 'BM-' + kodas : 'VM-' + kodas
        rezervacija['statusas'] = 'nepatvirtinta'
        rezervacija['mokejimas']['apmoketa'] = decoded.grandTotal
        rezervacija['mokejimas']['liko_moketi'] = rezervacija.mokejimas.suma - decoded.grandTotal
        rezervacija['pridejimo_laikas'] = admin.firestore.FieldValue.serverTimestamp()
        admin.firestore().collection('rezervacijos').doc(decoded.merchantReference).set(rezervacija)
      })
    }
    res.status(200)
  }
  catch (error) { console.log(error)}
})

exports.newReservation = functions.region('europe-west1').firestore.document("/rezervacijos/{id}").onCreate((snap, context) => {
  try {
    const rezervacija = snap.data()

    let ref = rezervacija.zaidimas.zaidimas === 'tablemonteball' ? 'uzimti_laikai/tablemonteball' : 'uzimti_laikai/'+ rezervacija.lokacija + '/' + rezervacija.diena + '/' + rezervacija.laikas

    db.ref(ref).set(true)

    let email = rezervacija.lokacija === 'vilnius' ? 'vilnius@monteball.eu' : 'info@monteball.eu'

    admin.firestore().collection('mail').add({
      to: [email],
      message: {
        subject: 'Nauja rezervacija',
        html: `<div style="background-color: #151616;">
          <div style="background-color: #151616; font-size: 18px; font-family: sans-serif; color: #fff; line-height: 1.5em; padding: 2em; margin: auto; max-width: 700px; letter-spacing: 2px;">
          <h2 style="color: rgb(255,196,42); margin-top: 1.5em;">Rezervacija</h2>
          <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff; ">Numeris:</div><div style="font-weight: bold; color: #fff;">${rezervacija.nr}</div></div>
          <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff; ">Data:</div><div style="font-weight: bold; color: #fff;">${rezervacija.diena.slice(0,2)}-${rezervacija.diena.slice(2,4)}-${rezervacija.diena.slice(-2)}</div></div>
          <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff; ">Valanda:</div><div style="font-weight: bold; color: #fff;">${rezervacija.laikas.slice(0,2)}:${rezervacija.laikas.slice(2,4)}</div></div>
          <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff; ">Žaidėjai:</div><div style="font-weight: bold; color: #fff;">${rezervacija.zaidejai}</div></div>
          <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff; ">Žaidimas:</div><div style="font-weight: bold; color: #fff;">${rezervacija.zaidimas.pavadinimas}</div></div>
          <h2 style="color: rgb(255,196,42); margin-top: 1.5em;">Apmokėjimas</h2>
          <div style="color: #fff;">Suma ${rezervacija.mokejimas.suma}€</div>
          <div style="color: #fff;">Sumokėta ${rezervacija.mokejimas.apmoketa}€</div>
          <div style="color: #fff;">Liko mokėti: ${rezervacija.mokejimas.liko_moketi}€ </div>
          <h2 style="color: rgb(255,196,42); margin-top: 1.5em;">Kontaktas</h2>
          <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff; ">Vardas:</div><div style="font-weight: bold; color: #fff;">${rezervacija.kontaktas.vardas}</div></div>
          <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff; ">Telefonas:</div><a href="tel:${rezervacija.kontaktas.telefonas}" style="font-weight: bold; color: #fff;">${rezervacija.kontaktas.telefonas}</a></div>
          <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff; ">El. paštas:</div><a href="mailto:${rezervacija.kontaktas.el_pastas}" style="font-weight: bold; color: #fff;">${rezervacija.kontaktas.el_pastas}</a></div>
        </div>
      </div>`
      }
    })

    admin.firestore().collection('mail').add({
      to: [rezervacija.kontaktas.el_pastas],
      message: {
        subject: 'Rezervacija priimta',
        html: `<div style="background-color: #151616; width: 100%; margin: 0; padding: 0;">
        <div style="font-size: 18px; font-family: sans-serif; color: #fff; line-height: 1.5em; padding: 2em; margin: auto; max-width: 700px; letter-spacing: 2px;">
        <p style="color: #fff;">Labas!</p>
        <p style="color: #fff;">Rezervacija monteball.eu svetainėje sėkmingai apmokėta.</p>
        <p style="color: #fff;">Greitu metu gausite pranešimą apie patvirtinimą arba su jumis susisieksime ir aptarsime iškilusius klausimus.</p>
        <br>
        <h2 style="color: rgb(255,196,42); margin-top: 1.5em;">Rezervacija</h2>
        <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Numeris:</div><div style="font-weight: bold; color: #fff;">${rezervacija.nr}</div></div>
        <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Data:</div><div style="font-weight: bold; color: #fff;">${rezervacija.diena.slice(0,2)}-${rezervacija.diena.slice(2,4)}-${rezervacija.diena.slice(-2)}</div></div>
        <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Valanda:</div><div style="font-weight: bold; color: #fff;">${rezervacija.laikas.slice(0,2)}:${rezervacija.laikas.slice(2,4)}</div></div>
        <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Žaidėjai:</div><div style="font-weight: bold; color: #fff;">${rezervacija.zaidejai}</div></div>
        <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Variantas:</div><div style="font-weight: bold; color: #fff;">${rezervacija.zaidimas.pavadinimas}</div></div>
        <h2 style="color: rgb(255,196,42); margin-top: 1.5em;">Apmokėjimas</h2>
        <div style="color: #fff;">Suma ${rezervacija.mokejimas.suma}€</div>
        <div style="color: #fff;">Jūs sumokėjote ${rezervacija.mokejimas.apmoketa}€</div>
        <div style="color: #fff;">Likusi mokėtina suma: ${rezervacija.mokejimas.liko_moketi}€ </div>
        <h2 style="color: rgb(255,196,42); margin-top: 1.5em;">Jūsų informacija</h2>
        <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Vardas:</div><div style="font-weight: bold; color: #fff;">${rezervacija.kontaktas.vardas}</div></div>
        <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Telefonas:</div><div style="font-weight: bold; color: #fff;">${rezervacija.kontaktas.telefonas}</div></div>
        <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">El. paštas:</div><div style="font-weight: bold; color: #fff;">${rezervacija.kontaktas.el_pastas}</div></div>
        <h2 style="color: rgb(255,196,42); margin-top: 1.5em;">Mūsų kontaktai</h2>
        <div><a style="color: #fff; text-transform: uppercase; margin-top: 1em;" href="https://maps.app.goo.gl/Ty2TVZN4ztmHYwq87" target="blank">Biržų Monteball® aikštynas</a></div>
        <div><a style="color: #fff;" href="tel:+37065978169">+370 659 78169</a></div>
        <div><a style="color: #fff;" href="mailto:info@monteball.eu">info@monteball.eu</a></div>
        <div style="margin-top: 1em;"><a style="color: #fff; text-transform: uppercase;" href="https://maps.app.goo.gl/5cK6fRKXp2imao6y5" target="blank">Vilniaus Monteball® aikštynas</a></div>
          <div><a style="color: #fff;" href="tel:+37065667331">+370 656 67331</a></div>
          <div><a style="color: #fff;" href="mailto:vilnius@monteball.eu">vilnius@monteball.eu</a></div>
        </div>
        <div style="display: flex; justify-content: center;">
          <a style="background-color: rgb(255,196,42); color: #000; padding: 2em; margin: 2em auto; text-transform: uppercase;" href="https://monteball.eu?p=rezervacijos_perziura&rid=${context.params.id}"> Peržiūra puslapyje</a>
        </div>
      </div>`
      }
    })
  } catch (error) { console.log(error)}
})

exports.confirmedReservation = functions.region('europe-west1').firestore.document("/rezervacijos/{id}").onUpdate(async (change, context) => {
  try {
    const rezervacija = change.after.data()
    if(rezervacija.patvirtinti && !rezervacija.patvirtinta) {

      await admin.firestore().collection('mail').add({
        to: [rezervacija.kontaktas.el_pastas],
        message: {
          subject: 'Rezervacija patvirtinta!',
          html: 
          `<div style="background-color: #151616; font-size: 18px; font-family: sans-serif; color: #fff; line-height: 1.5em; padding: 2em; margin: auto; max-width: 700px; letter-spacing: 2px;">
          <p style="color: #fff;">Labas!</p>
          <p style="color: #fff;">Rezervacija ${rezervacija.nr} patvirtinta!</p>
          <br>
          <h2 style="color: rgb(255,196,42); margin-top: 1.5em;">Rezervacija</h2>
          <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Numeris:</div><div style="font-weight: bold; color: #fff;">${rezervacija.nr}</div></div>
          <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Data:</div><div style="font-weight: bold; color: #fff;">${rezervacija.diena.slice(0,2)}-${rezervacija.diena.slice(2,4)}-${rezervacija.diena.slice(-2)}</div></div>
          <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Valanda:</div><div style="font-weight: bold; color: #fff;">${rezervacija.laikas.slice(0,2)}:${rezervacija.laikas.slice(2,4)}</div></div>
          <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Žaidėjai:</div><div style="font-weight: bold; color: #fff;">${rezervacija.zaidejai}</div></div>
          <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Variantas:</div><div style="font-weight: bold; color: #fff;">${rezervacija.zaidimas.pavadinimas}</div></div>
          <h2 style="color: rgb(255,196,42); margin-top: 1.5em;">Apmokėjimas</h2>
          <div style="color: #fff;">Suma ${rezervacija.mokejimas.suma}€</div>
          <div style="color: #fff;">Jūs sumokėjote ${rezervacija.mokejimas.apmoketa}€</div>
          <div style="color: #fff;">Likusi mokėtina suma: ${rezervacija.mokejimas.liko_moketi}€ </div>
          <h2 style="color: rgb(255,196,42); margin-top: 1.5em;">Jūsų informacija</h2>
          <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Vardas:</div><div style="font-weight: bold; color: #fff;">${rezervacija.kontaktas.vardas}</div></div>
          <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">Telefonas:</div><div style="font-weight: bold; color: #fff;">${rezervacija.kontaktas.telefonas}</div></div>
          <div style="display: flex;"><div style="margin-right: 0.5em; color: #fff;">El. paštas:</div><div style="font-weight: bold; color: #fff;">${rezervacija.kontaktas.el_pastas}</div></div>
          <h2 style="color: rgb(255,196,42); margin-top: 1.5em;">Mūsų kontaktai</h2>
          <div><a style="color: #fff; text-transform: uppercase; margin-top: 1em;" href="https://maps.app.goo.gl/Ty2TVZN4ztmHYwq87" target="blank">Biržų Monteball® aikštynas</a></div>
          <div><a style="color: #fff;" href="tel:+37065978169">+370 659 78169</a></div>
          <div><a style="color: #fff;" href="mailto:info@monteball.eu">info@monteball.eu</a></div>
          <div style="margin-top: 1em;"><a style="color: #fff; text-transform: uppercase;" href="https://maps.app.goo.gl/5cK6fRKXp2imao6y5" target="blank">Vilniaus Monteball® aikštynas</a></div>
          <div><a style="color: #fff;" href="tel:+37065667331">+370 656 67331</a></div>
          <div><a style="color: #fff;" href="mailto:vilnius@monteball.eu">vilnius@monteball.eu</a></div>
          <div style="display: flex; justify-content: center;">
            <a style="background-color: rgb(255,196,42); color: #000; padding: 2em; margin: 2em auto; text-transform: uppercase;" href="https://monteball.eu?p=rezervacijos_perziura&rid=${context.params.id}"> Peržiūra puslapyje</a>
          </div>
        </div>`
        }
      }).then((emailas) => {

        change.after.ref.update({statusas: 'patvirtinta', patvirtinti: false})

      })

    } 
  } catch (error) { console.log(error)}
})
