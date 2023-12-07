import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './loggedContent.css'


const LoggedInUserContent = () => {
    //logged content
    
    const navigate = useNavigate();
    const [newListName, setNewListName] = useState('');
    
    const [newListHeroes, setNewListHeroes] = useState([]);
    const [newListVisibility, setNewListVisibility] = useState('private'); // default to 'public'
    const [userLists, setUserLists] = useState([]);
    const [expandedListId, setExpandedListId] = useState(null);
    const [newListDescription, setNewListDescription] = useState('');
    const [rating, setRating] = useState(null); // Default rating
    const [review, setReview] = useState('');
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewListName, setReviewListName] = useState('');
    const [reviews, setReviews] = useState({});
    
    const [userRole, setUserRole] = useState(''); // Add state for user role

    const [searchQuery, setSearchQuery] = useState('');
    const [numberOfResults, setNumberOfResults] = useState();
    const [filterBy, setFilterBy] = useState('id');
    const [superheroID, setSuperheroID] = useState('');
    const [detailField, setDetailField] = useState('Publisher');
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');
    const [detailResult, setDetailResult] = useState('');
    const [expandedHeroId, setExpandedHeroId] = useState(null);
    const [expandedReviewsListId, setExpandedReviewsListId] = useState(null);
    const initialListData = { name: '', heroes: [], visibility: 'private', description: '' };

    const [newName, setNewName] = useState('');
    const [heroes, setHeroes] = useState(initialListData.heroes.join(', ')); 
    const [visibility, setVisibility] = useState(initialListData.visibility);
    const [description, setDescription] = useState(initialListData.description);
    //many states
  

    

  
    useEffect(() => {
        fetchUserLists();
        fetchUserRole();
    }, []);
    const toggleReviewForm = () => {
        setShowReviewForm(!showReviewForm);
    };
    const toggleReviews = (listName) => {
        if (expandedReviewsListId !== listName) {
            fetchReviewsByName(listName);
        }
        setExpandedReviewsListId(expandedReviewsListId === listName ? null : listName);
    };



    const fetchUserRole = async () => {
        try {
            const response = await fetch('/api/user/role', {
                credentials: 'include' 
            });
            if (!response.ok) {
                throw new Error('Error fetching user role');
            }
            const data = await response.json();
            setUserRole(data.role); 
        } catch (error) {
            console.error('Error:', error);
        }
    };

    //unauthorized functionality
    //-------------------------
    const getSuperheroDetails = async () => {
        let url = `/api/superheroes/detail?field=${encodeURIComponent(detailField)}`;
        if (superheroID.trim() !== '') {
          url += `&id=${encodeURIComponent(superheroID.trim())}`;
        }
    
        try {
          const response = await fetch(url);
          const data = await response.json();
          if (detailField.toLowerCase() === "publisher" && superheroID.trim() === '') {
            const publisherList = data.Publisher.join(', ');
            setDetailResult(`<strong>All Publishers:</strong> ${publisherList}`);
    
          } else {
            setDetailResult(`${data.name} - ${JSON.stringify(data.detail)}`);
          }
        } catch (error) {
          console.error('Error:', error);
          setDetailResult('Error fetching details.');
        }
      };
      const handleSearchClick = async () => {
        setError(''); // Clear previous errors
        try {
          const response = await fetch(`/api/superheroes/search?q=${encodeURIComponent(searchQuery)}&filterBy=${encodeURIComponent(filterBy)}&softSearch=true`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setResults(data.slice(0, numberOfResults)); 
        } catch (err) {
          setError('Error fetching superheroes');
          console.error('Error:', err);
        }
      };
      const handleClearResults = () => {
        setSearchQuery('')
        setFilterBy('id')
        setResults([]);
        setNumberOfResults()
      };


    //-------------------------


    
    
    const trimmedListName = reviewListName.trim();
    const fetchUserLists = async () => {
        try {
            const response = await fetch('/api/lists/private', { 
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache',
                },
                credentials: 'include'
            });
            if (!response.ok) {
                console.error('Error fetching lists, status:', response.status);
                throw new Error(`Error fetching lists, status code: ${response.status}`);
            }
            const lists = await response.json();
            if (Array.isArray(lists)) {
                setUserLists(lists);
            } else {
                console.error('Expected an array for lists, but got:', lists);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };
    const handleAdminClick = () => {
        // Handle admin button click, e.g., navigate to admin page
        navigate('/admin');
    };
    
    const handleHeroesChange = (e) => {
        const heroIds = e.target.value.split(',')
                            .map(id => id.trim()); // Convert the input into an array of trimmed IDs
        setNewListHeroes(heroIds);
    };
    
    const toggleList = (id) => {
        setExpandedListId(expandedListId === id ? null : id);
      };
  
    const handleLogout = async () => {
      try {
        await fetch('/logout', { method: 'POST' });
        // Redirect to the main screen after successful logout
        navigate('/mainContent');
      } catch (error) {
        console.error('Logout failed:', error);
      }
    };
    const handleUpdateList = async () => {
        try {
            const response = await fetch(`/api/lists/edit/${encodeURIComponent(newName)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newName,
                    heroes: heroes,
                    visibility: visibility,
                    description: description
                })
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
    
            // Handle success, update state, etc.
        } catch (error) {
            console.error('Error updating list:', error);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const updatedList = {
          newName,
          heroes: heroes.split(',').map(hero => hero.trim()), // Convert string back to array
          visibility,
          description
        };
        handleUpdateList(updatedList); // Pass the updated list to the update function
    };


    const handleCreateList = async () => {
        try {
            const response = await fetch('/api/lists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newListName,
                    heroes: newListHeroes, 
                    visibility: newListVisibility,
                    description: newListDescription // Include the description
                })
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
    
            // Reset form and handle response
            setNewListName('');
            setNewListHeroes([]);
            setNewListVisibility('public');
            setNewListDescription(''); // Reset the description as well
    
            
    
        } catch (error) {
            console.error('Error creating list:', error);
        }
    };
    const submitReview = async (listName) => {
        try {
            const response = await fetch(`/api/lists/${encodeURIComponent(listName)}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ rating, review }),
                credentials: 'include' // for session cookies
            });
    
            if (!response.ok) {
                throw new Error('Failed to submit review');
            }
    
            setRating(5); // Reset to default rating
        setReview(''); // Clear the review text
        } catch (error) {
            console.error('Error submitting review:', error);
        }
    };
    const fetchReviewsByName = async (listName) => {
        try {
            const response = await fetch(`/api/lists/reviews/${encodeURIComponent(listName)}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const reviewsData = await response.json();
            setReviews(prevReviews => ({ ...prevReviews, [listName]: reviewsData }));
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };
 
    
    
    
    
    
    const deleteList = async (listName) => {
        try {
            const response = await fetch(`/api/lists/${encodeURIComponent(listName)}`, {
                method: 'DELETE',
                credentials: 'include', // for session cookies
            });
    
            if (response.ok) {
                // Remove the list from the state by name
                setUserLists(userLists.filter(list => list.name !== listName));
            } else {
                // Handle failed deletion
                console.error('Failed to delete the list:', response.status);
            }
        } catch (error) {
            console.error('Error deleting the list:', error);
        }
    };
    
  
    return (
      <div>
       
        <button onClick={handleLogout} className="logout-button">Logout</button>
            {/* Conditionally render the admin button */}
            {userRole === 'admin' && (
                <button onClick={handleAdminClick} className="admin-button">Admin Panel</button>
            )}
            <section className="search-section">
        <h1><strong>Super Hero Database</strong></h1>
        <p className='about-section'>Welcome to the Upgraded Experience feel free to create lists and reviews as you like!!!</p>
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            placeholder="Search..."
          />
          <input
            type="number"
            value={numberOfResults}
            onChange={(e) => setNumberOfResults(e.target.value)}
            placeholder="Number of results"
            min="1"
          />
          <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
            <option value="id">ID</option>
            <option value="name">Name</option>
            <option value="Race">Race</option>
            <option value="powers">Power</option>
            <option value="Publisher">Publisher</option>
          </select>
          <button onClick={handleSearchClick}>Search</button>
        </div>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="results-section">
  <h4>Search Results - </h4>
  <ul>
    {results.map((hero, index) => (
      <li key={index}>
        <h3 className='expand-information' onClick={() => setExpandedHeroId(hero.id === expandedHeroId ? null : hero.id)}>
          {hero.name} - {hero.Publisher}
        </h3>
        {expandedHeroId === hero.id && (
          <div>
            <p><strong>Gender:</strong> {hero.Gender}</p>
            <p><strong>Eye Color:</strong> {hero["Eye color"]}</p>
            <p><strong>Race:</strong> {hero.Race}</p>
            <p><strong>Hair Color:</strong> {hero["Hair color"]}</p>
            <p><strong>Height:</strong> {hero.Height === -99 ? 'N/A' : hero.Height + ' cm'}</p>
            <p><strong>Publisher: </strong> {hero.Publisher}</p>
            <p><strong>Skin Color:</strong> {hero["Skin color"] === "-" ? 'N/A' : hero["Skin color"]}</p>
            <p><strong>Alignment:</strong> {hero.Alignment}</p>
            <p><strong>Weight:</strong> {hero.Weight === -99 ? 'N/A' : hero.Weight + ' kg'}</p>
            <p><strong>Powers: </strong> {hero.powers.join(', ')}</p>
            <button onClick={() => window.open(`https://duckduckgo.com/?q=${encodeURIComponent(hero.name)}`, '_blank')}>
          Search on DDG
        </button>
          </div>

        )}
      </li>
    ))}
  </ul>
  {results.length > 0 && (
    <button onClick={handleClearResults} className="clear-button">
      Clear Results
    </button>)}
