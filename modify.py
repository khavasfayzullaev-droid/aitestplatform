import re

with open("src/pages/student/TestPlayer.tsx", "r") as f:
    content = f.read()

# find the start of the result section
start_token = "if (step === 'result' && result) {"

start_index = content.find(start_token)

if start_index != -1:
    new_result_section = """if (step === 'result' && result) {
        const percent = Math.round((result.score / (result.total || 1)) * 100);

        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-10 px-4 font-sans">
                {/* Top Success Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 sm:p-10 rounded-[32px] shadow-sm w-full max-w-2xl border border-slate-100 text-center mb-10">
                    <div className="w-20 h-20 rounded-full border-[3px] border-[#31C48D] flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-[#31C48D]" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-[#1E293B] mb-2 tracking-tight">Test Yakunlandi!</h1>
                    <p className="text-[15px] font-medium text-slate-500 mb-8 tracking-wide">Natijangiz ustozingizga yuborildi.</p>

                    <div className="bg-slate-50/50 rounded-3xl py-12 px-8 mb-8">
                        <h2 className="text-7xl sm:text-[80px] font-black text-[#508DF8] tracking-tighter mb-4">{percent}%</h2>
                        <p className="text-lg font-medium text-slate-700">{result.score} ta to'g'ri (Jami {result.total} ta)</p>
                    </div>

                    <div className="bg-[#F3F4F6] rounded-[20px] p-6 text-[15px] font-medium text-slate-600 leading-relaxed text-center">
                        Test yakunlandi. Agar natijalarni ko'rib bo'lgan bo'lsangiz,<br/> ushbu sahifani yopishingiz mumkin.
                    </div>
                </motion.div>

                {/* Analysis Section */}
                {result.details && result.details.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full max-w-2xl">
                        <div className="mb-8 flex justify-center">
                            <h3 className="text-2xl font-black text-[#1E293B] flex items-center gap-2">
                                <span className="bg-[#FBCFE8] px-3 py-1 rounded-md text-[#1E293B]">Javoblar</span> Tahlili
                            </h3>
                        </div>

                        <div className="space-y-6">
                            {testData.questions.map((q: any, i: number) => {
                                const detail = result.details.find((d: any) => d.id === q.id)
                                if (!detail) return null;

                                const isCorrect = detail.correct;

                                return (
                                    <div key={q.id} className="bg-white rounded-[24px] p-6 sm:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                                        <div className="flex items-start gap-2 mb-6">
                                            <div className="mt-1 shrink-0">
                                                {isCorrect ? (
                                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[#31C48D]"><CheckCircle2 className="w-5 h-5" /></div>
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[#F43F5E]"><XCircle className="w-5 h-5" /></div>
                                                )}
                                            </div>
                                            <p className="font-bold text-lg text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                                                <span className="font-black mr-1">{i + 1}.</span>{q.question}
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            {q.options.map((opt: any) => {
                                                const isSelected = opt.label === detail.studentAnswer;
                                                const isActuallyCorrect = opt.label === detail.correctAnswer;
                                                
                                                let containerClasses = "border-slate-200 bg-white text-slate-600";
                                                let circleClasses = "border-slate-200 border-[2px]";
                                                let textClasses = "font-medium";
                                                let badge = null;

                                                if (isActuallyCorrect) {
                                                    containerClasses = "border-[#31C48D] bg-[#ECFDF5]";
                                                    circleClasses = isSelected ? "border-[#31C48D] border-[6px]" : "border-[#31C48D] border-[2px]";
                                                    textClasses = "font-bold text-[#059669]";
                                                    badge = <span className="bg-[#10B981] text-white text-[12px] font-bold px-3 py-1 rounded-full">To'g'ri javob</span>;
                                                } else if (isSelected && !isActuallyCorrect) {
                                                    containerClasses = "border-[#FDA4AF] bg-[#FFF1F2]";
                                                    circleClasses = "border-[#FB7185] border-[6px]";
                                                    textClasses = "font-medium text-[#F43F5E]";
                                                    badge = <span className="bg-[#FB7185] text-white text-[12px] font-bold px-3 py-1 rounded-full">Sizning javobingiz</span>;
                                                }

                                                return (
                                                    <div key={opt.id} className={`flex items-center justify-between p-4 rounded-xl border ${containerClasses}`}>
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-[22px] h-[22px] rounded-full shrink-0 ${circleClasses}`} />
                                                            <span className={`text-[15px] sm:text-base ${textClasses}`}>{opt.text}</span>
                                                        </div>
                                                        {badge}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </div>
        )
    }

    return null;
}
"""

    new_content = content[:start_index] + new_result_section
    with open("src/pages/student/TestPlayer.tsx", "w") as f:
        f.write(new_content)
    print("Successfully updated TestPlayer.tsx")
else:
    print("Could not find start token")
