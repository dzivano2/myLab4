
const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const rawPassword = "MyBoy/2002"; 
const encodedPassword = encodeURIComponent(rawPassword);
const Fuse = require('fuse.js');



const mongoURI = `mongodb+srv://devenzivanovic:${encodedPassword}@cluster0.ecxmiby.mongodb.net/?retryWrites=true&w=majority`;
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

  const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    disabled: { type: Boolean, default: false },
    role: { type: String, default: 'user' } // 'user' or 'admin'
});

  
const User = mongoose.model('User', userSchema);


const heroSchema = new mongoose.Schema({
    id: Number,
    name: String,
    Gender: String,
    'Eye color': String,
    Race: String,
    'Hair color': String,
    Height: Number,
    Publisher: String,
    'Skin color': String,
    Alignment: String,
    Weight: Number,
    powers: Object // or a more detailed schema for powers
});
const reviewSchema = new mongoose.Schema({
    rating: { type: Number, required: true, min: 1, max: 5 }, // Rating out of 5
    review: { type: String, required: true }, // Review text
    reviewer: { type: String, ref: 'User' }, // Reference to the User
    createdAt: { type: Date, default: Date.now },
    flagged: { type: Boolean, default: false }  // Timestamp
});

const listSchema = new mongoose.Schema({
    name: String,
    description: { type: String, required: true }, 
    visibility: String,
    heroes: [heroSchema],
    creator: { type: String, ref: 'User' },
    lastEdited: { type: Date, default: Date.now },
    reviews: [reviewSchema]
});
const List = mongoose.model('List', listSchema);





  
const app = express();

// Session configuration
app.use(session({
  secret: 'theKey', 
  resave: false,
  saveUninitialized: false
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    { usernameField: 'username' }, 
    async (username, password, done) => {
      try {
        const user = await User.findOne({ email: username });
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }

        
        if (user.disabled) {
          return done(null, false, { message: 'Account disabled.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect password.' });
        }

        return done(null, user);
      } catch (e) {
        return done(e);
      }
    }
));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  
  
  
let lists={};

// Middleware to handle json data
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));


function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).send('User not authenticated');
  }
  

//password endpoints
app.post('/register', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).send('User already exists');
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ email, password: hashedPassword });
      await newUser.save();
  
      res.status(201).send('User registered successfully');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error in registering user');
    }
  });
  app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(400).send(info.message);
  
      req.logIn(user, (err) => {
        if (err) return next(err);
        return res.send('Logged in successfully');
      });
    })(req, res, next);
  });
  app.post('/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.log('Error : Failed to logout.', err);
        return res.status(500).send('Logout failed');
      }
      req.session.destroy(() => {
        res.clearCookie('connect.sid'); 
        res.status(200).send('Logged out successfully');
      });
    });
  });
  
 
  
// Endpoint to get the current user's role
app.get('/api/user/role', isAuthenticated, (req, res) => {
    if (!req.user) {
        return res.status(404).send('User not found');
    }
    // Send back the user's role
    res.json({ role: req.user.role });
});
app.get('/api/admin/users', isAuthenticated, async (req, res) => {
    // Check if the logged-in user is an admin
    if (req.user.role !== 'admin') {
        return res.status(403).send('Access denied');
    }

    try {
        const users = await User.find({}, 'email role -_id'); 
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.put('/api/admin/users/update-role', isAuthenticated, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send('Access denied');
    }

    const { userEmail, newRole } = req.body;
    const mainAdminEmail = 'dzivano2@uwo.ca'; 

    if (userEmail === mainAdminEmail) {
        return res.status(403).send('Cannot change role of main admin');
    }

    try {
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).send('User not found');
        }

        user.role = newRole;
        await user.save();

        res.send('User role updated successfully');
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.put('/api/admin/users/toggle-disabled', isAuthenticated, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send('Access denied');
    }

    const { userEmail } = req.body;

    try {
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Toggle the disabled status
        user.disabled = !user.disabled;
        await user.save();

        res.send(`User ${user.disabled ? 'disabled' : 'enabled'} successfully`);
    } catch (error) {
        console.error('Error toggling user disabled status:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.get('/api/superheroes/info', (req, res) => {
    const infoPath = path.join(__dirname, 'superhero_info.json');
    fs.readFile(infoPath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading superhero information');
            return;
        }
        res.json(JSON.parse(data));
    });
});

