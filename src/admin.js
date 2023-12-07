import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './admin.css'
const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);

    const navigate = useNavigate();

    const handleBack =()=>{
        navigate('/loggedContent')
    }
    useEffect(() => {
        fetchAllUsers();
        fetchReviews();
    }, []);
    const fetchAllUsers = async () => {
        try {
            const response = await fetch('/api/admin/users', {
                credentials: 'include', // if you're using sessions
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
        
        
    };
    const toggleDisabledStatus = async (userEmail) => {
        try {
            const response = await fetch('/api/admin/users/toggle-disabled', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userEmail }),
                credentials: 'include', 
            });
    
            if (!response.ok) {
                throw new Error('Failed to toggle disabled status');
            }
    
            // Re-fetch users or update local state to reflect the change
            setUsers(users.map(user => {
                if (user.email === userEmail) {
                    return { ...user, disabled: !user.disabled };
                }
                return user;
            }));
            
        } catch (error) {
            console.error('Error:', error);
        }
    };
    
    const updateRole = async (userEmail, newRole) => {
        try {
            const response = await fetch('/api/admin/users/update-role', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userEmail, newRole }),
                credentials: 'include', // if using sessions
            });
    
            if (!response.ok) {
                throw new Error('Failed to update user role');
            }
    
            // Update local state or re-fetch users to reflect the change
            fetchAllUsers();
        } catch (error) {
            console.error('Error:', error);
        }
    };
    
    const fetchReviews = async () => {
        try {
            const response = await fetch('/api/admin/reviews');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setReviews(data);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    const toggleFlag = async (listName, reviewId) => {
        try {
            await fetch(`/api/admin/reviews/flag/${listName}/${reviewId}`, {
                method: 'PUT'
            });
            fetchReviews(); // Re-fetch reviews to update the UI
        } catch (error) {
            console.error('Error toggling flag:', error);
        }
    };

    
    return (
        
        <div className="admin-dashboard">
            <button onClick={handleBack}>Go Back </button>
            <h1>Admin Dashboard</h1>

            <section className="dashboard-section">
                <h2>User Management</h2>
                {loading ? (
                    <p>Loading users...</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.email}>
                                    <td>{user.email}</td>
                                    <td>
                                        <select 
                                            value={user.role}
                                            onChange={(e) => updateRole(user.email, e.target.value)}
                                            disabled={user.email === 'dzivano2@uwo.ca'} // Disable if main admin
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td>
                                        
                                    {user.email !== 'dzivano2@uwo.ca' && (
                                        <button 
                                            onClick={() => toggleDisabledStatus(user.email)}
                                            className={user.disabled ? 'disabled-button' : 'enabled-button'}
                >
                                            {user.disabled ? 'Enable' : 'Disable'}
                                        </button>
                                    )}
                                    </td>
            
                                </tr>
                             ))}
                        </tbody>

                    </table>
                )}
            </section>
            <section className="dashboard-section">
            <h2>Reviews Management</h2>
            <table>
                <thead>
                    <tr>
                        <th>Review</th>
                        <th>Rating</th>
                        <th>Reviewer</th>
                        <th>Flagged</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {reviews.map((review) => (
                        <tr key={review._id}>
                            <td>{review.review}</td>
                            <td>{review.rating}</td>
                            <td>{review.reviewer}</td>
                            <td>{review.flagged ? 'Yes' : 'No'}</td>
                            <td>
                                <button onClick={() => toggleFlag(review.listName, review._id)}>
                                    {review.flagged ? 'Unflag' : 'Flag'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </section>

            
        </div>
    );
};

export default AdminDashboard;
