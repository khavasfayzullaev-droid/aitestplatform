import React from 'react';

interface PrintTestProps {
    tests: any[];
    folderName: string;
}

export const PrintTest = React.forwardRef<HTMLDivElement, PrintTestProps>(({ tests, folderName }, ref) => {
    return (
        <div ref={ref} className="bg-white text-black p-12 pr-16 w-[210mm] mx-auto" style={{ minHeight: '297mm', fontFamily: 'Times New Roman, serif' }}>
            {tests.map((test, tIndex) => (
                <div key={test.id} style={{ pageBreakAfter: tIndex < tests.length - 1 ? 'always' : 'auto' }}>

                    {/* Header */}
                    <div className="text-center mb-10 border-b-2 border-black pb-4">
                        <h1 className="text-3xl font-bold uppercase mb-2">{test.title}</h1>
                        <p className="text-lg italic text-zinc-700">Fan/Mavzu: <span className="font-bold">{folderName}</span></p>
                        <p className="text-lg italic text-zinc-700">Testdagi jami savollar: {test.questions?.length} ta</p>
                        {test.settings?.timeLimit && <p className="text-lg italic text-zinc-700">Ajratilgan vaqt: {test.settings.timeLimit} daqiqa</p>}
                    </div>

                    {/* Questions */}
                    <div className="space-y-8 text-lg leading-relaxed text-justify">
                        {test.questions?.map((q: any, qIdx: number) => (
                            <div key={q.id} className="break-inside-avoid">
                                <div className="font-bold flex items-start gap-2 mb-3">
                                    <span className="shrink-0">{qIdx + 1}.</span>
                                    <span className="whitespace-pre-wrap leading-tight">{q.question}</span>
                                </div>
                                <div className="space-y-2 pl-6">
                                    {q.options?.map((opt: any) => (
                                        <div key={opt.id} className="flex gap-3">
                                            <span className="font-bold shrink-0">{opt.label})</span>
                                            <span>{opt.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Keys (Answer Key) forced to new page */}
                    {test.questions && test.questions.length > 0 && (
                        <div style={{ pageBreakBefore: 'always' }} className="mt-12">
                            <h2 className="text-2xl font-bold uppercase text-center mb-8 border-b-2 border-black pb-4">Javob Kalitlari - {test.title}</h2>
                            <div className="flex flex-wrap gap-x-12 gap-y-4">
                                {test.questions.map((q: any, qIdx: number) => (
                                    <div key={q.id} className="flex gap-3 text-lg border-b border-zinc-300 pb-1 w-24">
                                        <span className="font-bold w-6">{qIdx + 1}.</span>
                                        <span className="font-black underline under">{q.correctAnswer}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-20 border-t-2 border-black pt-4 text-center font-bold italic text-lg text-zinc-500">
                                AI Test CRM platformasida yig'ildi. Ishonchli va Himoyalangan!
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
});
PrintTest.displayName = 'PrintTest';
