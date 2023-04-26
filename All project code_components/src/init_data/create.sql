CREATE TABLE IF NOT EXISTS users (
    userID SERIAL,
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60) NOT NULL

    );

CREATE TABLE Movies (
  movie_id INT PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  image_url VARCHAR(255)
);

CREATE TABLE MovieReviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  movie_id INT,
  review TEXT,
  sentimentScore INT,
  FOREIGN KEY (movie_id) REFERENCES Movies(movie_id)
);