// Endpoint to read from superhero_powers.json
app.get('/api/superheroes/powers', (req, res) => {
    const powersPath = path.join(__dirname, 'superhero_powers.json');
    fs.readFile(powersPath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading superhero powers');
            return;
        }
        res.json(JSON.parse(data));
    });
});
//Endpoint to get heroes information and powers from json files

app.get('/api/superheroes/search', (req, res) => {
    const searchQuery = req.query.q.toLowerCase();
    const searchCriteria = req.query.filterBy            || 'name';
    
    
    const infoPath = path.join(__dirname, 'superhero_info.json');
    const powersPath = path.join(__dirname, 'superhero_powers.json');
  
    Promise.all([
        fs.promises.readFile(infoPath, 'utf8'),
        fs.promises.readFile(powersPath, 'utf8')
    ])
    .then(([infoData, powersData]) => {
        const superheroesInfo = JSON.parse(infoData);
        const superheroesPowers = JSON.parse(powersData);
  
        // Combine superhero information with their powers based on the name
        const combinedData = superheroesInfo.map(hero => {
            // Find the powers for the hero
            const heroPowersEntry = superheroesPowers.find(powerEntry => powerEntry.hero_names === hero.name);
            // Filter out the powers that are marked as 'True'
            const heroPowers = heroPowersEntry ? Object.keys(heroPowersEntry).reduce((powers, powerName) => {
                if (heroPowersEntry[powerName] === "True") {
                    powers.push(powerName);
                }
                return powers;
            }, []) : [];
  
            return { ...hero, powers: heroPowers };
        });
        const options = {
            
            keys: [searchCriteria],
            includeScore: true, 
            threshold: 0.3 
        };
        

  
        // Filter combined data based on search criteria
        const filteredSuperheroes = combinedData.filter(hero => {
            let fuse;
            let results;
        
            switch(searchCriteria) {
                case 'id':
                    
                    return hero.id === parseInt(searchQuery);
        
                case 'name':
                    fuse = new Fuse([hero], { keys: ['name'], threshold: 0.3 });
                    results = fuse.search(searchQuery);
                    return results.length > 0;
        
                case 'Race':
                    if (!hero.Race) return false;
                    fuse = new Fuse([hero], { keys: ['Race'], threshold: 0.3 });
                    results = fuse.search(searchQuery);
                    return results.length > 0;
        
                case 'Publisher':
                    if (!hero.Publisher) return false;
                    fuse = new Fuse([hero], { keys: ['Publisher'], threshold: 0.3 });
                    results = fuse.search(searchQuery);
                    return results.length > 0;
        
                case 'Power':
                    fuse = new Fuse(hero.powers, { threshold: 0.3 });
                    results = fuse.search(searchQuery);
                    return results.length > 0;
        
                default:
                    return true;
            }
        });
        
        //Send response with all the filtered heroes
        res.json(filteredSuperheroes);
    })
    .catch(err => {
        res.status(500).send('Error reading superhero data');
    });
  });

  //Endpoint to get superhero details for specific id, if id not entered and publisher selected, all publishers will be sent

  app.get('/api/superheroes/detail', (req, res) => {
    const superheroId = req.query.id ? parseInt(req.query.id) : null;
    const detailField = req.query.field.toLowerCase();

    const infoPath = path.join(__dirname, 'superhero_info.json');
    const powersPath = path.join(__dirname, 'superhero_powers.json');

    if (detailField === "publisher" && superheroId === null) {
        // Handling the request for all publishers
        fs.promises.readFile(infoPath, 'utf8')
            .then((infoData) => {
                const superheroesInfo = JSON.parse(infoData);
                const publisherSet = new Set();
                superheroesInfo.forEach(hero => {
                    if (hero.Publisher) {
                        publisherSet.add(hero.Publisher);
                    }
                });
                const allPublishers = Array.from(publisherSet);
                res.json({ Publisher: allPublishers });
            })
            .catch(err => {
                res.status(500).send('Error reading superhero data: ' + err.message);
            });
    } else {
        // Handling the request for a specific superhero detail
        fs.promises.readFile(infoPath, 'utf8')
            .then((infoData) => {
                const superheroesInfo = JSON.parse(infoData);
                const superhero = superheroesInfo.find(sh => sh.id === superheroId);

                if (!superhero && superheroId !== null) {
                    res.status(404).send('Superhero not found');
                    return;
                }

                if (detailField === 'powers') {
                    fs.promises.readFile(powersPath, 'utf8').then((powersData) => {
                        const superheroesPowers = JSON.parse(powersData);
                        const powersEntry = superheroesPowers.find(p => p.hero_names === superhero.name);
                        const powers = powersEntry ? Object.keys(powersEntry).filter(key => powersEntry[key] === "True") : [];
                        
                        res.json({ name: superhero.name, detail: powers });
                    });
                } else {
                    // Capitalize the first letter to match the JSON keys (e.g., 'Publisher')
                    const newDetailField = detailField.charAt(0).toUpperCase() + detailField.slice(1);
                    if (newDetailField in superhero) {
                        res.json({ name: superhero.name, detail: superhero[newDetailField] });
                    } else {
                        res.status(404).send(`Detail '${newDetailField}' not found for superhero with ID ${superheroId}`);
                    }
                }
            })
            .catch(err => {
                res.status(500).send('Error reading superhero data: ' + err.message);
            });
    }
});

