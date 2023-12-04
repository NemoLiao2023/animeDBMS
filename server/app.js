import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import * as db  from './database.js'
const app = express();


app.use(cors());
app.use(bodyParser.json());

app.get('/api/', (req, res) => {
    res.send('Hello World!');
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    console.log(email);
    try {
      const user = await db.findUserByEmail(email);
      //console.log(email);
      //console.log(user);
      if (!user) {
        return res.status(401).json({ message: 'The email is not found.' });
      }
  
    let isPasswordValid = false;
    if(user.user_password === password) isPasswordValid = true;

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'The email or password is not correct.' });
      }
      const payload = {
        id: user.user_id,
        email: user.user_email,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
      return res.status(200).json({ message: 'login success', user: user ,token: token});
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'server failed' });
    }
  });
  

app.get('/api/getProfile', async (req, res) => {
    console.log(req.headers.authorization);
    const token = req.headers.authorization;
    if(!token) return res.status(401).send('Token not found');

    jwt.verify(token, process.env.JWT_SECRET, async (err, authData) => {
        if(err) {
            if(err.name === 'TokenExpiredError') {
                return res.status(401).send('Token expired');
            }else{
                return res.status(401).send('Token is invalid');
            }
        }
        const id = authData.id;
        const profile = await db.getProfile(id);
        res.send(profile);

    });
});



app.get('/api/getAnimes', async (req, res) => {
    const animes = await db.getAnimes();
    res.send(animes);
});

app.get('/api/getAnime/:id', async (req, res) => {
    const id = req.params.id;
    const animes = await db.getAnime(id);
    res.send(animes);
});

app.get('/api/getAnimeDetails/:id', async (req, res) => {
    const id = req.params.id;
    //console.log(id);
    const anime_details = await db.getAnimeDetails(id);
    res.send(anime_details);
});

app.get('/api/getGenres', async (req, res) => {
    const genres = await db.getGenres();
    res.send(genres);
});

app.get('/api/getGenresCnt', async (req, res) => {
    const genres_cnt = await db.getGenresCnt();
    res.send(genres_cnt);
});

app.get('/api/getGenreName/:id', async (req, res) => {
    const id = req.params.id;
    const genre_name = await db.getGenreName(id);
    res.send(genre_name);
});

app.get('/api/getGenresCnt/:id', async (req, res) => {
    const id = req.params.id;
    const genre_cnt = await db.getGenresCnt(id);
    res.send(genre_cnt);
});

const port = process.env.PORT || 8800;

app.listen(port, () => {
    console.log('Server started on port '+ port);
});
