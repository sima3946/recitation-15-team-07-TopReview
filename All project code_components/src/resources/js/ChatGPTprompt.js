// //importing the new api key from openai
// import { Configuration, OpenAIApi } from "openai";
// // using the API key for the rest of the function
// const configuration = new Configuration({
//     apiKey: process.env.OPENAI_API_KEY,
// });
// const openai = new OpenAIApi(configuration);
// //checking that the open api key works 
// export default async function (req, res) {
//     if (!configuration.apiKey) {
//         res.status(500).json({
//             error: {
//                 message: "OpenAI API key not configured, please follow check the api keys right",
//             }
//         });
//         return;
//     }

//     try {
//         const completion = await openai.createCompletion({
//             //gpt-3.5-turbo and text-davinci-003 can understand and generate natural language. 
//             //gpt-3.5-turbo more cost effecitive 
//             model: "gpt-3.5-turbo",
//             prompt: generatePrompt(movie),
//             temperature: 0,
//         });
//         res.status(200).json({ result: completion.data.choices[0].text });
//     } catch (error) {
//         // Adjusts the error handling logic for our use cases
//         if (error.response) {
//             console.error(error.response.status, error.response.data);
//             res.status(error.response.status).json(error.response.data);
//         } else {
//             console.error(`Error with OpenAI API request: ${error.message}`);
//             res.status(500).json({
//                 error: {
//                     message: 'An error occurred during your request.',
//                 }
//             });
//         }
//     }
// };

// function generatePrompt(movie) {
//     const capitalizedMovie = Movies.name[0].toUpperCase() + Movies.name.slice(1).toLowerCase();
//     const MovieReviews = MovieReviews.sentimentScore;
//     if((${MovieReviews}) >= 70)
//     {
//         return `Please summarize theses movie reviews for ${capitalizedMovie}, ${MovieReviews}`;
//     }
//     else if (((${MovieReviews}) >= 30) && ((${MovieReviews}) <= 69))
//     {
//         return `Please summarize theses movie reviews for ${capitalizedMovie}, ${MovieReviews}`;
//     }else if (((${MovieReviews}) >= 0) && ((${MovieReviews}) <= 29))
//     {
//         return `Please summarize theses movie reviews for ${capitalizedMovie}, ${MovieReviews}`;
//     }else
//     {
//         return `Could not find a review for the movie: ${capitalizedMovie}`;
//     }
// }