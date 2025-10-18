import { useState } from "react";
import {
    Heart,
    MessageCircle,
    Repeat2,
    Share,
    MoreHorizontal,
    MapPin,
    Plus,
    Image as ImageIcon,
    Video,
    Link as LinkIcon,
    Smile,
    X,
    Send,
    Reply,
    Flag,
    Bookmark,
    Instagram,
    Home,
    Search,
    User,
    Menu,
    Pin,
    List
} from "lucide-react";
import {
    Button,
    Badge,
    Avatar,
    AvatarFallback,
    AvatarImage,
    Input,
    Textarea,
    Card,
    CardContent,
} from "../components/ui";
import NewThreadModal from "./NewThreadModal";
import ReplyModal from "./ReplyModal";
import { useAuth } from "../contexts/AuthContext";

// Mock data theo database schema
const mockPosts = [
    {
        PostID: 1,
        UserID: 1,
        Title: "Trận đấu tuyệt vời tại sân ABC",
        Content: "Hôm nay có trận đấu tuyệt vời tại sân ABC! Các bạn có muốn tham gia không? 🏆⚽\n\nThời gian: 19:00 - 21:00\nĐịa điểm: Sân bóng ABC, Quận 1\nPhí tham gia: 50k/người",
        MediaURL: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=400&fit=crop",
        FieldID: 1,
        CreatedAt: "2024-01-15T10:30:00Z",
        UpdatedAt: null,
        Status: "Active",
        author: {
            UserID: 1,
            Username: "ballspot",
            FullName: "BallSpot",
            Avatar: "https://ui-avatars.com/api/?name=BallSpot&background=0ea5e9&color=fff&size=100",
            Verified: true
        },
        field: {
            FieldID: 1,
            FieldName: "Sân bóng ABC",
            Location: "Quận 1, TP.HCM"
        },
        likes: 24,
        comments: 8,
        reposts: 3,
        shares: 5,
        isLiked: false,
        isReposted: false,
        isBookmarked: false
    },
    {
        PostID: 2,
        UserID: 2,
        Title: "Mẹo đá sân 7 người hiệu quả",
        Content: "Mẹo đá sân 7 người hiệu quả:\n\n1. Kiểm soát bóng tốt hơn\n2. Di chuyển không bóng\n3. Phối hợp nhóm\n4. Tận dụng không gian\n\nCác bạn có kinh nghiệm gì khác không?",
        MediaURL: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=800&h=400&fit=crop",
        FieldID: null,
        CreatedAt: "2024-01-15T08:15:00Z",
        UpdatedAt: null,
        Status: "Active",
        author: {
            UserID: 2,
            Username: "coachminh",
            FullName: "Coach Minh",
            Avatar: "https://ui-avatars.com/api/?name=Coach+Minh&background=10b981&color=fff&size=100",
            Verified: false
        },
        field: null,
        likes: 45,
        comments: 12,
        reposts: 7,
        shares: 8,
        isLiked: false,
        isReposted: false,
        isBookmarked: false
    },
    {
        PostID: 3,
        UserID: 3,
        Title: "Chọn giày đá bóng phù hợp",
        Content: "Chọn giày đá bóng phù hợp theo mặt sân rất quan trọng để tránh chấn thương và tăng hiệu suất thi đấu. Các loại mặt sân khác nhau cần loại giày khác nhau.\n\n• Sân cỏ tự nhiên: Giày có đinh dài\n• Sân cỏ nhân tạo: Giày có đinh ngắn\n• Sân futsal: Giày đế bằng",
        MediaURL: "https://images.unsplash.com/photo-1599050751795-5fa78f5c9c23?w=800&h=400&fit=crop",
        FieldID: 2,
        CreatedAt: "2024-01-15T06:45:00Z",
        UpdatedAt: null,
        Status: "Active",
        author: {
            UserID: 3,
            Username: "thietbipro",
            FullName: "Thiết bị Pro",
            Avatar: "https://ui-avatars.com/api/?name=Thiet+Bi+Pro&background=f59e0b&color=fff&size=100",
            Verified: true
        },
        field: {
            FieldID: 2,
            FieldName: "Sân bóng XYZ",
            Location: "Quận 7, TP.HCM"
        },
        likes: 32,
        comments: 15,
        reposts: 4,
        shares: 6,
        isLiked: false,
        isReposted: false,
        isBookmarked: false
    }
];

