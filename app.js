const express = require('express');
const path = require('path');
const session = require('express-session');
const http = require('http');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const app = express();


// Middleware

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname + '/public'));
const CHAT_MESSAGE_EVENT = 'chat message';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
const db = mysql.createConnection({

    host: 'localhost',
    user: 'root',
    password: '',
    database: 'testDB',
});

db.connect((err) => {
    if (err) throw err;
    console.log('Database connected!');
});

// Routes

app.get('/', (req, res) => {
    res.render('index', { title: 'G19 Programs' });
});
app.get('/video', (req, res) => {
    const videoPath = path.join(__dirname, 'your-video-file.mp4');
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
    }
});

app.get('/bioQuiz', (req, res) => {
    res.render('bioQuiz', { title: 'Bio 101 Quiz' });
});
app.get('/boxGame', (req, res) => {
    res.render('boxGame', { title: 'Box Game' });
});
app.get('/calculator', (req, res) => {
    res.render('calculator', { title: 'Calculator' });

});

app.get('/resume', (req, res) => {
    res.render('resume', { title: 'Resume' });
});


// Signup Route
app.get('/signup', (req, res) => {
    res.render('signup', { title: 'Sample Signup Page' });
});

app.post('/signup', (req, res) => {
    const { username, password, email } = req.body;
    const query = `INSERT INTO authuser (username, password, email) VALUES (?, ?, ?)`;
    db.query(query, [username, password, email], (err) => {
        if (err) throw err;
        res.redirect('/login');
    });
});


app.get('/login', (req, res) => {
    res.render('login', { title: ' Sample Login' });
});;


app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM authuser WHERE username = ? AND password = ?';
    db.query(sql, [username, password], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            const user = results[0];
            res.render('profile', { user });
        } else {
            res.send('Invalid username or password. <a href="/login">Try again</a>');
        }
    });
});

app.get('/profile', async (req, res) => {
    try {
        // Example: Check if the user is logged in
        if (!req.session || !req.session.username) {
            return res.redirect('/login'); // Redirect to login if not authenticated
        }

        const username = req.session.username;

        // Fetch additional data for the profile if needed
        const sql = 'SELECT * FROM authuser WHERE username = ?';
        const [rows] = await db.query(sql, [username]);

        if (rows.length === 0) {
            return res.redirect('/login'); // Redirect if user not found
        }

        const user = rows[0]; // Get user data from the database

        res.render('profile', {
            username: user.username,
            email: user.email,
            publicChatLink: 'publicChat'

        });

    } catch (error) {
        console.error('Error rendering profile:', error);
        res.status(500).send('Server Error');
    }
});


// Route for public chat
app.get('/publicChat', (req, res) => {
    res.render('publicChat');
});




// Socket.io connection
const { Server } = require('socket.io');
const { title } = require('process');
const server = http.createServer(app);
const io = new Server(server);
io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });


});

io.on(CHAT_MESSAGE_EVENT, (msg) => {
    io.emit(CHAT_MESSAGE_EVENT, msg);
});

app.listen(3000, "localhost");
console.log('Server is running ');








