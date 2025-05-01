const Post = require('../models/Post');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    console.log('CreatePost: Starting post creation');
    console.log('CreatePost: User ID:', req.user._id);
    
    // Log request body if it's JSON
    if (req.body && typeof req.body === 'object') {
      console.log('CreatePost: Request body content:', req.body.content);
    }
    
    // Check if we have a file uploaded
    let imageUrl = null;
    if (req.file) {
      console.log('CreatePost: Image file uploaded:', req.file.filename);
      // Store the path to the uploaded file
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Get content from request body
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Post content is required'
      });
    }

    // Create post with image if it exists
    const post = await Post.create({
      user: req.user._id,
      content,
      image: imageUrl
    });

    console.log('CreatePost: Post created with ID:', post._id);
    
    // Populate user details including profile image
    const populatedPost = await Post.findById(post._id)
      .populate({
        path: 'user',
        select: 'name profileImage role organization'
      });

    if (!populatedPost) {
      console.error('CreatePost: Failed to retrieve populated post');
      return res.status(404).json({
        success: false,
        error: 'Post not found after creation'
      });
    }

    console.log('CreatePost: Post created successfully');
    console.log('CreatePost: User details:', {
      id: populatedPost.user._id,
      name: populatedPost.user.name,
      profileImage: populatedPost.user.profileImage
    });

    // Format the post for frontend
    const formattedPost = {
      id: populatedPost._id,
      user: {
        id: populatedPost.user._id,
        name: populatedPost.user.name,
        avatar: populatedPost.user.profileImage,
        role: populatedPost.user.role,
        organization: populatedPost.user.organization
      },
      content: populatedPost.content,
      image: populatedPost.image,
      likes: 0,
      comments: 0,
      timeAgo: getTimeAgo(populatedPost.createdAt),
      liked: false,
      createdAt: populatedPost.createdAt
    };

    // Add post to user's posts array
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { posts: post._id } },
      { new: true }
    );

    console.log('CreatePost: Post added to user\'s posts array');
    console.log('CreatePost: Returning formatted post');

    res.status(201).json({
      success: true,
      data: formattedPost
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: error.message
    });
  }
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
exports.getPosts = async (req, res) => {
  try {
    console.log('GetPosts: Starting to fetch posts');
    console.log('GetPosts: Request headers:', JSON.stringify(req.headers));
    console.log('GetPosts: Request user:', req.user ? `ID: ${req.user._id}, Name: ${req.user.name}` : 'Not authenticated');
    
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: 'user',
        select: 'name profileImage role organization'
      })
      .populate({
        path: 'comments.user',
        select: 'name profileImage'
      });
      
    console.log(`GetPosts: Found ${posts.length} posts`);
    if (posts.length > 0) {
      console.log('GetPosts: First post details:', {
        id: posts[0]._id,
        content: posts[0].content.substring(0, 30) + '...',
        user: posts[0].user ? {
          id: posts[0].user._id,
          name: posts[0].user.name,
          profileImage: posts[0].user.profileImage
        } : 'No user',
        commentsCount: posts[0].comments.length,
        likesCount: posts[0].likes.length
      });
    }
    
    // Check if user is authenticated
    console.log('GetPosts: User authentication status:', req.user ? 'Authenticated' : 'Not authenticated');
    if (req.user) {
      console.log('GetPosts: User ID:', req.user._id);
    }

    // Format posts for the frontend
    const formattedPosts = posts.map(post => {
      // Safely check if user has liked the post
      let isLiked = false;
      if (req.user && req.user._id) {
        // Convert user ID to string for safe comparison
        const userId = req.user._id.toString();
        try {
          isLiked = post.likes.some(like => like && like.toString() === userId);
          console.log(`GetPosts: Post ${post._id} - User ${userId} liked status: ${isLiked}`);
        } catch (error) {
          console.error(`GetPosts: Error checking like status for post ${post._id}:`, error);
        }
      }
      
      // Safely access user fields
      const userData = {
        id: post.user ? post.user._id : 'unknown',
        name: post.user ? post.user.name : 'Unknown User',
        avatar: post.user && post.user.profileImage ? post.user.profileImage : null,
        role: post.user ? post.user.role : 'User',
        organization: post.user ? post.user.organization : null
      };

      console.log(`GetPosts: User data for post ${post._id}:`, userData);
      
      return {
        id: post._id,
        user: userData,
        content: post.content,
        image: post.image,
        likes: post.likes ? post.likes.length : 0,
        comments: post.comments ? post.comments.length : 0,
        timeAgo: getTimeAgo(post.createdAt),
        liked: isLiked,
        createdAt: post.createdAt
      };
    });
    
    console.log('GetPosts: Successfully formatted posts for frontend');
    console.log(`GetPosts: Returning ${formattedPosts.length} formatted posts`);

    res.status(200).json({
      success: true,
      count: posts.length,
      data: formattedPosts
    });
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: error.message
    });
  }
};

