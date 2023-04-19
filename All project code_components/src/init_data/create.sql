CREATE TABLE IF NOT EXISTS users(
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60) NOT NULL
    );

CREATE TABLE Movies (
  movie_id INT PRIMARY KEY,
  name VARCHAR(255)
);

CREATE TABLE MovieReviews (
  review_id INT PRIMARY KEY,
  movie_id INT,
  review TEXT,
  FOREIGN KEY (movie_id) REFERENCES Movies(id)
);
