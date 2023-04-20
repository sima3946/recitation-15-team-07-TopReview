// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcrypt'); //  To hash passwords
const mysql = require('mysql');
const fetch = require('node-fetch');
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part B.
// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

app.set('view engine', 'ejs'); // set the view engine to EJS
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

// All API routes go here

app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

app.get('/', (req, res) => {
  res.render("pages/login");
});

app.get('/login', (req, res) => {
  res.render("pages/login");
});

app.get('/home', (req, res) => {
  res.render("pages/home");
});

app.post('/login', async (req, res) => {
  const query = `SELECT * FROM users WHERE username = '${req.body.username}';`;
  db.one(query)
  .then(async user => {
    const match = await bcrypt.compare(req.body.password, user.password)
    if (req.body.password == '' || req.body.password == 'undefined') {
      console.log("no password");
    }
    else if (match) {
      req.session.user = user;
      req.session.save();
      res.render('pages/home', {status: 200, message: 'Success'});
    }
    else {
      res.status(201).json({message: 'Invalid input'});
    }
  })
  .catch(err => {
    if (err.code == 0) {
      res.render("pages/login");
    }
    return console.log(err);
  });
});

app.get('/register', (req, res) => {
  res.render("pages/register");
});

app.post('/register', async (req, res) => {
  if (req.body.password == '') {
    password = null;
  }
  const hash = await bcrypt.hash(req.body.password, 10);
  const username = await req.body.username;
  const query = "INSERT INTO users (username, password) values ($1, $2);"
  if (req.body.password == '') {
    res.status(201).json({message: 'No input'})
    return
  }
  else {
    db.any(query, [username, hash])
    .then(async data => {
      res.render('pages/login', {status: 200, message: 'Success'});
      return
    })
    .catch(err => {
      res.render('pages/register', {status: 201, message: 'Username taken'});
      return
    });
  }
  
})


app.post('/userID', async (req, res) => {
  const query = `SELECT userID FROM users WHERE username = '${req.body.username}';`
  db.one(query)
  .then(async user => {
    const userID = await user.userid;
    res.status(200);
    res.json({userID: userID, message: 'Success'})
  })
  .catch(err => {
    res.status(201);
    res.json({message: 'Invalid username'});
  })
});


// GET Endpoint for retrieving movies from the TMDb API
app.get('/movies', async (req, res) => {
  try {
    const api_key = '32e03fbc1ac17bae20d12c4548e26ce8'; //Gunhi's tmdb API key
    let page = 1;
    let total_pages = 1;
    
    // Loop through all pages of popular movies
    while (page <= total_pages) {
      const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${'32e03fbc1ac17bae20d12c4548e26ce8'}&page=${page}`);
      const data = await response.json();
      
      // Insert movies into MySQL database
      data.results.forEach(movie => {
        const { id, title } = movie;
        const sql = `INSERT INTO Movies (movie_id, name) VALUES (?, ?);`;
        connection.query(sql, [id, title], (error, results) => {
          if (error) throw error;
        });
      });
      
      // Update page and total_pages variables
      page++;
      total_pages = data.total_pages;
    }
    
    res.send('Movies inserted into database successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error inserting movies into database');
  }
});

/* GET Endpoint for retrieving REVIEWS for movies from the TMDb API
          and inserting them into the MovieReviews table */
app.get('/reviews', async (req, res) => {
  try {
    const api_key = '32e03fbc1ac17bae20d12c4548e26ce8';
    const movies = await connection.query('SELECT movie_id FROM Movies');
    
    // Loop through each movie in the database
    for (const movie of movies) {
      const movie_id = movie.movie_id;
      const response = await fetch(`https://api.themoviedb.org/3/movie/${movie_id}/reviews?api_key=${'32e03fbc1ac17bae20d12c4548e26ce8'}`);
      const data = await response.json();
      
      // Insert movie reviews into MySQL database
      data.results.forEach(review => {
        const { id, content } = review;
        const sql = `INSERT INTO MovieReviews (movie_id, review) VALUES (?, ?);`;
        connection.query(sql, [movie_id, content], (error, results) => {
          if (error) throw error;
        });
      });
    }
    
    res.send('Movie reviews inserted into database successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error inserting movie reviews into database');
  }
});













// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
// module.exports = app.listen(3000);
app.listen(3000);
console.log('Server is listening on port 3000');