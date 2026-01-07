"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import {
    ArrowLeft, Check, X, Loader2, User, Mail, Phone,
    Maximize2, AlertTriangle, FileText, Save, Edit2, Database
} from "lucide-react";
import Link from "next/link";

export default function PartnerVerificationPage() {
    const { id } = useParams();
    const router = useRouter();

    const [partner, setPartner] = useState<any>(null);
    const [joinRequestData, setJoinRequestData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // ✅ NEW: STATES FOR EDITING PHONE
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [newPhone, setNewPhone] = useState("");
    const [savingPhone, setSavingPhone] = useState(false);

    // Modal States
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [remark, setRemark] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const usersData = await apiRequest("/api/admin/users?role=partner", "GET");
                const foundUser = usersData.users.find((u: any) => u.uid === id);

                if (foundUser) {
                    setPartner(foundUser);
                    // Initialize edit field with existing phone
                    setNewPhone(foundUser.phone || foundUser.phoneNumber || "");

                    // Backup check
                    if (!findImage(foundUser)) {
                        try {
                            const reqData = await apiRequest("/api/admin/approve-request", "GET");
                            if (reqData && reqData.requests) {
                                const originalReq = reqData.requests.find((r: any) => r.email === foundUser.email);
                                if (originalReq) setJoinRequestData(originalReq);
                            }
                        } catch (e) { console.warn(e); }
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const findImage = (data: any) => {
        if (!data) return null;
        return (
            data.officialIdUrl || data.idProofUrl || data.documentUrl ||
            data.idUrl || data.proofUrl || data.imageUrl || data.fileUrl ||
            data.image || data.url || data.attachment ||
            data.documents?.idProof || data.documents?.url
        );
    };

    const idImageUrl = findImage(partner) || findImage(joinRequestData);

    // ✅ NEW: FUNCTION TO SAVE PHONE NUMBER
    const handleSavePhone = async () => {
        if (!newPhone) return;
        setSavingPhone(true);
        try {
            await apiRequest("/api/admin/verify-partner", "POST", {
                userId: id,
                action: "update_phone",
                phoneNumber: newPhone
            });

            // Update local state so we see the change immediately
            setPartner((prev: any) => ({ ...prev, phone: newPhone }));
            setIsEditingPhone(false);
            alert("Phone Number Saved!");
        } catch (err: any) {
            alert("Update Failed: " + err.message);
        } finally {
            setSavingPhone(false);
        }
    };

    const handleApprove = async () => {
        if (!confirm("Confirm identity verification?")) return;
        setProcessing(true);
        try {
            await apiRequest("/api/admin/verify-partner", "POST", { userId: id, action: "approve" });
            alert("Approved!");
            router.push("/admin/partners");
        } catch (err: any) { alert(err.message); }
        finally { setProcessing(false); }
    };

    const handleReject = async () => {
        if (!remark.trim()) return alert("Enter rejection reason.");
        setProcessing(true);
        try {
            await apiRequest("/api/admin/verify-partner", "POST", { userId: id, action: "reject", remark });
            alert("Rejected.");
            router.push("/admin/partners");
        } catch (err: any) { alert(err.message); }
        finally { setProcessing(false); }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white"><Loader2 className="animate-spin text-rose-600" size={40} /></div>;
    if (!partner) return <div className="p-10 text-white">Partner not found</div>;

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-10 relative">

            {/* IMAGE MODAL */}
            {showImageModal && idImageUrl && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                    <button onClick={() => setShowImageModal(false)} className="absolute top-6 right-6 bg-gray-800 p-2 rounded-full"><X size={24} /></button>
                    <img src={idImageUrl} className="max-h-[90vh] max-w-full rounded-lg" />
                </div>
            )}

            {/* REJECT MODAL */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl w-full max-w-md space-y-4">
                        <h3 className="text-xl font-bold text-red-500">Reject Verification</h3>
                        <textarea className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white" placeholder="Reason..." value={remark} onChange={(e) => setRemark(e.target.value)} />
                        <div className="flex gap-3">
                            <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 border border-gray-700 rounded-xl">Cancel</button>
                            <button onClick={handleReject} disabled={processing} className="flex-1 py-3 bg-red-600 rounded-xl font-bold">{processing ? "Processing..." : "Confirm"}</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: DETAILS */}
                <div className="space-y-6">
                    <Link href="/admin/partners" className="flex items-center gap-2 text-gray-400 hover:text-white"><ArrowLeft size={20} /> Back</Link>
                    <div>
                        <div className="w-16 h-16 rounded-2xl bg-blue-900/20 flex items-center justify-center mb-4"><User size={32} className="text-blue-400" /></div>
                        <h1 className="text-3xl font-bold">{partner.displayName || partner.name}</h1>
                        <p className="text-gray-500 text-xs font-mono mt-1">UID: {partner.uid}</p>
                    </div>

                    <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-4">
                        <div className="flex gap-3"><Mail className="text-gray-400" size={18} /> {partner.email}</div>

                        {/* ✅ NEW: EDITABLE PHONE SECTION */}
                        <div className="flex gap-3 items-center">
                            <Phone className="text-gray-400" size={18} />

                            {isEditingPhone ? (
                                // EDIT MODE
                                <div className="flex items-center gap-2 flex-1 animate-in fade-in">
                                    <input
                                        autoFocus
                                        className="bg-black border border-gray-600 rounded px-2 py-1 text-sm w-full outline-none focus:border-blue-500 text-white"
                                        value={newPhone}
                                        onChange={(e) => setNewPhone(e.target.value)}
                                        placeholder="+91..."
                                    />
                                    <button
                                        onClick={handleSavePhone}
                                        disabled={savingPhone}
                                        className="bg-green-600 p-1.5 rounded hover:bg-green-500 text-white"
                                    >
                                        {savingPhone ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    </button>
                                    <button
                                        onClick={() => setIsEditingPhone(false)}
                                        className="bg-gray-700 p-1.5 rounded hover:bg-gray-600 text-white"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                // VIEW MODE
                                <div className="flex items-center justify-between flex-1">
                                    <span>
                                        {partner.phone || partner.phoneNumber || joinRequestData?.phone || <span className="text-red-500 italic text-xs">No Number</span>}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setNewPhone(partner.phone || partner.phoneNumber || joinRequestData?.phone || "");
                                            setIsEditingPhone(true);
                                        }}
                                        className="text-gray-500 hover:text-white p-1 rounded-full hover:bg-gray-800 transition"
                                        title="Edit Phone Number"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 pt-4">
                        <button onClick={handleApprove} className="w-full py-4 bg-white text-black rounded-xl font-bold flex justify-center gap-2 hover:bg-gray-200"><Check /> Approve Partner</button>
                        <button onClick={() => setShowRejectModal(true)} className="w-full py-4 bg-gray-900 text-red-500 border border-gray-800 rounded-xl font-bold flex justify-center gap-2 hover:bg-red-900/10"><X /> Reject</button>
                    </div>
                </div>

                {/* RIGHT: DOCUMENT VIEWER + DEBUGGER */}
                <div className="lg:col-span-2">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden h-full flex flex-col">
                        <div className="flex justify-between p-4 border-b border-gray-800 bg-gray-900/50">
                            <h2 className="font-bold flex gap-2"><FileText className="text-blue-500" /> Document Viewer</h2>
                            {idImageUrl && <button onClick={() => setShowImageModal(true)} className="text-xs bg-gray-800 px-3 py-1 rounded"><Maximize2 size={14} /></button>}
                        </div>

                        <div className="flex-1 bg-black/50 flex flex-col items-center justify-center min-h-[500px] p-6">
                            {idImageUrl ? (
                                <img src={idImageUrl} className="max-h-[400px] object-contain cursor-pointer" onClick={() => setShowImageModal(true)} />
                            ) : (
                                <div className="text-center w-full">
                                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} className="text-amber-500" /></div>
                                    <h3 className="text-xl font-bold">No Document Found</h3>
                                    <p className="text-gray-400 text-sm mb-6">The system couldn't find an image URL in the usual fields.</p>

                                    {/* DEBUGGER */}
                                    <div className="bg-black border border-gray-700 rounded-xl p-4 text-left w-full max-w-lg mx-auto overflow-hidden">
                                        <h4 className="text-xs font-bold text-green-500 mb-2 flex items-center gap-2">
                                            <Database size={12} /> RAW DATA INSPECTOR
                                        </h4>
                                        <div className="overflow-auto max-h-60 text-[10px] font-mono text-gray-300">
                                            <pre>{JSON.stringify(partner, null, 2)}</pre>
                                            {joinRequestData && (
                                                <>
                                                    <div className="my-2 border-t border-gray-700"></div>
                                                    <p className="text-blue-400 mb-1">// JOIN REQUEST DATA:</p>
                                                    <pre>{JSON.stringify(joinRequestData, null, 2)}</pre>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}