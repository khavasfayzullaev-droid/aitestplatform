import React from 'react';

interface PrintResultsProps {
    testData: any;
    submissions: any[];
}

export const PrintResults = React.forwardRef<HTMLDivElement, PrintResultsProps>(({ testData, submissions }, ref) => {
    return (
        <div ref={ref} className="bg-white text-zinc-900 p-10 font-sans" style={{ minHeight: '297mm', width: '210mm', margin: '0 auto', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            <div className="mb-8">
                <h1 className="text-3xl font-black mb-6">{testData.title}<br /> Natijalar Qaydnomasi</h1>
                <div className="space-y-4 text-sm font-medium text-zinc-800">
                    <p>O'tkazilgan sana: {new Date().toLocaleDateString('uz-UZ')}</p>
                    <p>Jami ishtirokchilar: {submissions.length} kishi</p>
                    <p>Maksimal ball: {testData.questions?.length} ball</p>
                </div>
            </div>

            <div className="w-full mb-20 mt-4 rounded-3xl border border-zinc-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50/50 text-[11px] uppercase tracking-widest font-bold text-zinc-400">
                            <th className="p-4 pl-6 font-bold w-12 text-center">#</th>
                            <th className="p-4 font-bold">Ism Familiya (F.I.SH)</th>
                            <th className="p-4 font-bold">Topshirgan Vaqti</th>
                            <th className="p-4 font-bold">To'g'ri / Umumiy</th>
                            <th className="p-4 font-bold text-center">O'zlashtirish (%)</th>
                        </tr>
                    </thead>
                    <tbody className="text-zinc-800 text-sm font-medium">
                        {submissions.map((sub, idx) => {
                            const percent = Math.round((sub.score / (testData.questions?.length || 1)) * 100);
                            return (
                                <tr key={sub.id} className="border-b border-zinc-50 last:border-0 break-inside-avoid">
                                    <td className="p-4 pl-6 text-center font-bold">{idx + 1}</td>
                                    <td className="p-4 font-bold text-base">{sub.student_name}</td>
                                    <td className="p-4 text-zinc-500 font-semibold text-xs whitespace-nowrap">
                                        {new Date(sub.submitted_at || sub.started_at).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')}
                                    </td>
                                    <td className="p-4 font-black text-emerald-600 text-base">{sub.score} / {testData.questions?.length}</td>
                                    <td className="p-4 min-w-[140px]">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold w-10">{percent}%</span>
                                            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percent}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {submissions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-10 text-center font-bold text-zinc-400">
                                    Hali o'quvchilar test ishlamadi.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-end mt-20 break-inside-avoid text-sm">
                <div>
                    <p className="mb-4">Ustoz imzosi ________________</p>
                </div>

                <div className="w-24 border border-zinc-400 rounded-full h-24 flex items-center justify-center italic text-xs p-2 text-center text-zinc-400 font-bold border-dashed pt-4">
                    Muassasa<br />Muhri
                </div>

                <div className="text-right">
                    <p className="mb-4 text-zinc-800">{new Date().toLocaleDateString('uz-UZ')}</p>
                    <p className="font-medium text-zinc-500">Tasdiqlangan sana</p>
                </div>
            </div>
        </div>
    );
});
PrintResults.displayName = 'PrintResults';
