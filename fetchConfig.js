let fetchConf = null;

switch (window.location.hostname) {
    case "localhost":
        fetchConf = "http://localhost:3000";
        break;
    default:
        fetchConf = "https://ramdan-backend-check-f3ewbvc5a6akb5ac.israelcentral-01.azurewebsites.net";
        break;
}

export default fetchConf;
