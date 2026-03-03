import React from 'react';

interface PrintResultsProps {
    testData: any;
    submissions: any[];
}

export const PrintResults = React.forwardRef<HTMLDivElement, PrintResultsProps>(({ testData, submissions }, ref) => {
    return (
        <div ref={ref} className="bg-white text-black p-10 font-sans" style={{ minHeight: '297mm', width: '210mm', margin: '0 auto' }}>
            <div className="text-center mb-10 border-b-2 border-black pb-6">
                <h1 className="text-3xl font-black mb-3 uppercase tracking-wider">{testData.title}<br /> Natijalar Qaydnomas (Vedomost)</h1>
                <div className="flex justify-between items-center text-lg font-bold text-zinc-700 mt-6 px-10">
                    <p>O'tkazilgan sana: {new Date().toLocaleDateString('uz-UZ')}</p>
                    <p>Jami ishtirokchilar: {submissions.length} kishi</p>
                    <p>Maksimal ball: {testData.questions?.length} ball</p>
                </div>
            </div>

            <table className="w-full text-left border-collapse border border-black text-[15px] mb-20">
                <thead>
                    <tr className="bg-zinc-100">
                        <th className="p-3 border border-black font-black w-12 text-center">#</th>
                        <th className="p-3 border border-black font-black uppercase tracking-wider">Ism Familiya (F.I.SH)</th>
                        <th className="p-3 border border-black font-black uppercase tracking-wider text-center">Topshirgan Vaqti</th>
                        <th className="p-3 border border-black font-black uppercase tracking-wider text-center">To'g'ri / Umumiy</th>
                        <th className="p-3 border border-black font-black uppercase tracking-wider text-center w-32">O'zlashtirish (%)</th>
                    </tr>
                </thead>
                <tbody>
                    {submissions.map((sub, idx) => {
                        const percent = Math.round((sub.score / (testData.questions?.length || 1)) * 100);
                        return (
                            <tr key={sub.id} className="break-inside-avoid">
                                <td className="p-3 border border-black text-center font-bold">{idx + 1}</td>
                                <td className="p-3 border border-black font-bold uppercase">{sub.student_name}</td>
                                <td className="p-3 border border-black text-center font-semibold">
                                    {new Date(sub.submitted_at || sub.started_at).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')}
                                </td>
                                <td className="p-3 border border-black text-center font-black">{sub.score} / {testData.questions.length}</td>
                                <td className="p-3 border border-black text-center font-black">{percent}%</td>
                            </tr>
                        );
                    })}
                    {submissions.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-10 text-center font-bold text-zinc-400 italic">
                                Hali o'quvchilar test ishlamadi.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="flex justify-between items-end px-16 mt-32 break-inside-avoid">
                <div className="text-center w-64">
                    <div className="border-b border-black h-12 mb-2"></div>
                    <p className="font-bold text-lg uppercase tracking-wider">Ustoz imzosi</p>
                </div>

                <div className="w-24 border border-black rounded-full h-24 mb-4 opacity-50 flex items-center justify-center italic text-xs break-words p-2 text-center text-zinc-400 font-bold border-dashed">
                    Muassasa<br />Muhri
                </div>

                <div className="text-center w-64 mb-6">
                    <p className="font-bold text-lg">{new Date().toLocaleDateString('uz-UZ')}</p>
                    <p className="font-bold text-sm text-zinc-500 uppercase mt-1">Tasdiqlangan sana</p>
                </div>
            </div>
        </div>
    );
});
PrintResults.displayName = 'PrintResults';
