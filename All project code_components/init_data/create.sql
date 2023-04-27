CREATE TABLE IF NOT EXISTS users (
  userID SERIAL,
  username VARCHAR(50) PRIMARY KEY,
  password CHAR(60) NOT NULL
);

CREATE TABLE Movies (
  movie_id INT PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  image_url VARCHAR(255),
  year INT
);

CREATE TABLE TMDB_Reviews (
  review_id SERIAL PRIMARY KEY,
  movie_id INT,
  review TEXT,
  sentiment_score INT,
  FOREIGN KEY (movie_id) REFERENCES Movies(movie_id)
);


CREATE TABLE Letterboxd_Reviews (
  review_id SERIAL PRIMARY KEY,
  movie_id INT,
  review TEXT,
  sentimentScore INT,
  FOREIGN KEY (movie_id) REFERENCES Movies(movie_id)
);