</section>

<section className="detail-section">
        <h3>Get Superhero Details</h3>
        <p><strong>(Leave Blank to view all publishers)</strong></p>
        <input
          type="text"
          value={superheroID}
          onChange={(e) => setSuperheroID(e.target.value)}
          placeholder="Enter Superhero ID..."
        />
        <select value={detailField} onChange={(e) => setDetailField(e.target.value)}>
          <option value="Publisher">Publisher</option>
          <option value="powers">Powers</option>
          <option value="Race">Race</option>
        </select>
        <button onClick={getSuperheroDetails}>Get Detail</button>
        <div id="detailResult">
        {detailResult && <p dangerouslySetInnerHTML={{ __html: detailResult }} />}
        </div>
      </section>
      

        
        <section className="create-list-section">
                <h3>Create New List</h3>
                <input
                    type="text"
                    value={newListName}
                    onChange={e => setNewListName(e.target.value)}
                    placeholder="Enter List Name..."
                />
                <input
                    type="text"
                    value={newListHeroes.join(', ')}
                    onChange={handleHeroesChange}
                    placeholder="Enter Hero IDs (comma-separated)..."
                />
                <input
                    value={newListDescription}
                    onChange={e => setNewListDescription(e.target.value)}
                    placeholder="Enter List Description..."
                    rows="3" 
                ></input>
                <select value={newListVisibility} onChange={e => setNewListVisibility(e.target.value)}>
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                    
                </select>
                
                <button onClick={handleCreateList}>Create List</button>
            </section>
            {/* Update List Section */}
            <section className="update-list-section">
                <h3>Update List</h3>
                <div>
                    <lable>List Name:</lable>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />
                </div>
                <div>
                    <lable>Heroes (comma-separated IDs):</lable>
                    <input
                        type="text"
                        value={heroes}
                        onChange={(e) => setHeroes(e.target.value)}
                    />
                </div>
                <div>
                    <lable>Visibility:</lable>
                    <select
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value)}
                    >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                    </select>
                </div>
                <div>
                    <lable>Description:</lable>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <button onClick={handleSubmit}>Save Changes</button>
            </section>

        <button onClick={toggleReviewForm}>
            {showReviewForm ? 'Cancel Review' : 'Submit Review'}
        </button>

    
        {showReviewForm && (
        <div>
            <h3>Review Form</h3>
            <input
            type="text"
            value={reviewListName}
            onChange={(e) => setReviewListName(e.target.value)}
            placeholder="Enter the name of the list"
            />
            <input
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Write your review..."
        />
            <input
                type="number"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                min="1"
                max="5"
                placeholder='#'
        />
        
        
        <button onClick={() => submitReview(trimmedListName)}>Submit Review</button>
    </div>
)}



            <section className="user-lists-section">
  <h3>My Lists ({userLists.length})</h3>
  <ul>
    {userLists.map((list) => (
      <li key={list._id}>
        <h3 className='expand-lists' onClick={() => toggleList(list._id)}>
          {list.name} - {list.visibility}<button className='delete-button' onClick={() => deleteList(list.name)}>Delete</button>
        </h3>
        {expandedListId === list._id && (
          <>
             <p><strong>Creator:</strong> {list.creator}</p>
            <p><strong>Last Edited:</strong> {new Date(list.lastEdited).toLocaleDateString()}</p>
            <p><strong>Description:</strong> {list.description}</p>
            {list.heroes.map((hero) => (
              <div className='hero-list-ui' key={hero._id}>
                <h3 className='hero-name-lists'><strong>{hero.name}</strong></h3>
                <p><strong>Publisher:</strong> {hero.Publisher}</p>
                
                {/* Displaying Powers Separated by Commas */}
                <div className='powers-section'>
                  <strong>Powers:</strong> {hero.powers ? Object.keys(hero.powers).filter(power => hero.powers[power]).join(', ') : 'None'}
                </div>
                <br></br>
              </div>
            ))}
            <button onClick={() => toggleReviews(list.name)}>
      {expandedReviewsListId === list.name ? 'Hide Reviews' : 'Show Reviews'}
    </button>
    
    {expandedReviewsListId === list.name && reviews[list.name] && (
    <div className="reviews-section">
        {reviews[list.name].map((review, index) => (
            <div  key={index} className='review-container'>
                <p><strong>Rating:</strong> {review.rating}</p>
                <p><strong>Review:</strong> {review.review}</p>
                <p><strong>Reviewer:</strong> {review.reviewer}</p>
            </div>
        ))}
    </div>
)}

            
          </>
        )}
      </li>
    ))}
  </ul>
</section>
        
        
  
      
      </div>
    );
  };
  
  export default LoggedInUserContent;
  