//List Section
//-----------------------------------------------
app.post('/api/lists', isAuthenticated, async (req, res) => {
    const infoPath = path.join(__dirname, 'superhero_info.json');
    const powersPath = path.join(__dirname, 'superhero_powers.json');

    try {
        const { name, heroes, visibility, description } = req.body; // Including description in the request body
        const existingList = await List.findOne({ name, creator: req.user.email });
        if (existingList) {
            return res.status(400).send('A list with this name already exists.');
            ;
        }
        const userListsCount = await List.countDocuments({ creator: req.user.email })
        if (userListsCount >= 20) {
                return res.status(400).send('You have reached the maximum number of lists allowed.');
        }
        // Load hero information from JSON files
        const [infoData, powersData] = await Promise.all([
            fs.promises.readFile(infoPath, 'utf8'),
            fs.promises.readFile(powersPath, 'utf8')
        ]);
        const heroInfo = JSON.parse(infoData);
        const heroPowers = JSON.parse(powersData);

        // Process heroes and their powers
        const detailedHeroes = heroes.map(id => {
            const heroDetails = heroInfo.find(hero => hero.id === parseInt(id));
            const powersEntry = heroPowers.find(power => power.hero_names === heroDetails.name);
            const truePowers = powersEntry ? Object.keys(powersEntry)
                .filter(key => powersEntry[key] === 'True')
                .reduce((obj, key) => { obj[key] = true; return obj; }, {}) : {};

            return { ...heroDetails, powers: truePowers };
        });

        // Validate the description
        if (!description || typeof description !== 'string' || description.trim() === '') {
            return res.status(400).send('Description is required.');
        }

        // Create a new List document with the provided data
        const newList = new List({ 
            name, 
            visibility, 
            heroes: detailedHeroes, 
            creator: req.user.email, 
            description // Include the description
        });

        await newList.save(); // Save the new list to the database

        res.status(201).json(newList); // Respond with the created list
    } catch (error) {
        res.status(500).send('Error creating the list: ' + error.message);
    }
});