// @desc    Like a post
// @route   PUT /api/posts/:postId/like
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Convert IDs to strings for safe comparison
    const userId = req.user._id.toString();
    const isLiked = post.likes.some(like => like.toString() === userId);

    if (isLiked) {
      // If already liked, unlike it
      await Post.findByIdAndUpdate(
        req.params.postId,
        { $pull: { likes: req.user._id } },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Post unliked',
        liked: false,
        likeCount: post.likes.length - 1
      });
    } else {
      // Like the post
      await Post.findByIdAndUpdate(
        req.params.postId,
        { $push: { likes: req.user._id } },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Post liked',
        liked: true,
        likeCount: post.likes.length + 1
      });
    }
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Add a comment to a post
// @route   POST /api/posts/:postId/comment
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Comment text is required'
      });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const comment = {
      user: req.user._id,
      text,
      createdAt: new Date()
    };

    // Add comment to post
    post.comments.unshift(comment);
    await post.save();

    // Get the populated comment
    const populatedPost = await Post.findById(req.params.postId)
      .populate({
        path: 'comments.user',
        select: 'name profileImage'
      });

    const newComment = populatedPost.comments[0];

    res.status(201).json({
      success: true,
      data: {
        id: newComment._id,
        user: {
          id: newComment.user._id,
          name: newComment.user.name,
          avatar: newComment.user.profileImage
        },
        text: newComment.text,
        timeAgo: getTimeAgo(newComment.createdAt),
        createdAt: newComment.createdAt
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Helper function to format time ago
function getTimeAgo(date) {
  const now = new Date();
  const diff = now - date;
  
  // Convert to seconds
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 60) {
    return 'Just now';
  }
  
  // Convert to minutes
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  
  // Convert to hours
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  
  // Convert to days
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }
  
  // Convert to months
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo ago`;
  }
  
  // Convert to years
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

// @desc    Delete a post
// @route   DELETE /api/posts/:postId
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    console.log('DeletePost: Starting post deletion for ID:', req.params.postId);
    
    // Find the post
    const post = await Post.findById(req.params.postId);
    
    // Check if post exists
    if (!post) {
      console.log('DeletePost: Post not found');
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }
    
    // Make sure user owns the post
    if (post.user.toString() !== req.user._id.toString()) {
      console.log('DeletePost: Unauthorized deletion attempt');
      console.log('Post owner:', post.user);
      console.log('Request user:', req.user._id);
      return res.status(401).json({
        success: false,
        error: 'User not authorized to delete this post'
      });
    }
    
    console.log('DeletePost: Authorization verified, proceeding with deletion');
    
    // If post has an image, delete the file
    if (post.image) {
      try {
        const imagePath = path.join(__dirname, '..', 'public', post.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log('DeletePost: Associated image deleted:', imagePath);
        }
      } catch (error) {
        console.error('DeletePost: Error deleting image file:', error);
        // Continue deletion even if image removal fails
      }
    }
    
    // Remove post from user's posts array
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { posts: post._id } }
    );
    
    console.log('DeletePost: Post removed from user\'s posts array');
    
    // Delete the post
    await Post.findByIdAndDelete(req.params.postId);
    
    console.log('DeletePost: Post successfully deleted');
    
    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: error.message
    });
  }
}; 