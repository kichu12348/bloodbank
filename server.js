const path = require('path');
const express = require('express');

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));

// Routes
const mainRoutes = require('./routes/main');
const donorRoutes = require('./routes/donors');

app.use('/', mainRoutes);
app.use('/donors', donorRoutes);

// 404 handler
app.use((req, res) => {
	res.status(404).render('index', { groups: [], message: 'Page not found' });
});

// DB setup (drop, recreate, seed on each start), then start server
const { resetAndSeed } = require('./dbSetup');

const PORT = process.env.PORT || 3000;

resetAndSeed()
	.then(() => {
		app.listen(PORT, () => {
			console.log(`Server running on http://localhost:${PORT}`);
		});
	})
	.catch((err) => {
		console.error('Failed to initialize database:', err);
		process.exit(1);
	});