const mockComments = [
    {
        CommentID: 1,
        PostID: 1,
        UserID: 4,
        ParentCommentID: null,
        Content: "Giải đấu này có vẻ thú vị! Mình có thể tham gia được không?",
        CreatedAt: "2024-01-15T11:00:00Z",
        Status: "Active",
        author: {
            UserID: 4,
            Username: "nguyenvanb",
            FullName: "Nguyễn Văn B",
            Avatar: "https://ui-avatars.com/api/?name=Nguyen+Van+B&background=10b981&color=fff&size=100"
        },
        likes: 5,
        replies: [
            {
                CommentID: 2,
                PostID: 1,
                UserID: 1,
                ParentCommentID: 1,
                Content: "Chào bạn! Bạn có thể đăng ký tại link này: https://example.com",
                CreatedAt: "2024-01-15T11:30:00Z",
                Status: "Active",
                author: {
                    UserID: 1,
                    Username: "ballspot",
                    FullName: "BallSpot",
                    Avatar: "https://ui-avatars.com/api/?name=BallSpot&background=0ea5e9&color=fff&size=100"
                },
                likes: 2
            }
        ]
    }
];

export default function ThreadsFeed() {
    const { user } = useAuth();
    const [posts, setPosts] = useState(mockPosts);
    const [comments, setComments] = useState(mockComments);
    const [newPostContent, setNewPostContent] = useState("");
    const [newPostTitle, setNewPostTitle] = useState("");
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [showPostModal, setShowPostModal] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [showNewThread, setShowNewThread] = useState(false);
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [showCommentInput, setShowCommentInput] = useState({});
    const [commentContent, setCommentContent] = useState({});

    // Function to handle post submission
    const handlePostSubmit = (content) => {
        console.log("Posting from ThreadsFeed:", content);
        // Add your post submission logic here
    };

    // Function to handle reply submission
    const handleReplySubmit = (content) => {
        console.log("Replying to post:", selectedPost?.PostID, "Content:", content);
        // Add your reply submission logic here
    };

    // Function to open reply modal
    const handleOpenReply = (post) => {
        setSelectedPost(post);
        setShowReplyModal(true);
    };

    // Function to toggle comment input
    const toggleCommentInput = (postId) => {
        setShowCommentInput(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    // Function to handle comment content change
    const handleCommentChange = (postId, content) => {
        setCommentContent(prev => ({
            ...prev,
            [postId]: content
        }));
    };

    // Function to submit comment
    const handleCommentSubmit = (postId) => {
        const content = commentContent[postId];
        if (content && content.trim()) {
            console.log("Commenting on post:", postId, "Content:", content);
            // Add your comment submission logic here
            setCommentContent(prev => ({
                ...prev,
                [postId]: ""
            }));
        }
    };

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const postDate = new Date(dateString);
        const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));

        if (diffInHours < 1) return "Vừa xong";
        if (diffInHours < 24) return `${diffInHours}h`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d`;
        return postDate.toLocaleDateString('vi-VN');
    };

    const toggleLike = (postId) => {
        if (!user) return;

        setPosts(prevPosts =>
            prevPosts.map(post =>
                post.PostID === postId
                    ? {
                        ...post,
                        isLiked: !post.isLiked,
                        likes: post.isLiked ? post.likes - 1 : post.likes + 1
                    }
                    : post
            )
        );
    };

    const toggleRepost = (postId) => {
        if (!user) return;

        setPosts(prevPosts =>
            prevPosts.map(post =>
                post.PostID === postId
                    ? {
                        ...post,
                        isReposted: !post.isReposted,
                        reposts: post.isReposted ? post.reposts - 1 : post.reposts + 1
                    }
                    : post
            )
        );
    };

    const toggleBookmark = (postId) => {
        if (!user) return;

        setPosts(prevPosts =>
            prevPosts.map(post =>
                post.PostID === postId
                    ? { ...post, isBookmarked: !post.isBookmarked }
                    : post
            )
        );
    };

    const handleCreatePost = () => {
        if (!newPostContent.trim() || !user) return;

        const newPost = {
            PostID: Date.now(),
            UserID: user.id || 1,
            Title: newPostTitle.trim() || null,
            Content: newPostContent,
            MediaURL: null,
            FieldID: null,
            CreatedAt: new Date().toISOString(),
            UpdatedAt: null,
            Status: "Active",
            author: {
                UserID: user.id || 1,
                Username: user.username || "user",
                FullName: user.name || "Người dùng",
                Avatar: user.avatar || "https://ui-avatars.com/api/?name=User&background=0ea5e9&color=fff&size=100",
                Verified: false
            },
            field: null,
            likes: 0,
            comments: 0,
            reposts: 0,
            shares: 0,
            isLiked: false,
            isReposted: false,
            isBookmarked: false
        };

        setPosts(prevPosts => [newPost, ...prevPosts]);
        setNewPostContent("");
        setNewPostTitle("");
        setShowCreatePost(false);
        setShowNewThread(false);
    };

    const handleAddComment = (postId) => {
        if (!newComment.trim() || !user) return;

        const newCommentObj = {
            CommentID: Date.now(),
            PostID: postId,
            UserID: user.id || 1,
            ParentCommentID: replyingTo,
            Content: newComment,
            CreatedAt: new Date().toISOString(),
            Status: "Active",
            author: {
                UserID: user.id || 1,
                Username: user.username || "user",
                FullName: user.name || "Người dùng",
                Avatar: user.avatar || "https://ui-avatars.com/api/?name=User&background=0ea5e9&color=fff&size=100"
            },
            likes: 0,
            replies: []
        };

        if (replyingTo) {
            setComments(prevComments =>
                prevComments.map(comment =>
                    comment.CommentID === replyingTo
                        ? { ...comment, replies: [...comment.replies, newCommentObj] }
                        : comment
                )
            );
        } else {
            setComments(prevComments => [...prevComments, newCommentObj]);
        }

        setNewComment("");
        setReplyingTo(null);
    };

    const postComments = comments.filter(comment => comment.PostID === selectedPost?.PostID);

    return (
        <div className="min-h-screen">
            {/* Left Navigation - Fixed to left edge */}
            <div className="fixed justify-center left-0 top-0 w-16 h-full bg-white border-r border-gray-200 flex flex-col items-center py-4 z-10">
                <div className="mb-8">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">a</span>
                    </div>
                </div>

                <div className="flex flex-col items-center space-y-6">
                    <Button variant="ghost" size="sm" className="p-3 w-12 h-12">
                        <Home className="w-6 h-6 text-gray-700" />
                    </Button>

                    <Button variant="ghost" size="sm" className="p-3 w-12 h-12">
                        <Search className="w-6 h-6 text-gray-500" />
                    </Button>

                    <Button variant="ghost" size="sm" className="p-3 w-12 h-12">
                        <Heart className="w-6 h-6 text-gray-500" />
                    </Button>

                    <Button variant="ghost" size="sm" className="p-3 w-12 h-12">
                        <User className="w-6 h-6 text-gray-500" />
                    </Button>

                    <Button variant="ghost" size="sm" className="p-3 w-12 h-12">
                        <Menu className="w-6 h-6 text-gray-500" />
                    </Button>
                </div>
            </div>
            {/* Main Content - Centered */}
            <div className=" flex justify-center">

                {/* Posts Feed */}
                <div className="divide-y divide-gray-200">
                    {posts.map((post) => (
                        <div key={post.PostID} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex gap-3">
                                {/* Avatar */}
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={post.author.Avatar} />
                                    <AvatarFallback className="bg-gray-200 text-gray-700">
                                        {post.author.FullName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    {/* User Info */}
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-900">{post.author.FullName}</span>
                                        <span className="text-gray-500 text-sm">{post.author.Username}</span>
                                        {post.author.Verified && (
                                            <Badge variant="secondary" className="text-xs bg-blue-500 text-white">
                                                ✓
                                            </Badge>
                                        )}
                                        <span className="text-gray-500 text-sm">•</span>
                                        <span className="text-gray-500 text-sm">{formatTimeAgo(post.CreatedAt)}</span>
                                        {user && (
                                            <Button variant="ghost" size="sm" className="ml-auto p-1 h-6 w-6">
                                                <Plus className="w-4 h-4 text-gray-400" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Post Title */}
                                    {post.Title && (
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.Title}</h3>
                                    )}

                                    {/* Post Content */}
                                    <div className="mb-3">
                                        <p className="text-gray-900 whitespace-pre-wrap">{post.Content}</p>

                                        {/* Field Tag */}
                                        {post.field && (
                                            <div className="flex items-center gap-1 mt-2">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span className="text-blue-500 text-sm">{post.field.FieldName}</span>
                                                <span className="text-gray-500 text-sm">•</span>
                                                <span className="text-gray-500 text-sm">{post.field.Location}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Media */}
                                    {post.MediaURL && (
                                        <div className="mb-3 rounded-xl overflow-hidden border border-gray-200">
                                            <img
                                                src={post.MediaURL}
                                                alt="Post content"
                                                className="w-full h-auto object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* Interaction Buttons */}
                                    <div className="flex items-center justify-between max-w-md">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleLike(post.PostID)}
                                            className={`flex items-center gap-2 text-gray-500 hover:text-red-500 ${post.isLiked ? 'text-red-500' : ''}`}
                                        >
                                            <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                                            <span>{post.likes}</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleCommentInput(post.PostID)}
                                            className="flex items-center gap-2 text-gray-500 hover:text-blue-500"
                                        >
                                            <MessageCircle className="w-5 h-5" />
                                            <span>{post.comments}</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleRepost(post.PostID)}
                                            className={`flex items-center gap-2 text-gray-500 hover:text-green-500 ${post.isReposted ? 'text-green-500' : ''}`}
                                        >
                                            <Repeat2 className={`w-5 h-5 ${post.isReposted ? 'fill-current' : ''}`} />
                                            <span>{post.reposts}</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex items-center gap-2 text-gray-500 hover:text-blue-500"
                                        >
                                            <Share className="w-5 h-5" />
                                            <span>{post.shares}</span>
                                        </Button>
                                        {user && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleBookmark(post.PostID)}
                                                className={`flex items-center gap-2 text-gray-500 hover:text-yellow-500 ${post.isBookmarked ? 'text-yellow-500' : ''}`}
                                            >
                                                <Bookmark className={`w-5 h-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Comment Input Section */}
                                    {user && showCommentInput[post.PostID] && (
                                        <div className="mt-4">
                                            {/* Timeline line from post */}
                                            <div className="flex">
                                                <div className="w-8 flex justify-center">
                                                    <div className="w-px h-8 bg-gray-300"></div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex gap-2">
                                                        <Avatar className="w-8 h-8">
                                                            <AvatarImage src={user.avatar} />
                                                            <AvatarFallback className="bg-gray-200 text-gray-700">
                                                                {user.name?.charAt(0) || "U"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 ">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                                                                <span className="text-gray-500">&gt;</span>
                                                                <span className="text-sm text-gray-500">Thêm chủ đề</span>
                                                            </div>
                                                            <Textarea
                                                                placeholder={`Trả lời ${post.author.FullName}...`}
                                                                value={commentContent[post.PostID] || ""}
                                                                onChange={(e) => handleCommentChange(post.PostID, e.target.value)}
                                                                className="min-h-[40px] max-h-[200px] resize-none border-0 focus:ring-0 text-sm placeholder:text-gray-500 bg-transparent overflow-hidden"
                                                                style={{
                                                                    height: 'auto',
                                                                    minHeight: '60px',
                                                                    maxHeight: '200px'
                                                                }}
                                                                onInput={(e) => {
                                                                    e.target.style.height = 'auto';
                                                                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                                                                }}
                                                            />

                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleOpenReply(post)}
                                                                className="w-8 h-8 p-0 rounded-full border border-gray-300 hover:bg-gray-100"
                                                            >
                                                                <div className="w-4 h-4 flex items-center justify-center">
                                                                    <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                                                    </svg>
                                                                </div>
                                                            </Button>
                                                            {(commentContent[post.PostID] && commentContent[post.PostID].trim()) && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleCommentSubmit(post.PostID)}
                                                                    className="w-8 h-8 p-0 rounded-full bg-gray-900 hover:bg-gray-800"
                                                                >
                                                                    <div className="w-4 h-4 flex items-center justify-center">
                                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                                        </svg>
                                                                    </div>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* More Options */}
                                {user && (
                                    <div className="flex flex-col gap-1">
                                        <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                                            <Flag className="w-4 h-4 text-gray-400" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                        </div>
                    ))}
                </div>

            </div>
            {/* Right Plus Button - Fixed to right edge */}
            <div className="fixed right-4 top-20 z-20">
                <Button
                    onClick={() => setShowNewThread(true)}
                    className="w-12 h-12 rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-lg"
                >
                    <Plus className="w-6 h-6" />
                </Button>
            </div>



            <NewThreadModal
                isOpen={showNewThread}
                onClose={() => setShowNewThread(false)}
                user={user}
                postContent={newPostContent}
                setPostContent={setNewPostContent}
                onSubmit={handlePostSubmit}
            />

            <ReplyModal
                isOpen={showReplyModal}
                onClose={() => {
                    setShowReplyModal(false);
                    setSelectedPost(null);
                    setReplyContent("");
                }}
                user={user}
                originalPost={selectedPost ? {
                    author: selectedPost.author.FullName,
                    avatar: selectedPost.author.Avatar,
                    verified: selectedPost.author.Verified,
                    timeAgo: formatTimeAgo(selectedPost.CreatedAt),
                    content: selectedPost.Content
                } : null}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                onSubmit={handleReplySubmit}
            />

            {/* Login/Signup Modal for non-logged users */}
            {!user && showNewThread && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md bg-white border border-gray-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Đăng nhập hoặc đăng ký</h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowNewThread(false)}
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <p className="text-gray-600 mb-6">Xem những gì mọi người đang nói và tham gia cuộc trò chuyện.</p>

                            <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white mb-3">
                                <Instagram className="w-5 h-5 mr-2" />
                                Tiếp tục với Instagram
                            </Button>

                            <Button variant="ghost" className="w-full text-gray-600">
                                Đăng nhập bằng tên người dùng
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Create Post Modal */}
            {showCreatePost && user && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl bg-white border border-gray-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Tạo bài viết</h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowCreatePost(false)}
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <Input
                                    placeholder="Tiêu đề (tùy chọn)"
                                    value={newPostTitle}
                                    onChange={(e) => setNewPostTitle(e.target.value)}
                                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                                />

                                <Textarea
                                    placeholder="Nội dung bài viết..."
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 min-h-[120px]"
                                />

                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm">
                                        <ImageIcon className="w-5 h-5" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        <Video className="w-5 h-5" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        <LinkIcon className="w-5 h-5" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        <Smile className="w-5 h-5" />
                                    </Button>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowCreatePost(false)}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        onClick={handleCreatePost}
                                        disabled={!newPostContent.trim()}
                                        className="bg-gray-900 hover:bg-gray-800 text-white"
                                    >
                                        Đăng bài
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Comments Modal */}
            {showPostModal && selectedPost && user && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl bg-white border border-gray-200 max-h-[80vh] overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Bình luận</h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowPostModal(false)}
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Selected Post */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={selectedPost.author.Avatar} />
                                        <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                                            {selectedPost.author.FullName.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="font-semibold text-gray-900 text-sm">{selectedPost.author.FullName}</span>
                                    <span className="text-gray-500 text-xs">{selectedPost.author.Username}</span>
                                    <span className="text-gray-500 text-xs">•</span>
                                    <span className="text-gray-500 text-xs">{formatTimeAgo(selectedPost.CreatedAt)}</span>
                                </div>
                                {selectedPost.Title && (
                                    <h3 className="text-gray-900 font-semibold mb-1">{selectedPost.Title}</h3>
                                )}
                                <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedPost.Content}</p>
                            </div>

                            {/* Comments */}
                            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                                {postComments.map((comment) => (
                                    <div key={comment.CommentID} className="space-y-2">
                                        <div className="flex gap-3">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={comment.author.Avatar} />
                                                <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                                                    {comment.author.FullName.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-gray-900 text-sm">{comment.author.FullName}</span>
                                                    <span className="text-gray-500 text-xs">{comment.author.Username}</span>
                                                    <span className="text-gray-500 text-xs">•</span>
                                                    <span className="text-gray-500 text-xs">{formatTimeAgo(comment.CreatedAt)}</span>
                                                </div>
                                                <p className="text-gray-700 text-sm">{comment.Content}</p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500 text-xs">
                                                        <Heart className="w-4 h-4 mr-1" />
                                                        {comment.likes}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-gray-500 hover:text-blue-500 text-xs"
                                                        onClick={() => setReplyingTo(comment.CommentID)}
                                                    >
                                                        <Reply className="w-4 h-4 mr-1" />
                                                        Trả lời
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Replies */}
                                        {comment.replies && comment.replies.length > 0 && (
                                            <div className="ml-11 space-y-2">
                                                {comment.replies.map((reply) => (
                                                    <div key={reply.CommentID} className="flex gap-3">
                                                        <Avatar className="w-6 h-6">
                                                            <AvatarImage src={reply.author.Avatar} />
                                                            <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                                                                {reply.author.FullName.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-semibold text-gray-900 text-xs">{reply.author.FullName}</span>
                                                                <span className="text-gray-500 text-xs">{reply.author.Username}</span>
                                                                <span className="text-gray-500 text-xs">•</span>
                                                                <span className="text-gray-500 text-xs">{formatTimeAgo(reply.CreatedAt)}</span>
                                                            </div>
                                                            <p className="text-gray-700 text-xs">{reply.Content}</p>
                                                            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500 text-xs mt-1">
                                                                <Heart className="w-3 h-3 mr-1" />
                                                                {reply.likes}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Add Comment */}
                            <div className="border-t border-gray-200 pt-4">
                                <div className="flex gap-3">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={user.avatar || "https://ui-avatars.com/api/?name=User&background=0ea5e9&color=fff&size=100"} />
                                        <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                                            {user.name?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <Textarea
                                            placeholder={replyingTo ? "Trả lời bình luận..." : "Viết bình luận..."}
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 resize-none"
                                            rows={2}
                                        />
                                    </div>
                                    <Button
                                        onClick={() => handleAddComment(selectedPost.PostID)}
                                        disabled={!newComment.trim()}
                                        className="self-end bg-gray-900 hover:bg-gray-800 text-white"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                                {replyingTo && (
                                    <div className="mt-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setReplyingTo(null)}
                                            className="text-gray-500 text-xs"
                                        >
                                            <X className="w-3 h-3 mr-1" />
                                            Hủy trả lời
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}