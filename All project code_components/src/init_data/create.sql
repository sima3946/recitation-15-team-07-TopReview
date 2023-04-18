CREATE TABLE IF NOT EXISTS users (
    userID SERIAL,
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60) NOT NULL
);