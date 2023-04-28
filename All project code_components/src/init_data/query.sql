-- QUERY TO SORT REVIEWS ACCORDING TO SENTIMENT SCORE (BAD, MEDIUM, GOOD)
-- TMBD
    -- BAD
    SELECT review_id, review
        FROM TMDB_Reviews
        WHERE (sentiment_score >= -1 AND sentiment_score < -0.33);


    -- MEDIUM
    SELECT review_id, review
        FROM TMDB_Reviews
        WHERE (sentiment_score >= -0.33 AND sentiment_score <= 0.33);


    -- GOOD
    SELECT review_id, review
        FROM TMDB_Reviews
        WHERE (sentiment_score > 0.33 AND sentiment_score <= 1);

-- LETTERBOX

    -- BAD
    SELECT review_id, review
        FROM Letterboxd_Reviews
        WHERE (sentimentScore >= -1 AND sentimentScore < -0.33);


    -- MEDIUM
    SELECT review_id, review
        FROM Letterboxd_Reviews
        WHERE (sentimentScore >= -0.33 AND sentimentScore <= 0.33);


    -- GOOD
    SELECT review_id, review
        FROM Letterboxd_Reviews
        WHERE (sentimentScore > 0.33 AND sentimentScore <= 1);