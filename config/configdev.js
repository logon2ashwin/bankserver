module.exports = {
    service: {
        host: 'http://localhost',
        port: 3002,
        apiversion: "v1",
	    baseurl: "http://localhost"
    },
    database: {
        host: 'localhost',
        port: 27017,
        db: 'bankapp',
        username: '',
        password: ''       
    },
    email: {
        username: "ashwin.95b@gmail.com",
        password: "",
        from: "ashwin.95b@gmail.com",
        service: "mailgun",
	host: "smtp.mailgun.org",
	port: 587,
	trackerimage: "/logo_tiny.png"
    },
	googlemaps:{
		key: "AIzaSyCAZS4vCDwjVZgs-COeAC0YQfJAZv8BQk4"
	}
};
