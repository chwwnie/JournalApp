// Import the Express.js framework
const express = require('express');

//code for body-parser (translates data)
const bodyParser = require('body-parser');
// Create an instance of the Express application. This app variable will be used to define routes and configure the server.
const app = express();

//Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true })); // passes data to server
// Specify the port for the server to listen on
const port = 3000;

//set EJS as the view engine
app.set('view engine', 'ejs');

app.use(express.static('views')); // Serve static files from the 'views' directory (for CSS, images, etc.)

let journalEntries = [];
let nextEntryId = 1;

//Define a route to render the index page
app.get('/', (req, res) => {
    res.render('index'); // sends to index.ejs
});

//Define a route to render the contact us page
app.get('/contact', (req, res) => {
    res.render('contactUs'); // sends to contactUs.ejs
});

app.post('/submit', (req, res) => {
    const { name, email, contact, comments } = req.body;
    
    res.render('submit', {name, email, contact, comments}); // sends to submit.ejs with entered data
});

// Add new journal entry
app.get('/entries', function(req, res) {
    res.render('addEntry'); // sends to addEntry.ejs
});

app.post('/entries', function(req, res) {
    const { date, mood, customMood, content } = req.body;
    // Handle the mood input, which can be a single value or an array of values
    const selectedMoods = Array.isArray(mood) ? mood : mood ? [mood] : []; 
    // Filter out 'Other' and add custom mood if provided
    const finalMoods = selectedMoods.filter(value => value !== 'Other');

    if (selectedMoods.includes('Other') && customMood && customMood.trim()) {
        finalMoods.push(customMood.trim());
    } // If no moods are selected, no mood will be shown

    const entryMood = finalMoods.length ? finalMoods : ['Unspecified'];
    const newEntry = { id: nextEntryId++, date, mood: entryMood, content };
    journalEntries.push(newEntry);
    res.redirect('/past-entries'); // Redirect to the page that shows past entries after adding a new entry
});

// View past journal entries
app.get('/past-entries', function(req, res) {
    // Recent sorting as the default 
    const sort = req.query.sort || 'recent';
    let entries = [...journalEntries]; // Creates the updated copy of the journal entries

    // Month sorting
    if (sort === 'month') {
        entries.sort((a, b) => {
            const aDate = new Date(a.date); // Convert date strings to Date objects for accurate comparison
            const bDate = new Date(b.date);
            
            const monthA = Number.isNaN(aDate.getTime()) ? 0 : aDate.getMonth(); // Handle invalid dates by treating them as month 0 (January)
            const monthB = Number.isNaN(bDate.getTime()) ? 0 : bDate.getMonth();
            
            if (monthA !== monthB) {
                return monthA - monthB; // Sorts by calendar month (Jan -> Dec)
            }
            return bDate - aDate; // If months are the same, sort by date (recent first)
        });
    } 

    // Puts the oldest entries firts
    else if (sort === 'oldest'){
        entries.sort((a, b) => a.id - b.id);
    }

    // Puts newest entries first (default)
    else {
        entries.sort((a, b) => b.id - a.id);
    }

    // Render page with sorted results
    res.render('pastEntries', { journalEntries: entries, sort: sort });
});

// Edit an existing past entry
app.get('/past-entries/:id/edit', function(req, res) {
    const entryId = parseInt(req.params.id, 10); // Convert the id from the URL parameter to an integer
    const entry = journalEntries.find(item => item.id === entryId); // Find the entry with the matching id

    // If entry is not found, return a 404 error
    if (!entry) {
        return res.status(404).send('Entry not found');
    }

    res.render('editEntry', { entry });
});

// Saves edited entry & redirect back to past entries page
app.post('/past-entries/:id/edit', function(req, res) {
    const entryId = parseInt(req.params.id, 10);
    const entry = journalEntries.find(item => item.id === entryId);

    if (!entry) {
        return res.status(404).send('Entry not found');
    }

    const { date, mood, customMood, content } = req.body;
    const selectedMoods = Array.isArray(mood) ? mood : mood ? [mood] : [];
    const finalMoods = selectedMoods.filter(value => value !== 'Other');
    if (selectedMoods.includes('Other') && customMood && customMood.trim()) {
        finalMoods.push(customMood.trim());
    }

    entry.date = date;
    entry.mood = finalMoods.length ? finalMoods : ['Unspecified'];
    entry.content = content;

    res.redirect('/past-entries');
});

// delete an entry
app.get('/past-entries/:id/delete', function(req, res) {
    const entryId = parseInt(req.params.id, 10);

    // filter out selected entry to delete
    journalEntries = journalEntries.filter(item => item.id !== entryId);
    res.redirect('/past-entries');
});


// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});