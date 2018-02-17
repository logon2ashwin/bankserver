module.exports = {
    service: {
        host: 'http://cricwormapi.clofus.com',
        port: 8000,
        apiversion: "v1",
	baseurl: "http://cricworm.clofus.com"
    },
    database: {
        host: 'localhost',
        port: 27017,
        db: 'cricworm',
        username: 'cricworm',
        password: '7Qwerty706',
        replicaset: false
    },
    email: {
        username: "support@clofus.com",
        password: "0182680c955d37f1ba707640aba9b0ed",
        from: "support@clofus.com",
        service: "mailgun",
		host: "smtp.mailgun.org",
		port: 587,
		trackerimage: "/logo_tiny.png"
    }
};
