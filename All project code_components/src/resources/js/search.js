const movie = req.body.movie || '';
if (movie.trim().length === 0) {
  res.status(400).json({
    error: {
      message: "Please enter a valid movie name",
    }
  });
  return;
}