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
// const openai = require('openai'); //Make http requests from our server to openai.

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

app.use(express.static("resources"));
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
  res.json({ status: 'success', message: 'Welcome!' });
});

const tmdb_apiKey = '32e03fbc1ac17bae20d12c4548e26ce8';

// // Endpoint to retrieve movies from TMDB and store them in the Movies table
app.get('/movies', async (req, res) => {
  try {
    // Make initial API call to get total number of pages
    const initialResponse = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${tmdb_apiKey}&language=en-US&page=1`);
    const totalPages = initialResponse.data.total_pages;
    const moviesPerPage = initialResponse.data.results.length;

    // Loop through all pages of results and store movies in database
    for (let page = 1; page <= 100; page++) {
      const response = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${tmdb_apiKey}&language=en-US&page=${page}`);
      const movies = response.data.results;
      console.log('this is movie length')
      console.log(movies.length);

      // Insert each movie into the Movies table
      for (let i = 0; i < 10; i++) {
        const movie = movies[i];
        const movieId = movie.id;
        const name = movie.title;
        const description = movie.overview;
        const imageUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;
        // year has some undefined integer values that are coming in
        // const year = parseInt(movie.release_date.substring(0, 4));
        const tyear = new Date(movie.release_date).getFullYear();
        const year = (isNaN(tyear) ? new Date().getFullYear() : tyear);

        // Insert movie into database
        // changed pool to db
        try {
          await db.query('INSERT INTO Movies (movie_id, name, description, image_url, year) VALUES ($1, $2, $3, $4, $5)', [movieId, name, description, imageUrl, year]);
        } catch(error)
        {
          // console.log(error);
        }
      }
    }

    //res.status(200).send('Movies successfully stored in database');
    console.log("success in movie database");
  } catch (error) {
    console.log(error)
  }
})

//function should be able to load and populate the movie database before the user logs into home
// async function loadMovies(){
//   let response = await fetch('http://localhost:3000/movies');
//   let data = response.json();
//   return data;
// }

// .then(data => console.log(data))

app.get('/', async (req, res) => {
  res.render("pages/login");
});

app.get('/login', (req, res) => {
  res.render("pages/login");
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
      try {
        const query = `SELECT * FROM Movies LIMIT 6;`
        db.any(query)
        .then(async movies => {
          let titles = ['', '', '', '', '', '']
          let image_urls = ['', '', '', '', '', '']
          let movie_ids = ['', '', '', '', '', '']
          for (let i = 0; i < 6; i++) {
            titles[i] = movies[i].name;
            image_urls[i] = movies[i].image_url;
            movie_ids[i] = movies[i].movie_id;
          }
          res.render("pages/home", { names: titles, urls: image_urls, ids: movie_ids, status: 200, message: 'Success' });
        })
        .catch(err => {
          console.log(err);
        })
      } catch (error) {
        console.log(error);
      }
      //res.render('pages/home', {status: 200, message: 'Success'}); //need to pass the movie ids into here
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
    res.status(201).json({ message: 'No input' })
    return
  }
  else {
    db.any(query, [username, hash])
      .then(async data => {
        console.log("Success at login!")
        res.render('pages/login', { status: 200, message: 'Success' });
        return
      })
      .catch(err => {
        res.render('pages/register', { status: 201, message: 'Username taken' });
        return
      });
  }
})
app.get('/home', (req, res) => {

  try {
    const query = `SELECT * FROM Movies LIMIT 6;`
  db.any(query)
    .then(async movies => {
      let titles = ['', '', '', '', '', '']
      let image_urls = ['', '', '', '', '', '']
      let movie_ids = ['', '', '', '', '', '']
      for (let i = 0; i < 6; i++) {
        titles[i] = movies[i].name;
        image_urls[i] = movies[i].image_url;
        movie_ids[i] = movies[i].movie_id;
      }
      res.render("pages/home", { names: titles, urls: image_urls, ids: movie_ids, status: 200, message: 'Success' });
    })
    .catch(err => {
      console.log(err);
    })
  } catch (error) {
    console.log(error);
  }
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
  const queryReviews = `SELECT * FROM TMDB_Reviews WHERE movie_id = '${movieID}';`

  db.any(queryMovies)
    .then(dataMovies => {
      console.log('dataMovies'+dataMovies[0].name)
      db.any(queryReviews)
        .then(dataReviews => {
          console.log('dataMovies'+dataReviews)
          res.render("pages/review", { movie: dataMovies, reviews: dataReviews })
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

// app.post('/login', async (req, res) => {
//   const query = `SELECT * FROM users WHERE username = '${req.body.username}';`;
//   db.one(query)
//   .then(async user => {
//     const match = await bcrypt.compare(req.body.password, user.password)
//     if (req.body.password == '' || req.body.password == 'undefined') {
//       console.log("no password");
//     }
//     else if (match) {
//       req.session.user = user;
//       req.session.save();
//       res.render('pages/home', {status: 200, message: 'Success'});
//     }
//     else {
//       res.status(201).json({message: 'Invalid input'});
//     }
//   })
//   .catch(err => {
//     if (err.code == 0) {
//       res.render("pages/login");
//     }
//     return console.log(err);
//   });
// });

// app.get('/register', (req, res) => {
//   res.render("pages/register");
//   loadMovies().then(data => console.log(data));
//   console.log('here');
// });

// app.post('/register', async (req, res) => {
//   if (req.body.password == '') {
//     password = null;
//   }
//   const hash = await bcrypt.hash(req.body.password, 10);
//   const username = await req.body.username;
//   const query = "INSERT INTO users (username, password) values ($1, $2);"
//   if (req.body.password == '') {
//     res.status(201).json({ message: 'No input' })
//     return
//   }
//   else {
//     db.any(query, [username, hash])
//       .then(async data => {
//         console.log("Success at login!")
//         res.render('pages/login', { status: 200, message: 'Success' });
//         return
//       })
//       .catch(err => {
//         res.render('pages/register', { status: 201, message: 'Username taken' });
//         return
//       });
//   }
// })

app.post('/userID', async (req, res) => {
  const query = `SELECT userID FROM users WHERE username = '${req.body.username}';`
  db.one(query)
    .then(async user => {
      const userID = await user.userid;
      res.status(200);
      res.json({ userID: userID, message: 'Success' })
    })
    .catch(err => {
      res.status(201);
      res.json({ message: 'Invalid username' });
    })
});


// const tmdb_apiKey = '32e03fbc1ac17bae20d12c4548e26ce8'; // Gunhi's TMDb API key


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
    // changed pool to db
    const movies = await db.query('SELECT * FROM Movies');

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
        //changed pool to db
        await db.query('INSERT INTO TMDB_Reviews (movie_id, review, sentiment_score) VALUES ($1, $2, $3)', [movie.movie_id, review.content, sentimentResponse.data.documentSentiment.score]);


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
    // changed pool to db
    const result = await db.query('SELECT * FROM Movies');
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
        // changed pool to db
        await db.query('INSERT INTO Letterboxd_Reviews (movie_id, review, sentiment_score) VALUES ($1, $2, $3)', values);
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
      // call chatGPT(badReviews)
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