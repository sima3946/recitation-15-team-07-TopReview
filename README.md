# recitation-15-team-07-TopReview
## Application description
Some of the highest-grossing movies to date are incredibly long. In fact, over the past few decades, the average length of movies has been increasing. With such a commitment, movie watchers need an easy way to know whether a movie is worth watching. This is often done by looking at summaries. More importantly, however, we tend to look at reviews for guidance. With each movie racking up hundreds of reviews, finding a movie is an issue. TopReview is dedicated to making the process easier. The process is made substantially easier by aggregating these hundreds of reviews into three categories - negative, neutral, and positive. Drawing from open-source sites such as TMDB and Letterbox, TopReview first sorts each review into one of these three categories using sentimental analysis. Google Cloud provides this analysis and is a natural language processor that deduces digital text's overall tone and underlying sentiments. Once categorized, the reviews are funneled into ChatGPT along with a prompt of our making to create a comprehensive summary for each category. If you are looking for movies to watch, look no further than TopReview. Finding movies has just been made easy.

## Contributors
- Gunhi Kim; guki7733 
- Tyler Kloster; tkloster01 
- Siranush Mazmandyan; sima3946 
- Alex Pham; avqpham01 
- Kira Velez; kive7791

## Technology Stack References
![Technology Stack References](/All%20project%20code_components/src/resources/img/Technology%20Stack.png)

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
