function initializeContent(){
    let response = fetch('http://recitation-015-team-07.eastus.cloudapp.azure.com:3000/movies');
    console.log(response.status)
    console.log('in initializeContent function');
}