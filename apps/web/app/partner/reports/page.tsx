"use client";

import { FileText, Download, TrendingUp } from "lucide-react";

export default function PartnerReportsPage() {
    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
                    <p className="text-gray-500">Download statements and view financial history.</p>
                </div>
                <button className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white">
                    <Download size={16} /> Export CSV
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <ReportCard label="This Month Earnings" value="₹45,200" color="bg-green-50 text-green-700" />
                <ReportCard label="Pending Payouts" value="₹12,400" color="bg-orange-50 text-orange-700" />
                <ReportCard label="Total Commission Paid" value="₹4,500" color="bg-blue-50 text-blue-700" />
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 font-bold">
                    Recent Statements
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {['January 2026', 'December 2025', 'November 2025'].map((month, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white">{month} Statement</div>
                                    <div className="text-xs text-gray-500">Generated on 1st of month</div>
                                </div>
                            </div>
                            <button className="text-rose-600 font-bold text-sm hover:underline">Download PDF</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ReportCard({ label, value, color }: any) {
    return (
        <div className={`p-6 rounded-2xl ${color} dark:bg-opacity-10 border border-transparent dark:border-gray-800`}>
            <div className="text-xs font-bold uppercase opacity-70 mb-1">{label}</div>
            <div className="text-2xl font-extrabold">{value}</div>
        </div>
    )
}