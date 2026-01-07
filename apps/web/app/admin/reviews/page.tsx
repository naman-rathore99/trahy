"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { apiRequest } from "@/lib/api";
import {
    Star, Trash2, Edit2, Search, Loader2, X, Save, ChevronDown, ChevronUp, Building2
} from "lucide-react";

interface Review {
    id: string;
    hotelId: string;
    hotelName: string;
    user: string;
    rating: number;
    text: string;
    createdAt: string;
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Grouping State
    const [groupedReviews, setGroupedReviews] = useState<Record<string, Review[]>>({});
    const [expandedHotels, setExpandedHotels] = useState<Record<string, boolean>>({});

    // Edit State
    const [editingReview, setEditingReview] = useState<any>(null);
    const [editText, setEditText] = useState("");
    const [editRating, setEditRating] = useState(5);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const data = await apiRequest("/api/admin/reviews", "GET");
            if (data.reviews) {
                setReviews(data.reviews);
                groupData(data.reviews);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Helper: Group reviews by Hotel ID
    const groupData = (data: Review[]) => {
        const groups: Record<string, Review[]> = {};
        data.forEach(review => {
            const key = review.hotelName || "Unknown Hotel"; // Group by Name
            if (!groups[key]) groups[key] = [];
            groups[key].push(review);
        });
        setGroupedReviews(groups);

        // Auto-expand all for now
        const expandState: Record<string, boolean> = {};
        Object.keys(groups).forEach(key => expandState[key] = true);
        setExpandedHotels(expandState);
    };

    const toggleHotel = (hotelName: string) => {
        setExpandedHotels(prev => ({ ...prev, [hotelName]: !prev[hotelName] }));
    };

    const handleDelete = async (hotelId: string, reviewId: string) => {
        if (!confirm("Are you sure you want to delete this review?")) return;
        try {
            await apiRequest("/api/admin/delete-review", "POST", { hotelId, reviewId });
            // Update UI
            const updatedList = reviews.filter(r => r.id !== reviewId);
            setReviews(updatedList);
            groupData(updatedList); // Re-group
        } catch (error) {
            alert("Failed to delete");
        }
    };

    const openEditModal = (review: any) => {
        setEditingReview(review);
        setEditText(review.text);
        setEditRating(review.rating);
    };

    const handleSaveEdit = async () => {
        if (!editingReview) return;
        setSaving(true);
        try {
            await apiRequest("/api/admin/edit-review", "POST", {
                hotelId: editingReview.hotelId,
                reviewId: editingReview.id,
                text: editText,
                rating: editRating
            });

            const updatedList = reviews.map(r => r.id === editingReview.id ? { ...r, text: editText, rating: editRating } : r);
            setReviews(updatedList);
            groupData(updatedList);
            setEditingReview(null);
        } catch (error) {
            alert("Failed to update");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-black">
            <AdminSidebar />
            <main className="flex-1  p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hotel Reviews</h1>
                        <p className="text-gray-500">Manage reviews category-wise</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            className="pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border rounded-xl outline-none"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    {Object.entries(groupedReviews).map(([hotelName, hotelReviews]) => {
                        // Filter logic inside the group
                        const filteredGroup = hotelReviews.filter(r =>
                            r.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.user.toLowerCase().includes(searchTerm.toLowerCase())
                        );

                        if (filteredGroup.length === 0 && searchTerm) return null;

                        return (
                            <div key={hotelName} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">

                                {/* HOTEL HEADER */}
                                <div
                                    className="p-5 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    onClick={() => toggleHotel(hotelName)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-rose-100 text-rose-600 p-2 rounded-lg">
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-lg text-gray-900 dark:text-white">{hotelName}</h2>
                                            <p className="text-xs text-gray-500">{filteredGroup.length} Reviews</p>
                                        </div>
                                    </div>
                                    {expandedHotels[hotelName] ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                                </div>

                                {/* REVIEW TABLE */}
                                {expandedHotels[hotelName] && (
                                    <div className="border-t border-gray-100 dark:border-gray-800">
                                        <table className="w-full text-left">
                                            <thead className="bg-white dark:bg-gray-900 text-gray-400 text-[10px] uppercase font-bold border-b dark:border-gray-800">
                                                <tr>
                                                    <th className="p-4 pl-6">User</th>
                                                    <th className="p-4">Rating</th>
                                                    <th className="p-4 w-1/2">Comment</th>
                                                    <th className="p-4">Date</th>
                                                    <th className="p-4 text-right pr-6">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {filteredGroup.map((review) => (
                                                    <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                                        <td className="p-4 pl-6 font-bold text-sm">{review.user}</td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-1 text-yellow-500 font-bold text-xs bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md w-fit">
                                                                <Star size={12} className="fill-current" /> {review.rating}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{review.text}</td>
                                                        <td className="p-4 text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</td>
                                                        <td className="p-4 pr-6 flex justify-end gap-2">
                                                            <button
                                                                onClick={() => openEditModal(review)}
                                                                className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(review.hotelId, review.id)}
                                                                className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {Object.keys(groupedReviews).length === 0 && (
                        <div className="text-center py-20 text-gray-400">No reviews found.</div>
                    )}
                </div>
            </main>

            {/* EDIT MODAL (Same as before) */}
            {editingReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Edit Review</h3>
                            <button onClick={() => setEditingReview(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setEditRating(star)}
                                            className={`p-1 ${star <= editRating ? "text-yellow-400" : "text-gray-300"}`}
                                        >
                                            <Star size={24} className="fill-current" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Content</label>
                                <textarea
                                    className="w-full h-32 p-3 bg-gray-50 dark:bg-black border rounded-xl outline-none"
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setEditingReview(null)}
                                    className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={saving}
                                    className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}