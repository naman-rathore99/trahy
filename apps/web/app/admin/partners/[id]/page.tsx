"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import {
    ArrowLeft,
    ShieldCheck,
    ShieldAlert,
    Check,
    X,
    Loader2,
    User,
    Mail,
    Phone,
    Maximize2,
    AlertTriangle,
    FileText
} from "lucide-react";
import Link from "next/link";

export default function PartnerVerificationPage() {
    const { id } = useParams();
    const router = useRouter();

    const [partner, setPartner] = useState<any>(null);
    const [joinRequestData, setJoinRequestData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Modal States
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [remark, setRemark] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch the User List
                const usersData = await apiRequest("/api/admin/users?role=partner", "GET");
                const foundUser = usersData.users.find((u: any) => u.uid === id);

                if (foundUser) {
                    console.log("✅ Found User Data:", foundUser); // DEBUG LOG
                    setPartner(foundUser);

                    // 2. Check for backup image in Join Requests
                    // (Only if the user object doesn't have an obvious image)
                    if (!findImage(foundUser)) {
                        try {
                            const reqData = await apiRequest("/api/admin/join-requests", "GET");
                            if (reqData && reqData.requests) {
                                const originalReq = reqData.requests.find((r: any) => r.email === foundUser.email);
                                if (originalReq) {
                                    console.log("✅ Found Backup Request Data:", originalReq); // DEBUG LOG
                                    setJoinRequestData(originalReq);
                                }
                            }
                        } catch (backupError) {
                            console.warn("Backup check failed:", backupError);
                        }
                    }
                }
            } catch (err) {
                console.error("Critical Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // ✅ NEW HELPER: Checks multiple field names for the image
    const findImage = (data: any) => {
        if (!data) return null;
        return (
            data.officialIdUrl ||
            data.idProofUrl ||
            data.documentUrl ||
            data.idUrl ||
            data.proofUrl ||
            data.imageUrl ||
            data.fileUrl
        );
    };

    // Determine which image to show using the smart helper
    const idImageUrl = findImage(partner) || findImage(joinRequestData);

    const handleApprove = async () => {
        if (!confirm("Confirm identity verification? This will make their Hotel visible publicly.")) return;
        setProcessing(true);
        try {
            await apiRequest("/api/admin/verify-partner", "POST", {
                userId: id,
                action: "approve"
            });

            alert("Partner Verified & Hotel Approved!");
            router.push("/admin/partners");
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!remark.trim()) return alert("Please enter a reason for rejection.");
        setProcessing(true);
        try {
            await apiRequest("/api/admin/verify-partner", "POST", {
                userId: id,
                action: "reject",
                remark: remark
            });

            alert("Documents Rejected. Hotel hidden.");
            router.push("/admin/partners");
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <Loader2 className="animate-spin text-rose-600" size={40} />
        </div>
    );

    if (!partner) return <div className="p-10 text-center text-white">Partner not found</div>;

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-10 relative">

            {/* --- MAXIMIZED IMAGE MODAL --- */}
            {showImageModal && idImageUrl && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <button
                        onClick={() => setShowImageModal(false)}
                        className="absolute top-6 right-6 bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition"
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={idImageUrl}
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-gray-700"
                    />
                </div>
            )}

            {/* --- REJECTION REMARK MODAL --- */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-red-500 flex items-center gap-2">
                                <AlertTriangle size={24} /> Reject Verification
                            </h3>
                            <button onClick={() => setShowRejectModal(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                        </div>

                        <p className="text-sm text-gray-400">
                            Please provide a reason. This will be sent to the partner so they can re-upload correct documents.
                        </p>

                        <textarea
                            className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-red-500 min-h-[100px]"
                            placeholder="Ex: ID is blurry, Name mismatch, Expired document..."
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                        ></textarea>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="flex-1 py-3 rounded-xl border border-gray-700 hover:bg-gray-800 font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={processing}
                                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 font-bold text-white flex justify-center items-center gap-2"
                            >
                                {processing ? <Loader2 className="animate-spin" size={18} /> : "Confirm Rejection"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COL: Partner Details */}
                <div className="space-y-6">
                    <Link href="/admin/partners" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} /> Back
                    </Link>

                    <div>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center border border-blue-900/50 mb-4">
                            <User size={32} className="text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-bold">{partner.displayName}</h1>
                        <p className="text-gray-400 text-sm mt-1">UID: {partner.uid}</p>
                    </div>

                    <div className="space-y-4 bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                        <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider">Contact Info</h3>
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-800 p-2 rounded-lg"><Mail size={16} className="text-gray-400" /></div>
                            <span>{partner.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-800 p-2 rounded-lg"><Phone size={16} className="text-gray-400" /></div>
                            <span>{partner.phone || "No phone linked"}</span>
                        </div>
                    </div>

                    <div className={`p-4 rounded-xl border flex items-center gap-3 ${partner.isVerified ? 'bg-green-900/10 border-green-900 text-green-500' : 'bg-amber-900/10 border-amber-900 text-amber-500'}`}>
                        {partner.isVerified ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
                        <div>
                            <p className="font-bold">{partner.isVerified ? "Verified Partner" : "Verification Pending"}</p>
                            <p className="text-xs opacity-70">{partner.isVerified ? "Access granted to all features." : "Review documents below."}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 space-y-3">
                        <button
                            onClick={() => handleApprove()}
                            className="w-full py-4 rounded-xl bg-white text-black hover:bg-gray-200 font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/10"
                        >
                            <Check size={20} /> Approve Partner
                        </button>
                        <button
                            onClick={() => setShowRejectModal(true)}
                            className="w-full py-4 rounded-xl bg-gray-900 text-red-500 border border-gray-800 hover:bg-red-900/10 hover:border-red-900 transition-all flex items-center justify-center gap-2"
                        >
                            <X size={20} /> Reject / Request Changes
                        </button>
                    </div>
                </div>

                {/* RIGHT COL: Document Viewer */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-1 overflow-hidden h-full flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
                            <h2 className="font-bold flex items-center gap-2">
                                <FileText size={18} className="text-blue-500" /> ID Proof Document
                            </h2>
                            {idImageUrl && (
                                <button
                                    onClick={() => setShowImageModal(true)}
                                    className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                                >
                                    <Maximize2 size={12} /> Full Screen
                                </button>
                            )}
                        </div>

                        <div className="flex-1 bg-black/50 flex items-center justify-center min-h-[500px] relative group">
                            {idImageUrl ? (
                                <img
                                    src={idImageUrl}
                                    className="max-h-[500px] max-w-full object-contain cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                                    onClick={() => setShowImageModal(true)}
                                />
                            ) : (
                                <div className="text-center p-10">
                                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertTriangle size={32} className="text-amber-500" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">No Document Found</h3>
                                    <p className="text-gray-400 max-w-sm mx-auto">
                                        The user profile does not have an image in any common field.
                                        <br /><br />
                                        <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">
                                            Checked Fields:
                                        </span>
                                        <span className="text-xs text-gray-500 block mt-1 font-mono">
                                            officialIdUrl, idProofUrl, documentUrl, idUrl, imageUrl...
                                        </span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}