app.get('/api/lists/public', async (req, res) => {
  try {
    // Fetch the public lists along with the email of the user who created them
    const publicLists = await List.find({ visibility: 'public' })
      .sort({ lastEdited: -1 })
      .limit(10)
      // Populate the creator field with the user's email
      .lean(); // Convert mongoose documents to plain JavaScript objects

    // Structure the response data
    const formattedLists = publicLists.map(list => ({
      name: list.name,
      numberOfHeroes: list.heroes.length,
      heroes: list.heroes, // Return the full hero information
      creatorEmail: list.creator, // Use the populated email
      lastEdited: list.lastEdited,
      description:list.description
      
    }));

    res.json(formattedLists);
  } catch (error) {
    res.status(500).send('Error fetching public lists: ' + error.message);
  }
});
app.get('/api/lists/private', isAuthenticated, async (req, res) => {
    try {
        // Assuming the user's email is part of the user object after authentication
        const userEmail = req.user.email;
        console.log('Logged in user email:', userEmail);

        // Fetch all lists where the creator field matches the logged-in user's email
        const userLists = await List.find({ creator: userEmail }).lean();
        console.log('Found user lists:', userLists);

        if (!userLists.length) {
            console.log('No lists found for user with email:', userEmail);
            // Changed from sending a 404 to sending an empty array to maintain consistency with RESTful practices
            res.json([]); // Send an empty array if no lists are found
        } else {
            res.json(userLists); // Send the found lists
        }
    } catch (error) {
        console.error('Error fetching user lists for email:', userEmail, error);
        res.status(500).send('Error fetching user lists: ' + error.message);
    }
});



  


 
  //Endpoint to get detials for each ID
  app.get('/api/lists/details/:name', (req, res) => {
    const listName = req.params.name;
    if (!lists[listName]) {
      return res.status(404).send('List does not exist.');
    }
  
    // Paths to the JSON files
    const infoPath = path.join(__dirname, 'superhero_info.json');
    const powersPath = path.join(__dirname, 'superhero_powers.json');
  
    // Read the JSON files and find details for each superhero ID
    Promise.all([
        fs.promises.readFile(infoPath, 'utf8'),
        fs.promises.readFile(powersPath, 'utf8')
    ])
    .then(([infoData, powersData]) => {
        const superheroesInfo = JSON.parse(infoData);
        const superheroesPowers = JSON.parse(powersData);
  
        const superheroDetails = lists[listName].map(id => {
            const superheroInfo = superheroesInfo.find(hero => hero.id === parseInt(id));
            if (!superheroInfo) {
              return null; // Handle case where superhero ID is not found
            }
            const superheroPowersEntry = superheroesPowers.find(powerEntry => powerEntry.hero_names === superheroInfo.name);
            const heroPowers = superheroPowersEntry ? Object.keys(superheroPowersEntry).filter(key => superheroPowersEntry[key] === "True") : [];
  
            return { ...superheroInfo, powers: heroPowers };
        }).filter(detail => detail != null); // Filter out any null details
  
        res.status(200).json(superheroDetails);
    })
    .catch(err => {
        res.status(500).send('Error reading superhero data: ' + err.message);
    });
  });
  


