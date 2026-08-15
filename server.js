import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'CHANGE_ME',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, httpOnly: true, sameSite: 'lax' }
}));

const CLIENT_ID = process.env.CLIENT_ID;
const REDIRECT_URI = process.env.REDIRECT_URI;

function base64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
}

app.get('/auth/deriv', async (req,res)=>{
  if (!CLIENT_ID || !REDIRECT_URI) return res.status(500).send('Missing OAuth configuration.');
  const verifier = base64url(crypto.randomBytes(48));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
  const state = base64url(crypto.randomBytes(24));
  req.session.verifier = verifier;
  req.session.state = state;

  const u = new URL('https://auth.deriv.com/oauth2/auth');
  u.searchParams.set('response_type','code');
  u.searchParams.set('client_id',CLIENT_ID);
  u.searchParams.set('redirect_uri',REDIRECT_URI);
  u.searchParams.set('scope','trade');
  u.searchParams.set('state',state);
  u.searchParams.set('code_challenge',challenge);
  u.searchParams.set('code_challenge_method','S256');
  res.redirect(u.toString());
});

app.get('/callback', async (req,res)=>{
  const {code,state,error} = req.query;
  if (error) return res.status(400).send('Deriv authorization was cancelled or failed.');
  if (!code || state !== req.session.state) return res.status(400).send('Invalid OAuth callback.');
  try {
    const body = new URLSearchParams({
      grant_type:'authorization_code',
      client_id:CLIENT_ID,
      code,
      code_verifier:req.session.verifier,
      redirect_uri:REDIRECT_URI
    });
    const r = await fetch('https://auth.deriv.com/oauth2/token',{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body
    });
    const data = await r.json();
    if (!r.ok || !data.access_token) return res.status(502).json(data);
    req.session.deriv = { accessToken:data.access_token, expiresIn:data.expires_in };
    delete req.session.verifier;
    delete req.session.state;
    res.redirect('/connected');
  } catch(e) {
    res.status(500).send('OAuth exchange failed.');
  }
});

app.get('/connected',(req,res)=>{
  res.send(`<!doctype html><html><body style="font-family:Arial;background:#07111f;color:white;padding:40px">
  <h1>Deriv connected</h1><p>Your authorization was successful.</p>
  <p>You can now return to Cipher Bett AI.</p></body></html>`);
});

app.get('/api/status',(req,res)=>res.json({connected:!!req.session.deriv}));

app.listen(process.env.PORT || 3000,()=>console.log('Cipher Bett backend running'));
