var express = require('express');
var app=express();
app.use(express.static('public'));
var passwordHash = require('password-hash');

const ejs = require('ejs');
const bp = require('body-parser');
const axios = require('axios');
app.use(bp.json())
app.use(bp.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Filter} = require('firebase-admin/firestore');
var serviceAccount = require("./key.json");
const bodyParser = require('body-parser');

initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();
//from home to signin page
 
app.get('/', (req,res) => {
    res.sendFile(__dirname + '/public/' + 'home.html');
});

app.post('/signinsubmit', (req, res) => {
  console.log(req.body);

  db.collection('user')
  .where(
    Filter.or(
      Filter.where('Email','==',req.body.Email),
      Filter.where('password','==',req.body.password)
    )
  )
  .get()
  .then((docs) => {
    if (docs.size > 0) {
      res.send("hey already you have account with either this email or password");
    }
    else {
    db.collection('user')
      .add({
        FirstName: req.body.fname,
        SecondName: req.body.lname,
        Email: req.body.Email,
        Password: passwordHash.generate(req.body.password),
        Confirm_Password: req.body.pwd1
      })
      .then(() => {
      //login page
        res.sendFile(__dirname + '/public/' + 'login.html');
      })
      .catch(() => {
        res.send('something went wrong');
      });
    }
  });
});

app.post('/loginsubmit', function (req, res) {
 
   db.collection('user')
   .where('Email','==',req.body.email)
   .get()
   .then((docs) => {
    let verified = false;
    docs.forEach((doc) => {
      verified = passwordHash.verify(req.body.password, doc.data().Password);

     });
     if (verified) {
      res.render('weather.ejs',{ city: '', temperature: '', humid: '', windspeed: '', uvradiation: '' });
      console.log(verified);
     } else {
        res.send('fail');
        console.log(verified);
     }
   });
 });

 app.post('/dashboard', (req, res) => {
  const location = req.body.loc;
  const apiurl = `http://api.weatherapi.com/v1/current.json?key=c510634008e143e2b8b61403231509&q=${location}&aqi=no`;
  axios.get(apiurl).then((response) => {
    const data = response.data;
    const temp = data.current.temp_c;
    const hum = data.current.humidity;
    const ws = data.current.wind_kph;
    const uv = data.current.uv;
    res.render('weather.ejs', { city: location, temperature: temp, humid: hum, windspeed: ws, uvradiation: uv});
    console.log(location);
    console.log(data);
    console.log(temp);
    console.log(hum);
    console.log(ws);
    console.log(uv);
  })
    .catch((error) => {
      console.log(error.message);
    })
});



app.listen(3000, () => {
  console.log('server started');
});
