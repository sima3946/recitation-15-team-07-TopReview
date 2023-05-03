function initializeContent(){
    let response = fetch('http://localhost:3000/movies');
    console.log(response.status)
    console.log('in initializeContent function');
}