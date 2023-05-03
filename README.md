# recitation-15-team-07-TopReview
## Application description
For movie lovers trying to get a comprehensive view of a movie without having to read through tens of thousands of reviews from several different platforms, TopReview is a review aggregation website that will gather review/summary data about movies from the open-source realm and give the general sentiment of a movie across different platforms such as IMDB, RottenTomatoes, LetterBox, and more. Unlike Metacritic, which only has numerical scores for movie and film criteria, TopReview will give users an all-encompassing text review.

## Contributors
- Gunhi Kim; guki7733 
- Tyler Kloster; tkloster01 
- Siranush Mazmandyan; sima3946 
- Alex Pham; avqpham01 
- Kira Velez; kive7791

## Technology Stack References

## Prerequisites to run the application
> Any software that needs to be installed to run the application
- Docker will be needed to run the application locally. In order to be able to run the application directly from its deployment,
one must enter the Virtual Machine to be able to access it, which can be done through Microsoft Azure. If you do not have MySQL, please download this as well. 

## Instructions on how to run the application locally.
To run the application locally, please ensure that Docker is running as well as you are inside of the Virtual Machine that is packaged with this application. Running Docker will allow the databases to be filled as well as the application to begin running. Please then go to the link provided within this document. 

If you are looking to run this application through an external editor (such as VSCode), make sure the repository is downloaded as well as Docker and MySQL. Then ensure that you are in the file that says "All project code_components", docker compose up, and visit localhost:3000. If you are not able to connect to the review database, please ensure that you have the API key for ChatGPT within your environment configuration.

## How to run the tests
At the bottom of the index.js jile, you will see

// module.exports = app.listen(3000);
app.listen(3000);

Uncomment the top line and then comment out the bottom line
The notes on what the tests do can be found in the file Lab_11_UAT_plans.txt

## Link to the deployed application
- Link to [Project Guideline](./Milestone%20Submissions/Project%20Guideline.pdf)
- Link to [Deployed Application](http://recitation-015-team-07.eastus.cloudapp.azure.com:3000/)