// Endpoint to delete a list
app.delete('/api/lists/:name', isAuthenticated, async (req, res) => {
    try {
        const listName = req.params.name;
        const userEmail = req.user.email; // Or use user._id if it's being stored as ObjectId

        // Delete the list by name and the creator's email
        const result = await List.findOneAndDelete({
            name: listName,
            creator: userEmail // Make sure this matches how you're storing the creator field
        });

        if (!result) {
            return res.status(404).send('List not found or you do not have permission to delete it.');
        }

        res.status(200).send(`List '${listName}' has been deleted.`);
    } catch (error) {
        console.error('Error deleting list:', error);
        res.status(500).send('Error deleting list: ' + error.message);
    }
});
app.put('/api/lists/edit/:listName', isAuthenticated, async (req, res) => {
    const decode = decodeURIComponent(req.params.listName);
    const listName = decode;
    const { name, heroes, visibility, description } = req.body;
    const infoPath = path.join(__dirname, 'superhero_info.json');
const powersPath = path.join(__dirname, 'superhero_powers.json');

    try {
        const listToUpdate = await List.findOne({ name: listName, creator: req.user.email });
        if (!listToUpdate) {
            return res.status(404).send('List not found.');
        }

        // Load hero information from JSON files
        const [infoData, powersData] = await Promise.all([
            fs.promises.readFile(infoPath, 'utf8'),
            fs.promises.readFile(powersPath, 'utf8')
        ]);
        const heroInfo = JSON.parse(infoData);
        const heroPowers = JSON.parse(powersData);
        let heroIds = Array.isArray(heroes) ? heroes : heroes.split(',').map(id => parseInt(id.trim()));

        // Process heroes and their powers
        const detailedHeroes = heroIds.map(id => {
            const heroDetails = heroInfo.find(hero => hero.id === parseInt(id));
            const powersEntry = heroPowers.find(power => power.hero_names === heroDetails.name);
            const truePowers = powersEntry ? Object.keys(powersEntry)
                .filter(key => powersEntry[key] === 'True')
                .reduce((obj, key) => { obj[key] = true; return obj; }, {}) : {};

            return { ...heroDetails, powers: truePowers };
        });

        listToUpdate.name = name || listToUpdate.name;
        listToUpdate.heroes = detailedHeroes;
        listToUpdate.visibility = visibility || listToUpdate.visibility;
        listToUpdate.description = description || listToUpdate.description;

        await listToUpdate.save();
        res.json(listToUpdate);
    } catch (error) {
        res.status(500).send('Error updating list: ' + error.message);
    }
});
//-------------------------------------------------------



// Reviews Section
//----------------------------------
app.post('/api/lists/:listName/reviews', isAuthenticated, async (req, res) => {
    const listName = decodeURIComponent(req.params.listName);
    // Now use listName to find the list and add the review
    try {
        const list = await List.findOne({ name: listName, visibility: 'public' }).exec();
        if (!list) {
            return res.status(404).send('List not found or not public.');
        }
        // Add the review to the list
        
        list.reviews.push({ rating: req.body.rating, review: req.body.review, reviewer: req.user.email });
        await list.save();
        res.status(200).json({ message: 'Review added successfully', reviews: list.reviews });
    } catch (error) {
        res.status(500).send('Error adding review: ' + error.message);
    }
});
// When fetching reviews
app.get('/api/lists/reviews/:listName', async (req, res) => {
    const listName = decodeURIComponent(req.params.listName);

    try {
        const list = await List.findOne({ name: listName }).select('reviews');
        if (!list) {
            return res.status(404).send('List not found.');
        }

        res.status(200).json(list.reviews);
    } catch (error) {
        res.status(500).send('Error fetching reviews: ' + error.message);
    }
});
app.put('/api/admin/reviews/flag/:listName/:reviewId', isAuthenticated, async (req, res) => {
    const { listName, reviewId } = req.params;
    try {
        const list = await List.findOne({ name: listName });
        if (!list) {
            return res.status(404).send('List not found.');
        }

        const review = list.reviews.id(reviewId);
        if (!review) {
            return res.status(404).send('Review not found.');
        }

        // Toggle the flag status
        review.flagged = !review.flagged;

        // Save the parent document
        await list.save();
        res.json({ message: 'Review flag status updated', flagged: review.flagged });
    } catch (error) {
        console.error('Error updating review flag status:', error);
        res.status(500).send('Error updating review flag status: ' + error.message);
    }
});


app.get('/api/admin/reviews', isAuthenticated, async (req, res) => {
    try {
        
        const lists = await List.find({});
        const allReviews = lists.reduce((acc, list) => {
            return acc.concat(list.reviews.map(review => {
                return { ...review.toObject(), listName: list.name };
            }));
        }, []);

        res.json(allReviews);
    } catch (error) {
        res.status(500).send('Error fetching reviews: ' + error.message);
    }
});



//-------------------------------


  
  
  





//The port to run the server on
const PORT = process.env.PORT || 3001;

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
