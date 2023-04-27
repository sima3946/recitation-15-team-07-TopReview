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
  const query = `SELECT * FROM Movies LIMIT 6`
  db.any(query)
  .then(async movies => {
    let titles = ['', '', '', '', '', '']
    let image_urls = ['', '', '', '', '', '']
    let movie_ids = ['', '', '', '', '', '']
    for (let i = 0; i < 6; i++) {
      titles[i] = movies[i].name
      image_urls[i] = movies[i].image_url
      movie_ids[i] = movies[i].movie_id
    }
    res.render("pages/home", {names: titles, urls: image_urls, ids: movie_ids, status: 200, message: 'Success'});
  })
  .catch(err => {
    console.log(err);
  })
});

app.get('/review', (req, res) => {
  movieID = '';
  found = false;
  for (let i = 0; i < req.url.length; i++) {
    if (found == false) {
      if (req.url[i] == 'i' && req.url[i + 1] == 'd') {
        found = true;
        i++; i++;
      }
    }
    else {
      movieID += req.url[i]
    }
  }

  const queryMovies = `SELECT * FROM movies WHERE movie_id = '${movieID}';`
  const queryReviews = `SELECT * FROM MovieReviews WHERE movie_id = '${movieID}';`

  db.any(queryMovies)
  .then(dataMovies => {
    db.any(queryReviews)
    .then(dataReviews => {
      res.render("pages/review", {movie: dataMovies, reviews: dataReviews})
    })
    .catch(err2 => {
      console.log(err2)
    })
  })
  .catch(err1 => {
    console.log(err1)
  })
})

app.get('/profile', (req, res) => {
  res.render("pages/profile", {
    username: req.session.user.username,
    password: req.session.user.password,
  });
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
      res.redirect('/home');
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


const tmdb_apiKey = '32e03fbc1ac17bae20d12c4548e26ce8'; // Gunhi's TMDb API key

// Endpoint to retrieve movies from TMDB and store them in the Movies table
app.get('/movies', async (req, res) => {
  try {
    // Make initial API call to get total number of pages
    const initialResponse = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${tmdb_apiKey}&language=en-US&page=1`);
    const totalPages = initialResponse.data.total_pages;
    const moviesPerPage = initialResponse.data.results.length;

    // Loop through all pages of results and store movies in database
    for (let page = 1; page <= totalPages; page++) {
      const response = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${tmdb_apiKey}&language=en-US&page=${page}`);
      const movies = response.data.results;

      // Insert each movie into the Movies table
      for (let i = 0; i < movies.length; i++) {
        const movie = movies[i];
        const movieId = movie.id;
        const name = movie.title;
        const description = movie.overview;
        const imageUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;
        const year = parseInt(movie.release_date.substring(0, 4));

        // Insert movie into database
        await pool.query('INSERT INTO Movies (movie_id, name, description, image_url, year) VALUES ($1, $2, $3, $4, $5)', [movieId, name, description, imageUrl, year]);
      }
    }

    res.status(200).send('Movies successfully stored in database');
  } catch (error) {
    console.log(error)
  }
})

// API Key for Google Cloud Sentiment Analysis (gunhi)
const sentiment_api_key = 'AIzaSyBFJjk7mor-E9HL4hMyaFcRI0mdhLCZaTg';

// helper function to get sentiment score from Google Cloud's sentiment analysis API
async function getSentimentScore(review) {
  try {
    const response = await fetch(`https://language.googleapis.com/v1/documents:analyzeSentiment?key=${sentiment_api_key}`, {
      method: 'POST',
      body: JSON.stringify({
        document: {
          type: 'PLAIN_TEXT',
          content: review,
        },
        encodingType: 'UTF8',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.documentSentiment.score;
  } catch (error) {
    console.error(error);
    throw new Error('Error retrieving sentiment score');
  }
}


//gets all tmdb reviews
app.get('/tmdb-reviews', async (req, res) => {
  try {
    // Get all movies from database
    const movies = await pool.query('SELECT * FROM Movies');

    // Loop through each movie and get reviews from TMDB API
    for (const movie of movies.rows) {
      const response = await axios.get(`https://api.themoviedb.org/3/movie/${movie.tmdb_id}/reviews?api_key=${tmdb_apiKey}`);

      // Loop through each review and store in database
      for (const review of response.data.results) {
        // Perform sentiment analysis on review
        const sentimentResponse = await axios.post(`https://language.googleapis.com/v1/documents:analyzeSentiment?key=${sentiment_api_key}`, {
          document: {
            type: 'PLAIN_TEXT',
            content: review.content
          }
        });
        console.log(sentimentResponse);

        // Insert review and sentiment score into database
        await pool.query('INSERT INTO TMDB_Reviews (movie_id, review, sentiment_score) VALUES ($1, $2, $3)', [movie.movie_id, review.content, sentimentResponse.data.documentSentiment.score]);

      }
    }

    res.send('Successfully retrieved and stored TMDB reviews');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Endpoint to get Letterboxd reviews for movies already in database
app.get('/letterboxd/reviews', async (req, res) => {
  try {
    // Get movies from database
    const result = await pool.query('SELECT * FROM Movies');
    const movies = result.rows;
    
    // Loop through movies and get reviews
    for (const movie of movies) {
      // Make request to Letterboxd API to get reviews for movie
      const response = await axios.get(`https://api.letterboxd.com/api/v0.1/films/${movie.movie_id}/reviews?perpage=100`);
      const reviews = response.data.items;
      // Loop through reviews and insert into database with sentiment score
      for (const review of reviews) {
        const sentimentScore = await getSentimentScore(review.body);
        const values = [movie.movie_id, review.body, sentimentScore];
        await pool.query('INSERT INTO Letterboxd_Reviews (movie_id, review, sentiment_score) VALUES ($1, $2, $3)', values);
      }
    }
    res.send('Letterboxd reviews successfully retrieved and stored.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving and storing Letterboxd reviews.');
  }
});

          
app.get('/reviewInfo', async (req, res) => {
  const query1 = `SELECT * FROM MovieReviews`;
  const query2 = `SELECT * FROM MovieReviews ORDER BY movie_id ;`
  db.any(query1)
  .then(async movies => {
    console.log(movies);
  })
  .catch(err => {
    console.log(err);
  })
})

/*
async function sortReviewsBySentiment() {
  // Connect to the database and retrieve the reviews
  const connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute('SELECT sentiment_score FROM reviews');

  // Loop through the reviews and group them into bad, medium, and good categories based on their sentiment score
  const badReviews = [];
  const mediumReviews = [];
  const goodReviews = [];

  for (const row of rows) {
    const sentimentScore = row.sentiment_score;

    if (sentimentScore === null || sentimentScore === undefined) {
      continue;
    }

    if (sentimentScore < -0.33) {
      badReviews.push(row);
    } else if (sentimentScore >= -0.33 && sentimentScore <= 0.33) {
      mediumReviews.push(row);
    } else {
      goodReviews.push(row);
    }
  }

  // Print the results
  console.log(`Bad reviews (${badReviews.length}):`);
  console.log(badReviews.map(review => review.id));

  console.log(`Medium reviews (${mediumReviews.length}):`);
  console.log(mediumReviews.map(review => review.id));

  console.log(`Good reviews (${goodReviews.length}):`);
  console.log(goodReviews.map(review => review.id));

  // Close the database connection
  await connection.end();
}

sortReviewsBySentiment();
*/
// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
// module.exports = app.listen(3000);
app.listen(3000);
console.log('Server is listening on port 3000');