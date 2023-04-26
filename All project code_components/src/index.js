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
  const query = `SELECT * FROM Movies LIMIT 5`
  db.any(query)
  .then(async movies => {
    let titles = ['', '', '', '', '']
    let image_urls = ['', '', '', '', '']
    for (let i = 0; i < 5; i++) {
      titles[i] = movies[i].name
      image_urls[i] = movies[i].image_url
    }
    res.render("pages/home", {names: titles, urls: image_urls});
  })
  .catch(err => {
    console.log(err);
  })
});

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
    const api_key = '32e03fbc1ac17bae20d12c4548e26ce8'; // Gunhi's TMDb API key
    let page = 1;
    let total_pages = 1;
    let count = 0;

    while (page <= total_pages && (count < 1)) {
      const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${api_key}&page=${page}`);
      const data = await response.json();
      const movies = data.results.map(movie => {
        return {
          id: movie.id,
          title: movie.title,
          description: movie.overview,
          image_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        };
      });
      
      const sql = 'INSERT INTO Movies (movie_id, name, description, image_url) VALUES ($1, $2, $3, $4)';
      for(let i = 0; i < movies.length; i++) {
        db.any(sql, [movies[i].id, movies[i].title, movies[i].description, movies[i].image_url])
        .then(async data => {
          res.status(200);
        })
        .catch(err => {
          console.log(err);
        })
      }
      

      page++;
      total_pages = data.total_pages;
      count++;
    }

    res.send('Movies inserted into database successfully!');
  }
  catch (error) {
    console.error(error);
    res.status(500).send('Error inserting movies into database');
  }
});

app.get('/movieInfo', async (req, res) => {
  const query = `SELECT * FROM Movies`;
  db.any(query)
  .then(async movies => {
    console.log(movies);
  })
  .catch(err => {
    console.log(err);
  })
});


/* GET Endpoint for retrieving REVIEWS for movies from the TMDb API
          and inserting them into the MovieReviews table */
app.get('/reviews', async (req, res) => {
  try {
    const api_key = '32e03fbc1ac17bae20d12c4548e26ce8';
    const movies = await db.query('SELECT movie_id FROM Movies');

    for (const movie of movies) {
      const movie_id = movie.movie_id;
      const response = await fetch(`https://api.themoviedb.org/3/movie/${movie_id}/reviews?api_key=${api_key}`);
      const data = await response.json();
      const reviews = data.results.map(review => {
        return {
          movie_id: movie_id,
          review: review.content,
          sentimentScore: -2
        };
      });

      const sql = 'INSERT INTO MovieReviews (movie_id, review, sentimentScore) VALUES ($1, $2, $3)';
      for (let i = 0; i < reviews.length; i++) {
        db.any(sql, [reviews[i].movie_id, reviews[i].review, reviews[i].sentimentScore])
        .then(data => {
          res.status(200);
        })
        .catch(err => {
          console.log(err);
        })
      }
    }

    res.send('Movie reviews inserted into database successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error inserting movie reviews into database');
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


app.get('/scores', async(req, res) => {
  try{
    
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT id, reviews FROM movies');
  
    // Loop through the movies and their reviews, and make an API call for each review
    for (const row of rows) {
      const movieId = row.id;
      const reviews = JSON.parse(row.reviews);
  
      for (const review of reviews) {
        const reviewText = review.text;
        const apiUrl = `${sentimentApiUrl}?text=${reviewText}`;
  
        try {
          const response = await axios.get(apiUrl);
          const sentiment = response.data.sentiment;
          console.log(`Sentiment analysis result for review '${reviewText}' in movie ${movieId}: ${sentiment}`);
          // Update the review in the database with the sentiment analysis result
          await connection.execute('UPDATE movies SET reviews = JSON_SET(reviews, CONCAT("$[", JSON_SEARCH(reviews, "one", ?), "].sentiment"), ?) WHERE id = ?', [reviewText, sentiment, movieId]);
        } catch (error) {
          console.error(`Error analyzing sentiment for review '${reviewText}' in movie ${movieId}: ${error}`);
        }
      }
    }
  } catch(error) {
    console.error(error);
    res.status(500).send('Error giving reviews sentiment score');
  }
});


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






// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
// module.exports = app.listen(3000);
app.listen(3000);
console.log('Server is listening on port 3000');