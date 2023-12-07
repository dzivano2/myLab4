import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';



import './App.css';
const MainScreen = () => {
    console.log('MainScreen is being rendered');
  const [searchQuery, setSearchQuery] = useState('');
  const [numberOfResults, setNumberOfResults] = useState();
  const [filterBy, setFilterBy] = useState('id');
  const [superheroID, setSuperheroID] = useState('');
  const [detailField, setDetailField] = useState('Publisher');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [detailResult, setDetailResult] = useState('');
  const [expandedListId, setExpandedListId] = useState(null);

  const [expandedHeroId, setExpandedHeroId] = useState(null);
  const [publicLists, setPublicLists] = useState([]);
  const [listReviews, setListReviews] = useState({});
  const [expandedReviewsListId, setExpandedReviewsListId] = useState(null);
  




  

  
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login'); // Assuming '/' is the route for your Login component
  };
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
      setResults(data.slice(0, numberOfResults)); // Limit the results as needed
    } catch (err) {
      setError('Error fetching superheroes');
      console.error('Error:', err);
    }
  };
  
  const toggleReviews = (listName) => {
    setExpandedReviewsListId(expandedReviewsListId === listName ? null : listName);
  };

  useEffect(() => {
    const fetchPublicLists = async () => {
      try {
        const response = await fetch('/api/lists/public');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setPublicLists(data);
        data.forEach(list => fetchReviewsForList(list.name));
      } catch (error) {
        console.error('Error fetching public lists:', error);
      }
    };

    fetchPublicLists();
  }, []);
  const handleClearResults = () => {
    setSearchQuery('')
    setFilterBy('id')
    setResults([]);
    setNumberOfResults()
  };


const toggleList = (id) => {
    console.log('Current ID:', id);
    console.log('Current expandedListId:', expandedListId);
    setExpandedListId(expandedListId === id ? null : id);
};

// ...

console.log('Render: expandedListId', expandedListId);

const fetchReviewsForList = async (listName) => {
    try {
      const response = await fetch(`/api/lists/reviews/${encodeURIComponent(listName)}`);
      const data = await response.json();
      setListReviews(prev => ({ ...prev, [listName]: data }));
    } catch (error) {
      console.error(`Error fetching reviews for ${listName}:`, error);
    }
  };
  const handleNavigateToPolicies = () => {
    navigate('/policies');
  };
  

  return (
    
      <div className='page-container'>
      
      <button onClick={handleLoginClick} className="login-button">Login</button>
      <button onClick={handleNavigateToPolicies}>Policies</button>
        
      {/* Search Section */}
      <section className="search-section">
        <h1><strong>Super Hero Database</strong></h1>
        <p className='about-section'>Welcome to the Super Hero Database! Explore lists and superheroes, create an account and log in for additional options</p>
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


      {/* Detail Section */}
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
      
      <section className="public-hero-lists-section">
  <h3>Public Hero Lists</h3>
  <ul>
    {publicLists.map((list) => (
      <li key={list.lastEdited}>
        <h4 className='expand-lists' onClick={() => toggleList(list.lastEdited)}>
          {list.name}
        </h4>
        {expandedListId === list.lastEdited && (
          <>
            <p><strong>Creator:</strong> {list.creatorEmail}</p>
            <p><strong>Last Edited:</strong> {new Date(list.lastEdited).toLocaleDateString()}</p>
            <p><strong>Description:</strong> {list.description}</p>
            {list.heroes.map((hero, index) => (
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
                  {expandedReviewsListId === list.name && (
                    <div className='reviews-section'>
                      <h3>Reviews -</h3>
                      {listReviews[list.name] && listReviews[list.name].map((review, index) => (
                        <div key={index} className='review-container'>
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

export default MainScreen;
