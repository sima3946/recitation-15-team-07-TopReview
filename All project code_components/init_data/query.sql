/* QUERY TO SORT REVIEWS ACCORDING TO SENTIMENT SCORE (BAD, MEDIUM, GOOD) */
/* BAD */
SELECT review_id, review
    FROM MovieReviews
    WHERE (sentimentScore >= -1 AND sentimentScore < -0.33)


/* MEDIUM */
SELECT review_id, review
    FROM MovieReviews
    WHERE (sentimentScore >= -0.33 AND sentimentScore =< 0.33)


/* GOOD */
SELECT review_id, review
    FROM MovieReviews
    WHERE (sentimentScore > 0.33 AND sentimentScore <= 1)
